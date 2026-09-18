const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const WebSocket = require('ws');
const { WebSocketServer } = WebSocket;

const port = process.env.PORT || 3000;
const indexPage = fs.readFileSync(path.join(__dirname, 'public', 'index.html'));
const partyHostPrompt = fs.readFileSync(path.join(__dirname, 'party-host-agent.md'), 'utf8');

function sendJson(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
}

const server = http.createServer((request, response) => {
  if (request.url === '/') {
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    response.end(indexPage);
    return;
  }

  if (request.url === '/ice-breaker-logo-v2.png') {
    response.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400' });
    response.end(fs.readFileSync(path.join(__dirname, 'public', 'ice-breaker-logo-v2.png')));
    return;
  }

  if (request.url === '/api/conversation/start' && request.method === 'POST') {
    const apiKey = process.env.HIGGINS_API_KEY || process.env.HIGGS_API_KEY;
    sendJson(response, 200, {
      started: Boolean(apiKey),
      message: apiKey ? 'Conversation ready' : 'Higgs API key is not configured',
    });
    return;
  }

  response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  response.end('Not found');
});

const realtimeServer = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  if (request.url !== '/api/realtime') {
    socket.destroy();
    return;
  }

  realtimeServer.handleUpgrade(request, socket, head, (browserSocket) => {
    realtimeServer.emit('connection', browserSocket, request);
  });
});

function sendSocketJson(socket, message) {
  if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
}

realtimeServer.on('connection', (browserSocket) => {
  const apiKey = process.env.HIGGINS_API_KEY || process.env.HIGGS_API_KEY;
  if (!apiKey) {
    sendSocketJson(browserSocket, { type: 'error', message: 'Higgs API key is not configured' });
    browserSocket.close(1011);
    return;
  }

  const higgsSocket = new WebSocket('wss://api.boson.ai/v1/realtime/?model=higgs-realtime', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  let fallbackSpeaker = 0;
  let startSent = false;
  const speakersByItem = new Map();

  function speakerFor(event) {
    const itemId = event.item_id || event.item?.id;
    if (event.speaker) return event.speaker;
    if (!itemId) return `Speaker ${(fallbackSpeaker++ % 2) + 1}`;
    if (!speakersByItem.has(itemId)) speakersByItem.set(itemId, `Speaker ${(fallbackSpeaker++ % 2) + 1}`);
    return speakersByItem.get(itemId);
  }

  function sendPartyStart() {
    if (startSent || higgsSocket.readyState !== WebSocket.OPEN) return;
    startSent = true;
    higgsSocket.send(JSON.stringify({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text: 'The organizer has started the party. Begin the first icebreaker activity now.' }],
      },
    }));
    higgsSocket.send(JSON.stringify({ type: 'response.create' }));
    sendSocketJson(browserSocket, { type: 'ready' });
  }

  higgsSocket.on('open', () => {
    higgsSocket.send(JSON.stringify({
      type: 'session.update',
      session: {
        model: 'higgs-realtime',
        output_modalities: ['audio'],
        instructions: partyHostPrompt,
        audio: {
          input: {
            format: { type: 'audio/pcm', rate: 24000 },
            turn_detection: { type: 'server_vad' },
          },
          output: { format: { type: 'audio/pcm' }, voice: 'default' },
        },
        input_audio_transcription: {
          model: process.env.HIGGS_TRANSCRIPTION_MODEL || 'gpt-4o-transcribe-diarize',
        },
      },
    }));
    sendPartyStart();
  });

  higgsSocket.on('message', (data) => {
    let event;
    try {
      event = JSON.parse(data.toString());
    } catch {
      return;
    }

    if (event.type === 'session.updated') {
      sendPartyStart();
      return;
    }

    if (event.type === 'conversation.item.input_audio_transcription.delta' && event.delta) {
      sendSocketJson(browserSocket, {
        type: 'transcript_delta',
        id: event.item_id || 'speaker-current',
        role: 'user',
        speaker: speakerFor(event),
        text: event.delta,
      });
      return;
    }

    if (event.type === 'conversation.item.input_audio_transcription.completed') {
      const speaker = speakerFor(event);
      sendSocketJson(browserSocket, {
        type: 'transcript',
        id: event.item_id || `speaker-${fallbackSpeaker}`,
        role: 'user',
        speaker,
        text: event.transcript || '',
        final: true,
      });
      return;
    }

    if ((event.type === 'response.audio.delta' || event.type === 'response.output_audio.delta') && event.delta) {
      sendSocketJson(browserSocket, { type: 'audio', audio: event.delta });
      return;
    }

    if ((event.type === 'response.audio_transcript.delta' || event.type === 'response.output_audio_transcript.delta') && event.delta) {
      sendSocketJson(browserSocket, {
        type: 'transcript_delta',
        id: event.response_id || 'assistant-current',
        role: 'assistant',
        speaker: 'Ice Breaker',
        text: event.delta,
      });
      return;
    }

    if ((event.type === 'response.audio_transcript.done' || event.type === 'response.output_audio_transcript.done') && event.transcript) {
      sendSocketJson(browserSocket, {
        type: 'transcript_done',
        id: event.response_id || 'assistant-current',
        role: 'assistant',
        speaker: 'Ice Breaker',
        text: event.transcript,
        final: true,
      });
      return;
    }

    if (event.type === 'error') {
      sendSocketJson(browserSocket, { type: 'error', message: event.error?.message || 'Higgs Realtime error' });
    }
  });

  higgsSocket.on('error', () => {
    sendSocketJson(browserSocket, { type: 'error', message: 'Unable to connect to Higgs Realtime' });
  });

  higgsSocket.on('close', () => {
    if (browserSocket.readyState === WebSocket.OPEN) browserSocket.close();
  });

  browserSocket.on('message', (data, isBinary) => {
    if (!isBinary || higgsSocket.readyState !== WebSocket.OPEN) return;
    higgsSocket.send(JSON.stringify({
      type: 'input_audio_buffer.append',
      audio: Buffer.from(data).toString('base64'),
    }));
  });

  browserSocket.on('close', () => {
    if (higgsSocket.readyState === WebSocket.OPEN) higgsSocket.close();
  });
});

server.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
