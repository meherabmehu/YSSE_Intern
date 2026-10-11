import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDatabase } from './database.js';
import { createApi } from './api.js';

const publicRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../public');
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
};
export function createApp({
  dbPath = resolve(publicRoot, '../data/ysse.sqlite'),
  demoMode = process.env.DEMO_MODE !== 'false',
} = {}) {
  const db = openDatabase(dbPath, demoMode);
  const api = createApi(db, demoMode);
  const server = createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
    );
    try {
      const url = new URL(req.url, 'http://localhost');
      if (await api(req, res, url)) return;
      if (!['GET', 'HEAD'].includes(req.method)) {
        res.writeHead(405);
        res.end('Method not supported');
        return;
      }
      const file = resolve(
        publicRoot,
        `.${decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname)}`,
      );
      if (!file.startsWith(publicRoot + sep)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }
      const content = await readFile(file);
      res.writeHead(200, {
        'Content-Type': mime[extname(file)] ?? 'application/octet-stream',
        'X-Content-Type-Options': 'nosniff',
      });
      res.end(req.method === 'HEAD' ? undefined : content);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  });
  server.on('close', () => db.close());
  return server;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT ?? 3000);
  createApp().listen(port, process.env.HOST ?? '127.0.0.1', () =>
    console.log(`YSSE portal: http://${process.env.HOST ?? '127.0.0.1'}:${port}`),
  );
}
