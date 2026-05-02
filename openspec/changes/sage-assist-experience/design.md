## Context

The experience object currently stores `highlights` (string array of achievement bullets), `summary` (free-form role description), and `context_notes` (a catch-all text field for extra context). The `context_notes` field serves no clear purpose in the current UI and is used inconsistently.

The Sage Assist experience layer adds three AI-powered interactions on top of this data. User-authored extra context remains in Career ID as **`context_notes`** (API: `contextNotes`) — unchanged by this change. Sage-generated notes from the responsibility interview (`sage_notes` conceptually) are stored in JobSearchSage-owned **`sage_profile_notes`**, not on `career_id.experience`, so Career ID stays schema-stable and portable for multiple consumers.

Existing AI infrastructure in `server/utils/profile-experience-enhancer.ts` (Vercel AI SDK + AI Gateway, GPT-4o-mini, 10-second timeout via `Promise.race`) is the established pattern for all new AI utility functions.

## Goals / Non-Goals

**Goals:**

- Leave Career ID schema and Career ID experience field names unchanged (`context_notes` / `contextNotes`)
- Persist Sage-generated notes in `sage_profile_notes` with logical references to Career ID profile objects (experience rows identified by id + profile id)
- Implement stateless AI endpoints under `/api/ai/experience/` and `/api/ai/sage/` using the existing AI Gateway pattern
- Implement `GET`/`PUT` sage-notes handlers that read/write `sage_profile_notes`
- Deliver 3 frontend features in the experience detail view without putting Sage columns on Career ID PATCH payloads

**Non-Goals:**

- Prompt scripts or question flows for the responsibility interview — defined during implementation
- HERO nudge threshold scoring rules — defined during implementation
- Achievement enhancement trigger rules — defined during implementation
- Any changes to HERO stories, resume generation, or other profile sections
- Streaming AI responses — all Sage endpoints use standard `generateText` (non-streaming)
- Database FK from JobSearchSage to Career ID — use logical keys (`profile_id`, `target_type`, `target_id`) only
- Career ID schema migrations — any rename of `context_notes` is out of scope here and belongs to the Career ID service if desired later

## Decisions

### Decision: Store Sage-generated notes in `sage_profile_notes` (JobSearchSage schema), not on `career_id.experience`

**Choice**: New table `sage_profile_notes` with logical references (`user_id`, `profile_id`, `target_type`, `target_id`, `note_type`, `content`, …). Unique constraint on `(user_id, target_type, target_id, note_type)` for overwrite semantics.

**Rationale**: Career ID will be consumed by multiple apps; coupling Sage-specific AI persistence to the Career ID schema forces downstream migrations and pollutes the portable profile model. JobSearchSage owns Sage artifacts; Career ID owns canonical profile fields (`context_notes`, `summary`, `highlights`, etc.).

**Alternative considered**: Add `sage_notes` column on `career_id.experience`. Rejected — conflicts with multi-app Career ID API strategy.

### Decision: Two-call flow for achievement enhancement (questions then update)

**Choice**: First POST call returns questions; second POST call (with answers) returns the improved bullet.

**Rationale**: Mirrors the existing `gather-context` + `enhance-achievements` two-stage pattern. Allows the frontend to render questions and collect answers before making the improvement call. The alternative (single streaming call) is out of scope and adds client complexity.

**Alternative considered**: Single call that returns both questions and a speculative bullet in one shot. Rejected — quality of the improved bullet depends on the user's answers, not the original bullet alone.

### Decision: Single `/api/ai/experience/interview` endpoint with a `mode` parameter

**Choice**: One endpoint with `mode: 'notes_help' | 'role_summary'` plus `conversationHistory[]`.

**Rationale**: Both modes share the same conversational turn structure (send message → receive next question or done). A single endpoint with a mode switch is simpler to maintain than two nearly-identical endpoints. The AI system prompt differs per mode but the request/response shape is identical.

**Alternative considered**: Two separate endpoints (`/interview-notes` and `/interview-summary`). Rejected — code duplication with no routing benefit.

### Decision: Confirm notes help output via `PUT /api/ai/sage/notes`

**Choice**: Interview returns `output` only; persisting Sage notes is a separate explicit `PUT` after user confirmation. Role summary confirmation continues to use `PATCH .../career-id/.../experience/:id` with `summary`.

**Rationale**: Writes stay in the owning store — JSS for Sage notes, Career ID for `summary` and `highlights`.

### Decision: Persist HERO nudges as experience-linked story candidates

**Choice**: `POST /api/ai/experience/hero-nudge` persists a nudge candidate when a strong HERO signal is detected. A nudge is keyed by `profile_id`, `experience_id`, and a stable content hash of the saved experience snapshot. It stores short second-person copy (`signal`, `context`), lifecycle status, `accepted_at`, `declined_at`, and optional links to the created HERO story and discovery session.

**Rationale**: A nudge is not just a transient message; it is a story candidate attached to an experience. Persisting it lets the app avoid re-running AI for unchanged content, track whether the user accepted or declined the suggestion, avoid showing declined suggestions repeatedly, and resume in-progress nudge story sessions.

**Alternative considered**: Keep nudge checks stateless and page-session-only. Rejected — this loses accepted/declined analytics, creates repeated AI calls, and makes the flow awkward because the user can be dropped into HERO without durable context.

### Decision: Nudge acceptance starts a HERO discovery session, not a moments flow

**Choice**: Accepting a nudge starts or resumes a `hero_discovery_sessions` row with `session_type='experience_nudge_story'`. The session references the source experience, persisted nudge, and partial HERO story using first-class columns. It asks focused HERO story questions and creates/updates a partial HERO story. It does not create `hero_moments`.

**Rationale**: The existing HERO discovery session table is useful for long-running AI conversation state, but the current moment-capture shape (`captured_moments`, `moment_count`) does not match a nudge that already points at a specific experience. A typed discovery session preserves the reusable conversation container while making the new path explicit.

**Alternative considered**: Continue using hero moments as an invisible intermediate data structure. Rejected — moments are being phased out as a user-facing concept, and hiding them as internal plumbing would create naming drift and confusing lifecycle behavior.

### Decision: Sage notes row is overwritten (not appended) by confirmed interview; read-only to the user

**Choice**: Each confirmed "notes help" interview replaces the content for that `(user_id, target_type, target_id, note_type)` row. Sage notes are never exposed as an editable input in any view.

**Rationale**: Sage's notes are a coherent block from one interview session. Appending would produce a jumbled field. Users who want different Sage notes re-run the interview and confirm overwrite.

## API Contracts

### `POST /api/ai/experience/enhance-achievement`

**Request:**

```json
{
  "experience": {
    "title": "string",
    "employer": "string",
    "summary": "string | null (optional)"
  },
  "bullet": "string",
  "answers": [{ "questionId": "string", "answer": "string" }]
}
```

**Response (questions phase — `answers` omitted or empty):**

```json
{
  "success": true,
  "data": {
    "phase": "questions",
    "questions": [{ "id": "string", "text": "string" }]
  }
}
```

**Response (improvement phase — `answers` provided):**

```json
{
  "success": true,
  "data": {
    "phase": "result",
    "improvedBullet": "string"
  }
}
```

### `POST /api/ai/experience/interview`

**Request:**

```json
{
  "mode": "notes_help | role_summary",
  "experience": {
    "title": "string",
    "employer": "string",
    "employmentType": "string",
    "summary": "string | null",
    "highlights": ["string"],
    "contextNotes": "string | null",
    "sageNotes": "string | null"
  },
  "conversationHistory": [{ "role": "user | assistant", "content": "string" }]
}
```

`sageNotes` in the request body is optional context — sourced from `GET /api/ai/sage/notes?...` or empty if none.

**Response (ongoing):**

```json
{
  "success": true,
  "data": {
    "done": false,
    "message": "string"
  }
}
```

**Response (complete):**

```json
{
  "success": true,
  "data": {
    "done": true,
    "output": "string"
  }
}
```

### `POST /api/ai/experience/hero-nudge`

**Request:**

```json
{
  "experience": {
    "id": "string",
    "title": "string",
    "employer": "string",
    "highlights": ["string"],
    "summary": "string | null",
    "contextNotes": "string | null",
    "sageNotes": "string | null"
  }
}
```

`sageNotes` SHOULD be populated from `sage_profile_notes` when available so nudge analysis includes Sage-generated context.

**Response:**

```json
{
  "success": true,
  "data": {
    "nudge": true,
    "id": "string",
    "experienceId": 123,
    "contentHash": "string",
    "signal": "string",
    "context": "string",
    "status": "active",
    "acceptedAt": "string | null",
    "declinedAt": "string | null",
    "heroStoryId": "string | null",
    "discoverySessionId": 123
  }
}
```

or

```json
{
  "success": true,
  "data": { "nudge": false }
}
```

The endpoint SHALL reuse an existing active nudge for the same `(profile_id, experience_id, content_hash)` and SHALL mark older active nudges stale when the experience content hash changes.

### `POST /api/ai/experience/hero-nudge/:id/decline`

Marks a persisted HERO nudge declined.

**Response:** success with `declinedAt`.

### `POST /api/ai/hero-discovery/nudge/start`

**Request:**

```json
{
  "profileId": "string",
  "nudgeId": "string",
  "experience": {
    "id": 123,
    "title": "string",
    "employer": "string",
    "highlights": ["string"],
    "summary": "string | null",
    "contextNotes": "string | null",
    "sageNotes": "string | null"
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "sessionId": 123,
    "heroStoryId": "hero_...",
    "message": "string"
  }
}
```

This endpoint SHALL set `accepted_at` on the nudge, create or reuse a linked partial HERO story, and create or reuse a `hero_discovery_sessions` row with `session_type='experience_nudge_story'`.

### `POST /api/ai/hero-discovery/nudge/continue`

Continues a nudge-driven HERO story discovery session. The response SHALL include the next assistant message and MAY include structured HERO story field updates.

### `POST /api/ai/hero-discovery/nudge/end`

Completes a nudge-driven HERO story discovery session, marks the session complete, marks the nudge converted, and returns the linked `heroStoryId`.

### `GET /api/ai/sage/notes`

**Query:** `profileId`, `targetType`, `targetId` required; `noteType` optional (defaults to `sage_notes`).

**Response:**

```json
{
  "success": true,
  "data": {
    "content": "string | null",
    "updatedAt": "string | null"
  }
}
```

### `PUT /api/ai/sage/notes`

**Request:**

```json
{
  "profileId": "string",
  "targetType": "string",
  "targetId": "string",
  "noteType": "string (optional, defaults to sage_notes)",
  "content": "string",
  "metadata": {}
}
```

Upserts `sage_profile_notes` for the provided `(targetType, targetId, noteType)` logical key.

**Response:** success with saved row metadata (implementation-defined).

## Field Mapping

| Concept              | Career ID (`experience`)       | JobSearchSage (`sage_profile_notes`)        |
|----------------------|--------------------------------|---------------------------------------------|
| User-authored notes  | `context_notes` / `contextNotes` | —                                       |
| Sage-generated notes | — (not stored on experience)   | `content` where `note_type` = `sage_notes` |

| TypeScript (camelCase) | Source                                      |
|------------------------|---------------------------------------------|
| `contextNotes`         | `career_id.experience.context_notes` (unchanged) |
| `sageNotes` (UI/API)   | Loaded/saved via `/api/ai/sage/notes`, backed by `sage_profile_notes` |

## HERO Nudge Data Model

### `hero_story_nudges`

JobSearchSage-owned table for persisted story candidates:

- `id`
- `profile_id`
- `experience_id`
- `content_hash`
- `signal`
- `context`
- `status`: `active | accepted | declined | converted | stale`
- `accepted_at`
- `declined_at`
- `hero_story_id`
- `discovery_session_id`
- timestamps

### `hero_discovery_sessions`

Keep the existing table as the durable AI conversation container, but add first-class fields for session type and links:

- `session_type`: `moment_discovery | experience_nudge_story`
- `source_type`: `experience`
- `source_experience_id`
- `hero_nudge_id`
- `hero_story_id`
- `progress_count`

`moment_count` remains for legacy moment discovery only. Nudge-driven sessions SHALL use `progress_count` and SHALL NOT write `captured_moments` or `moment_count`.

## Migration Plan

1. Supabase migration (JobSearchSage only): create `sage_profile_notes` + indexes + RLS policies
2. Supabase migration: create `hero_story_nudges`; add nudge/story session columns to `hero_discovery_sessions`; keep `moment_count` for legacy moment discovery only
3. Implement `/api/ai/experience/*` endpoints + `sage_profile_notes` persistence + `server/utils/sage-experience-enhancer.ts`
4. Implement persisted HERO nudge utilities and nudge-driven discovery endpoints
5. Build frontend Sage UI components and wire sage-notes fetch/put
6. Update HERO discovery panel presentation to use the same panel pattern as the HERO story session and support nudge/story mode

**Rollback (Career ID):** Not applicable — no Career ID migrations in this change.

**Rollback (JobSearchSage):** Drop `sage_profile_notes` and `hero_story_nudges` only if no production data to preserve. Remove added `hero_discovery_sessions` columns only if no nudge/story sessions exist.

## Risks / Trade-offs

- **10-second AI timeout** — Sage interview turns that require longer context may time out. Mitigation: keep conversation history to the last 3 turns (enforced max turn limit).
- **Sage notes overwrite** — Users who confirm a new interview lose the previous Sage-generated notes row content for that experience. Mitigation: display a confirmation warning before overwrite.
- **Nudge check adds an AI/provider call after experience saves** — Could add latency or cost. Mitigation: persist nudges by content hash and reuse active nudges for unchanged experience content.
- **Discovery session table now has mixed modes** — Legacy moment discovery and nudge story discovery have different semantics. Mitigation: use `session_type` and first-class linking columns; only use `moment_count` for `moment_discovery`.
- **Cross-store reads** — Experience detail must load Career ID experience plus `GET /api/ai/sage/notes` for read-only Sage section. Mitigation: parallel fetch; handle missing sage-notes as empty.

## Resolved Decisions

**Max interview turns: 3.** After 3 user turns, Sage SHALL wrap up and return `done: true` with the accumulated output. The endpoint tracks turn count from `conversationHistory.length` (user messages only).

**Nudge banner behavior.** The nudge banner is a persisted story candidate. Accepting it sets `accepted_at`, starts or resumes a nudge-driven HERO discovery session, and links to a partial HERO story. Declining it sets `declined_at` so the app can avoid repeatedly showing the same suggestion while the content hash is unchanged.

**Sage notes are strictly read-only to the user in the UI.** They are never exposed as an editable input. Users change Sage notes only by re-running the responsibility interview (notes help mode) and confirming, which `PUT`s replacement content to `sage_profile_notes`.
