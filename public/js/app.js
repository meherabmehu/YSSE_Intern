import { publicPages, bindPublic } from './pages/public.js';
import { link } from './ui.js';

const navigation = [['/', 'Home'], ['/about', 'About'], ['/departments', 'Departments'], ['/courses', 'Learning'], ['/updates', 'Updates']];
function shell(content, page) {
  return `<div class="demo-banner">FUNCTIONAL DEMO <span>Sample resources and recruitment data · Official YSSE channels linked inside</span></div><header class="site-header"><div class="container nav-wrap"><a class="brand" href="#/" aria-label="YSSE home"><img src="/assets/mark.svg" alt="" width="40" height="40"><span>YSSE<small>Stage of innovation</small></span></a><button class="menu-toggle" aria-label="Toggle navigation" aria-expanded="false" aria-controls="primary-nav">☰</button><nav id="primary-nav" aria-label="Main navigation">${navigation.map(([href, title]) => `<a href="#${href}" ${page === href.slice(1) || (href === '/' && page === 'home') ? 'aria-current="page"' : ''}>${title}</a>`).join('')}${link('#/internship', 'Internships ↗', 'nav-cta')}</nav></div></header><main id="main" tabindex="-1">${content}</main><footer><div class="container footer-grid"><div><a class="brand" href="#/"><img src="/assets/mark.svg" alt="" width="40" height="40"><span>YSSE<small>Stage of innovation</small></span></a><p>Learn. Connect. Contribute.<br>A next step with purpose.</p></div><div><h3>Explore</h3>${link('#/about', 'About YSSE')}${link('#/departments', 'Our departments')}${link('#/courses', 'Learning resources')}</div><div><h3>Get involved</h3>${link('#/internship', 'Virtual internship')}${link('#/contact', 'Contact')}${link('https://verify.ysseglobal.org/', 'Verify a certificate ↗')}</div><div><h3>Stay connected</h3>${link('https://www.facebook.com/YSSEGlobal', 'Facebook ↗')}${link('https://www.linkedin.com/company/ysseglobal', 'LinkedIn ↗')}${link('https://ysseglobal.org/', 'Existing website ↗')}</div></div><div class="container footer-bottom"><span>YSSE portal · Functional demonstration</span><span>Built for learning, connection and meaningful action.</span></div></footer>`;
}
async function render() {
  const [page = 'home', id] = location.hash.replace(/^#\/?/, '').split('/');
  const content = publicPages[page]?.(id) ?? `<section class="section container"><div class="eyebrow">RECRUITMENT / NEXT MILESTONE</div><h1>A purposeful next step.</h1><p>The interactive internship pipeline is being connected to this foundation.</p>${link('#/departments', 'Explore departments →', 'button primary')}</section>`;
  document.querySelector('#app').innerHTML = shell(content, page);
  document.title = `${({ home: 'A generation of changemakers', about: 'About YSSE', departments: 'Our departments', courses: 'Learning resources', updates: 'Updates', contact: 'Contact', internship: 'Virtual internship' })[page] ?? 'Portal'} — YSSE`;
  document.querySelector('.menu-toggle').addEventListener('click', e => { const open = e.currentTarget.getAttribute('aria-expanded') !== 'true'; e.currentTarget.setAttribute('aria-expanded', open); document.querySelector('#primary-nav').classList.toggle('open', open); });
  bindPublic(page, id);
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', render);
render();
