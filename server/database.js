import { DatabaseSync } from 'node:sqlite';
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
export function openDatabase(path, demoMode = true) {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('applicant','staff')));
    CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS applications (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), batch_id TEXT NOT NULL, department TEXT NOT NULL, status TEXT NOT NULL, payload TEXT NOT NULL, cv_name TEXT, cv BLOB, created TEXT NOT NULL, updated TEXT NOT NULL, UNIQUE(user_id,batch_id));
    CREATE TABLE IF NOT EXISTS history (id INTEGER PRIMARY KEY, application_id TEXT NOT NULL REFERENCES applications(id), status TEXT NOT NULL, actor TEXT NOT NULL, message TEXT NOT NULL, created TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS reviews (application_id TEXT PRIMARY KEY REFERENCES applications(id), notes TEXT NOT NULL DEFAULT '', score INTEGER, interviewer TEXT, scheduled_at TEXT, meeting_url TEXT);
    CREATE TABLE IF NOT EXISTS notifications (id INTEGER PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), subject TEXT NOT NULL, body TEXT NOT NULL, created TEXT NOT NULL);
  `);
  const setting = (key, value) =>
    db
      .prepare('INSERT OR IGNORE INTO settings(key,value) VALUES (?,?)')
      .run(key, JSON.stringify(value));
  setting('batch', {
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
  setting('announcements', []);
  if (demoMode) {
    const add = (id, name, email, password, role) => {
      if (!db.prepare('SELECT id FROM users WHERE email=?').get(email))
        db.prepare('INSERT INTO users VALUES (?,?,?,?,?)').run(
          id,
          name,
          email,
          hashPassword(password),
          role,
        );
    };
    add('demo-staff', 'Demo HR Coordinator', 'staff@demo.ysse.test', 'YsseDemo2026!', 'staff');
    add(
      'demo-applicant',
      'Demo Applicant',
      'applicant@demo.ysse.test',
      'YsseDemo2026!',
      'applicant',
    );
  }
  return db;
}
export function getSetting(db, key) {
  return JSON.parse(db.prepare('SELECT value FROM settings WHERE key=?').get(key).value);
}
export function setSetting(db, key, value) {
  db.prepare('UPDATE settings SET value=? WHERE key=?').run(JSON.stringify(value), key);
}
export function transaction(db, fn) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
export function recordStatus(db, application, status, actor, message) {
  const now = new Date().toISOString();
  db.prepare('UPDATE applications SET status=?, updated=? WHERE id=?').run(
    status,
    now,
    application.id,
  );
  db.prepare(
    'INSERT INTO history(application_id,status,actor,message,created) VALUES (?,?,?,?,?)',
  ).run(application.id, status, actor, message, now);
  db.prepare('INSERT INTO notifications(user_id,subject,body,created) VALUES (?,?,?,?)').run(
    application.user_id,
    `Application ${status.replaceAll('_', ' ')}`,
    message,
    now,
  );
}
export const newId = () => randomUUID();
