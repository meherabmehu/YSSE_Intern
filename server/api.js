import { createHash, randomBytes } from 'node:crypto';
import {
  hashPassword,
  verifyPassword,
  getSetting,
  setSetting,
  newId,
  recordStatus,
  transaction,
} from './database.js';
import {
  HttpError,
  requireValue,
  saveApplication,
  getApplication,
  serializeApplication,
  moveApplication,
  updateReview,
  validateBatch,
  isWebUrl,
} from './recruitment.js';

const publicUser = (user) =>
  user ? { id: user.id, name: user.name, email: user.email, role: user.role } : null;
const hashToken = (token) => createHash('sha256').update(token).digest('hex');
export const json = (res, status, value) => {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(value));
};
async function readBody(req) {
  requireValue(
    req.headers['content-type']?.startsWith('application/json'),
    'Use application/json.',
    415,
  );
  // Vercel parses JSON before calling the function; local Node requests remain streams.
  if (req.body !== undefined) {
    const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    requireValue(Buffer.byteLength(raw) <= 3 * 1024 * 1024, 'Request is too large.', 413);
    let value;
    try {
      value = typeof req.body === 'string' ? JSON.parse(raw) : req.body;
    } catch {
      throw new HttpError(400, 'Invalid JSON.');
    }
    requireValue(
      value && typeof value === 'object' && !Array.isArray(value),
      'Invalid request body.',
    );
    return value;
  }
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    requireValue(size <= 3 * 1024 * 1024, 'Request is too large.', 413);
    chunks.push(chunk);
  }
  try {
    const value = JSON.parse(Buffer.concat(chunks).toString());
    requireValue(
      value && typeof value === 'object' && !Array.isArray(value),
      'Invalid request body.',
    );
    return value;
  } catch (e) {
    if (e instanceof HttpError) throw e;
    throw new HttpError(400, 'Invalid JSON.');
  }
}
export function createApi(db, demoMode) {
  const attempts = new Map();
  async function authenticate(req) {
    const token = /(?:^|;\s*)ysse_session=([a-f0-9]{64})(?:;|$)/.exec(
      req.headers.cookie ?? '',
    )?.[1];
    if (!token) return null;
    const account =
      (await db
        .prepare(
          'SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND s.expires>?',
        )
        .get(hashToken(token), Date.now())) ?? null;
    return !demoMode && account?.id.startsWith('demo-') ? null : account;
  }
  async function session(req, res, user) {
    const token = randomBytes(32).toString('hex');
    await db.prepare('DELETE FROM sessions WHERE expires<?').run(Date.now());
    await db
      .prepare('INSERT INTO sessions VALUES (?,?,?)')
      .run(hashToken(token), user.id, Date.now() + 8 * 3600000);
    res.setHeader(
      'Set-Cookie',
      `ysse_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${req.socket.encrypted || process.env.VERCEL ? '; Secure' : ''}`,
    );
  }
  function rateLimit(req) {
    const key = req.socket.remoteAddress;
    const now = Date.now();
    for (const [ip, entry] of attempts) if (entry.until < now) attempts.delete(ip);
    const entry = attempts.get(key) ?? { count: 0, until: now + 15 * 60000 };
    entry.count++;
    attempts.set(key, entry);
    requireValue(entry.count <= 30, 'Too many sign-in attempts. Try again in 15 minutes.', 429);
  }
  return async function api(req, res, url) {
    const path = url.pathname;
    if (!path.startsWith('/api/')) return false;
    try {
      if (!['GET', 'POST', 'PUT', 'DELETE'].includes(req.method))
        throw new HttpError(405, 'Method not supported.');
      if (req.method !== 'GET') {
        requireValue(
          req.headers['x-ysse-request'] === 'portal',
          'Missing request protection header.',
          403,
        );
        if (req.headers.origin)
          requireValue(
            new URL(req.headers.origin).host === req.headers.host,
            'Cross-origin requests are not allowed.',
            403,
          );
      }
      const user = await authenticate(req);
      if (path === '/api/health') {
        json(res, 200, { ok: true, demoMode });
        return true;
      }
      if (path === '/api/session' && req.method === 'GET') {
        json(res, 200, { user: publicUser(user), demoMode });
        return true;
      }
      if (path === '/api/batch' && req.method === 'GET') {
        json(res, 200, await getSetting(db, 'batch'));
        return true;
      }
      if (path === '/api/announcements' && req.method === 'GET') {
        json(res, 200, await getSetting(db, 'announcements'));
        return true;
      }
      if (path === '/api/login' && req.method === 'POST') {
        rateLimit(req);
        const body = await readBody(req);
        requireValue(
          typeof body.email === 'string' &&
            typeof body.password === 'string' &&
            body.password.length <= 256,
          'Enter your email and password.',
        );
        const account = await db
          .prepare('SELECT * FROM users WHERE email=?')
          .get(body.email.trim().toLowerCase());
        requireValue(
          account &&
            (demoMode || !account.id.startsWith('demo-')) &&
            verifyPassword(body.password, account.password),
          'Email or password is incorrect.',
          401,
        );
        await session(req, res, account);
        json(res, 200, { user: publicUser(account) });
        return true;
      }
      if (path === '/api/register' && req.method === 'POST') {
        requireValue(
          demoMode,
          'Registration is unavailable until production email verification is integrated.',
          403,
        );
        rateLimit(req);
        const body = await readBody(req);
        requireValue(
          typeof body.name === 'string' && body.name.trim().length >= 2 && body.name.length <= 100,
          'Enter your name.',
        );
        requireValue(
          typeof body.email === 'string' &&
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email) &&
            body.email.length <= 254,
          'Enter a valid email.',
        );
        requireValue(
          typeof body.password === 'string' &&
            body.password.length >= 10 &&
            body.password.length <= 256,
          'Use a password with at least 10 characters.',
        );
        const email = body.email.trim().toLowerCase();
        requireValue(
          !(await db.prepare('SELECT id FROM users WHERE email=?').get(email)),
          'An account with this email already exists.',
          409,
        );
        const account = { id: newId(), name: body.name.trim(), email, role: 'applicant' };
        await db
          .prepare('INSERT INTO users VALUES (?,?,?,?,?)')
          .run(account.id, account.name, email, hashPassword(body.password), account.role);
        await session(req, res, account);
        json(res, 201, { user: publicUser(account) });
        return true;
      }
      requireValue(user, 'Sign in to continue.', 401);
      if (path === '/api/logout' && req.method === 'POST') {
        const token = /ysse_session=([a-f0-9]{64})/.exec(req.headers.cookie ?? '')?.[1];
        if (token) await db.prepare('DELETE FROM sessions WHERE token=?').run(hashToken(token));
        res.setHeader('Set-Cookie', 'ysse_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');
        json(res, 200, { ok: true });
        return true;
      }
      if (path === '/api/notifications' && req.method === 'GET') {
        json(
          res,
          200,
          await db
            .prepare(
              'SELECT id,subject,body,created FROM notifications WHERE user_id=? ORDER BY id DESC LIMIT 50',
            )
            .all(user.id),
        );
        return true;
      }
      if (path === '/api/application' && req.method === 'GET') {
        requireValue(user.role === 'applicant', 'Applicant accounts only.', 403);
        const batch = await getSetting(db, 'batch');
        const row = await db
          .prepare('SELECT * FROM applications WHERE user_id=? AND batch_id=?')
          .get(user.id, batch.id);
        json(res, 200, await serializeApplication(db, row, user));
        return true;
      }
      if (path === '/api/application' && req.method === 'PUT') {
        requireValue(user.role === 'applicant', 'Applicant accounts only.', 403);
        json(res, 200, await saveApplication(db, user, await readBody(req)));
        return true;
      }
      const action = /^\/api\/applications\/([^/]+)\/(accept|withdraw|cv)$/.exec(path);
      if (action) {
        const row = await getApplication(db, action[1], user);
        if (action[2] === 'cv' && req.method === 'GET') {
          requireValue(row.cv, 'No CV attached.', 404);
          res.writeHead(200, {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${row.cv_name}"`,
            'Cache-Control': 'no-store',
          });
          res.end(Buffer.from(row.cv));
          return true;
        }
        requireValue(req.method === 'POST', 'Method not supported.', 405);
        requireValue(
          user.id === row.user_id && user.role === 'applicant',
          'Only the applicant may perform this action.',
          403,
        );
        const accept = action[2] === 'accept';
        requireValue(
          accept
            ? row.status === 'selected'
            : !['draft', 'rejected', 'withdrawn', 'onboarded'].includes(row.status),
          'This action is unavailable at the current stage.',
          409,
        );
        await transaction(
          db,
          async () =>
            await recordStatus(
              db,
              row,
              accept ? 'offer_accepted' : 'withdrawn',
              user.name,
              accept
                ? 'You accepted your demo offer. Staff will complete onboarding.'
                : 'You withdrew your application.',
            ),
        );
        json(
          res,
          200,
          await serializeApplication(db, await getApplication(db, row.id, user), user),
        );
        return true;
      }
      requireValue(user.role === 'staff', 'Staff access required.', 403);
      if (path === '/api/staff/applications' && req.method === 'GET') {
        const rows = await db
          .prepare(
            "SELECT a.*,u.email FROM applications a JOIN users u ON u.id=a.user_id WHERE a.status != 'draft' ORDER BY a.updated DESC",
          )
          .all();
        json(
          res,
          200,
          await Promise.all(rows.map(async (row) => await serializeApplication(db, row, user))),
        );
        return true;
      }
      const staffAction = /^\/api\/staff\/applications\/([^/]+)(?:\/(review|transition))?$/.exec(
        path,
      );
      if (staffAction) {
        const row = await getApplication(db, staffAction[1], user);
        if (req.method === 'GET' && !staffAction[2])
          json(res, 200, await serializeApplication(db, row, user));
        else if (req.method === 'PUT' && staffAction[2] === 'review') {
          const body = await readBody(req);
          await updateReview(db, await getApplication(db, row.id, user), body);
          json(
            res,
            200,
            await serializeApplication(db, await getApplication(db, row.id, user), user),
          );
        } else if (req.method === 'POST' && staffAction[2] === 'transition') {
          const body = await readBody(req);
          // Re-read after I/O so another reviewer's transition cannot use a stale stage.
          json(
            res,
            200,
            await moveApplication(db, await getApplication(db, row.id, user), body, user),
          );
        } else throw new HttpError(405, 'Method not supported.');
        return true;
      }
      if (path === '/api/staff/batch' && req.method === 'PUT') {
        const batch = validateBatch(await readBody(req), await getSetting(db, 'batch'));
        await setSetting(db, 'batch', batch);
        json(res, 200, batch);
        return true;
      }
      if (path === '/api/staff/announcements' && req.method === 'POST') {
        const body = await readBody(req);
        requireValue(
          typeof body.title === 'string' &&
            body.title.trim().length >= 3 &&
            body.title.length <= 150,
          'Announcement title must be 3–150 characters.',
        );
        requireValue(
          typeof body.summary === 'string' &&
            body.summary.trim().length >= 10 &&
            body.summary.length <= 1000,
          'Summary must be 10–1000 characters.',
        );
        requireValue(
          !body.href ||
            (typeof body.href === 'string' &&
              (isWebUrl(body.href) || /^#\/[a-z-]+(?:\/[a-z-]+)?$/.test(body.href))),
          'Use a portal route or HTTPS link.',
        );
        const items = await getSetting(db, 'announcements');
        requireValue(items.length < 30, 'Remove an old announcement before adding another.');
        const item = {
          id: newId(),
          title: body.title.trim(),
          summary: body.summary.trim(),
          href: body.href || '#/updates',
          tag: 'Demo announcement',
          date: new Date().toISOString(),
        };
        items.unshift(item);
        await setSetting(db, 'announcements', items);
        json(res, 201, item);
        return true;
      }
      if (path.startsWith('/api/staff/announcements/') && req.method === 'DELETE') {
        const id = path.split('/').at(-1);
        const items = await getSetting(db, 'announcements');
        requireValue(
          items.some((item) => item.id === id),
          'Announcement not found.',
          404,
        );
        await setSetting(
          db,
          'announcements',
          items.filter((item) => item.id !== id),
        );
        json(res, 200, { ok: true });
        return true;
      }
      throw new HttpError(404, 'Endpoint not found.');
    } catch (error) {
      if (
        error.code === '23505' ||
        (error.code === 'ERR_SQLITE_ERROR' && error.message.includes('UNIQUE'))
      )
        error = new HttpError(409, 'This record already exists. Refresh and try again.');
      if (!(error instanceof HttpError))
        console.error('API error:', { name: error.name, code: error.code });
      json(res, error.status ?? 500, {
        error:
          error instanceof HttpError
            ? error.message
            : 'An unexpected error occurred. Please try again.',
      });
    }
    return true;
  };
}
