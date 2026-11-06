// Account dashboard — only for signed-in people.
(async function () {
  const $ = (id) => document.getElementById(id);
  const { client } = await window.MOF.ready;
  if (!client) {
    $('account-loading').hidden = true;
    $('account-off').hidden = false;
    return;
  }

  // Arriving from an email confirmation link? Give Supabase a moment to finish signing in.
  let session = await window.MOF.getSession();
  if (!session && /access_token|code=/.test(location.hash + location.search)) {
    await new Promise((r) => setTimeout(r, 800));
    session = await window.MOF.getSession();
  }
  if (!session) { location.replace('/login?next=/account'); return; }

  const user = session.user;
  const name = (user.user_metadata && user.user_metadata.full_name) || '';
  $('greeting').textContent = name ? `Welcome, ${name}` :'Welcome to your Studio';
  $('acct-email').textContent = user.email || '—';
  if (user.created_at) {
    $('acct-since').textContent = new Date(user.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
  }
  if (location.hash || location.search) history.replaceState(null, '', '/account');

  $('account-loading').hidden = true;
  $('account').hidden = false;

  $('signout-btn').addEventListener('click', async () => {
    await client.auth.signOut();
    location.replace('/');
  });

  client.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') location.replace('/login');
  });
})();
