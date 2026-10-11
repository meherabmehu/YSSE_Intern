export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const link = (href, label, className = '') => `<a class="${className}" href="${escapeHtml(href)}" ${href.startsWith('https://') ? 'target="_blank" rel="noopener noreferrer"' : ''}>${label}</a>`;
export const badge = (text, type = '') => `<span class="badge ${type}">${escapeHtml(text)}</span>`;
export function toast(message, error = false) {
  const node = document.querySelector('#toast');
  node.textContent = message;
  node.className = `visible ${error ? 'error' : ''}`;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { node.className = ''; }, 5000);
}
export function pageIntro(eyebrow, title, description, extra = '') {
  return `<section class="page-intro"><div class="container"><div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p>${description}</p>${extra}</div></section>`;
}
export function emptyState(title, message) {
  return `<div class="empty-state"><span class="empty-icon">◎</span><h3>${title}</h3><p>${message}</p></div>`;
}
