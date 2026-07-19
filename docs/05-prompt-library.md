# Prompt Library

Prompts actually used with Claude Code to build and harden this project, in the order they were
used. Each entry is the real prompt (or a direct paraphrase of a multi-turn exchange) plus a one
line note on what came out of it.

1. **"Make an easy full-stack project I can deploy free on Vercel, using Supabase and Gemini AI,
   and make sure I can actually deploy it on Vercel."**
   → Produced the initial scaffold: Next.js App Router + Supabase (auth/DB) + Gemini API route,
   with a schema file, `.env.example`, and a README deploy walkthrough.

2. **"Verify the production build succeeds, and check for known vulnerabilities before this goes
   any further."**
   → `npm audit` surfaced a critical Next.js CVE on the initially-scaffolded version; bumped to a
   patched Next 16 / React 19 and re-verified the build.

3. **"Here's my Supabase connection string, DB password, and Gemini API key — wire up the app and
   confirm the schema is actually applied."**
   → Set up `.env.local`, decoded/verified the Supabase key was the `anon` role (not
   `service_role`), and checked the live `notes` table via the REST API before trusting it.

4. **"Run the schema against my database directly instead of making me paste it into the SQL
   editor."**
   → Attempted a direct `pg` connection; hit `ENOTFOUND` because Supabase's direct-connect host is
   IPv6-only. Diagnosed via `nslookup` and fell back to the browser SQL editor (see debugging
   journal, issue #2).

5. **"I get a 429 'quota exceeded, limit 0' error when I click Summarize — fix this, and add some
   other functionality while you're in there."**
   → Added a shared Gemini error-handling module (`lib/gemini.ts`) that turns a 429 into a typed,
   user-facing message with a retry countdown instead of an unhandled exception.

6. **"Add editing, search, and AI-generated tags with click-to-filter, on top of the existing
   create/delete/summarize flow."**
   → Added `/api/tags`, a `tags text[]` column + migration, inline note editing, and a client-side
   search box, all sharing the new cooldown-aware AI error handling.

7. **"These AI routes don't check who's calling them — lock them down."**
   → Added `lib/auth.ts` (verifies the Supabase JWT server-side) and required it in both
   `/api/summarize` and `/api/tags`; updated the client to send the access token; confirmed with a
   raw `curl` that an unauthenticated call now gets a 401 instead of reaching Gemini.

8. **"Document every API endpoint: method, URL, auth, request, response, and error cases."**
   → Produced `docs/06-api-documentation.md` directly from the route handlers, rather than from
   memory, to keep it accurate.

9. **"[Assignment prompt] Choose one project and produce all 11 required deliverables (proposal,
   PRD, architecture, vibe coding spec, prompt library, GitHub repo, live deployment, README, API
   docs, debugging journal, retrospective)."**
   → Mapped the assignment onto the already-built AI Notes app (qualifies as "Your Own Project":
   full-stack, AI, database, deployable) rather than starting a second project from scratch.

10. **"For this project, give me all deliverables."**
    → This document set, plus the auth fix in prompt #7, which was made while writing the API
    docs and architecture doc surfaced it as a real gap worth closing first.
