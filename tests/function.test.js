import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { openDatabase } from '../server/database.js';
import { createApi } from '../server/api.js';

test('API accepts Vercel-preparsed JSON bodies after the request stream is consumed', async (t) => {
  const db = await openDatabase(':memory:', true);
  const api = createApi(db, true);
  const server = createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    req.body = JSON.parse(Buffer.concat(chunks).toString());
    await db.exclusive(() => api(req, res, new URL(req.url, 'http://localhost')));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await db.close();
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  const response = await fetch(base + '/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-YSSE-Request': 'portal' },
    body: JSON.stringify({ email: 'staff@demo.ysse.test', password: 'YsseDemo2026!' }),
  });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).user.role, 'staff');
});
