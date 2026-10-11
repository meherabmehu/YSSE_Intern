import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../server/index.js';

async function setup(t, options = {}) {
  const server = createApp({ dbPath: ':memory:', ...options });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => (server.listening ? new Promise((resolve) => server.close(resolve)) : undefined));
  const base = `http://127.0.0.1:${server.address().port}`;
  function client() {
    let cookie = '';
    return async (path, body, method = body === undefined ? 'GET' : 'POST', extraHeaders = {}) => {
      const response = await fetch(`${base}/api${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-YSSE-Request': 'portal',
          Cookie: cookie,
          ...extraHeaders,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const next = response.headers.get('set-cookie');
      if (next) cookie = next.split(';')[0];
      const data = response.headers.get('content-type')?.includes('json')
        ? await response.json()
        : await response.text();
      return { status: response.status, data, headers: response.headers };
    };
  }
  const applicant = client(),
    staff = client();
  assert.equal(
    (await applicant('/login', { email: 'applicant@demo.ysse.test', password: 'YsseDemo2026!' }))
      .status,
    200,
  );
  assert.equal(
    (await staff('/login', { email: 'staff@demo.ysse.test', password: 'YsseDemo2026!' })).status,
    200,
  );
  return { applicant, staff, anonymous: client(), client, base, server };
}
const payload = {
  name: 'Sample Candidate',
  phone: '+8801700000000',
  institution: 'Demo University',
  education: 'Undergraduate, year 2',
  department: 'it',
  skills: 'JavaScript, teamwork and web development',
  motivation: 'I want to learn from a team and contribute useful technology to community projects.',
  portfolio: 'https://example.com/portfolio',
  eligible: true,
  commitment: true,
  consent: true,
};
async function submitted(applicant) {
  const response = await applicant('/application', { ...payload, submit: true }, 'PUT');
  assert.equal(response.status, 200, JSON.stringify(response.data));
  return response.data;
}

test('complete recruitment journey persists history, private evaluation and notification previews', async (t) => {
  const { applicant, staff } = await setup(t);
  const draft = await applicant(
    '/application',
    { department: 'it', name: 'Sample Candidate' },
    'PUT',
  );
  assert.equal(draft.data.status, 'draft');
  assert.equal((await staff('/staff/applications')).data.length, 0);
  const a = await submitted(applicant);
  const transition = (status, fields = {}) =>
    staff(`/staff/applications/${a.id}/transition`, { status, ...fields });
  assert.equal((await transition('selected')).status, 409);
  assert.equal(
    (await transition('shortlisted', { score: 82, notes: 'Private reviewer comments' })).status,
    200,
  );
  const schedule = {
    interviewer: 'Demo Interviewer',
    scheduledAt: new Date(Date.now() + 86400000).toISOString(),
    meetingUrl: 'https://meet.google.com/demo',
  };
  assert.equal((await transition('interview_scheduled', schedule)).status, 200);
  assert.equal((await transition('interviewed')).status, 200);
  assert.equal((await transition('selected')).status, 200);
  assert.equal((await transition('onboarded')).status, 409);
  assert.equal((await applicant(`/applications/${a.id}/accept`, {})).data.status, 'offer_accepted');
  assert.equal((await transition('onboarded')).data.status, 'onboarded');
  const candidateView = (await applicant('/application')).data;
  assert.equal(candidateView.history.length, 7);
  assert.equal(candidateView.review, undefined);
  assert.equal(JSON.stringify(candidateView).includes('Private reviewer comments'), false);
  assert.equal((await applicant('/notifications')).data.length, 7);
  assert.equal(
    (await staff(`/staff/applications/${a.id}`)).data.review.notes,
    'Private reviewer comments',
  );
});
test('requires authentication, staff permissions and ownership for applications and CVs', async (t) => {
  const { applicant, staff, anonymous, client } = await setup(t);
  assert.equal((await anonymous('/application')).status, 401);
  assert.equal((await applicant('/staff/applications')).status, 403);
  assert.equal((await staff('/application', payload, 'PUT')).status, 403);
  const a = await submitted(applicant);
  const other = client();
  await other('/register', {
    name: 'Other Candidate',
    email: 'other@example.test',
    password: 'LongPassword123!',
  });
  assert.equal((await other(`/applications/${a.id}/cv`)).status, 403);
  assert.equal((await other(`/applications/${a.id}/withdraw`, {})).status, 403);
  assert.equal((await staff(`/applications/${a.id}/accept`, {})).status, 403);
});
test('enforces submission validation, one application per batch and submitted data locking', async (t) => {
  const { applicant } = await setup(t);
  assert.equal(
    (await applicant('/application', { department: 'it', submit: true }, 'PUT')).status,
    400,
  );
  assert.equal(
    (await applicant('/application', { ...payload, portfolio: '', submit: true }, 'PUT')).status,
    400,
  );
  assert.equal(
    (await applicant('/application', { ...payload, consent: false, submit: true }, 'PUT')).status,
    400,
  );
  await submitted(applicant);
  assert.equal(
    (await applicant('/application', { ...payload, department: 'design', submit: true }, 'PUT'))
      .status,
    409,
  );
  assert.equal((await applicant('/application', payload, 'PUT')).status, 409);
});
test('batch department restrictions, closed window and elapsed deadline are enforced server-side', async (t) => {
  const { applicant, staff } = await setup(t);
  const batch = (await applicant('/batch')).data;
  assert.equal(
    (await staff('/staff/batch', { ...batch, departments: ['design'] }, 'PUT')).status,
    200,
  );
  assert.equal((await applicant('/application', payload, 'PUT')).status, 400);
  await staff('/staff/batch', { ...batch, open: false }, 'PUT');
  assert.equal((await applicant('/application', payload, 'PUT')).status, 409);
  await staff(
    '/staff/batch',
    { ...batch, deadline: new Date(Date.now() - 1000).toISOString() },
    'PUT',
  );
  assert.equal((await applicant('/application', payload, 'PUT')).status, 409);
});
test('CV validation and download access work without exposing file data in JSON', async (t) => {
  const { applicant, staff } = await setup(t);
  const bad = { name: 'cv.pdf', base64: Buffer.from('not a PDF').toString('base64') };
  assert.equal((await applicant('/application', { ...payload, cv: bad }, 'PUT')).status, 400);
  const cv = {
    name: 'demo.pdf',
    base64: Buffer.from('%PDF-1.4\nDemo PDF content\n%%EOF').toString('base64'),
  };
  const a = (
    await applicant('/application', { ...payload, portfolio: '', cv, submit: true }, 'PUT')
  ).data;
  assert.equal(a.hasCv, true);
  assert.equal(a.cv, undefined);
  const download = await staff(`/applications/${a.id}/cv`);
  assert.equal(download.status, 200);
  assert.equal(download.headers.get('content-type'), 'application/pdf');
  assert.equal(download.data.startsWith('%PDF-'), true);
});
test('interview scheduling validates dates and URLs, and failed transitions leave no history', async (t) => {
  const { applicant, staff } = await setup(t);
  const a = await submitted(applicant);
  await staff(`/staff/applications/${a.id}/transition`, { status: 'shortlisted' });
  const path = `/staff/applications/${a.id}/transition`;
  assert.equal(
    (
      await staff(path, {
        status: 'interview_scheduled',
        interviewer: 'Demo',
        scheduledAt: 'invalid',
        meetingUrl: 'https://example.com',
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await staff(path, {
        status: 'interview_scheduled',
        interviewer: 'Demo',
        scheduledAt: new Date(Date.now() + 100000).toISOString(),
        meetingUrl: 'javascript:alert(1)',
      })
    ).status,
    400,
  );
  const current = (await applicant('/application')).data;
  assert.equal(current.status, 'shortlisted');
  assert.equal(current.history.length, 2);
});
test('waitlist cannot bypass interview and rejected applications cannot be reopened', async (t) => {
  const { applicant, staff } = await setup(t);
  const a = await submitted(applicant);
  const path = `/staff/applications/${a.id}/transition`;
  assert.equal((await staff(path, { status: 'waitlisted' })).status, 200);
  assert.equal((await staff(path, { status: 'selected' })).status, 409);
  assert.equal((await staff(path, { status: 'rejected' })).status, 200);
  assert.equal((await staff(path, { status: 'shortlisted' })).status, 409);
});
test('withdrawal is recorded and terminal', async (t) => {
  const { applicant, staff } = await setup(t);
  const a = await submitted(applicant);
  assert.equal((await applicant(`/applications/${a.id}/withdraw`, {})).data.status, 'withdrawn');
  assert.equal(
    (await staff(`/staff/applications/${a.id}/transition`, { status: 'shortlisted' })).status,
    409,
  );
});
test('announcement management validates links and supports persistence and removal', async (t) => {
  const { applicant, staff, anonymous } = await setup(t);
  const item = {
    title: 'Demo update',
    summary: 'An illustrative public announcement.',
    href: '#/internship',
  };
  assert.equal((await applicant('/staff/announcements', item)).status, 403);
  assert.equal(
    (await staff('/staff/announcements', { ...item, href: 'javascript:alert(1)' })).status,
    400,
  );
  const created = await staff('/staff/announcements', item);
  assert.equal(created.status, 201);
  assert.equal((await anonymous('/announcements')).data[0].title, item.title);
  await staff(`/staff/announcements/${created.data.id}`, {}, 'DELETE');
  assert.equal((await anonymous('/announcements')).data.length, 0);
});
test('session logout, request protection and invalid credentials are enforced', async (t) => {
  const { applicant, anonymous } = await setup(t);
  assert.equal(
    (await anonymous('/login', { email: 'applicant@demo.ysse.test', password: 'incorrect' }))
      .status,
    401,
  );
  assert.equal(
    (await applicant('/application', payload, 'PUT', { 'X-YSSE-Request': '' })).status,
    403,
  );
  assert.equal(
    (await applicant('/application', payload, 'PUT', { Origin: 'https://untrusted.example' }))
      .status,
    403,
  );
  assert.equal((await applicant('/session')).data.user.role, 'applicant');
  await applicant('/logout', {});
  assert.equal((await applicant('/session')).data.user, null);
  assert.equal((await applicant('/application')).status, 401);
});
test('database survives a server restart', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'ysse-test-'));
  const path = join(directory, 'demo.sqlite');
  const first = await setup(t, { dbPath: path });
  const a = await submitted(first.applicant);
  await new Promise((resolve) => first.server.close(resolve));
  const second = await setup(t, { dbPath: path });
  t.after(() => rm(directory, { recursive: true, force: true }));
  assert.equal((await second.applicant('/application')).data.id, a.id);
  assert.equal((await second.staff('/staff/applications')).data.length, 1);
});
test('static server serves assets, rejects traversal and hides server/database files', async (t) => {
  const { base } = await setup(t);
  for (const path of ['/', '/js/app.js', '/styles.css', '/assets/growth.svg'])
    assert.equal((await fetch(base + path)).status, 200);
  for (const path of ['/server/api.js', '/data/ysse.sqlite', '/.git/config'])
    assert.equal((await fetch(base + path)).status, 404);
  assert.equal((await fetch(base + '/%2e%2e%2fserver/index.js')).status, 403);
  assert.equal(
    (await fetch(base)).headers.get('content-security-policy').includes("frame-ancestors 'none'"),
    true,
  );
});
