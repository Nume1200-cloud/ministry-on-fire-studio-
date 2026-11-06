// Sermon Builder — front end
(function () {
  const form = document.getElementById('sermon-form');
  const submitBtn = document.getElementById('submit-btn');
  const errorEl = document.getElementById('form-error');
  const emptyEl = document.getElementById('empty-state');
  const loadingEl = document.getElementById('loading');
  const outputEl = document.getElementById('output');
  const actionsEl = document.getElementById('actions');
  let lastSermon = null;

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  function show(state) {
    emptyEl.hidden = state !== 'empty';
    loadingEl.hidden = state !== 'loading';
    outputEl.hidden = state !== 'output';
    actionsEl.hidden = state !== 'output';
  }

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.hidden = !msg;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    showError('');
    const data = Object.fromEntries(new FormData(form).entries());
    if (!data.scripture || !data.scripture.trim()) {
      showError('Please enter a scripture passage to build from.');
      form.scripture.focus();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Building…';
    show('loading');
    if (window.innerWidth < 900) document.getElementById('result').scrollIntoView({ behavior: 'smooth' });

    try {
      const res = await fetch('/api/sermon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Something went wrong. Please try again.');
      lastSermon = body;
      render(body);
      show('output');
    } catch (err) {
      show(lastSermon ? 'output' : 'empty');
      showError(err.message || 'Could not reach the server. Please try again.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Build my sermon';
    }
  });

  function render(r) {
    const s = r.sermon || {};
    let html = '';
    if (r.demo) {
      html += '<div class="demo-banner"><strong>Demo mode.</strong> This is a sample outline. Add an AI key in Vercel to get fully written sermons.</div>';
    }
    html += '<article class="sermon">';
    if (r.raw) {
      html += `<div class="raw">${esc(r.raw)}</div></article>`;
      outputEl.innerHTML = html;
      return;
    }
    html += `<h2>${esc(s.title)}</h2>`;
    html += `<p class="meta">${esc(s.scripture_reference)} · ${esc(s.translation)}</p>`;
    if (s.big_idea) html += `<div class="big-idea">${esc(s.big_idea)}</div>`;
    if (s.key_verse) html += `<blockquote>${esc(s.key_verse)}</blockquote>`;
    if (s.introduction) html += `<h4>Introduction</h4><p>${esc(s.introduction)}</p>`;

    (s.points || []).forEach((p, i) => {
      html += `<section class="point"><h3>${i + 1}. ${esc(p.heading)}</h3>`;
      if (p.scripture_refs) html += `<p class="refs">${esc(p.scripture_refs)}</p>`;
      if (p.explanation) html += `<h4>Explanation</h4><p>${esc(p.explanation)}</p>`;
      if (p.illustration) html += `<h4>Illustration</h4><p>${esc(p.illustration)}</p>`;
      if (p.application) html += `<h4>Application</h4><p>${esc(p.application)}</p>`;
      html += '</section>';
    });

    if (s.conclusion) html += `<h3>Conclusion</h3><p>${esc(s.conclusion)}</p>`;
    if (s.invitation) html += `<h4>Invitation</h4><p>${esc(s.invitation)}</p>`;
    if (s.closing_prayer) html += `<h4>Closing prayer</h4><p>${esc(s.closing_prayer)}</p>`;
    if (Array.isArray(s.reflection_questions) && s.reflection_questions.length) {
      html += '<h4>For reflection</h4><ul>' + s.reflection_questions.map((q) => `<li>${esc(q)}</li>`).join('') + '</ul>';
    }
    html += '</article>';
    outputEl.innerHTML = html;
  }

  function toPlainText(r) {
    if (r.raw) return r.raw;
    const s = r.sermon || {};
    const out = [];
    out.push(s.title || 'Sermon', `${s.scripture_reference || ''} (${s.translation || ''})`, '');
    if (s.big_idea) out.push('BIG IDEA: ' + s.big_idea, '');
    if (s.key_verse) out.push('"' + s.key_verse + '"', '');
    if (s.introduction) out.push('INTRODUCTION', s.introduction, '');
    (s.points || []).forEach((p, i) => {
      out.push(`${i + 1}. ${p.heading}`);
      if (p.scripture_refs) out.push('   Scripture: ' + p.scripture_refs);
      if (p.explanation) out.push('   ' + p.explanation);
      if (p.illustration) out.push('   Illustration: ' + p.illustration);
      if (p.application) out.push('   Application: ' + p.application);
      out.push('');
    });
    if (s.conclusion) out.push('CONCLUSION', s.conclusion, '');
    if (s.invitation) out.push('INVITATION', s.invitation, '');
    if (s.closing_prayer) out.push('CLOSING PRAYER', s.closing_prayer, '');
    if (s.reflection_questions?.length) out.push('FOR REFLECTION', ...s.reflection_questions.map((q) => '- ' + q), '');
    out.push('Prepared with Ministry on Fire Studio · Kingdom Tools');
    return out.join('\n');
  }

  document.getElementById('copy-btn').addEventListener('click', async (e) => {
    if (!lastSermon) return;
    try {
      await navigator.clipboard.writeText(toPlainText(lastSermon));
      e.target.textContent = 'Copied!';
    } catch {
      e.target.textContent = 'Copy failed';
    }
    setTimeout(() => (e.target.textContent = 'Copy'), 2000);
  });

  document.getElementById('download-btn').addEventListener('click', () => {
    if (!lastSermon) return;
    const name = (lastSermon.sermon?.title || 'sermon').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
    const blob = new Blob([toPlainText(lastSermon)], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${name || 'sermon'}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  });

  document.getElementById('print-btn').addEventListener('click', () => window.print());

  show('empty');
})();
