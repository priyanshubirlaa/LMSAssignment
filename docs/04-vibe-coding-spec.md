# Vibe Coding Spec — AI Notes

**Repository**: https://github.com/priyanshubirlaa/LMSAssignment
**Live demo**: https://lms-assignment-three.vercel.app/

A working spec for building this app with an AI pair-programmer (Claude Code), covering intent,
constraints, and the rules the assistant should follow when generating or editing code in this
repo.

## 1. Project Overview

A minimal full-stack notes app where any note can be summarized or tagged by Gemini with one
click. Optimized for: fast to build, free to run, safe to hand to another AI session to extend.

## 2. Tech Stack

Next.js 16 (App Router) + TypeScript, React 19, Supabase (Postgres + Auth), Google Gemini API
(`@google/generative-ai`), deployed on Vercel. No custom Express server, no ORM — Supabase's JS
client talks to Postgres directly through PostgREST, authorized by RLS.

## 3. Core Features & User Flows

- **Sign in**: enter email → receive magic link → redirected back signed in. No password flow to
  build or test.
- **Create note**: title + content form → insert row scoped to `auth.uid()`.
- **Summarize**: click button on a note → POST to `/api/summarize` with the note content and the
  user's access token → Gemini returns a summary → persisted back onto the note row.
- **Tag**: same flow against `/api/tags`, returns an array of short tags rendered as chips;
  clicking a chip filters the note list to that tag.
- **Edit / delete**: inline edit form per note; delete removes the row (RLS-enforced, so a request
  for someone else's note id simply matches zero rows).
- **Search**: client-side filter over the already-loaded notes by title/content substring.

## 4. Data Model

See `docs/03-technical-architecture.md#database-design` — one table, `notes`, RLS-scoped by
`user_id`. `summary` and `tags` are nullable and populated asynchronously after note creation.

## 5. API / Component Design

- `lib/supabase.ts` — single browser Supabase client (anon key), used directly by components for
  all note CRUD.
- `lib/gemini.ts` — server-only Gemini call wrapper; normalizes 429/quota errors into a typed
  `GeminiRequestError` with an optional `retryAfterSeconds`.
- `lib/auth.ts` — server-only helper that verifies a Supabase JWT from the `Authorization` header.
- `app/api/summarize/route.ts`, `app/api/tags/route.ts` — thin route handlers: verify auth →
  validate body → call `generateText` with a specific prompt → return JSON.
- `components/AuthGate.tsx` — owns session state, renders sign-in form or children.
- `components/NotesApp.tsx` — owns all note state (list, search, filters, editing, in-flight AI
  calls, cooldown timer).

Rule for future changes: keep Gemini calls server-side only; never let `GEMINI_API_KEY` reach a
client bundle.

## 6. UI/UX Guidelines

Single dark-themed page, no client-side router needed (one screen: signed-out vs signed-in).
Every async action (save, summarize, tag, delete) shows its own inline loading state on the
specific button that triggered it — never a full-page spinner. Errors render as a single
dismissable-by-next-action line, not a modal. Tags render as `#tag` chips; the active filter chip
is visually distinct (filled vs outline).

## 7. AI Integration Rules

- Model is configurable via `GEMINI_MODEL` env var (default `gemini-2.0-flash`); never hardcode
  a model name in more than one place — always go through `lib/gemini.ts`.
- Prompts are single-purpose and constrained ("return only X, no preamble") to keep responses
  parseable without a JSON-mode round-trip.
- Every Gemini call must be reachable only from an authenticated request — see `lib/auth.ts`.
- Rate-limit/quota errors are a distinct, expected failure mode, not a generic 500 — the caller
  gets a message plus `retryAfterSeconds` it can use to disable retries.

## 8. Constraints & Non-Goals

- No custom backend framework (Express/Fastify) — API routes only.
- No ORM/migration tool — schema changes are plain SQL files run through Supabase's SQL editor.
- No client-side AI calls (no client-exposed API key, ever).
- No offline/local-first behavior, no real-time sync, no team/sharing features (see PRD §6).
