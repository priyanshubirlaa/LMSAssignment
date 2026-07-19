# Retrospective

**Repository**: https://github.com/priyanshubirlaa/LMSAssignment
**Live demo**: https://lms-assignment-three.vercel.app/

> Draft based on how this project actually went. Since this is meant to be a personal reflection,
> read it over and adjust anything that doesn't match your own experience before submitting.

**Original plan**: The initial goal was narrow and deliberately small — a notes app that could be
built and deployed for free, using Supabase for auth and Postgres, and Gemini for a single AI
feature (summarization). The intent was to prove out the full pipeline (auth → database → AI →
deployment) with the smallest possible feature set, rather than start broad and risk not finishing
any one part.

**Changes made**: The scope grew twice, both times for good reasons rather than scope creep for
its own sake. First, after hitting a real Gemini quota error, the fix wasn't just "handle this one
error" — it became a proper shared error-handling module plus a second AI feature (tag generation)
and supporting UI (search, edit, tag filters), since the same infrastructure was already in place.
Second, turning this into a course submission meant re-examining the project against a stricter
bar — writing the API documentation directly surfaced a real authorization gap that had gone
unnoticed through normal manual testing, which got fixed before being documented rather than
documented as a known issue.

**Challenges**: Two infrastructure quirks cost the most time: Supabase's direct-connect Postgres
host being IPv6-only (which fails silently in confusing ways depending on network configuration),
and Gemini's free-tier quota being an account-eligibility issue rather than a code bug, which
required treating it as a distinct, non-retryable error class instead of generic error handling.

**Learnings**: Dependency audits belong at the start of a project, not the end. Documentation is a
debugging tool, not just a deliverable — writing down what an endpoint's auth actually does forces
you to check rather than assume.

**Proud of**: shipping AI error handling that treats quota exhaustion as an expected, user-facing
state rather than a crash, and catching the missing auth check before it shipped instead of after.
