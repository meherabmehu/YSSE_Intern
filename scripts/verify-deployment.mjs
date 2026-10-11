import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import pg from 'pg';

// Opt-in hosted QA. Only the synthetic account created by this run is removed.
assert.ok(
  process.env.YSSE_VERIFY_URL && process.env.DATABASE_URL,
  'Set YSSE_VERIFY_URL and DATABASE_URL explicitly.',
);
const base = new URL(process.env.YSSE_VERIFY_URL);
assert.equal(base.protocol, 'https:');
const marker = randomUUID();
const email = `deployment-qa-${marker}@example.test`;
let userId;
const cookies = { applicant: '', staff: '' };
async function request(
  path,
  body,
  role = 'applicant',
  method = body === undefined ? 'GET' : 'POST',
) {
  const response = await fetch(new URL('/api' + path, base), {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-YSSE-Request': 'portal',
      Origin: base.origin,
      Cookie: cookies[role],
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const cookie = response.headers.get('set-cookie');
  if (cookie) {
    if (!cookie.includes('Max-Age=0')) assert.ok(cookie.includes('Secure'));
    cookies[role] = cookie.split(';')[0];
  }
  const data = await response.json();
  assert.ok(response.ok, `${path}: HTTP ${response.status}`);
  return data;
}
try {
  const registered = await request('/register', {
    name: 'Deployment QA Candidate',
    email,
    password: `QA-${marker}!`,
  });
  userId = registered.user.id;
  assert.equal(registered.user.email, email);
  await request('/login', { email: 'staff@demo.ysse.test', password: 'YsseDemo2026!' }, 'staff');
  const payload = {
    name: 'Deployment QA Candidate',
    phone: '+8801700000000',
    institution: 'Sample QA University',
    education: 'Sample undergraduate',
    department: 'it',
    skills: 'Sample web development and teamwork',
    motivation: 'This synthetic deployment check verifies the demonstration recruitment pipeline.',
    portfolio: 'https://example.com/qa',
    eligible: true,
    commitment: true,
    consent: true,
  };
  await request('/application', payload, 'applicant', 'PUT');
  const submitted = await request('/application', { ...payload, submit: true }, 'applicant', 'PUT');
  const id = submitted.id;
  assert.equal(submitted.status, 'submitted');
  assert.ok((await request('/staff/applications', undefined, 'staff')).some((a) => a.id === id));
  async function transition(status, extra = {}) {
    const result = await request(
      `/staff/applications/${id}/transition`,
      { status, ...extra },
      'staff',
    );
    assert.equal(result.status, status);
  }
  await transition('shortlisted', { notes: 'Private synthetic QA review', score: 90 });
  await transition('interview_scheduled', {
    interviewer: 'QA Mentor',
    scheduledAt: new Date(Date.now() + 86400000).toISOString(),
    meetingUrl: 'https://example.com/qa-meeting',
  });
  await transition('interviewed');
  await transition('selected');
  assert.equal((await request(`/applications/${id}/accept`, {})).status, 'offer_accepted');
  await transition('onboarded');
  const result = await request('/application');
  assert.equal(result.status, 'onboarded');
  assert.equal(result.history.length, 7);
  assert.equal(result.review, undefined);
  assert.equal((await request('/notifications')).length, 7);
  await request('/logout', {}, 'staff');
  await request('/logout', {}, 'applicant');
  console.log(
    'Live deployment: authentication, draft, submission, screening, interview, offer acceptance, onboarding and notification previews passed.',
  );
} finally {
  if (userId) {
    const url = new URL(process.env.DATABASE_URL);
    url.searchParams.set('sslmode', 'verify-full');
    const pool = new pg.Pool({ connectionString: url.toString(), max: 1 });
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const own = await client.query('SELECT id FROM users WHERE id=$1 AND email=$2', [
        userId,
        email,
      ]);
      assert.equal(own.rowCount, 1, 'Cleanup is limited to this synthetic QA account.');
      await client.query(
        'DELETE FROM history WHERE application_id IN (SELECT id FROM applications WHERE user_id=$1)',
        [userId],
      );
      await client.query(
        'DELETE FROM reviews WHERE application_id IN (SELECT id FROM applications WHERE user_id=$1)',
        [userId],
      );
      await client.query('DELETE FROM notifications WHERE user_id=$1', [userId]);
      await client.query('DELETE FROM applications WHERE user_id=$1', [userId]);
      await client.query('DELETE FROM sessions WHERE user_id=$1', [userId]);
      await client.query('DELETE FROM users WHERE id=$1 AND email=$2', [userId, email]);
      await client.query('COMMIT');
      console.log(
        'Synthetic deployment QA records removed; demo users and other applications preserved.',
      );
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
      await pool.end();
    }
  }
}
