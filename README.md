# AI Notes

A tiny full-stack notes app: write notes, get an AI-generated summary and topic tags for any of
them with one click, all on free-tier infrastructure.

**Live demo**: https://lms-assignment-three.vercel.app/
**Repository**: https://github.com/priyanshubirlaa/LMSAssignment

## Features

- Email magic-link sign-in / sign-out (no passwords)
- Create, edit, delete notes
- "Summarize with AI" — 1–2 sentence Gemini-generated summary per note
- "Generate tags" — 3–5 Gemini-generated topic tags per note, click a tag to filter
- Search notes by title/content
- Per-user data isolation enforced by Postgres row-level security
- Server-side auth check on the AI endpoints (a request without a valid session token is rejected
  before it ever reaches Gemini)
- Graceful handling of Gemini rate-limit/quota errors (clear message + retry countdown, not a crash)
- Responsive, dark-themed single-page UI

## Tech stack

- **Next.js 16** (App Router) + TypeScript + React 19 — frontend and API routes, deployed as a
  single Vercel project
- **Supabase** — Postgres database + email magic-link auth (free tier)
- **Gemini API** (`@google/generative-ai`) — AI summary + tag generation (free tier)

## Environment variables

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → `anon` `public` key |
| `GEMINI_API_KEY` | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| `GEMINI_MODEL` (optional) | Defaults to `gemini-2.0-flash` |

Copy `.env.example` to `.env.local` and fill these in for local dev. The same three/four values
go into Vercel's **Settings → Environment Variables** for production — never commit `.env.local`
(it's git-ignored already).

## Installation

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → New project (free tier is fine).
2. Open **SQL Editor** → New query, paste the contents of [`supabase/schema.sql`](supabase/schema.sql), and run it. This creates the `notes` table and row-level security policies so users only ever see their own notes.
   - If you already ran an older version of `schema.sql` without the `tags` column, also run [`supabase/migrations/002_add_tags.sql`](supabase/migrations/002_add_tags.sql).
3. Go to **Authentication → Providers** and make sure **Email** is enabled (it is by default). No SMTP setup needed — Supabase sends magic-link emails for you on the free tier.
4. Go to **Authentication → URL Configuration** and add your deployed URL (e.g. `https://your-app.vercel.app`) plus `http://localhost:3000` to the **Redirect URLs** allow list.
5. Copy the two values from **Project Settings → API** into your env vars (see table above).

### 2. Get a Gemini API key

Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey) and create a free API key.

### 3. Run locally

```bash
npm install
cp .env.example .env.local   # then fill in the values above
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment

1. Push this project to a GitHub repo (already done: https://github.com/priyanshubirlaa/LMSAssignment).
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo. Framework preset "Next.js" is auto-detected — no config needed.
3. Add the environment variables from the table above in the Vercel project's **Settings → Environment Variables**.
4. Deploy. Once live, add the Vercel URL to Supabase's **Redirect URLs** (Installation step 1.4) so magic-link sign-in works in production, and add the URL to the "Live demo" line at the top of this README.

Everything here runs on free tiers (Vercel Hobby, Supabase free project, Gemini free API quota).

## Screenshots

_Optional — add screenshots of the sign-in screen and the notes list with a generated summary/tags here._

## Documentation

Full assignment deliverables live in [`docs/`](docs/):

1. [Project Proposal](docs/01-project-proposal.md)
2. [PRD](docs/02-prd.md)
3. [Technical Architecture](docs/03-technical-architecture.md)
4. [Vibe Coding Spec](docs/04-vibe-coding-spec.md)
5. [Prompt Library](docs/05-prompt-library.md)
6. [API Documentation](docs/06-api-documentation.md)
7. [Debugging Journal](docs/07-debugging-journal.md)
8. [Retrospective](docs/08-retrospective.md)

## Project structure

```
app/
  page.tsx                client page: auth gate + notes UI
  layout.tsx
  api/summarize/route.ts  server route calling Gemini for a note summary (auth-checked)
  api/tags/route.ts       server route calling Gemini for topic tags (auth-checked)
components/
  AuthGate.tsx            email magic-link sign-in
  NotesApp.tsx            create/edit/delete/search notes, trigger AI summary + tags
lib/
  supabase.ts             Supabase client (browser, uses anon key)
  gemini.ts               shared Gemini call + quota/rate-limit error handling
  auth.ts                 server-side Supabase JWT verification for the AI routes
  types.ts
supabase/
  schema.sql              table + RLS policies to run once in Supabase
  migrations/002_add_tags.sql  adds the tags column to an existing table
docs/
  01-08                   assignment deliverables (proposal, PRD, architecture, etc.)
```

## Notes / things you can change

- Swap the Gemini model via the `GEMINI_MODEL` env var (defaults to `gemini-2.0-flash`).
- Auth uses Supabase's magic-link email flow so there's no password handling code at all. Row-level security policies (in `schema.sql`) enforce that each user only sees their own notes — this is enforced by Postgres, not just the app.
- The Gemini calls happen in server-side API routes (`app/api/summarize`, `app/api/tags`), gated by a server-side check on the caller's Supabase session (`lib/auth.ts`), so the API key never reaches the browser and the routes can't be called anonymously.
- If Gemini returns a 429 quota error, the UI shows the message and disables the AI buttons for the server's suggested retry window instead of crashing. A `limit: 0` quota error means the API key's Google Cloud project hasn't been granted free-tier access — generate a fresh key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) or check billing on that project.
