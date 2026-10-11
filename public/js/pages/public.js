import { departments, courses, updates, sources } from '../data.js';
import { link, badge, pageIntro, escapeHtml, emptyState, toast } from '../ui.js';

const departmentCard = (d) =>
  `<a class="department-card" href="#/departments/${d.id}"><span class="card-number">${d.number}</span><div><span class="eyebrow">${d.theme}</span><h3>${d.name}</h3><p>${d.description}</p></div><span class="arrow" aria-hidden="true">↗</span></a>`;
const courseCard = (c) =>
  `<a class="course-card" href="#/courses/${c.id}"><div class="course-art ${c.color}"><span>${c.icon}</span><small>YSSE LEARNING / DEMO</small></div><div class="course-body">${badge(c.category)}<h3>${c.title}</h3><p>${c.description}</p><div class="card-meta"><span>${c.lessons.length} lessons · ${c.level}</span><span aria-hidden="true">↗</span></div></div></a>`;
const updateCard = (u) =>
  `<article class="update-card"><span class="update-dot ${u.color}" aria-hidden="true"></span>${badge(u.tag)}<h3>${link(u.href, u.title)}</h3><p>${u.summary}</p><small>${u.date}</small></article>`;
export const publicPages = {
  home() {
    return `<section class="hero"><div class="container hero-grid"><div class="hero-copy"><div class="eyebrow"><span class="tiny-dot"></span> YOUTH SCHOOL FOR SOCIAL ENTREPRENEURS</div><h1>A generation<br>of <em>changemakers.</em></h1><p>Learn with purpose. Connect with people who care. Turn your ideas into meaningful action for your community.</p><div class="button-row">${link('#/internship', 'Explore internships <span aria-hidden="true">↗</span>', 'button primary')}${link('#/about', 'Discover YSSE <span aria-hidden="true">→</span>', 'button text')}</div><div class="hero-footnote"><span class="mini-mark">Y</span><span>Youth-led. Community-minded.<br><strong>Working for social development since 2015.</strong></span></div></div><div class="hero-visual"><img src="/assets/growth.svg" alt="Illustration of young people helping each other climb steps toward growth" width="640" height="560"><div class="visual-label"><span class="label-icon">↗</span><div><strong>Grow together.</strong><small>Make your next step matter.</small></div></div><span class="visual-caption">Ideas become impact when we act together.</span></div></div></section>
    <div class="values-strip"><div class="container"><span>Rooted in purpose</span><strong>Social entrepreneurship</strong><span class="strip-star">✳</span><strong>Youth empowerment</strong><span class="strip-star">✳</span><strong>Community action</strong></div></div>
    <section class="section container"><div class="section-head"><div><div class="eyebrow">FIND YOUR PLACE</div><h2>Different strengths.<br>One shared purpose.</h2></div><div><p>Meet the teams that bring ideas to life.<br>Find where your interests can make a difference.</p>${link('#/departments', 'Explore all 9 departments →', 'inline-link')}</div></div><div class="department-grid">${departments
      .filter((d) => ['admin-hr', 'design', 'it'].includes(d.id))
      .map(departmentCard)
      .join('')}</div></section>
    <section class="learning-section"><div class="container section"><div class="section-head"><div><div class="eyebrow">LEARN SOMETHING THAT MATTERS</div><h2>A little curiosity.<br>A world of possibility.</h2></div>${link('#/courses', 'Browse learning resources →', 'inline-link')}</div><p class="demo-note">Sample learning content for this demo. Official course recordings will be added after approval.</p><div class="course-grid">${courses.map(courseCard).join('')}</div></div></section>
    <section class="section container"><div class="section-head"><div><div class="eyebrow">WHAT’S HAPPENING</div><h2>Stay in the loop.</h2></div>${link('#/updates', 'All updates →', 'inline-link')}</div><div class="update-grid">${updates.map(updateCard).join('')}</div></section>
    <section class="container cta-panel"><div><div class="eyebrow">YOUR NEXT CHAPTER</div><h2>Bring your curiosity.<br>Build your confidence.</h2><p>Explore a virtual internship built around learning, teamwork and purpose.</p></div>${link('#/internship', 'Discover the internship journey ↗', 'button light')}</section>`;
  },
  about() {
    return `${pageIntro('GET TO KNOW US', 'Young people. Lasting possibility.', 'YSSE brings young people together around social entrepreneurship, learning and community development.')}<section class="section container split-section"><div><h2>Purpose starts<br>with people.</h2><p>Youth School for Social Entrepreneurs is a youth-led nonprofit working for social development since 2015. Its mission centres on empowering youth and women through social entrepreneurship and addressing poverty and youth unemployment.</p>${link(sources.main, 'Visit the existing YSSE website ↗', 'inline-link')}</div><div class="stack"><article class="info-card"><span class="eyebrow">01 / LEARN</span><h3>Develop skills with purpose</h3><p>Explore learning opportunities in leadership, entrepreneurship, communication and teamwork.</p></article><article class="info-card"><span class="eyebrow">02 / CONNECT</span><h3>Find a community</h3><p>Meet teams and explore opportunities to collaborate around shared goals.</p></article><article class="info-card"><span class="eyebrow">03 / CONTRIBUTE</span><h3>Take meaningful action</h3><p>Discover initiatives involving youth development, women’s empowerment, education and community support.</p></article></div></section><section class="container source-note">Organization summary is based on ${link(sources.internship, 'YSSE’s published program overview')}. Demo descriptions are illustrative; team details and impact figures await approval.</section>`;
  },
  departments(id) {
    if (!id)
      return `${pageIntro('OUR DEPARTMENTS', 'Find where you belong.', 'Explore nine teams, their proposed focus areas and the skills you can bring.')}<section class="section container"><label class="search-box"><span aria-hidden="true">⌕</span><input id="department-search" type="search" placeholder="Search departments or skills" aria-label="Search departments"></label><p class="demo-note">Department names are official. Descriptions and hierarchy roles below are proposed demo content.</p><div class="department-grid" id="department-results">${departments.map(departmentCard).join('')}</div><p class="source-note">Source: ${link(sources.departments, 'YSSE department directory ↗')}</p></section>`;
    const d = departments.find((d) => d.id === id);
    if (!d) return publicPages.notFound();
    return `${pageIntro(`${link('#/departments', 'DEPARTMENTS')} / ${d.number}`, d.name, d.description)}<section class="section container split-section"><div><div class="eyebrow">THE WORK</div><h2>${d.theme}</h2><p>Proposed responsibilities for this demo:</p><ul class="check-list">${d.responsibilities.map((r) => `<li>${r}</li>`).join('')}</ul>${link('#/internship', 'Explore opportunities ↗', 'button primary')}</div><div><div class="eyebrow">TEAM STRUCTURE / PROPOSED</div><div class="hierarchy"><div>Executive leadership<small>Organization direction</small></div><span aria-hidden="true">↓</span><div>Department head<small>Team goals and oversight</small></div><span aria-hidden="true">↓</span><div>Coordinator / mentor<small>Guidance and day-to-day support</small></div><span aria-hidden="true">↓</span><div>Team members / interns<small>Collaboration and delivery</small></div></div><p class="demo-note">Names, photos and actual reporting relationships will be published after YSSE approval.</p></div></section>`;
  },
  courses(id) {
    if (!id)
      return `${pageIntro('THE LEARNING SPACE', 'Keep your curiosity growing.', 'Start with practical sample resources. Find a subject, try a lesson and take your next step.')}<section class="section container"><div class="filter-row"><label class="search-box"><span aria-hidden="true">⌕</span><input id="course-search" type="search" placeholder="Search resources" aria-label="Search learning resources"></label><label>Category<select id="course-category"><option value="">All categories</option>${[...new Set(courses.map((c) => c.category))].map((c) => `<option>${c}</option>`).join('')}</select></label><label>Department<select id="course-department"><option value="">All departments</option>${departments.map((d) => `<option value="${d.id}">${d.name}</option>`).join('')}</select></label></div><p class="demo-note">These are original sample readings and exercises, not official YSSE recordings.</p><div class="course-grid" id="course-results">${courses.map(courseCard).join('')}</div></section>`;
    const c = courses.find((c) => c.id === id);
    if (!c) return publicPages.notFound();
    return `${pageIntro(link('#/courses', 'LEARNING RESOURCES') + ' / SAMPLE COURSE', c.title, c.description)}<section class="section container lesson-layout"><aside class="lesson-sidebar"><h3>Your learning path</h3><p>${c.lessons.length} lessons · ${c.level}</p>${c.lessons.map((l, i) => `<button class="lesson-tab ${i === 0 ? 'active' : ''}" data-lesson="${i}" aria-pressed="${i === 0}"><span>${String(i + 1).padStart(2, '0')}</span>${l.title}</button>`).join('')}<button class="button secondary" id="download-resource">Download worksheet ↓</button></aside><article class="lesson-content" id="lesson-content">${lessonContent(c, 0)}</article></section>`;
  },
  updates() {
    return `${pageIntro('ACTIVITIES & ANNOUNCEMENTS', 'Good things happen together.', 'Explore the demo updates and visit YSSE’s official channels for published announcements.')}<section class="section container"><div class="update-grid">${updates.map(updateCard).join('')}</div><div class="social-panel"><div><div class="eyebrow">FROM THE COMMUNITY</div><h2>Keep the conversation going.</h2><p>Official social updates open on their original platforms. A live feed can be integrated when access is available.</p></div><div class="button-row">${link(sources.facebook, 'Facebook ↗', 'button primary')}${link(sources.linkedin, 'LinkedIn ↗', 'button secondary')}</div></div></section>`;
  },
  contact() {
    return `${pageIntro('LET’S CONNECT', 'A conversation can be a beginning.', 'Use the published YSSE channels for organization and internship enquiries.')}<section class="section container contact-grid"><article class="info-card"><div class="eyebrow">ORGANIZATION</div><h3>Discover YSSE</h3><p>Visit the existing website for official information and contact details.</p>${link(sources.main, 'ysseglobal.org ↗', 'inline-link')}</article><article class="info-card"><div class="eyebrow">RECRUITMENT</div><h3>Internship enquiries</h3><p>${link('mailto:ysse.hrd@gmail.com', 'ysse.hrd@gmail.com')}</p>${link(sources.internship, 'Program information ↗', 'inline-link')}</article><article class="info-card"><div class="eyebrow">CERTIFICATES</div><h3>Verify your certificate</h3><p>Use YSSE’s existing certificate lookup service.</p>${link(sources.certificates, 'Open certificate verification ↗', 'inline-link')}</article></section>`;
  },
  notFound() {
    return `<section class="section container">${emptyState('This page is not here.', 'The address may have changed. Explore the portal from the homepage.')}${link('#/', 'Back to home', 'button primary')}</section>`;
  },
};
function lessonContent(c, i) {
  return `<span class="eyebrow">LESSON ${i + 1} / ${c.lessons.length}</span><h2>${c.lessons[i].title}</h2>${badge(c.lessons[i].duration)}<p class="lesson-text">${c.lessons[i].text}</p><div class="reflection"><h3>Pause and reflect</h3><p>What is one idea you can apply in your own work or community?</p></div><p class="demo-note">Sample lesson · No official completion certificate is issued by this demo.</p><button class="button primary" data-next="${(i + 1) % c.lessons.length}">${i < c.lessons.length - 1 ? 'Next lesson →' : 'Review first lesson ↺'}</button>`;
}
export function bindPublic(page, id) {
  document.querySelector('#department-search')?.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    const found = departments.filter((d) =>
      `${d.name} ${d.theme} ${d.responsibilities.join(' ')}`.toLowerCase().includes(q),
    );
    document.querySelector('#department-results').innerHTML = found.length
      ? found.map(departmentCard).join('')
      : emptyState('No departments found', 'Try a different name or skill.');
  });
  const filterCourses = () => {
    const q = document.querySelector('#course-search').value.toLowerCase();
    const category = document.querySelector('#course-category').value;
    const department = document.querySelector('#course-department').value;
    const found = courses.filter(
      (c) =>
        `${c.title} ${c.description}`.toLowerCase().includes(q) &&
        (!category || c.category === category) &&
        (!department || c.department === department),
    );
    document.querySelector('#course-results').innerHTML = found.length
      ? found.map(courseCard).join('')
      : emptyState('No matching resources', 'Try another search or filter.');
  };
  ['course-search', 'course-category', 'course-department'].forEach((id) =>
    document.getElementById(id)?.addEventListener('input', filterCourses),
  );
  if (page === 'courses' && id) {
    const c = courses.find((c) => c.id === id);
    if (!c) return;
    const show = (i) => {
      document.querySelector('#lesson-content').innerHTML = lessonContent(c, i);
      document.querySelectorAll('[data-lesson]').forEach((el) => {
        el.classList.toggle('active', Number(el.dataset.lesson) === i);
        el.setAttribute('aria-pressed', Number(el.dataset.lesson) === i);
      });
    };
    document.querySelector('.lesson-layout').addEventListener('click', (e) => {
      const tab = e.target.closest('[data-lesson], [data-next]');
      if (tab) show(Number(tab.dataset.lesson ?? tab.dataset.next));
    });
    document.querySelector('#download-resource').addEventListener('click', () => {
      const text = `${c.title}\nYSSE portal — sample worksheet\n\n${c.lessons.map((l, i) => `${i + 1}. ${l.title}\n${l.text}\n\nMy reflections:\n\n`).join('\n')}\nThis is sample content, not an official YSSE course.`;
      const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${c.id}-worksheet.txt`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast('Worksheet downloaded.');
    });
  }
}
