const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const WebSocket = require('ws');
const { WebSocketServer } = WebSocket;

const port = process.env.PORT || 3000;
const indexPage = fs.readFileSync(path.join(__dirname, 'public', 'index.html'));

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

  higgsSocket.on('open', () => {
    higgsSocket.send(JSON.stringify({
      type: 'session.update',
      session: {
        model: 'higgs-realtime',
        output_modalities: ['audio'],
        instructions: 'Listen to the complete conversation. Respond briefly and warmly when appropriate. Do not interrupt people. Preserve the conversation context.',
        audio: {
          input: {
            format: 'pcm16',
            turn_detection: { type: 'server_vad' },
          },
          output: { voice: 'default' },
        },
        input_audio_transcription: {
          model: process.env.HIGGS_TRANSCRIPTION_MODEL || 'gpt-4o-transcribe-diarize',
        },
      },
    }));
    sendSocketJson(browserSocket, { type: 'ready' });
  });

  higgsSocket.on('message', (data) => {
    let event;
    try {
      event = JSON.parse(data.toString());
    } catch {
      return;
    }

    if (event.type === 'conversation.item.input_audio_transcription.completed') {
      const speaker = event.speaker || event.item?.speaker || `Speaker ${(fallbackSpeaker++ % 2) + 1}`;
      sendSocketJson(browserSocket, { type: 'transcript', role: 'user', speaker, text: event.transcript || '' });
      return;
    }

    if (event.type === 'response.audio.delta' && event.delta) {
      sendSocketJson(browserSocket, { type: 'audio', audio: event.delta });
      return;
    }

    if (event.type === 'response.audio_transcript.done' && event.transcript) {
      sendSocketJson(browserSocket, { type: 'transcript', role: 'assistant', speaker: 'Ice Breaker', text: event.transcript });
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
