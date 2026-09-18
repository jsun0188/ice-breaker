const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

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

server.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
