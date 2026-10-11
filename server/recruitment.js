import { departments } from '../public/js/data.js';
import { getSetting, newId, recordStatus, transaction } from './database.js';

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
export function requireValue(condition, message, status = 400) {
  if (!condition) throw new HttpError(status, message);
}
export const transitions = {
  submitted: ['shortlisted', 'waitlisted', 'rejected'],
  waitlisted: ['shortlisted', 'selected', 'rejected'],
  shortlisted: ['interview_scheduled', 'rejected'],
  interview_scheduled: ['interviewed', 'rejected'],
  interviewed: ['selected', 'waitlisted', 'rejected'],
  selected: [],
  offer_accepted: ['onboarded'],
  onboarded: [],
  rejected: [],
  withdrawn: [],
  draft: [],
};
const clean = (value, max = 2000) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
export function applicationData(body, submitting = false) {
  const data = {
    name: clean(body.name, 100),
    phone: clean(body.phone, 30),
    institution: clean(body.institution, 200),
    education: clean(body.education, 200),
    skills: clean(body.skills),
    motivation: clean(body.motivation),
    portfolio: clean(body.portfolio, 500),
    commitment: body.commitment === true,
    eligible: body.eligible === true,
    consent: body.consent === true,
  };
  if (data.portfolio)
    requireValue(
      /^https:\/\//.test(data.portfolio) && isWebUrl(data.portfolio),
      'Portfolio must be a valid HTTPS link.',
    );
  if (submitting) {
    requireValue(
      data.name.length >= 2 && data.institution.length >= 2 && data.education.length >= 2,
      'Name, institution and education are required.',
    );
    requireValue(/^[+\d ()-]{7,30}$/.test(data.phone), 'Enter a valid phone number.');
    requireValue(
      data.skills.length >= 10 && data.motivation.length >= 30,
      'Describe your skills (10+ characters) and motivation (30+ characters).',
    );
    requireValue(
      data.commitment && data.eligible && data.consent,
      'Confirm eligibility, weekly commitment and application data consent.',
    );
  }
  return data;
}
export function isWebUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' && !u.username && !u.password;
  } catch {
    return false;
  }
}
export function getApplication(db, id, user) {
  const row = db
    .prepare('SELECT a.*,u.email FROM applications a JOIN users u ON u.id=a.user_id WHERE a.id=?')
    .get(id);
  requireValue(row, 'Application not found.', 404);
  requireValue(
    user.role === 'staff' || row.user_id === user.id,
    'You cannot access this application.',
    403,
  );
  requireValue(
    user.role !== 'staff' || row.status !== 'draft',
    'Draft applications are private to the applicant.',
    403,
  );
  return row;
}
export function serializeApplication(db, row, user) {
  if (!row) return null;
  const { cv, payload, ...application } = row;
  application.data = JSON.parse(payload);
  application.hasCv = Boolean(cv);
  application.history = db
    .prepare('SELECT status,actor,message,created FROM history WHERE application_id=? ORDER BY id')
    .all(row.id);
  const review = db.prepare('SELECT * FROM reviews WHERE application_id=?').get(row.id);
  application.interview = review?.scheduled_at
    ? {
        interviewer: review.interviewer,
        scheduledAt: review.scheduled_at,
        meetingUrl: review.meeting_url,
      }
    : null;
  if (user.role === 'staff') application.review = review ?? { notes: '', score: null };
  return application;
}
export function saveApplication(db, user, body) {
  const batch = getSetting(db, 'batch');
  requireValue(
    batch.open && Date.parse(batch.deadline) > Date.now(),
    'Applications for this batch are closed.',
    409,
  );
  requireValue(
    typeof body.department === 'string' && batch.departments.includes(body.department),
    'Choose a department recruiting in this batch.',
  );
  const existing = db
    .prepare('SELECT * FROM applications WHERE user_id=? AND batch_id=?')
    .get(user.id, batch.id);
  requireValue(
    !existing || existing.status === 'draft',
    'This application is already submitted.',
    409,
  );
  const submitting = body.submit === true;
  const data = applicationData(body, submitting);
  let cv = existing?.cv ?? null,
    cvName = existing?.cv_name ?? null;
  if (body.removeCv === true) {
    cv = null;
    cvName = null;
  }
  if (body.cv) {
    requireValue(
      typeof body.cv.base64 === 'string' && body.cv.base64.length <= 2800000,
      'CV must be a PDF of at most 2 MB.',
    );
    cv = Buffer.from(body.cv.base64, 'base64');
    requireValue(
      cv.length > 5 && cv.length <= 2 * 1024 * 1024 && cv.subarray(0, 5).toString() === '%PDF-',
      'CV must be a PDF of at most 2 MB.',
    );
    cvName = clean(body.cv.name, 100).replace(/[^a-zA-Z0-9 ._-]/g, '_');
    requireValue(cvName.toLowerCase().endsWith('.pdf'), 'CV filename must end in .pdf.');
  }
  if (submitting)
    requireValue(cv || data.portfolio, 'Attach a PDF CV or provide a portfolio link.');
  const now = new Date().toISOString();
  const id = existing?.id ?? newId();
  transaction(db, () => {
    if (existing)
      db.prepare(
        'UPDATE applications SET department=?,payload=?,cv_name=?,cv=?,updated=? WHERE id=?',
      ).run(body.department, JSON.stringify(data), cvName, cv, now, id);
    else
      db.prepare('INSERT INTO applications VALUES (?,?,?,?,?,?,?,?,?,?)').run(
        id,
        user.id,
        batch.id,
        body.department,
        'draft',
        JSON.stringify(data),
        cvName,
        cv,
        now,
        now,
      );
    if (submitting)
      recordStatus(
        db,
        { id, user_id: user.id },
        'submitted',
        user.name,
        'Your application has been received. The recruitment team will review it.',
      );
  });
  return serializeApplication(db, getApplication(db, id, user), user);
}
export function updateReview(db, row, body) {
  requireValue(row.status !== 'draft', 'Drafts cannot be reviewed.', 409);
  const old = db.prepare('SELECT * FROM reviews WHERE application_id=?').get(row.id) ?? {};
  const score =
    body.score === null || body.score === ''
      ? null
      : body.score === undefined
        ? (old.score ?? null)
        : Number(body.score);
  requireValue(
    score === null || (Number.isInteger(score) && score >= 0 && score <= 100),
    'Score must be between 0 and 100.',
  );
  db.prepare(
    `INSERT INTO reviews(application_id,notes,score) VALUES (?,?,?) ON CONFLICT(application_id) DO UPDATE SET notes=excluded.notes,score=excluded.score`,
  ).run(row.id, clean(body.notes ?? old.notes, 5000), score);
}
export function moveApplication(db, row, body, user) {
  const next = body.status;
  requireValue(
    transitions[row.status]?.includes(next),
    `Cannot move from ${row.status.replaceAll('_', ' ')} to that stage.`,
    409,
  );
  if (next === 'selected' && row.status === 'waitlisted') {
    requireValue(
      db
        .prepare("SELECT id FROM history WHERE application_id=? AND status='interviewed'")
        .get(row.id),
      'Complete an interview before selection.',
      409,
    );
  }
  if (next === 'interview_scheduled') {
    requireValue(isWebUrl(body.meetingUrl), 'Enter a valid HTTPS meeting link.');
    requireValue(
      Number.isFinite(Date.parse(body.scheduledAt)) && Date.parse(body.scheduledAt) > Date.now(),
      'Schedule the interview in the future.',
    );
    requireValue(clean(body.interviewer, 100).length >= 2, 'Enter the interviewer’s name.');
  }
  const messages = {
    shortlisted: 'You have been shortlisted. Interview details will follow.',
    waitlisted:
      'Your application is on the waitlist. We will update you if an opportunity becomes available.',
    rejected: 'Thank you for your interest. Your application was not selected for this demo batch.',
    interview_scheduled: 'Your interview has been scheduled. See the details in your dashboard.',
    interviewed: 'Your interview is complete and a decision is pending.',
    selected: 'You have been selected. Review and accept your demo offer in the dashboard.',
    onboarded: 'Onboarding is complete. Welcome to your assigned department.',
  };
  transaction(db, () => {
    updateReview(db, row, body);
    if (next === 'interview_scheduled')
      db.prepare(
        `INSERT INTO reviews(application_id,interviewer,scheduled_at,meeting_url) VALUES (?,?,?,?) ON CONFLICT(application_id) DO UPDATE SET interviewer=excluded.interviewer,scheduled_at=excluded.scheduled_at,meeting_url=excluded.meeting_url`,
      ).run(
        row.id,
        clean(body.interviewer, 100),
        new Date(body.scheduledAt).toISOString(),
        body.meetingUrl,
      );
    recordStatus(db, row, next, user.name, messages[next]);
  });
  return serializeApplication(db, getApplication(db, row.id, user), user);
}
export function validateBatch(body, previous) {
  requireValue(clean(body.title, 150).length >= 3, 'Batch title is required.');
  requireValue(Number.isFinite(Date.parse(body.deadline)), 'Enter a valid deadline.');
  requireValue(
    Array.isArray(body.departments) &&
      body.departments.length > 0 &&
      body.departments.every((id) => departments.some((d) => d.id === id)),
    'Choose at least one valid department.',
  );
  requireValue(
    Number.isInteger(Number(body.hours)) && Number(body.hours) >= 1 && Number(body.hours) <= 60,
    'Weekly hours must be between 1 and 60.',
  );
  requireValue(
    clean(body.duration, 100) && clean(body.eligibility, 1000),
    'Duration and eligibility are required.',
  );
  return {
    ...previous,
    title: clean(body.title, 150),
    open: body.open === true,
    deadline: new Date(body.deadline).toISOString(),
    departments: [...new Set(body.departments)],
    hours: Number(body.hours),
    duration: clean(body.duration, 100),
    eligibility: clean(body.eligibility, 1000),
  };
}
