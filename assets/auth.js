// Shared login helper for every page.
// Needs the Supabase script loaded first:
//   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
// Then use: const { client, config } = await window.MOF.ready;
(function () {
  const ready = (async () => {
    let config = { authEnabled: false };
    try {
      const res = await fetch('/api/config', { cache: 'no-store' });
      if (res.ok) config = await res.json();
    } catch (err) {
      console.warn('Could not load login settings', err);
    }
    if (!config.authEnabled || !window.supabase) return { client: null, config };
    const client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    return { client, config };
  })();

  async function getSession() {
    const { client } = await ready;
    if (!client) return null;
    const { data } = await client.auth.getSession();
    return data.session || null;
  }

  // Adds the login token to a fetch() call when someone is signed in.
  async function authHeaders(extra) {
    const headers = Object.assign({}, extra || {});
    const session = await getSession();
    if (session) headers.Authorization = `Bearer ${session.access_token}`;
    return headers;
  }

  // Any link with data-auth-link becomes "Sign in" or "My account".
  async function updateNav() {
    const links = document.querySelectorAll('[data-auth-link]');
    if (!links.length) return;
    const { client } = await ready;
    if (!client) { links.forEach((a) => (a.hidden = true)); return; }
    const paint = (session) => links.forEach((a) => {
      a.hidden = false;
      a.textContent = session ? 'My account' : 'Sign in';
      a.href = session ? '/account' : '/login';
    });
    paint(await getSession());
    client.auth.onAuthStateChange((_event, session) => paint(session));
  }

  window.MOF = { ready, getSession, authHeaders };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', updateNav);
  else updateNav();
})();
