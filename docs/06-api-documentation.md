# API Documentation

Two custom endpoints exist in this app. All other data access (note create/read/update/delete)
goes directly from the browser to Supabase via the Supabase JS client and is authorized by
Postgres row-level security, not a custom API — see `supabase/schema.sql`.

Base URL: `https://<your-deployment>.vercel.app` (or `http://localhost:3000` in dev).

---

## POST /api/summarize

Generates a 1–2 sentence AI summary of note content.

- **Method**: `POST`
- **URL**: `/api/summarize`
- **Authentication**: Required. `Authorization: Bearer <supabase_access_token>` header, where the
  token is the current user's Supabase session `access_token` (from `supabase.auth.getSession()`).
  Verified server-side in `lib/auth.ts` via `supabase.auth.getUser(token)`.

### Request

```http
POST /api/summarize
Authorization: Bearer eyJhbGciOi...
Content-Type: application/json

{
  "content": "string, required — the note body to summarize"
}
```

### Response — 200 OK

```json
{
  "summary": "A concise 1-2 sentence summary of the note."
}
```

### Errors

| Status | Body | Cause |
|---|---|---|
| 401 | `{ "error": "Unauthorized" }` | Missing or invalid `Authorization` header / expired session. |
| 400 | `{ "error": "content is required" }` | `content` missing or not a string. |
| 429 | `{ "error": "Gemini API quota exceeded...", "retryAfterSeconds": 29 }` | Gemini rate limit or free-tier quota exhausted. Client should disable the action until `retryAfterSeconds` elapses. |
| 500 | `{ "error": "<message>" }` | `GEMINI_API_KEY` not configured, or an unexpected Gemini/SDK error. |

---

## POST /api/tags

Generates 3–5 short topic tags for note content.

- **Method**: `POST`
- **URL**: `/api/tags`
- **Authentication**: Required, identical scheme to `/api/summarize`.

### Request

```http
POST /api/tags
Authorization: Bearer eyJhbGciOi...
Content-Type: application/json

{
  "content": "string, required — the note body to tag"
}
```

### Response — 200 OK

```json
{
  "tags": ["productivity", "meeting notes", "q3 planning"]
}
```

Tags are lowercase, deduplicated by Gemini's own output (not de-duplicated by the server), and
capped at 5 entries.

### Errors

Identical shape and causes to `/api/summarize` (see table above) — both routes share the same
`lib/gemini.ts` error normalization and `lib/auth.ts` auth check.

---

## Data access without a custom API (for reference)

Note CRUD is performed client-side against Supabase directly:

| Operation | Client call | Authorization |
|---|---|---|
| List my notes | `supabase.from("notes").select("*").order("created_at", ...)` | RLS: `auth.uid() = user_id` |
| Create a note | `supabase.from("notes").insert({...})` | RLS `with check` on insert |
| Update a note (edit / save summary / save tags) | `supabase.from("notes").update({...}).eq("id", id)` | RLS on update |
| Delete a note | `supabase.from("notes").delete().eq("id", id)` | RLS on delete |

These are documented here for completeness since they are the majority of the app's data
operations, even though they're not routes this codebase defines — they're PostgREST calls that
Supabase's RLS policies authorize.
