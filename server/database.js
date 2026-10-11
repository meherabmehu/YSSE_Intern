import { sqliteStorage, postgresStorage } from './storage.js';
import { HttpError } from './errors.js';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomBytes, scryptSync, timingSafeEqual, randomUUID } from 'node:crypto';
import { departments } from '../public/js/data.js';

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}
export function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const actual = scryptSync(password, salt, 64);
  return timingSafeEqual(actual, Buffer.from(hash, 'hex'));
}
export async function openDatabase(path, demoMode = true, databaseUrl = '') {
  if (!databaseUrl && path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = databaseUrl ? postgresStorage(databaseUrl) : sqliteStorage(path);
  const initialize = async () => {
    if (db.kind === 'sqlite') await db.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');
    const serial = db.kind === 'postgres' ? 'BIGSERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY';
    const binary = db.kind === 'postgres' ? 'BYTEA' : 'BLOB';
    await db.exec(`
    CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('applicant','staff')));
    CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), expires BIGINT NOT NULL);
    CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS applications (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), batch_id TEXT NOT NULL, department TEXT NOT NULL, status TEXT NOT NULL, payload TEXT NOT NULL, cv_name TEXT, cv ${binary}, created TEXT NOT NULL, updated TEXT NOT NULL, UNIQUE(user_id,batch_id));
    CREATE TABLE IF NOT EXISTS history (id ${serial}, application_id TEXT NOT NULL REFERENCES applications(id), status TEXT NOT NULL, actor TEXT NOT NULL, message TEXT NOT NULL, created TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS reviews (application_id TEXT PRIMARY KEY REFERENCES applications(id), notes TEXT NOT NULL DEFAULT '', score INTEGER, interviewer TEXT, scheduled_at TEXT, meeting_url TEXT);
    CREATE TABLE IF NOT EXISTS notifications (id ${serial}, user_id TEXT NOT NULL REFERENCES users(id), subject TEXT NOT NULL, body TEXT NOT NULL, created TEXT NOT NULL);
  `);
    const setting = async (key, value) =>
      await db
        .prepare('INSERT INTO settings(key,value) VALUES (?,?) ON CONFLICT(key) DO NOTHING')
        .run(key, JSON.stringify(value));
    await setting('batch', {
      id: 'demo-01',
      title: 'Virtual Internship · Demo Batch',
      open: true,
      deadline: new Date(Date.now() + 30 * 86400000).toISOString(),
      hours: 20,
      duration: '4 months and 15 days',
      departments: departments.map((d) => d.id),
      eligibility:
        'Bangladeshi college and university students with Bengali and English proficiency.',
      sample: true,
    });
    await setting('announcements', []);
    if (demoMode) {
      const add = async (id, name, email, password, role) => {
        if (!(await db.prepare('SELECT id FROM users WHERE email=?').get(email)))
          await db
            .prepare('INSERT INTO users VALUES (?,?,?,?,?) ON CONFLICT(email) DO NOTHING')
            .run(id, name, email, hashPassword(password), role);
      };
      await add(
        'demo-staff',
        'Demo HR Coordinator',
        'staff@demo.ysse.test',
        'YsseDemo2026!',
        'staff',
      );
      await add(
        'demo-applicant',
        'Demo Applicant',
        'applicant@demo.ysse.test',
        'YsseDemo2026!',
        'applicant',
      );
    }
  };
  try {
    if (db.kind === 'postgres')
      await db.transaction(async () => {
        // Cold starts may initialize together; hold a transaction-scoped schema lock.
        await db.exec('SELECT pg_advisory_xact_lock(975031)');
        await initialize();
      });
    else await initialize();
  } catch (error) {
    await db.close();
    throw error;
  }
  return db;
}
export async function getSetting(db, key) {
  return JSON.parse((await db.prepare('SELECT value FROM settings WHERE key=?').get(key)).value);
}
export async function setSetting(db, key, value) {
  await db.prepare('UPDATE settings SET value=? WHERE key=?').run(JSON.stringify(value), key);
}
export async function transaction(db, fn) {
  return db.transaction(fn);
}
export async function recordStatus(db, application, status, actor, message) {
  const now = new Date().toISOString();
  const changed = await db
    .prepare('UPDATE applications SET status=?, updated=? WHERE id=? AND status=?')
    .run(status, now, application.id, application.status ?? 'draft');
  if (Number(changed.changes) !== 1)
    throw new HttpError(
      409,
      'This application changed while you were reviewing it. Refresh and try again.',
    );
  await db
    .prepare('INSERT INTO history(application_id,status,actor,message,created) VALUES (?,?,?,?,?)')
    .run(application.id, status, actor, message, now);
  await db
    .prepare('INSERT INTO notifications(user_id,subject,body,created) VALUES (?,?,?,?)')
    .run(application.user_id, `Application ${status.replaceAll('_', ' ')}`, message, now);
}
export const newId = () => randomUUID();
