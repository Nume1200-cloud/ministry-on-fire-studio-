// GET /api/config — tells the browser how to reach Supabase for login.
// The Supabase URL and "anon" (public) key are SAFE to share with browsers.
// They're designed for it: Supabase's security rules protect the data.
// NEVER put the Supabase "service_role" key here or anywhere in the browser.

function handler(req, res) {
  const url = (process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const anonKey = (process.env.SUPABASE_ANON_KEY || '').trim();
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    authEnabled: Boolean(url && anonKey),
    supabaseUrl: url || null,
    supabaseAnonKey: anonKey || null,
    requireLogin: process.env.REQUIRE_LOGIN === 'true'
  });
}

module.exports = handler;
