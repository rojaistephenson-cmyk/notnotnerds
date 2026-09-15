# notnotnerds

A content site for science-humor, built to run before the merch store exists.
Next.js 14 (App Router) + SQLite-compatible database via `@libsql/client`.
No user accounts, no build step beyond Next.js itself.

## What's here

- **Homepage** — "post of the week" feature spot + a grid of recent posts.
- **Post pages** (`/post/[slug]`) — title, body, optional image, publish date,
  two reactions (🧪 Relatable / 🤯 Mind. Blown.) that increment a counter.
- **Submission form** (`/submit`) — title + body + optional name/email.
  Submissions land in a `pending` queue; nothing publishes automatically.
- **Admin** (`/admin`) — password-gated. Approve/reject pending submissions,
  and mark any published post as "post of the week."

The database is `@libsql/client`, which speaks SQLite either as a local file
or over the network to a hosted Turso database — same code, same SQL,
different `DATABASE_URL`. Locally it defaults to a file at
`data/notnotnerds.db`, created and seeded with four sample posts
automatically the first time it's touched. Delete that file to start fresh.

## Run it locally

```bash
npm install
cp .env.example .env.local
# edit .env.local: set ADMIN_PASSWORD to whatever you want,
# and SESSION_SECRET to a random string (e.g. `openssl rand -hex 32`)
# leave DATABASE_URL and DATABASE_AUTH_TOKEN blank for now
npm run dev
```

Visit `http://localhost:3000`. Admin is at `http://localhost:3000/admin`.

## Launching it on Vercel

Three things have to exist before Vercel deploy works: a database Vercel can
actually reach (SQLite-the-file doesn't survive there — see below), your code
in a place Vercel can pull from (GitHub is the standard path), and a Vercel
project pointed at it with the right environment variables.

### 1. Create a Turso database

Vercel's serverless functions run on a read-only, ephemeral filesystem —
anything a local SQLite file writes disappears the moment the function
instance recycles, so submissions/approvals/reaction counts would silently
vanish in production. Turso is a hosted, SQLite-compatible database (built on
libSQL) that this project already speaks natively, which is why it needed no
code changes beyond what's already in `lib/db.js`.

Easiest path is the [Turso web dashboard](https://turso.tech) — sign up,
create a database, and its detail page shows both values you need:
a `libsql://...` URL and a way to generate an auth token.

If you'd rather use the CLI:

```bash
curl -sSfL https://get.tur.so/install.sh | bash
turso auth login
turso db create notnotnerds
turso db show notnotnerds --url            # → DATABASE_URL
turso db tokens create notnotnerds         # → DATABASE_AUTH_TOKEN
```

Either way, you'll end up with two values. Keep them handy for step 3 — you
don't need to create any tables yourself; the app creates and seeds them on
its first request, same as it does locally.

### 2. Push the code to GitHub

Vercel deploys from a git repo. If this folder isn't a repo yet:

```bash
git init
git add .
git commit -m "notnotnerds"
```

Then create an empty repository on [github.com/new](https://github.com/new)
(don't initialize it with a README) and push:

```bash
git remote add origin https://github.com/<you>/notnotnerds.git
git branch -M main
git push -u origin main
```

### 3. Import the project on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in — "Continue with
   GitHub" is the path of least resistance since it also grants Vercel
   access to your repos.
2. **Add New… → Project**, then pick the `notnotnerds` repo. Vercel
   auto-detects Next.js; you don't need to change any build settings.
3. Before clicking Deploy, open **Environment Variables** and add:
   - `ADMIN_PASSWORD` — whatever you want it to be in production
   - `SESSION_SECRET` — a long random string (`openssl rand -hex 32`)
   - `DATABASE_URL` — the `libsql://...` URL from step 1
   - `DATABASE_AUTH_TOKEN` — the token from step 1
4. Click **Deploy**. First build takes a minute or two.

Once it's live, open the deployed URL — that first page load creates and
seeds the tables in your Turso database automatically, and `/admin` will
prompt for the password you set above.

### 4. Point notnotnerds.com at it

In the Vercel project, go to **Settings → Domains** and add
`notnotnerds.com`. Vercel will show you either nameservers to switch to, or
an A/CNAME record to add at your current registrar — follow whichever it
shows you. DNS changes can take anywhere from a few minutes to a few hours to
propagate.

### After that

Any future `git push` to `main` redeploys automatically. Rotate
`ADMIN_PASSWORD` any time from the same Environment Variables screen (redeploy
required for it to take effect, which Vercel will prompt you to do).

## Notes / things you'll likely want to change

- Reactions have no per-visitor dedupe (no accounts, as requested) — anyone
  can click repeatedly. Add a `localStorage` guard client-side if you want to
  soften that later; it's cosmetic, not enforced server-side either way.
- Admin auth is a single shared password behind a signed cookie — enough to
  keep it off Google, not meant to survive a determined attacker. Fine for
  "not launched yet"; revisit before this is public and mattering.
- Images: `image_url` on a post can be any URL (upload elsewhere and paste
  the link, e.g. an S3/Cloudinary/imgur URL). There's no image upload UI
  yet — the field is there for when you want one.
- Colors and type are CSS custom properties in `app/globals.css`
  (`--bg`, `--accent`, `--accent-2`, etc.) with a dark-mode variant baked in
  — tweak those first if you want to shift the look.
