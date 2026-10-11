import { publicPages, bindPublic } from './pages/public.js';
import { link, escapeHtml, toast } from './ui.js';
import { api, session, refreshSession } from './api.js';
import {
  internshipPage,
  loginPage,
  applyPage,
  dashboardPage,
  bindRecruitment,
} from './pages/recruitment.js';
import { staffPage, settingsPage, contentPage, bindStaff } from './pages/staff.js';

const navigation = [
  ['/', 'Home'],
  ['/about', 'About'],
  ['/departments', 'Departments'],
  ['/courses', 'Learning'],
  ['/updates', 'Updates'],
];
function shell(content, page) {
  return `<div class="demo-banner">FUNCTIONAL DEMO <span>Sample resources and recruitment data · Official YSSE channels linked inside</span></div><header class="site-header"><div class="container nav-wrap"><a class="brand" href="#/" aria-label="YSSE home"><img src="/assets/mark.svg" alt="" width="40" height="40"><span>YSSE<small>Stage of innovation</small></span></a><button class="menu-toggle" aria-label="Toggle navigation" aria-expanded="false" aria-controls="primary-nav">☰</button><nav id="primary-nav" aria-label="Main navigation">${navigation.map(([href, title]) => `<a href="#${href}" ${page === href.slice(1) || (href === '/' && page === 'home') ? 'aria-current="page"' : ''}>${title}</a>`).join('')}${link('#/internship', 'Internships ↗', 'nav-cta')}${session.user ? `${link(session.user.role === 'staff' ? '#/staff' : '#/dashboard', 'Workspace', 'workspace-link')}<button class="logout-button" id="logout">Sign out</button>` : link('#/login', 'Sign in', 'workspace-link')}</nav></div></header><main id="main" tabindex="-1">${content}</main><footer><div class="container footer-grid"><div><a class="brand" href="#/"><img src="/assets/mark.svg" alt="" width="40" height="40"><span>YSSE<small>Stage of innovation</small></span></a><p>Learn. Connect. Contribute.<br>A next step with purpose.</p></div><div><h3>Explore</h3>${link('#/about', 'About YSSE')}${link('#/departments', 'Our departments')}${link('#/courses', 'Learning resources')}</div><div><h3>Get involved</h3>${link('#/internship', 'Virtual internship')}${link('#/contact', 'Contact')}${link('https://verify.ysseglobal.org/', 'Verify a certificate ↗')}</div><div><h3>Stay connected</h3>${link('https://www.facebook.com/YSSEGlobal', 'Facebook ↗')}${link('https://www.linkedin.com/company/ysseglobal', 'LinkedIn ↗')}${link('https://ysseglobal.org/', 'Existing website ↗')}</div></div><div class="container footer-bottom"><span>YSSE portal · Functional demonstration</span><span>Built for learning, connection and meaningful action.</span></div></footer>`;
}
let renderId = 0;
async function render() {
  const current = ++renderId;
  const [route, id] = location.hash.replace(/^#\/?/, '').split('/');
  const page = route || 'home';
  let content;
  try {
    await refreshSession();
    const pages = {
      internship: internshipPage,
      login: () => loginPage(false),
      register: () => loginPage(true),
      apply: applyPage,
      dashboard: dashboardPage,
      staff: staffPage,
      settings: settingsPage,
      content: contentPage,
    };
    content = pages[page]
      ? await pages[page](id)
      : (publicPages[page]?.(id) ?? publicPages.notFound());
  } catch (error) {
    content = `<section class="section container"><div class="empty-state"><h1>We couldn’t load this page.</h1><p>${escapeHtml(error.message)}</p><button class="button primary" id="retry-page">Try again</button></div></section>`;
  }
  if (current !== renderId) return;
  document.querySelector('#app').innerHTML = shell(content, page);
  document.title = `${{ home: 'A generation of changemakers', about: 'About YSSE', departments: 'Our departments', courses: 'Learning resources', updates: 'Updates', contact: 'Contact', internship: 'Virtual internship' }[page] ?? 'Portal'} — YSSE`;
  document.querySelector('.menu-toggle').addEventListener('click', (e) => {
    const open = e.currentTarget.getAttribute('aria-expanded') !== 'true';
    e.currentTarget.setAttribute('aria-expanded', open);
    document.querySelector('#primary-nav').classList.toggle('open', open);
  });
  document.querySelector('#retry-page')?.addEventListener('click', render);
  document.querySelector('#logout')?.addEventListener('click', async () => {
    try {
      await api('/logout', { method: 'POST', body: {} });
      await refreshSession();
      if (location.hash === '#/') await render();
      else location.hash = '#/';
      toast('Signed out.');
    } catch (error) {
      toast(error.message, true);
    }
  });
  bindPublic(page, id);
  bindRecruitment(page, render);
  await bindStaff(page, id, render);
  if (page === 'home' || page === 'updates') {
    try {
      const items = await api('/announcements');
      if (current !== renderId) return;
      document.querySelector('.update-grid')?.insertAdjacentHTML(
        'afterbegin',
        items
          .slice(0, page === 'home' ? 3 : 30)
          .map(
            (item) =>
              `<article class="update-card"><span class="badge">Demo announcement</span><h3>${link(item.href, escapeHtml(item.title))}</h3><p>${escapeHtml(item.summary)}</p><small>${new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeZone: 'Asia/Dhaka' }).format(new Date(item.date))}</small></article>`,
          )
          .join(''),
      );
    } catch (error) {
      toast(`Announcements unavailable: ${error.message}`, true);
    }
  }
  window.scrollTo(0, 0);
  if (location.hash) document.querySelector('#main').focus({ preventScroll: true });
}
window.addEventListener('hashchange', render);
render();
