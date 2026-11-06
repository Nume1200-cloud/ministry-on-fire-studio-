// Shared helper for server functions: checks who is signed in.
// Files starting with "_" are not turned into web addresses by Vercel.

function authConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
}

// Returns the signed-in user ({ id, email }) or null.
async function getUser(req) {
  if (!authConfigured()) return null;
  const header = req.headers?.authorization || req.headers?.Authorization || '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) return null;

  const base = process.env.SUPABASE_URL.trim().replace(/\/+$/, '');
  try {
    const res = await fetch(`${base}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${match[1]}`, apikey: process.env.SUPABASE_ANON_KEY.trim() }
    });
    if (!res.ok) return null;
    const user = await res.json();
    return user && user.id ? { id: user.id, email: user.email } : null;
  } catch (err) {
    console.error('Could not check login with Supabase', err);
    return null;
  }
}

// True when the owner has switched on "members only" in Vercel.
function loginRequired() {
  return authConfigured() && process.env.REQUIRE_LOGIN === 'true';
}

module.exports = { getUser, loginRequired, authConfigured };
