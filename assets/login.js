// Sign in / Create account / Forgot password
(async function () {
  const $ = (id) => document.getElementById(id);
  const form = $('auth-form');
  const submit = $('auth-submit');
  const errorEl = $('auth-error');
  const successEl = $('auth-success');
  const tabs = $('tabs');
  let mode = 'signin';

  // Only send people to pages on this site after login.
  const params = new URLSearchParams(location.search);
  const nextRaw = params.get('next') || '';
  const next = /^\/(?!\/)[\w\-\/?=&#.]*$/.test(nextRaw) ? nextRaw : '/account';

  const copy = {
    signin: { title: 'Welcome back', sub: 'Sign in to build, save and return to your messages.', button: 'Sign in' },
    signup: { title: 'Create your account', sub: 'Free plan includes 3 sermon drafts a month. No card needed.', button: 'Create account' },
    forgot: { title: 'Reset your password', sub: "Enter your email and we'll send you a link to choose a new password.", button: 'Send reset link' }
  };

  function message(el, text) { el.textContent = text || ''; el.hidden = !text; }
  function clearMessages() { message(errorEl, ''); message(successEl, ''); }

  function setMode(next) {
    mode = next;
    clearMessages();
    const c = copy[mode];
    $('auth-title').textContent = c.title;
    $('auth-sub').textContent = c.sub;
    submit.textContent = c.button;
    tabs.hidden = mode === 'forgot';
    tabs.querySelectorAll('button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.mode === mode)));
    $('name-field').hidden = mode !== 'signup';
    $('password-field').hidden = mode === 'forgot';
    $('password-hint').hidden = mode !== 'signup';
    form.password.autocomplete = mode === 'signup' ? 'new-password' : 'current-password';
    $('forgot-btn').hidden = mode !== 'signin';
    $('back-btn').hidden = mode !== 'forgot';
  }

  tabs.addEventListener('click', (e) => { if (e.target.dataset.mode) setMode(e.target.dataset.mode); });
  $('forgot-btn').addEventListener('click', () => setMode('forgot'));
  $('back-btn').addEventListener('click', () => setMode('signin'));
  if (params.get('mode') === 'signup') setMode('signup');

  const { client } = await window.MOF.ready;
  if (!client) {
    form.hidden = true;
    tabs.hidden = true;
    $('auth-off').hidden = false;
    return;
  }

  // Already signed in? Skip this page.
  const existing = await window.MOF.getSession();
  if (existing) { location.replace(next); return; }

  function friendly(err) {
    const msg = (err && err.message) || '';
    if (/invalid login credentials/i.test(msg)) return 'That email and password don\'t match. Try again or reset your password.';
    if (/email not confirmed/i.test(msg)) return 'Please confirm your email first. Check your inbox (and spam folder) for the link.';
    if (/rate limit|too many/i.test(msg)) return 'Too many tries. Please wait a minute and try again.';
    if (/password/i.test(msg) && /characters|short|weak/i.test(msg)) return 'Please choose a stronger password (at least 8 characters).';
    return msg || 'Something went wrong. Please try again.';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearMessages();
    const email = form.email.value.trim();
    const password = form.password.value;
    if (!/^\S+@\S+\.\S+$/.test(email)) return message(errorEl, 'Please enter a valid email address.');
    if (mode !== 'forgot' && password.length < 8) return message(errorEl, 'Your password needs at least 8 characters.');

    submit.disabled = true;
    const label = submit.textContent;
    submit.textContent = 'One moment…';
    try {
      if (mode === 'signin') {
        const { error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        location.replace(next);
        return;
      }
      if (mode === 'signup') {
        const { data, error } = await client.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${location.origin}/account`,
            data: { full_name: form.full_name.value.trim().slice(0, 80) }
          }
        });
        if (error) throw error;
        if (data.session) { location.replace(next); return; }
        form.password.value = '';
        message(successEl, `Almost there! We sent a confirmation link to ${email}. Open it to finish creating your account.`);
        return;
      }
      // forgot
      const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/reset` });
      if (error) throw error;
      message(successEl, `If there's an account for ${email}, a reset link is on its way. Check your inbox (and spam folder).`);
    } catch (err) {
      message(errorEl, friendly(err));
    } finally {
      submit.disabled = false;
      submit.textContent = label;
    }
  });
})();
