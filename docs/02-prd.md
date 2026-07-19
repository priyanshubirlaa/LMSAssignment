# Product Requirements Document — AI Notes

**Repository**: https://github.com/priyanshubirlaa/LMSAssignment
**Live demo**: https://lms-assignment-three.vercel.app/

## 1. Problem

Free-text notes accumulate faster than anyone re-reads them. Without a summary or tags, old notes
become a write-only archive: users add to the pile but rarely extract value back out of it. Existing
solutions either lack AI entirely or require a paid backend to add it.

## 2. Users

- **Primary**: an individual note-taker who wants a fast, free, low-ceremony notes tool with
  optional AI assistance.
- **Secondary**: a developer/student who wants a reference full-stack project combining a hosted
  Postgres database, a serverless deployment, and a third-party generative AI API.

## 3. User Stories

1. As a user, I want to sign in with just my email so I don't need to manage a password.
2. As a user, I want to write a note with a title and body so I can capture a thought quickly.
3. As a user, I want to click a button and get a short AI summary of a note so I don't have to
   re-read the whole thing later.
4. As a user, I want a note tagged with topics automatically so I can find it later by theme.
5. As a user, I want to click a tag to see only notes with that tag.
6. As a user, I want to search my notes by keyword.
7. As a user, I want to edit or delete a note I previously created.
8. As a user, I want assurance that other users (or an unauthenticated caller) cannot read or
   trigger AI actions on my notes.

## 4. Features

| Feature | Priority |
|---|---|
| Email magic-link sign-in / sign-out | Must |
| Create / list / delete notes | Must |
| Edit existing notes | Must |
| AI summary generation per note | Must |
| AI tag generation per note | Should |
| Tag-based filtering | Should |
| Full-text search (client-side) | Should |
| Graceful handling of AI rate-limit/quota errors | Must |
| Server-side auth check on AI endpoints | Must |

## 5. Non-functional Requirements

- **Security**: row-level security in Postgres so a user can only read/write their own rows;
  API routes that call the paid/rate-limited Gemini API must verify the caller's identity token
  server-side (not just rely on the browser sending requests only from the logged-in UI).
- **Cost**: must run entirely within free tiers — Vercel Hobby, Supabase free project, Gemini
  API free quota.
- **Availability**: no custom server to operate; deployment is a static/serverless Next.js app,
  so uptime is whatever Vercel's platform provides.
- **Performance**: AI actions should respond within Gemini's typical latency (a few seconds);
  the UI must not block other interactions while an AI call is in flight for a given note.
- **Portability**: entire local dev environment must start with `npm install` + three env vars.

## 6. Out of Scope

- Real-time collaboration / multi-user note sharing.
- Rich text / markdown rendering or file attachments.
- Offline support / local-first sync.
- Mobile app (responsive web only).
- Billing, teams, or organization accounts.
- Server-side pagination (all of a user's notes are fetched in one query — acceptable at
  personal-notes scale, not designed for tens of thousands of notes per user).

## 7. Success Metrics

- A new user can go from `git clone` to a working local instance in under 10 minutes following
  the README.
- Summarize/tag actions succeed (non-error) for well-formed input when the Gemini key has quota.
- Zero cross-user data leakage: verified via RLS policies plus the auth-gated AI routes.
- Deployed instance builds and runs on Vercel's free Hobby tier with no paid add-ons.

## 8. Open Questions

- Should tag generation also support user-edited/removed tags, or stay fully AI-owned?
- Should note history/versions be kept when a note is edited?
- At what note count does client-side search need to move server-side (Postgres `ilike`/full-text)?

## 9. Constraints

- Must use Supabase for auth + Postgres (assignment/architecture constraint).
- Must use the Gemini API for the AI features (assignment constraint).
- Must be deployable on Vercel with no additional paid services.
- Gemini free-tier quota is controlled by Google per API key/project and is outside this app's
  control — the app can only degrade gracefully when quota is exhausted, not guarantee availability.
