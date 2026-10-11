import { api } from '../api.js';
import { departments } from '../data.js';
import { pageIntro, link, escapeHtml as esc, emptyState, toast } from '../ui.js';
import {
  protectedPage,
  statusLabels,
  statusBadge,
  date,
  departmentName,
  historyView,
  dataView,
  interviewView,
} from './recruitment.js';

const nextStages = {
  submitted: ['shortlisted', 'waitlisted', 'rejected'],
  waitlisted: ['shortlisted', 'selected', 'rejected'],
  shortlisted: ['interview_scheduled', 'rejected'],
  interview_scheduled: ['interviewed', 'rejected'],
  interviewed: ['selected', 'waitlisted', 'rejected'],
  offer_accepted: ['onboarded'],
};
const tabs = (active) =>
  `<div class="workspace-tabs">${[
    ['staff', 'Applications'],
    ['settings', 'Batch settings'],
    ['content', 'Announcements'],
  ]
    .map(([id, title]) => link(`#/${id}`, title, active === id ? 'active' : ''))
    .join('')}</div>`;
const table = (rows) =>
  rows.length
    ? `<div class="table-wrap"><table><thead><tr><th>Applicant</th><th>Department</th><th>Status</th><th>Updated</th><th><span class="sr-only">Review</span></th></tr></thead><tbody>${rows.map((a) => `<tr><td><strong>${esc(a.data.name)}</strong><small>${esc(a.email)}</small></td><td>${esc(departmentName(a.department))}</td><td>${statusBadge(a.status)}</td><td>${esc(date(a.updated))}</td><td>${link(`#/staff/${a.id}`, 'Review →', 'inline-link')}</td></tr>`).join('')}</tbody></table></div>`
    : emptyState(
        'No applications to review.',
        'Submit an application using an applicant account, or adjust your filters.',
      );

export async function staffPage(id) {
  const denied = protectedPage('staff');
  if (denied) return denied;
  if (id) {
    const a = await api(`/staff/applications/${id}`);
    const stages = (nextStages[a.status] ?? []).filter(
      (status) =>
        status !== 'selected' ||
        a.status !== 'waitlisted' ||
        a.history.some((h) => h.status === 'interviewed'),
    );
    return `${pageIntro(link('#/staff', 'STAFF WORKSPACE') + ' / APPLICATION REVIEW', esc(a.data.name), `Reference: ${esc(a.id.slice(0, 8).toUpperCase())} · ${esc(departmentName(a.department))}`)}<section class="section container"><div class="dashboard-top"><h2>Application review</h2>${statusBadge(a.status)}</div><div class="dashboard-grid"><div class="stack"><section class="info-card"><h3>Applicant details</h3>${dataView(a)}</section>${interviewView(a)}<section class="info-card"><h3>Status history</h3>${historyView(a.history)}</section></div><aside class="stack"><form class="info-card" id="review-form" data-id="${a.id}"><div class="eyebrow">PRIVATE STAFF NOTES</div><h3>Evaluation</h3><label>Score (0–100)<input type="number" name="score" min="0" max="100" value="${esc(a.review.score)}"></label><label>Review notes<textarea name="notes" maxlength="5000">${esc(a.review.notes)}</textarea></label><p class="field-help">Notes and scores are never shown to applicants.</p><button class="button secondary" type="submit">Save evaluation</button><p class="form-error" role="alert"></p></form>${stages.length ? `<form class="info-card" id="transition-form" data-id="${a.id}"><div class="eyebrow">NEXT STEP</div><h3>Move the application</h3><label>Recruitment stage<select name="status" id="next-status">${stages.map((s) => `<option value="${s}">${statusLabels[s]}</option>`).join('')}</select></label><div id="interview-fields" ${stages[0] === 'interview_scheduled' ? '' : 'hidden'}><label>Interviewer<input name="interviewer" maxlength="100" value="${esc(a.interview?.interviewer)}"></label><label>Interview time (your device timezone)<input type="datetime-local" name="scheduledAt"></label><label>Meeting link (HTTPS)<input name="meetingUrl" type="url" placeholder="https://meet.google.com/…"></label></div><p class="field-help">This saves the current evaluation, records a status change and creates a notification preview.</p><button class="button primary full-width" type="submit">Confirm stage change →</button><p class="form-error" role="alert"></p></form>` : `<section class="info-card"><h3>${a.status === 'selected' ? 'Waiting for offer acceptance' : a.status === 'onboarded' ? 'Recruitment complete' : 'No staff action needed'}</h3><p>${a.status === 'selected' ? 'The applicant must accept the offer before you can complete onboarding.' : 'This application has no further available staff transitions.'}</p></section>`}</aside></div></section>`;
  }
  const rows = await api('/staff/applications');
  const stats = [
    ['All applications', rows.length],
    ['To screen', rows.filter((a) => a.status === 'submitted').length],
    [
      'Interviews',
      rows.filter((a) => ['interview_scheduled', 'interviewed'].includes(a.status)).length,
    ],
    ['Onboarded', rows.filter((a) => a.status === 'onboarded').length],
  ];
  return `${pageIntro('STAFF WORKSPACE', 'Good teams start here.', 'Review applications, guide candidates and keep the recruitment journey moving.')}<section class="section container">${tabs('staff')}<div class="metric-grid">${stats.map(([label, value]) => `<div class="metric"><small>${label}</small><strong>${value}</strong></div>`).join('')}</div><div class="filter-row"><label class="search-box"><span aria-hidden="true">⌕</span><input type="search" id="application-search" placeholder="Search applicant, email or institution" aria-label="Search applications"></label><label>Department<select id="application-department"><option value="">All departments</option>${departments.map((d) => `<option value="${d.id}">${d.name}</option>`).join('')}</select></label><label>Status<select id="application-status"><option value="">All stages</option>${Object.entries(
    statusLabels,
  )
    .filter(([s]) => s !== 'draft')
    .map(([s, l]) => `<option value="${s}">${l}</option>`)
    .join(
      '',
    )}</select></label><button class="button secondary" id="export-applications">Export filtered CSV ↓</button></div><div id="application-results">${table(rows)}</div><p class="demo-note">Only submitted applications appear here. Drafts stay in the applicant’s workspace.</p></section>`;
}
function localDate(value) {
  const d = new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
export async function settingsPage() {
  const denied = protectedPage('staff');
  if (denied) return denied;
  const b = await api('/batch');
  return `${pageIntro('STAFF WORKSPACE', 'Set the stage for your next team.', 'Configure the demonstration batch and the departments currently recruiting.')}<section class="section container">${tabs('settings')}<form class="settings-form info-card" id="batch-form"><h3>Batch configuration</h3><div class="form-grid"><label>Title<input name="title" value="${esc(b.title)}" required maxlength="150"></label><label>Deadline (your device timezone)<input name="deadline" type="datetime-local" value="${localDate(b.deadline)}" required></label><label>Weekly hours<input name="hours" type="number" min="1" max="60" value="${b.hours}" required></label><label>Program duration<input name="duration" value="${esc(b.duration)}" required maxlength="100"></label></div><label>Eligibility<textarea name="eligibility" maxlength="1000" required>${esc(b.eligibility)}</textarea></label><label class="checkbox"><input type="checkbox" name="open" ${b.open ? 'checked' : ''}>Accept demo applications</label><fieldset><legend>Recruiting departments</legend><div class="checkbox-grid">${departments.map((d) => `<label class="checkbox"><input type="checkbox" name="departments" value="${d.id}" ${b.departments.includes(d.id) ? 'checked' : ''}>${d.name}</label>`).join('')}</div></fieldset><p class="demo-note">Existing submitted applications keep their department. Closing the batch prevents new saves and submissions. This demo configures one batch; creating additional batches is a production extension.</p><p class="form-error" role="alert"></p><button class="button primary">Save batch settings →</button></form></section>`;
}
export async function contentPage() {
  const denied = protectedPage('staff');
  if (denied) return denied;
  const items = await api('/announcements');
  return `${pageIntro('STAFF WORKSPACE', 'Keep your community informed.', 'Create demo announcements that appear on the home and updates pages.')}<section class="section container">${tabs('content')}<div class="dashboard-grid"><form class="info-card" id="announcement-form"><h3>New announcement</h3><label>Title<input name="title" required minlength="3" maxlength="150"></label><label>Summary<textarea name="summary" required minlength="10" maxlength="1000"></textarea></label><label>Link<input name="href" placeholder="#/internship or https://…" maxlength="500"></label><p class="form-error" role="alert"></p><button class="button primary">Add demo announcement →</button></form><div class="stack">${items.length ? items.map((item) => `<article class="info-card"><h3>${esc(item.title)}</h3><p>${esc(item.summary)}</p><small>${esc(date(item.date))}</small><div class="button-row">${link(item.href, 'View link ↗', 'inline-link')}<button class="button danger delete-announcement" data-id="${item.id}">Remove</button></div></article>`).join('') : emptyState('No custom announcements yet.', 'Add one to see it on the public pages.')}</div></div></section>`;
}
function csvCell(value) {
  let text = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
export async function bindStaff(page, id, rerender) {
  const review = document.querySelector('#review-form');
  review?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const button = review.querySelector('button');
    button.disabled = true;
    try {
      await api(`/staff/applications/${review.dataset.id}/review`, {
        method: 'PUT',
        body: Object.fromEntries(new FormData(review)),
      });
      toast('Private evaluation saved.');
    } catch (error) {
      review.querySelector('.form-error').textContent = error.message;
    } finally {
      button.disabled = false;
    }
  });
  const transition = document.querySelector('#transition-form');
  const toggleInterview = () => {
    const show = document.querySelector('#next-status').value === 'interview_scheduled';
    document.querySelector('#interview-fields').hidden = !show;
    document.querySelectorAll('#interview-fields input').forEach((input) => {
      input.required = show;
    });
  };
  document.querySelector('#next-status')?.addEventListener('change', toggleInterview);
  if (transition) toggleInterview();
  transition?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const button = transition.querySelector('button');
    button.disabled = true;
    try {
      const body = {
        ...Object.fromEntries(new FormData(transition)),
        ...Object.fromEntries(new FormData(review)),
      };
      if (body.scheduledAt) body.scheduledAt = new Date(body.scheduledAt).toISOString();
      await api(`/staff/applications/${transition.dataset.id}/transition`, {
        method: 'POST',
        body,
      });
      await rerender();
      toast('Application moved. Notification preview created.');
    } catch (error) {
      transition.querySelector('.form-error').textContent = error.message;
      button.disabled = false;
    }
  });
  if (page === 'staff' && !id && document.querySelector('#application-search')) {
    const rows = await api('/staff/applications');
    let filtered = rows;
    const filter = () => {
      const q = document.querySelector('#application-search').value.toLowerCase(),
        d = document.querySelector('#application-department').value,
        s = document.querySelector('#application-status').value;
      filtered = rows.filter(
        (a) =>
          `${a.data.name} ${a.email} ${a.data.institution}`.toLowerCase().includes(q) &&
          (!d || a.department === d) &&
          (!s || a.status === s),
      );
      document.querySelector('#application-results').innerHTML = table(filtered);
    };
    ['application-search', 'application-department', 'application-status'].forEach((id) =>
      document.getElementById(id).addEventListener('input', filter),
    );
    document.querySelector('#export-applications').addEventListener('click', () => {
      const csv = [
        ['Reference', 'Name', 'Email', 'Department', 'Status', 'Updated'],
        ...filtered.map((a) => [
          a.id,
          a.data.name,
          a.email,
          departmentName(a.department),
          statusLabels[a.status],
          a.updated,
        ]),
      ]
        .map((row) => row.map(csvCell).join(','))
        .join('\r\n');
      const url = URL.createObjectURL(
        new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }),
      );
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ysse-demo-applications.csv';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast('Filtered applications exported.');
    });
  }
  const batch = document.querySelector('#batch-form');
  batch?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const button = batch.querySelector('button');
    button.disabled = true;
    try {
      const form = new FormData(batch);
      const body = {
        ...Object.fromEntries(form),
        open: batch.elements.open.checked,
        departments: form.getAll('departments'),
      };
      body.deadline = new Date(body.deadline).toISOString();
      await api('/staff/batch', { method: 'PUT', body });
      toast('Batch settings saved.');
    } catch (error) {
      batch.querySelector('.form-error').textContent = error.message;
    } finally {
      button.disabled = false;
    }
  });
  const announcement = document.querySelector('#announcement-form');
  announcement?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const button = announcement.querySelector('button');
    button.disabled = true;
    try {
      await api('/staff/announcements', {
        method: 'POST',
        body: Object.fromEntries(new FormData(announcement)),
      });
      await rerender();
      toast('Demo announcement added.');
    } catch (error) {
      announcement.querySelector('.form-error').textContent = error.message;
      button.disabled = false;
    }
  });
  document.querySelectorAll('.delete-announcement').forEach((button) =>
    button.addEventListener('click', async () => {
      if (!window.confirm('Remove this demo announcement?')) return;
      button.disabled = true;
      try {
        await api(`/staff/announcements/${button.dataset.id}`, { method: 'DELETE', body: {} });
        await rerender();
        toast('Announcement removed.');
      } catch (error) {
        toast(error.message, true);
        button.disabled = false;
      }
    }),
  );
}
