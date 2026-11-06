# Ministry on Fire Studio

**By Kingdom Tools · Faith. Technology. Ministry.**

A web app that helps pastors, ministers and Bible teachers prepare sermons, Bible studies and prayers.

## What's built so far

| Piece | Status |
|---|---|
| Landing page (`/`) | ✅ Done |
| Sermon Builder (`/sermon`) | ✅ Done (works in demo mode without an AI key) |
| Accounts / login (`/login`, `/account`, `/reset`) | ✅ Done (turns on once Supabase is connected) |
| Saved Library | Next |
| Bible Study Builder | Later |
| Usage limits (3 / 30 / 100 per month) | Later |
| Subscriptions with Stripe | Later |

## How the files fit together

- `index.html` is the landing page.
- `sermon.html` is the Sermon Builder page.
- `assets/` holds the styles, the logo, and the Sermon Builder's browser code.
- `login.html`, `account.html`, `reset.html` are the account pages. `assets/auth.js` is the shared login helper.
- `api/config.js` tells the browser how to reach Supabase. `api/_auth.js` checks who's signed in.
- `api/sermon.js` runs on Vercel's servers. It's the only place the AI key is used, so the key never shows up in anyone's browser.
- `dev-server.js` is only for previewing on a computer. Vercel ignores it.

There are no outside packages to install, so nothing can break during deploy.

## Put it online with Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **Add New → Project**, then pick `ministry-on-fire-studio-`.
3. Leave every setting as it is and click **Deploy**.
4. You'll get a live link. The Sermon Builder works right away in **demo mode**.

## Turn on real AI sermons

1. Get an API key at [console.anthropic.com](https://console.anthropic.com).
2. In Vercel, open the project, then **Settings → Environment Variables**.
3. Add `ANTHROPIC_API_KEY` and paste your key as the value.
4. Go to **Deployments**, open the menu on the newest one, and click **Redeploy**.

Never paste your key into GitHub or any file in this repo.

> Heads-up: unless `REQUIRE_LOGIN` is on, anyone with the link can use the Sermon Builder, and each use costs a little on your AI key. Turn on accounts and the members-only switch before adding the key.

## Turn on accounts (Supabase)

Accounts stay hidden until you do these steps. The site keeps working either way.

1. Go to [supabase.com](https://supabase.com), sign up, and click **New project**. Name it `ministry-on-fire-studio`, make up a strong database password and save it somewhere safe, and pick the region closest to you (West US).
2. When the project is ready, open **Project Settings → API**. Copy the **Project URL** and the **anon public** key. (Don't copy the `service_role` key. That one must stay secret.)
3. In Supabase, open **Authentication → URL Configuration**:
   - **Site URL:** your live Vercel link, like `https://your-project.vercel.app`
   - **Redirect URLs:** add `https://your-project.vercel.app/**`
4. In Vercel, open the project, then **Settings → Environment Variables**, and add:
   - `SUPABASE_URL` = the Project URL
   - `SUPABASE_ANON_KEY` = the anon public key
5. Go to **Deployments**, open the menu on the newest one, and click **Redeploy**.

Now "Sign in" shows in the menu. People can create an account, confirm their email, sign in, reset a forgotten password, and see their account page.

**Members-only switch:** add `REQUIRE_LOGIN` = `true` in Vercel (then redeploy) and only signed-in people can use the Sermon Builder. Turn this on before you add your AI key, so strangers can't run up your bill.

## Scripture

Only the **KJV** and **WEB** translations are offered. Both are public domain. The AI is told to quote only from the translation you pick, but always check quotes against your own Bible.
