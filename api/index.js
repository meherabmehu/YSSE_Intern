import { openDatabase } from '../server/database.js';
import { createApi, json } from '../server/api.js';

let initialized;
async function initialize() {
  if (!process.env.DATABASE_URL) throw new Error('Hosted deployments require DATABASE_URL.');
  const db = await openDatabase(
    ':memory:',
    process.env.DEMO_MODE !== 'false',
    process.env.DATABASE_URL,
  );
  return { db, api: createApi(db, process.env.DEMO_MODE !== 'false') };
}

export default async function handler(req, res) {
  try {
    initialized ??= initialize().catch((error) => {
      initialized = undefined;
      throw error;
    });
    const { db, api } = await initialized;
    const route = Array.isArray(req.query?.route) ? req.query.route.join('/') : req.query?.route;
    const url = new URL(route ? `/api/${route}` : req.url, 'https://portal.invalid');
    if (!(await db.exclusive(() => api(req, res, url))))
      json(res, 404, { error: 'Endpoint not found.' });
  } catch (error) {
    console.error('Hosted initialization failed', { name: error.name, code: error.code });
    json(res, 503, { error: 'The portal database is temporarily unavailable. Please try again.' });
  }
}
