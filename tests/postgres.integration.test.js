import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { createApp } from '../server/index.js';

test(
  'PostgreSQL lifecycle, transaction rollback, binary CV and cross-instance persistence',
  {
    skip: process.env.YSSE_TEST_POSTGRES !== '1' || !process.env.DATABASE_URL,
  },
  async (t) => {
    // This schema is created only for this test and is removed afterwards.
    const schema = `ysse_test_${randomUUID().replaceAll('-', '')}`;
    assert.match(schema, /^ysse_test_[a-f0-9]{32}$/);
    const url = new URL(process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL);
    url.searchParams.set('sslmode', 'verify-full');
    const admin = new pg.Pool({ connectionString: url.toString(), max: 1 });
    await admin.query(`CREATE SCHEMA "${schema}"`);
    url.searchParams.set('options', `-c search_path=${schema}`);
    const databaseUrl = url.toString();
    const servers = [];
    t.after(async () => {
      for (const server of servers)
        if (server.listening) {
          server.closeAllConnections();
          await new Promise((resolve) => server.close(resolve));
        }
      await admin.query(`DROP SCHEMA "${schema}" CASCADE`);
      await admin.end();
    });
    async function instance() {
      const server = await createApp({ databaseUrl, demoMode: true });
      servers.push(server);
      await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
      return `http://127.0.0.1:${server.address().port}`;
    }
    const [base, second] = await Promise.all([instance(), instance()]);
    let applicantCookie, staffCookie;
    async function request(path, body, cookie = '', target = base, method = body ? 'POST' : 'GET') {
      const response = await fetch(target + '/api' + path, {
        method,
        headers: { 'Content-Type': 'application/json', 'X-YSSE-Request': 'portal', Cookie: cookie },
        body: body ? JSON.stringify(body) : undefined,
      });
      const result = response.headers.get('content-type')?.includes('json')
        ? await response.json()
        : await response.text();
      return {
        status: response.status,
        data: result,
        cookie: response.headers.get('set-cookie')?.split(';')[0],
      };
    }
    applicantCookie = (
      await request('/login', { email: 'applicant@demo.ysse.test', password: 'YsseDemo2026!' })
    ).cookie;
    staffCookie = (
      await request('/login', { email: 'staff@demo.ysse.test', password: 'YsseDemo2026!' })
    ).cookie;
    assert.ok(applicantCookie);
    assert.ok(staffCookie);
    const payload = {
      name: 'Postgres QA Candidate',
      phone: '+8801700000000',
      institution: 'Sample University',
      education: 'Undergraduate year 2',
      department: 'it',
      skills: 'Web development and teamwork',
      motivation: 'I want to learn useful skills and support a community project with a team.',
      eligible: true,
      commitment: true,
      consent: true,
      submit: true,
      cv: {
        name: 'sample.pdf',
        base64: Buffer.from('%PDF-1.4\nSample QA document\n%%EOF').toString('base64'),
      },
    };
    const submitted = await request('/application', payload, applicantCookie, base, 'PUT');
    assert.equal(submitted.status, 200, JSON.stringify(submitted.data));
    const id = submitted.data.id;
    assert.equal((await request('/application', undefined, applicantCookie, second)).data.id, id);
    assert.equal(
      (await request('/staff/applications', undefined, staffCookie, second)).data[0].id,
      id,
    );
    assert.equal(
      (await request(`/applications/${id}/cv`, undefined, staffCookie, second)).data.startsWith(
        '%PDF-',
      ),
      true,
    );
    async function transition(status, extra = {}, target = base) {
      return request(
        `/staff/applications/${id}/transition`,
        { status, ...extra },
        staffCookie,
        target,
      );
    }
    const concurrent = await Promise.all([
      transition('shortlisted', { notes: 'first review' }),
      transition('shortlisted', { notes: 'second review' }, second),
    ]);
    assert.deepEqual(concurrent.map((r) => r.status).sort(), [200, 409]);
    assert.equal(
      (await request('/application', undefined, applicantCookie)).data.history.length,
      2,
    );
    assert.equal(
      (
        await transition('interview_scheduled', {
          interviewer: 'QA Mentor',
          scheduledAt: new Date(Date.now() + 86400000).toISOString(),
          meetingUrl: 'https://example.com/meeting',
        })
      ).status,
      200,
    );
    assert.equal((await transition('interviewed')).status, 200);
    assert.equal((await transition('selected')).status, 200);
    assert.equal(
      (await request(`/applications/${id}/accept`, {}, applicantCookie, second)).status,
      200,
    );
    assert.equal((await transition('onboarded', {}, second)).status, 200);
    const result = (await request('/application', undefined, applicantCookie)).data;
    assert.equal(result.status, 'onboarded');
    assert.equal(result.history.length, 7);
    assert.equal(result.review, undefined);
  },
);
