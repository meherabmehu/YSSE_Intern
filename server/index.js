import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const publicRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../public');
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml' };
export function createApp() {
  return createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname === '/api/health') { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: true })); return; }
      const file = resolve(publicRoot, `.${decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname)}`);
      if (!file.startsWith(publicRoot + sep)) { res.writeHead(403); res.end('Forbidden'); return; }
      const content = await readFile(file);
      res.writeHead(200, { 'Content-Type': mime[extname(file)] ?? 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' });
      res.end(content);
    } catch { res.writeHead(404); res.end('Not found'); }
  });
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT ?? 3000);
  createApp().listen(port, process.env.HOST ?? '127.0.0.1', () => console.log(`YSSE portal: http://${process.env.HOST ?? '127.0.0.1'}:${port}`));
}
