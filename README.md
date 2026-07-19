# AI Notes

A tiny full-stack notes app:

- **Next.js** (App Router) — frontend + API route, deployed as a Vercel serverless project
- **Supabase** — Postgres database + email magic-link auth (free tier)
- **Gemini API** — generates a short AI summary and topic tags for any note (free tier)

Sign in with your email, write notes, click "Summarize with AI" for a summary or "Generate tags" for topic tags. You can also edit/delete notes and search/filter by text or tag.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → New project (free tier is fine).
2. Once created, open **SQL Editor** → New query, paste the contents of [`supabase/schema.sql`](supabase/schema.sql), and run it. This creates the `notes` table and row-level security policies so users only ever see their own notes.
   - If you already ran an older version of `schema.sql` without the `tags` column, run [`supabase/migrations/002_add_tags.sql`](supabase/migrations/002_add_tags.sql) too.
3. Go to **Authentication → Providers** and make sure **Email** is enabled (it is by default). No SMTP setup needed — Supabase sends magic-link emails for you on the free tier.
4. Go to **Authentication → URL Configuration** and add your deployed URL (e.g. `https://your-app.vercel.app`) plus `http://localhost:3000` to the **Redirect URLs** allow list.
5. Go to **Project Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 2. Get a Gemini API key

1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey) and create a free API key.
2. Use it as `GEMINI_API_KEY`.

## 3. Run locally

```bash
npm install
cp .env.example .env.local   # then fill in the three values above
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 4. Deploy to Vercel (free)

1. Push this project to a GitHub repo.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo. Framework preset "Next.js" is auto-detected — no config needed.
3. Add the same three environment variables from your `.env.local` in the Vercel project's **Settings → Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY`
4. Deploy. Once live, add the Vercel URL to Supabase's **Redirect URLs** (step 1.4) so magic-link sign-in works in production.

That's it — everything here runs on free tiers (Vercel Hobby, Supabase free project, Gemini free API quota).

## Project structure

```
app/
  page.tsx                client page: auth gate + notes UI
  layout.tsx
  api/summarize/route.ts  server route calling Gemini for a note summary
  api/tags/route.ts       server route calling Gemini for topic tags
components/
  AuthGate.tsx            email magic-link sign-in
  NotesApp.tsx            create/edit/delete/search notes, trigger AI summary + tags
lib/
  supabase.ts             Supabase client (browser, uses anon key)
  gemini.ts               shared Gemini call + quota/rate-limit error handling
  types.ts
supabase/
  schema.sql              table + RLS policies to run once in Supabase
  migrations/002_add_tags.sql  adds the tags column to an existing table
```

## Notes / things you can change

- Swap the Gemini model via the `GEMINI_MODEL` env var (defaults to `gemini-2.0-flash`).
- Auth uses Supabase's magic-link email flow so there's no password handling code at all. Row-level security policies (in `schema.sql`) enforce that each user only sees their own notes — this is enforced by Postgres, not just the app.
- The Gemini calls happen in server-side API routes (`app/api/summarize`, `app/api/tags`) so the API key never reaches the browser.
- If Gemini returns a 429 quota error, the UI shows the message and disables the AI buttons for the server's suggested retry window instead of crashing. A `limit: 0` quota error means the API key's Google Cloud project hasn't been granted free-tier access — generate a fresh key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) or check billing on that project.
