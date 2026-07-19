# Technical Architecture — AI Notes

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend + server | Next.js 16 (App Router), React 19, TypeScript | Single deployable unit on Vercel; API routes double as the backend, no separate server to host. |
| Database | Supabase Postgres | Free hosted Postgres with row-level security built in; matches the assignment's "PostgreSQL" requirement without operating a DB server. |
| Auth | Supabase Auth (email magic link) | No password storage/hashing code to write or get wrong; issues a JWT the API routes can verify. |
| AI | Google Gemini API (`@google/generative-ai`) | Free-tier generative model for summarization and tagging. |
| Hosting | Vercel (Hobby/free tier) | Zero-config Next.js deployment, serverless functions for the two API routes. |

## Components

```
Browser (React client components)
  ├─ AuthGate.tsx      — magic-link sign-in, session state
  └─ NotesApp.tsx       — CRUD UI, search/filter, calls AI endpoints with the user's access token
        │
        ▼
Next.js API routes (serverless, run on Vercel)
  ├─ /api/summarize     — verifies JWT, calls Gemini, returns a summary
  └─ /api/tags          — verifies JWT, calls Gemini, returns topic tags
        │
        ▼
lib/gemini.ts  — shared Gemini client + 429/quota error normalization
lib/auth.ts    — verifies a Supabase access token server-side (supabase.auth.getUser)
        │
        ▼
Supabase (hosted)
  ├─ Postgres `notes` table (RLS: auth.uid() = user_id)
  └─ Auth service (issues/validates JWTs, sends magic-link email)
```

Data access from the browser to Postgres goes **directly** through the Supabase JS client
(`lib/supabase.ts`, anon key) rather than through a custom CRUD API — Postgres RLS is the actual
authorization boundary for note data. The only reason a Next.js API route exists at all is to keep
`GEMINI_API_KEY` server-side and to add an explicit authorization check before spending API quota.

## Database Design

```sql
notes
├─ id          uuid, primary key, default gen_random_uuid()
├─ user_id     uuid, references auth.users(id) on delete cascade
├─ title       text, not null
├─ content     text, not null
├─ summary     text, nullable        -- filled in by /api/summarize
├─ tags        text[], nullable      -- filled in by /api/tags
└─ created_at  timestamptz, default now()
```

Row-level security policies (see `supabase/schema.sql`) restrict `select`/`insert`/`update`/`delete`
to rows where `auth.uid() = user_id`. This is enforced by Postgres itself, so even a bug in the
client code cannot leak another user's notes.

## API Design

See [`docs/06-api-documentation.md`](06-api-documentation.md) for the full per-endpoint spec.
Summary:

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/summarize` | POST | Bearer JWT (Supabase) | Generate a 1–2 sentence summary of note content |
| `/api/tags` | POST | Bearer JWT (Supabase) | Generate 3–5 topic tags for note content |

Note CRUD itself has no custom API — it goes through the Supabase client library directly
(PostgREST under the hood), authorized by RLS.

## Implementation Sequence

1. Scaffold Next.js app, Supabase client, `.env` wiring.
2. Define and apply Postgres schema + RLS policies.
3. Build magic-link auth gate.
4. Build note CRUD (create, list, delete) against Supabase directly from the client.
5. Add the Gemini-backed `/api/summarize` route and wire the "Summarize with AI" button.
6. Harden dependencies (Next.js version bump after a critical CVE surfaced in `npm audit`).
7. Add note editing, search, and the `/api/tags` route + tag-filter UI.
8. Add graceful handling for Gemini 429/quota errors (cooldown + message instead of a crash).
9. Add server-side JWT verification to both AI routes (closing an auth gap found during API
   documentation review).
10. Write documentation deliverables; commit and deploy.

## Risks

| Risk | Mitigation |
|---|---|
| Gemini free-tier quota can be `0` for a given API key/project (Google-side eligibility, not app behavior) | Errors are caught, surfaced with a clear message and a retry-after cooldown instead of crashing the UI. |
| Supabase's **direct** Postgres connection (port 5432) is IPv6-only, which fails on networks without IPv6 egress | Schema changes are applied through Supabase's browser SQL editor rather than a direct `psql`/driver connection; documented in the debugging journal. |
| Unauthenticated calls could exhaust the shared Gemini quota | Both AI routes verify the Supabase access token server-side before calling Gemini. |
| Client-side search doesn't scale indefinitely | Acceptable at personal-notes scale; flagged as an open question for a server-side `ilike`/full-text upgrade path. |
| No automated tests | Manual smoke-testing (curl + browser) was used for this MVP; noted as a gap, not a silent risk. |
