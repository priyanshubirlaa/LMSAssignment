# Debugging Journal

**Repository**: https://github.com/priyanshubirlaa/LMSAssignment
**Live demo**: https://lms-assignment-three.vercel.app/

Real issues hit while building and hardening this project, in the order they occurred.

---

## Issue 1: Critical Next.js CVE in the initially scaffolded version

**What happened**: Right after `npm install` on the initial scaffold (Next.js 14.2.15), `npm audit`
reported a critical-severity vulnerability affecting a wide range of Next.js versions (DoS via
Server Actions, cache-key confusion, SSRF via middleware redirects, among others in the same
advisory cluster).

**Recovery method**: Checked the latest published versions (`npm view next version` → 16.2.10,
`npm view react version` → 19.2.7), bumped `package.json` to those, deleted `node_modules` +
`package-lock.json`, reinstalled, and re-ran `npm run build` to confirm the app still compiled and
built statically with no breaking changes for this codebase.

**Lesson learned**: Run `npm audit` immediately after scaffolding, before writing any feature code
— it's much cheaper to jump a major framework version on a project with zero custom code yet than
after weeks of feature work.

---

## Issue 2: Direct Supabase Postgres connection fails with `ENOTFOUND`

**What happened**: Tried to run `supabase/schema.sql` programmatically against the live database
using the direct connection string (`db.<ref>.supabase.co:5432`) via Node's `pg` client, to avoid
asking the user to paste SQL into a dashboard. It failed immediately with
`getaddrinfo ENOTFOUND db.<ref>.supabase.co`.

**Recovery method**: `nslookup` on the same host, from the same machine, *did* resolve — but only
to an `AAAA` (IPv6) record, no `A` (IPv4) record. Node's `getaddrinfo` (like glibc) applies
`AI_ADDRCONFIG` by default: it suppresses AAAA results if the OS has no non-loopback IPv6 route
configured, which was the case on this network. That explained the contradiction between a working
`nslookup` and a failing `pg` connection. Rather than fight the network's IPv6 support, fell back
to Supabase's browser-based SQL editor to apply the schema, which uses HTTPS and has no such
constraint.

**Lesson learned**: Supabase's direct-connect Postgres host is IPv6-only by design; on any network
without IPv6 egress, tooling must either use Supabase's IPv4-compatible connection pooler
(`aws-0-<region>.pooler.supabase.com`) or fall back to the dashboard SQL editor. Don't assume a
successful DNS lookup means a successful connection — check which record type actually resolved.

---

## Issue 3: Gemini API returns 429 with `limit: 0` on the free tier

**What happened**: Clicking "Summarize with AI" threw an unhandled `[GoogleGenerativeAI Error]:
429 Too Many Requests`, with the response body showing
`generate_content_free_tier_requests, limit: 0` for the configured model — i.e., the API key's
Google Cloud project had *zero* free-tier quota granted, not merely a temporarily exhausted quota.

**Recovery method**: Confirmed this was an account/eligibility issue on Google's side (not an app
bug) by inspecting the quota violation details in the error payload. Rather than retry-looping
against a permanently zero quota, added a typed `GeminiRequestError` (`lib/gemini.ts`) that
detects 429/quota errors, extracts the suggested retry delay from the message, and surfaces a
user-facing message with a countdown instead of a raw stack trace. The button disables itself
until the cooldown elapses.

**Lesson learned**: Not every third-party API error is a retry-until-it-works situation — a
`limit: 0` quota is a configuration/billing problem that no amount of client-side retrying fixes.
The right fix is to fail clearly and quickly, and tell the user what to check (billing/plan on the
provider's side), rather than mask it behind generic error handling.

---

## Issue 4: AI API routes had no server-side authorization check

**What happened**: While writing the API documentation (`docs/06-api-documentation.md`) and having
to describe each endpoint's "Authentication" column honestly, it became clear `/api/summarize` and
`/api/tags` accepted requests from *anyone* — the routes trusted that only the signed-in UI would
ever call them, but nothing enforced that server-side. Any client with the deployed URL could POST
directly to either route and consume the shared Gemini quota, authenticated or not.

**Recovery method**: Added `lib/auth.ts`, which reads the `Authorization: Bearer <token>` header
and verifies it against Supabase (`supabase.auth.getUser(token)`), and required it in both routes,
returning `401` when missing/invalid. Updated the client to send the current session's
`access_token` on every AI call. Verified with a raw `curl POST` (no header) that the route now
returns `401` instead of reaching Gemini.

**Lesson learned**: Writing the API docs surfaced a real gap that casual manual testing (always
done through the logged-in UI) never would have — documentation review is a legitimate way to
find bugs, not just record behavior after the fact.
