# Harsha Reddy — Portfolio + Blog (Vercel · Supabase · Resend)

A tech-noir personal portfolio with a working contact form (stored + emailed)
and a login-protected blog you can write to. 100% free tier.

```
index.html        the portfolio + blog (one file, no build)
admin.html        login + write-a-post page
api/connect.js    POST → stores contact in Supabase + emails you via Resend
api/posts.js      GET published posts (public) · POST a new post (login required)
schema.sql        run once in Supabase to create the tables + audit trigger
package.json      declares the Supabase dependency (Vercel installs it)
.env.example      the environment variables you'll set in Vercel
```

Nothing to install locally. Everything below is done in a browser.

---

## 1 — Supabase (database + login)  ~5 min

1. Go to **supabase.com** → **New project** (free). Pick a name + DB password.
2. Open **SQL Editor → New query**, paste all of `schema.sql`, click **Run**.
   This creates `connect_requests`, `connect_audit` (+ the AFTER INSERT trigger),
   and `blog_posts` with one seed post.
3. **Authentication → Users → Add user** → enter your email + a password.
   This is your blog login. (Toggle "Auto Confirm" so you can log in right away.)
4. **Project Settings → API** — copy these three values, you'll need them:
   - **Project URL**            → `SUPABASE_URL`
   - **anon / public key**      → goes in `admin.html`
   - **service_role key**       → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

## 2 — Resend (email alerts)  ~2 min

1. Go to **resend.com** → sign up (free).
2. **API Keys → Create** → copy the key (`re_...`) → that's `RESEND_API_KEY`.
3. Free tier note: without a custom domain, Resend only delivers to the email
   you signed up with. Since you're emailing **yourself**, that's fine. (Add a
   domain later if you want a custom "from" address.)

## 3 — Edit admin.html

Open `admin.html`, find the two marked lines near the bottom, and paste your
Supabase **Project URL** and **anon/public key**:

```js
const SUPABASE_URL = 'https://YOUR-PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR-ANON-PUBLIC-KEY';
```

(The anon key is *meant* to be public — RLS keeps your data safe.)

## 4 — Deploy on Vercel  ~3 min

1. Put this folder in a **GitHub** repo (or drag-drop the folder into Vercel).
2. **vercel.com → Add New → Project** → import the repo. No build settings to
   change — Vercel auto-detects the static site + `api/` functions.
3. Before/after first deploy: **Settings → Environment Variables**, add:
   | Name | Value |
   |---|---|
   | `SUPABASE_URL` | your project URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | service_role key (secret) |
   | `RESEND_API_KEY` | your Resend key |
   | `CONTACT_EMAIL` | dhreddy07@gmail.com |
4. **Redeploy** so the variables take effect. Done — your site is live.

## 5 — Use it

- **Contact:** open your site → *Open Channel* → send. The row lands in
  `connect_requests` and you get an email.
- **Write a blog post:** go to `your-site.vercel.app/admin.html` → log in →
  fill the form → **Transmit Post**. It appears on the blog immediately.

---

### How auth works (quick)
`admin.html` signs you in with Supabase and gets a session token. When you
publish, that token rides along to `api/posts.js`, which verifies it before
writing. The write itself uses the secret service-role key on the server, so
the database is never exposed to the browser.

### Local Oracle version
Your Node + Express + Oracle XE build stays your local learning project — the
SQL concepts (tables, the audit trigger, stored procedures) map directly onto
what `schema.sql` does here in Postgres.
