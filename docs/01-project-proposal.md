# Project Proposal — AI Notes

## Problem Statement

People capture quick notes throughout the day — meeting takeaways, article highlights, half-formed
ideas — but rarely revisit them, because re-reading raw text is slower than skimming a summary.
Most lightweight note apps either have no AI features at all, or bolt AI onto a heavyweight,
subscription-gated product. There's no small, self-hostable notes app where AI summarization and
tagging are a first-class, zero-cost part of the workflow.

## Target User

Individual users (students, developers, researchers) who want a personal, low-friction notes tool:

- Comfortable signing in with just an email (no password to remember).
- Writes short-to-medium free-text notes rather than structured documents.
- Wants an at-a-glance summary/tag instead of re-reading a long note to recall its point.
- Price-sensitive — expects to run this on free-tier infrastructure, not pay for a SaaS seat.

## Value Proposition

AI Notes turns any note into a scannable summary and a set of topic tags with one click, backed
by real per-user data isolation (Postgres row-level security) rather than app-level access checks
alone. It runs entirely on free tiers (Vercel, Supabase, Gemini API), so there is no operating cost
for a single user or small team, and the whole stack deploys with three environment variables and
no infrastructure to manage.

## MVP Scope

**In scope:**
- Email magic-link authentication (Supabase Auth) — no password storage/handling in app code.
- Create / edit / delete text notes, scoped per-user via Postgres RLS.
- "Summarize with AI" — one-click Gemini-generated 1–2 sentence summary per note.
- "Generate tags" — one-click Gemini-generated topic tags, with click-to-filter.
- Search notes by title/content.
- Responsive single-page UI, dark theme.
- One-command local dev, one-click Vercel deployment.

**Out of scope for MVP:** see PRD §6 (Out of Scope).
