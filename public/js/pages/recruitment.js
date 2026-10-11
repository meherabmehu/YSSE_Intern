import { api, session, refreshSession } from '../api.js';
import { departments, sources } from '../data.js';
import { pageIntro, link, badge, escapeHtml as esc, emptyState, toast } from '../ui.js';

export const statusLabels = {
  draft: 'Draft',
  submitted: 'Submitted',
  shortlisted: 'Shortlisted',
  interview_scheduled: 'Interview scheduled',
  interviewed: 'Interview complete',
  waitlisted: 'Waitlisted',
  selected: 'Selected',
  offer_accepted: 'Offer accepted',
  onboarded: 'Onboarded',
  rejected: 'Not selected',
  withdrawn: 'Withdrawn',
};
export const date = (value) =>
  new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Dhaka',
  }).format(new Date(value)) + ' · Dhaka';
export const statusBadge = (status) => badge(statusLabels[status] ?? status, `status-${status}`);
export const departmentName = (id) => departments.find((d) => d.id === id)?.name ?? id;
export const historyView = (history) =>
  `<ol class="timeline">${history.map((h) => `<li><span class="timeline-dot"></span><div><strong>${esc(statusLabels[h.status] ?? h.status)}</strong><p>${esc(h.message)}</p><small>${esc(date(h.created))} · ${esc(h.actor)}</small></div></li>`).join('')}</ol>`;
export const interviewView = (a) =>
  a.interview
    ? `<div class="info-card interview-card"><div class="eyebrow">INTERVIEW DETAILS</div><h3>${esc(date(a.interview.scheduledAt))}</h3><p>Interviewer: ${esc(a.interview.interviewer)}</p>${link(a.interview.meetingUrl, 'Open meeting link ↗', 'button secondary')}<p class="demo-note">Demo scheduling only. Confirm arrangements with the recruitment team.</p></div>`
    : '';
export const dataView = (a) =>
  `<dl class="details-list"><dt>Applicant</dt><dd>${esc(a.data.name)}</dd><dt>Email</dt><dd>${esc(a.email ?? session.user.email)}</dd><dt>Phone</dt><dd>${esc(a.data.phone)}</dd><dt>Department</dt><dd>${esc(departmentName(a.department))}</dd><dt>Institution</dt><dd>${esc(a.data.institution)}</dd><dt>Education</dt><dd>${esc(a.data.education)}</dd><dt>Skills</dt><dd class="preserve-lines">${esc(a.data.skills)}</dd><dt>Motivation</dt><dd class="preserve-lines">${esc(a.data.motivation)}</dd>${a.data.portfolio ? `<dt>Portfolio</dt><dd>${link(a.data.portfolio, 'View portfolio ↗', 'inline-link')}</dd>` : ''}${a.hasCv ? `<dt>CV</dt><dd>${link(`/api/applications/${a.id}/cv`, `${esc(a.cv_name)} ↓`, 'inline-link')}</dd>` : ''}</dl>`;
export const protectedPage = (role) => {
  if (!session.user)
    return `${pageIntro('YOUR PORTAL', 'Sign in to take the next step.', 'Access your application and recruitment updates.')}<section class="section container">${link('#/login', 'Sign in →', 'button primary')}</section>`;
  if (role && session.user.role !== role)
    return `${pageIntro('YOUR PORTAL', 'This area needs another role.', 'Applicant and staff workspaces are kept separate.')}<section class="section container">${link(session.user.role === 'staff' ? '#/staff' : '#/dashboard', 'Open your dashboard →', 'button primary')}</section>`;
  return null;
};
export async function internshipPage() {
  const batch = await api('/batch');
  const open = batch.open && new Date(batch.deadline) > new Date();
  return `${pageIntro('VIRTUAL INTERNSHIP', 'Learn by doing.<br>Grow by contributing.', 'Explore a purposeful experience in teamwork, professional skills and community impact.')}<section class="section container internship-layout"><div><div class="eyebrow">A CHAPTER WITH PURPOSE</div><h2>Your skills have<br>a place to grow.</h2><p>YSSE’s published internship overview describes learning sessions, project participation, mentorship and departmental orientation. This portal demonstrates how recruitment could work from application to onboarding.</p><div class="stats-row"><div><strong>${esc(batch.duration)}</strong><small>Program duration</small></div><div><strong>${batch.hours} hours</strong><small>Weekly commitment</small></div><div><strong>Virtual</strong><small>Work from home</small></div></div><h3>Explore the journey</h3><ol class="journey-list">${['Choose a department and apply', 'Application screening and shortlisting', 'Department interview and evaluation', 'Selection and offer acceptance', 'Onboarding and orientation'].map((s, i) => `<li><span>${i + 1}</span>${s}</li>`).join('')}</ol><div class="faq-list"><h3>A few things to know</h3><details><summary>Who can apply?</summary><p>${esc(batch.eligibility)}</p></details><details><summary>Can I apply to multiple departments?</summary><p>The published overview allows one department. This demo enforces one application per account per batch.</p></details><details><summary>Is this a live recruitment campaign?</summary><p>No. The batch, applications, notifications and offers here are for demonstration. Check official YSSE channels for current openings.</p></details><details><summary>Are there course recordings and certificates?</summary><p>Sample learning resources are available in the portal. Approved recordings will be added later. Official certificate verification remains on YSSE’s existing service.</p></details></div></div><aside class="application-callout"><div class="eyebrow">DEMONSTRATION BATCH</div><h3>${esc(batch.title)}</h3>${badge(open ? 'Demo applications open' : 'Applications closed', open ? 'status-selected' : '')}<p class="deadline"><strong>Deadline</strong><br>${esc(date(batch.deadline))}</p><h4>Recruiting departments</h4><ul class="compact-list">${batch.departments.map((id) => `<li>${esc(departmentName(id))}</li>`).join('')}</ul>${open ? link(session.user?.role === 'staff' ? '#/staff' : session.user ? '#/apply' : '#/login', session.user?.role === 'staff' ? 'Open staff dashboard →' : 'Start your demo application ↗', 'button primary full-width') : link('#/updates', 'Browse updates →', 'button secondary full-width')}<p class="demo-note">Use sample personal information. This demo does not send real emails or verify email ownership.</p>${link(sources.internship, 'Published program overview ↗', 'inline-link')}</aside></section>`;
}
export function loginPage(register = false) {
  return `${pageIntro('YOUR NEXT STEP', register ? 'Start your journey.' : 'Welcome back.', 'One workspace for your application, learning and next steps.')}<section class="section container auth-layout"><div class="auth-card"><div class="tabs">${link('#/login', 'Sign in', !register ? 'active' : '')}${link('#/register', 'Create account', register ? 'active' : '')}</div><form id="auth-form" data-register="${register}">${register ? `<label>Your name<input name="name" autocomplete="name" required minlength="2" maxlength="100"></label>` : ''}<label>Email address<input type="email" name="email" autocomplete="email" required maxlength="254"></label><label>Password<input type="password" name="password" autocomplete="${register ? 'new-password' : 'current-password'}" required minlength="${register ? 10 : 1}" maxlength="256"></label>${register ? '<p class="field-help">At least 10 characters. Email verification is not available yet.</p>' : ''}<p class="form-error" role="alert"></p><button class="button primary full-width" type="submit">${register ? 'Create account' : 'Sign in'} →</button></form></div><aside class="auth-aside"><span class="eyebrow">EXPLORE THE COMPLETE FLOW</span><h2>Your next chapter<br>starts here.</h2><p>Try the applicant journey, then switch to staff to review the same application.</p>${session.demoMode ? `<div class="demo-credentials"><strong>Sample accounts</strong><p>Shared password: <code>YsseDemo2026!</code></p><button class="button secondary demo-fill" data-email="applicant@demo.ysse.test">Use applicant account</button><small>applicant@demo.ysse.test</small><button class="button secondary demo-fill" data-email="staff@demo.ysse.test">Use staff account</button><small>staff@demo.ysse.test</small></div>` : '<p>Sign in with your registered account.</p>'}<p class="demo-note">Sample data only. Real email verification and password recovery are production backlog items.</p></aside></section>`;
}
export async function applyPage() {
  const denied = protectedPage('applicant');
  if (denied) return denied;
  const [batch, application] = await Promise.all([api('/batch'), api('/application')]);
  if (application && application.status !== 'draft')
    return `${pageIntro('YOUR APPLICATION', 'You have already applied.', 'One application per batch keeps your department choice clear.')}<section class="section container">${link('#/dashboard', 'View your application →', 'button primary')}</section>`;
  if (!batch.open || new Date(batch.deadline) <= new Date())
    return `${pageIntro('APPLICATIONS CLOSED', 'The application window has closed.', 'You can still view an existing application from your dashboard.')}<section class="section container">${link('#/dashboard', 'Open dashboard →', 'button primary')}</section>`;
  const d = application?.data ?? { name: session.user.name };
  return `${pageIntro('APPLICATION / DEMO BATCH', 'Let’s get to know you.', 'Save a draft, review your details, then submit. You can apply to one recruiting department.')}<section class="section container application-layout"><form id="application-form" class="application-form"><div class="form-section"><div class="form-section-title"><span>01</span><h3>Your details</h3></div><div class="form-grid"><label>Full name<input name="name" value="${esc(d.name)}" required minlength="2" maxlength="100"></label><label>Email<input value="${esc(session.user.email)}" disabled><small class="field-help">Your account email</small></label><label>Phone<input name="phone" value="${esc(d.phone)}" required maxlength="30" autocomplete="tel"></label><label>Institution<input name="institution" value="${esc(d.institution)}" required minlength="2" maxlength="200"></label><label>Education / year<input name="education" value="${esc(d.education)}" required minlength="2" maxlength="200"></label><label>Preferred department<select name="department" required><option value="">Choose one department</option>${batch.departments.map((id) => `<option value="${id}" ${application?.department === id ? 'selected' : ''}>${departmentName(id)}</option>`).join('')}</select></label></div></div><div class="form-section"><div class="form-section-title"><span>02</span><h3>Your interests & experience</h3></div><label>Relevant skills<textarea name="skills" required minlength="10" maxlength="2000" placeholder="Tell us what you enjoy working on and the skills you bring.">${esc(d.skills)}</textarea></label><label>Why do you want to join?<textarea name="motivation" required minlength="30" maxlength="2000" placeholder="What would you like to learn and contribute?">${esc(d.motivation)}</textarea></label><label>Portfolio link (HTTPS)<input name="portfolio" type="url" value="${esc(d.portfolio)}" placeholder="https://…" maxlength="500"></label><label>PDF CV (maximum 2 MB)<input id="cv-file" type="file" accept="application/pdf,.pdf"><small class="field-help">Provide a CV or a portfolio. ${application?.hasCv ? `Saved: ${esc(application.cv_name)}` : 'No CV saved yet.'}</small></label>${application?.hasCv ? '<label class="checkbox"><input type="checkbox" name="removeCv">Remove the saved CV</label>' : ''}</div><div class="form-section"><div class="form-section-title"><span>03</span><h3>Confirm & review</h3></div><label class="checkbox"><input type="checkbox" name="eligible" ${d.eligible ? 'checked' : ''} required>I meet the eligibility requirements shown for this demo batch.</label><label class="checkbox"><input type="checkbox" name="commitment" ${d.commitment ? 'checked' : ''} required>I can commit ${batch.hours} hours per week.</label><label class="checkbox"><input type="checkbox" name="consent" ${d.consent ? 'checked' : ''} required>I agree to store this sample application in the demo database for staff review.</label><p class="form-error" role="alert"></p><div class="button-row"><button type="button" class="button secondary" id="save-draft">Save draft</button><button type="submit" class="button primary">Review application →</button></div><div id="application-review" hidden></div></div></form><aside class="application-tips"><div class="eyebrow">A LITTLE GUIDANCE</div><h3>Show us your curiosity.</h3><p>You don’t need a perfect story. Explain what you know, what you want to learn and how you want to contribute.</p><ul class="check-list"><li>Choose one department</li><li>Use specific examples</li><li>Review your details</li><li>Keep a copy of your reference</li></ul><p class="demo-note">This is a demo. Use sample information and a sample CV.</p><p class="field-help">Deadline: ${esc(date(batch.deadline))}</p></aside></section>`;
}
export async function dashboardPage() {
  const denied = protectedPage('applicant');
  if (denied) return denied;
  const [a, notifications] = await Promise.all([api('/application'), api('/notifications')]);
  const intro = pageIntro(
    'APPLICANT WORKSPACE',
    `Hello, ${esc(session.user.name.split(' ')[0])}.`,
    'Your application and next steps, all in one place.',
  );
  if (!a)
    return `${intro}<section class="section container">${emptyState('Your journey is ready to begin.', 'Explore the batch, choose your department and start a sample application.')}<div class="center-action">${link('#/internship', 'Explore the demo internship →', 'button primary')}</div></section>`;
  return `${intro}<section class="section container"><div class="dashboard-top"><div><div class="eyebrow">APPLICATION ${esc(a.id.slice(0, 8).toUpperCase())}</div><h2>${esc(departmentName(a.department))}</h2></div>${statusBadge(a.status)}</div>${a.status === 'draft' ? `<div class="notice"><p>Your draft is saved. Complete and submit it before the deadline.</p>${link('#/apply', 'Continue application →', 'button primary')}</div>` : ''}${a.status === 'selected' ? `<div class="notice"><div><h3>You’ve been selected.</h3><p>Accept your demo offer to let the staff team begin onboarding.</p></div><button class="button primary" id="accept-offer" data-id="${a.id}">Accept demo offer →</button></div>` : ''}${a.status === 'onboarded' ? `<div class="notice"><div><h3>Welcome to the team.</h3><p>Your demo onboarding is complete. Department: ${esc(departmentName(a.department))}. Start exploring learning resources.</p></div>${link('#/courses', 'Explore learning →', 'button primary')}</div>` : ''}<div class="dashboard-grid"><div class="stack">${interviewView(a)}<section class="info-card"><h3>Application journey</h3>${a.history.length ? historyView(a.history) : '<p>Save and submit your draft to start your journey.</p>'}</section><section class="info-card"><h3>Your submitted details</h3>${dataView(a)}</section></div><aside class="stack"><section class="info-card"><div class="eyebrow">NOTIFICATION PREVIEWS</div><h3>Your updates</h3><p class="field-help">Preview messages stored in this demo. No emails are sent.</p>${notifications.length ? notifications.map((n) => `<div class="notification"><strong>${esc(n.subject)}</strong><p>${esc(n.body)}</p><small>${esc(date(n.created))}</small></div>`).join('') : '<p>No updates yet.</p>'}</section>${!['draft', 'rejected', 'withdrawn', 'onboarded'].includes(a.status) ? `<section class="info-card"><h3>Plans changed?</h3><p>You can withdraw your application. This cannot be undone in the demo.</p><button class="button danger" id="withdraw-application" data-id="${a.id}">Withdraw application</button></section>` : ''}</aside></div></section>`;
}
async function fileData(file) {
  if (!file) return undefined;
  if (file.size > 2 * 1024 * 1024 || !file.name.toLowerCase().endsWith('.pdf'))
    throw new Error('Choose a PDF CV of at most 2 MB.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = '';
  for (let i = 0; i < bytes.length; i += 8192)
    binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return { name: file.name, base64: btoa(binary) };
}
export async function formPayload(form) {
  const data = Object.fromEntries(new FormData(form));
  ['eligible', 'commitment', 'consent', 'removeCv'].forEach((key) => {
    data[key] = form.elements[key]?.checked === true;
  });
  data.cv = await fileData(document.querySelector('#cv-file')?.files[0]);
  return data;
}
export function bindRecruitment(page, rerender) {
  const auth = document.querySelector('#auth-form');
  auth?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const button = auth.querySelector('button');
    button.disabled = true;
    try {
      await api(auth.dataset.register === 'true' ? '/register' : '/login', {
        method: 'POST',
        body: Object.fromEntries(new FormData(auth)),
      });
      await refreshSession();
      location.hash = session.user.role === 'staff' ? '#/staff' : '#/dashboard';
      toast('Welcome to your workspace.');
    } catch (error) {
      auth.querySelector('.form-error').textContent = error.message;
    } finally {
      button.disabled = false;
    }
  });
  document.querySelectorAll('.demo-fill').forEach((button) =>
    button.addEventListener('click', () => {
      auth.elements.email.value = button.dataset.email;
      auth.elements.password.value = 'YsseDemo2026!';
      auth.elements.email.focus();
    }),
  );
  const form = document.querySelector('#application-form');
  let reviewed = null;
  const hideReview = () => {
    reviewed = null;
    document.querySelector('#application-review').hidden = true;
  };
  form?.addEventListener('input', hideReview);
  document.querySelector('#save-draft')?.addEventListener('click', async (e) => {
    e.currentTarget.disabled = true;
    try {
      const body = await formPayload(form);
      await api('/application', { method: 'PUT', body });
      toast('Draft saved to the database.');
    } catch (error) {
      form.querySelector('.form-error').textContent = error.message;
    } finally {
      document.querySelector('#save-draft').disabled = false;
    }
  });
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    form.querySelector('.form-error').textContent = '';
    try {
      reviewed = await formPayload(form);
      const review = document.querySelector('#application-review');
      review.hidden = false;
      review.innerHTML = `<div class="review-panel"><h3>Ready to submit?</h3><dl class="details-list"><dt>Name</dt><dd>${esc(reviewed.name)}</dd><dt>Department</dt><dd>${esc(departmentName(reviewed.department))}</dd><dt>Institution</dt><dd>${esc(reviewed.institution)}</dd><dt>Skills</dt><dd>${esc(reviewed.skills)}</dd><dt>Motivation</dt><dd>${esc(reviewed.motivation)}</dd></dl><p>After submission, your details are locked for this demo batch.</p><button type="button" class="button primary" id="confirm-submit">Confirm & submit application ↗</button></div>`;
      review.scrollIntoView({ behavior: 'smooth', block: 'center' });
      document.querySelector('#confirm-submit').addEventListener('click', async (e) => {
        e.currentTarget.disabled = true;
        try {
          const a = await api('/application', {
            method: 'PUT',
            body: { ...reviewed, submit: true },
          });
          location.hash = '#/dashboard';
          toast(`Submitted. Reference: ${a.id.slice(0, 8).toUpperCase()}`);
        } catch (error) {
          form.querySelector('.form-error').textContent = error.message;
          e.currentTarget.disabled = false;
        }
      });
    } catch (error) {
      form.querySelector('.form-error').textContent = error.message;
    }
  });
  for (const [id, action] of [
    ['accept-offer', 'accept'],
    ['withdraw-application', 'withdraw'],
  ]) {
    document.getElementById(id)?.addEventListener('click', async (e) => {
      if (
        !window.confirm(
          action === 'accept'
            ? 'Accept this demo internship offer?'
            : 'Withdraw your application? You cannot undo this action.',
        )
      )
        return;
      e.currentTarget.disabled = true;
      try {
        await api(`/applications/${e.currentTarget.dataset.id}/${action}`, {
          method: 'POST',
          body: {},
        });
        await rerender();
        toast(action === 'accept' ? 'Offer accepted.' : 'Application withdrawn.');
      } catch (error) {
        toast(error.message, true);
        e.currentTarget.disabled = false;
      }
    });
  }
}
