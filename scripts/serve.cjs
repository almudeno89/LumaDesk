const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const file = path.resolve(__dirname, '../index.html');
const port = Number(process.env.PORT || 8770);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('PORT must be an integer between 1 and 65535.');
  process.exit(1);
}
const server = http.createServer((req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(405, { Allow: 'GET, HEAD' });
    return res.end();
  }
  const pathname = (req.url || '/').split('?')[0];
  if (pathname === '/favicon.ico') {
    res.writeHead(204);
    return res.end();
  }
  if (!['/', '/index.html'].includes(pathname)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end(req.method === 'HEAD' ? undefined : 'Not found');
  }
  fs.readFile(file, (error, html) => {
    if (error) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end(req.method === 'HEAD' ? undefined : 'Could not read index.html');
    }
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    });
    res.end(req.method === 'HEAD' ? undefined : html);
  });
});
server.on('error', error => {
  console.error(`Could not start the preview: ${error.message}`);
  process.exitCode = 1;
});
server.listen(port, '127.0.0.1', () => {
  console.log(`Luma Design: http://127.0.0.1:${port}`);
  console.log('Visual preview only. Press Control-C to stop.');
});
