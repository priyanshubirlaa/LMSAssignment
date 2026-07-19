# Prompt Library

**Repository**: https://github.com/priyanshubirlaa/LMSAssignment
**Live demo**: https://lms-assignment-three.vercel.app/

Prompts used with Claude Code to build and harden this project, in the order they were used. Each
entry is the actual prompt (or a direct paraphrase of a multi-turn exchange) plus a one-line note
on what came out of it.

1. **"Scaffold a full-stack Next.js (App Router) application integrated with Supabase for
   authentication and Postgres storage, and the Gemini API for AI-generated content, structured
   for zero-configuration deployment on Vercel's free tier."**
   → Produced the initial scaffold: Next.js App Router + Supabase (auth/DB) + a Gemini-backed API
   route, a Postgres schema with row-level security, `.env.example`, and a README deployment guide.

2. **"Run a full production build and a dependency security audit before any feature work
   continues."**
   → `npm audit` surfaced a critical Next.js CVE in the initially scaffolded version; upgraded to
   a patched Next 16 / React 19 and re-verified the build before proceeding.

3. **"Provision the Supabase project credentials and Gemini API key, wire them into the
   application configuration, and confirm the database schema has been applied correctly against
   the live instance."**
   → Configured `.env.local`, verified the Supabase key was scoped to the `anon` role (not
   `service_role`) before use, and confirmed the live `notes` table via the REST API rather than
   assuming the schema had taken effect.

4. **"Apply the database schema directly against the provisioned Postgres instance via a scripted
   connection rather than the dashboard SQL editor."**
   → Attempted a direct `pg` connection; it failed with `ENOTFOUND` because Supabase's
   direct-connect host is IPv6-only. Diagnosed the cause via `nslookup` and fell back to applying
   the schema through Supabase's SQL editor (see debugging journal, issue #2).

5. **"The Gemini summarization endpoint is returning a 429 quota-exceeded error — diagnose the
   root cause, implement proper error handling, and extend the application with additional
   AI-assisted functionality."**
   → Added a shared Gemini error-handling module (`lib/gemini.ts`) that classifies a 429/quota
   response into a typed, user-facing message with a retry countdown instead of surfacing a raw
   exception.

6. **"Extend the note-taking feature set with inline editing, full-text search, and AI-generated
   topic tags with tag-based filtering."**
   → Added the `/api/tags` route, a `tags text[]` column plus migration, inline note editing, and
   a client-side search box, all reusing the cooldown-aware AI error handling from the previous step.

7. **"Audit the AI API routes for authorization gaps and enforce server-side verification of the
   caller's session token."**
   → Added `lib/auth.ts` (verifies the Supabase JWT server-side) and required it in both
   `/api/summarize` and `/api/tags`; updated the client to send the access token; confirmed with a
   raw `curl` request that an unauthenticated call now returns 401 instead of reaching Gemini.

8. **"Produce complete API documentation for every endpoint, covering method, URL, authentication,
   request/response schema, and error conditions."**
   → Produced `docs/06-api-documentation.md` directly from the route handler source, rather than
   from memory, to guarantee accuracy.

9. **"Map this assignment's required project category onto the existing application and produce
   the full set of required deliverables: proposal, PRD, technical architecture, vibe coding spec,
   prompt library, GitHub repository, live deployment, README, API documentation, debugging
   journal, and retrospective."**
   → Mapped the assignment onto the already-built AI Notes application (qualifies as "Your Own
   Project": full-stack, AI, database, deployable) rather than starting a second project from
   scratch, and produced the full `docs/` set.

10. **"Cross-check every deliverable against the assignment's checklist and confirm nothing
    required is missing."**
    → Verified each document's required subsections against the checklist line by line, confirmed
    the repository was public with 10+ commits and no `.env` tracked, and confirmed word counts
    (e.g. retrospective ≥ 200 words) met the stated minimums.

11. **"Verify the live deployment URL works end-to-end and update the documentation and
    repository accordingly."**
    → Confirmed the production deployment returns 200 on the homepage and correctly returns 401 on
    an unauthenticated call to a protected API route, then committed the live URL into the README
    and this prompt library.
