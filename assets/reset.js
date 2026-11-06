// Choose a new password — from a reset email link, or while signed in.
(async function () {
  const $ = (id) => document.getElementById(id);
  const form = $('reset-form');
  const errorEl = $('reset-error');
  const { client } = await window.MOF.ready;
  if (!client) { $('reset-off').hidden = false; return; }

  let session = await window.MOF.getSession();
  if (!session && /access_token|code=/.test(location.hash + location.search)) {
    await new Promise((r) => setTimeout(r, 800));
    session = await window.MOF.getSession();
  }
  if (!session) {
    $('reset-sub').hidden = true;
    $('reset-expired').hidden = false;
    return;
  }
  if (location.hash || location.search) history.replaceState(null, '', '/reset');
  form.hidden = false;

  function showError(text) { errorEl.textContent = text || ''; errorEl.hidden = !text; }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    showError('');
    const password = form.password.value;
    if (password.length < 8) return showError('Your password needs at least 8 characters.');
    if (password !== form.confirm.value) return showError("Those two passwords don't match.");

    const btn = $('reset-submit');
    btn.disabled = true;
    btn.textContent = 'Saving…';
    const { error } = await client.auth.updateUser({ password });
    if (error) {
      showError(/same|different/i.test(error.message) ? 'Please pick a password you haven\'t used here before.' : (error.message || 'Could not save. Please try again.'));
      btn.disabled = false;
      btn.textContent = 'Save new password';
      return;
    }
    form.hidden = true;
    $('reset-success').hidden = false;
    setTimeout(() => location.replace('/account'), 1500);
  });
})();
