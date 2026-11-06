# Ministry on Fire Studio

**By Kingdom Tools · Faith. Technology. Ministry.**

A web app that helps pastors, ministers and Bible teachers prepare sermons, Bible studies and prayers.

## What's built so far

| Piece | Status |
|---|---|
| Landing page (`/`) | ✅ Done |
| Sermon Builder (`/sermon`) | ✅ Done (works in demo mode without an AI key) |
| Accounts / login | Next |
| Saved Library | Later |
| Bible Study Builder | Later |
| Usage limits (3 / 30 / 100 per month) | Later |
| Subscriptions with Stripe | Later |

## How the files fit together

- `index.html` is the landing page.
- `sermon.html` is the Sermon Builder page.
- `assets/` holds the styles, the logo, and the Sermon Builder's browser code.
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

> Heads-up: until accounts and usage limits are added, anyone with the link can use the Sermon Builder, and each use costs a little on your AI key. Keep the link private for now, or leave the key off (demo mode) until login is in place.

## Scripture

Only the **KJV** and **WEB** translations are offered. Both are public domain. The AI is told to quote only from the translation you pick, but always check quotes against your own Bible.
