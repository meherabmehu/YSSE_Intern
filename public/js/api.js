export let session = { user: null, demoMode: true };
export async function api(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    credentials: 'same-origin',
    ...options,
    headers: { 'Content-Type': 'application/json', 'X-YSSE-Request': 'portal', ...options.headers },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Could not complete the request.');
  return data;
}
export async function refreshSession() {
  session = await api('/session');
  return session;
}
