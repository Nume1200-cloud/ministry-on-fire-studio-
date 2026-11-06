// POST /api/sermon — builds a sermon outline.
// Runs on Vercel's servers, so the AI key never reaches the browser.
// If ANTHROPIC_API_KEY isn't set, it returns a sample outline (demo mode).

const ALLOWED_TRANSLATIONS = ['KJV', 'WEB'];
const TRANSLATION_NAMES = { KJV: 'King James Version', WEB: 'World English Bible' };
const LIMITS = { scripture: 120, theme: 160, occasion: 60, style: 60, notes: 600 };

function clean(value, max) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function readInput(body) {
  const b = typeof body === 'string' ? safeJson(body) || {} : body || {};
  const translation = ALLOWED_TRANSLATIONS.includes(b.translation) ? b.translation : 'KJV';
  const length = ['15', '30', '45'].includes(String(b.length)) ? String(b.length) : '30';
  return {
    scripture: clean(b.scripture, LIMITS.scripture),
    theme: clean(b.theme, LIMITS.theme),
    occasion: clean(b.occasion, LIMITS.occasion) || 'Sunday morning worship',
    style: clean(b.style, LIMITS.style) || 'Expository (verse by verse)',
    notes: clean(b.notes, LIMITS.notes),
    translation,
    length
  };
}

function safeJson(text) {
  try { return JSON.parse(text); } catch { return null; }
}

// Pulls the JSON object out of the model's reply, even if it adds extra words.
function extractJson(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  return safeJson(text.slice(start, end + 1));
}

function pointCount(length) {
  return length === '15' ? 2 : length === '45' ? 4 : 3;
}

function buildPrompt(input) {
  const system = [
    'You are a seasoned, theologically careful preaching assistant for Christian pastors, ministers and Bible teachers.',
    'Write warm, clear, Christ-centered sermon outlines that are faithful to the context of the passage.',
    `Quote scripture ONLY from the ${TRANSLATION_NAMES[input.translation]} (${input.translation}). Keep quotations short and exact; if you are not sure of the exact wording, give the reference instead of quoting.`,
    'Do not invent statistics, news events or quotes from real people. Illustrations should be everyday, relatable scenarios.',
    'Reply with ONE JSON object and nothing else.'
  ].join(' ');

  const shape = `{
  "title": "sermon title",
  "scripture_reference": "main passage",
  "translation": "${input.translation}",
  "big_idea": "one sentence summarizing the message",
  "key_verse": "short exact quote of the key verse from the ${input.translation}, with reference",
  "introduction": "opening paragraph that draws listeners in",
  "points": [
    {
      "heading": "point heading",
      "scripture_refs": "supporting verses",
      "explanation": "what the text means in context",
      "illustration": "a relatable illustration",
      "application": "how to live this out this week"
    }
  ],
  "conclusion": "closing paragraph",
  "invitation": "an invitation or altar call suited to the occasion",
  "closing_prayer": "a short closing prayer",
  "reflection_questions": ["question", "question", "question"]
}`;

  const user = [
    `Build a sermon outline.`,
    `Scripture: ${input.scripture}`,
    input.theme && `Theme or burden: ${input.theme}`,
    `Occasion: ${input.occasion}`,
    `Style: ${input.style}`,
    `Target length: about ${input.length} minutes, with ${pointCount(input.length)} main points.`,
    input.notes && `Preacher's notes: ${input.notes}`,
    '',
    `Use exactly this JSON shape:\n${shape}`
  ].filter(Boolean).join('\n');

  return { system, user };
}

function demoSermon(input) {
  const theme = input.theme || "God's faithfulness";
  const n = pointCount(input.length);
  const points = [
    {
      heading: 'Look at what the text says',
      scripture_refs: input.scripture,
      explanation: `Read ${input.scripture} aloud from the ${input.translation}. Walk through who is speaking, who is listening, and what was happening at the time.`,
      illustration: 'Share a moment when you had to read something twice before you really understood it.',
      application: 'Invite the congregation to slow down and read this passage again on their own this week.'
    },
    {
      heading: `See how it speaks to "${theme}"`,
      scripture_refs: input.scripture,
      explanation: `Connect the passage to the theme of ${theme} and show where God's character is revealed in the text.`,
      illustration: 'Tell a short story from everyday life that mirrors the truth of the passage.',
      application: 'Name one place in daily life where this truth needs to be trusted.'
    },
    {
      heading: 'Point to Jesus',
      scripture_refs: 'John 1:14; Hebrews 12:2',
      explanation: 'Show how this passage finds its fullness in Christ.',
      illustration: 'Describe how a signpost points beyond itself to the destination.',
      application: 'Call listeners to place their trust in Jesus in a fresh way.'
    },
    {
      heading: 'Live it out together',
      scripture_refs: 'James 1:22',
      explanation: 'Move from hearing the word to doing it as a church family.',
      illustration: 'Picture a team that only reads the playbook but never plays the game.',
      application: 'Offer one concrete step for individuals and one for the church this week.'
    }
  ];
  return {
    title: theme.replace(/(^|\s)\S/g, (c) => c.toUpperCase()),
    scripture_reference: input.scripture,
    translation: input.translation,
    big_idea: `Through ${input.scripture}, God speaks a living word about ${theme}.`,
    key_verse: `Read the key verse from ${input.scripture} (${input.translation}).`,
    introduction: `Open with a question your listeners are already asking about ${theme}, then turn to ${input.scripture}.`,
    points: points.slice(0, n),
    conclusion: 'Bring the points together and restate the big idea in one memorable sentence.',
    invitation: `Invite people to respond in a way that fits ${input.occasion.toLowerCase()}.`,
    closing_prayer: 'Lord, seal this word in our hearts. Help us to be doers and not hearers only. In Jesus\' name, Amen.',
    reflection_questions: [
      `What stood out to you most in ${input.scripture}?`,
      `Where do you need a word about ${theme} this week?`,
      'Who could you share this message with?'
    ]
  };
}

async function callAI(input) {
  const { system, user } = buildPrompt(input);
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: process.env.AI_MODEL || 'claude-sonnet-5-5',
      max_tokens: 4000,
      system,
      messages: [{ role: 'user', content: user }]
    })
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    console.error('AI request failed', res.status, detail.slice(0, 500));
    throw new Error('The sermon service is busy right now. Please try again in a moment.');
  }

  const data = await res.json();
  const text = (data.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('');
  const sermon = extractJson(text);
  return sermon ? { sermon } : { raw: text };
}

async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Use POST.' });
  }

  const input = readInput(req.body);
  if (!input.scripture) {
    return res.status(400).json({ error: 'Please enter a scripture passage.' });
  }

  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(200).json({ demo: true, sermon: demoSermon(input) });
    }
    const result = await callAI(input);
    return res.status(200).json({ demo: false, ...result });
  } catch (err) {
    console.error(err);
    return res.status(502).json({ error: err.message || 'Something went wrong. Please try again.' });
  }
}

module.exports = handler;
// Exported for local testing
module.exports._internal = { readInput, buildPrompt, demoSermon, extractJson };
