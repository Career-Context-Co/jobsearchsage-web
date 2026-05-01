## Context

The experience object currently stores `highlights` (string array of achievement bullets), `summary` (free-form role description), and `context_notes` (a catch-all text field for extra context). The `context_notes` field serves no clear purpose in the current UI and is used inconsistently.

The Sage Assist experience layer adds three AI-powered interactions on top of this data. User-authored extra context remains in Career ID as **`context_notes`** (API: `contextNotes`) — unchanged by this change. Sage-generated notes from the responsibility interview (`sage_notes` conceptually) are stored in JobSearchSage-owned **`sage_profile_notes`**, not on `career_id.experience`, so Career ID stays schema-stable and portable for multiple consumers.

Existing AI infrastructure in `server/utils/profile-experience-enhancer.ts` (Vercel AI SDK + AI Gateway, GPT-4o-mini, 10-second timeout via `Promise.race`) is the established pattern for all new AI utility functions.

## Goals / Non-Goals

**Goals:**

- Leave Career ID schema and Career ID experience field names unchanged (`context_notes` / `contextNotes`)
- Persist Sage-generated notes in `sage_profile_notes` with logical references to Career ID profile objects (experience rows identified by id + profile id)
- Implement stateless AI endpoints under `/api/ai/experience/` using the existing AI Gateway pattern
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

### Decision: Confirm notes help output via `PUT /api/ai/experience/:experienceId/sage-notes`

**Choice**: Interview returns `output` only; persisting Sage notes is a separate explicit `PUT` after user confirmation. Role summary confirmation continues to use `PATCH .../career-id/.../experience/:id` with `summary`.

**Rationale**: Writes stay in the owning store — JSS for Sage notes, Career ID for `summary` and `highlights`.

### Decision: Nudge check is a stateless POST; nudge banner is a navigation CTA

**Choice**: Frontend calls the nudge check endpoint after the experience detail view loads. The banner is not dismissible — it presents a single call-to-action that navigates the user to start a new HERO story session with the current experience preloaded. Once the user navigates away, the banner is no longer shown in that page session. No dismissal state is persisted.

**Rationale**: The nudge's purpose is to route the user toward HERO story creation, not to surface information they can act on later. A dismiss action would let users ignore it indefinitely without taking action. If they don't want a HERO story, they simply ignore the banner; if they do, they click through. This avoids any need for a dismissal persistence column or user preference.

**Alternative considered**: Persist nudge dismissal per experience in the DB so it doesn't re-appear on future views. Deferred — can be added later if users find repeated nudges disruptive.

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

`sageNotes` in the request body is optional context — sourced from `GET .../sage-notes` or empty if none.

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
    "signal": "string",
    "context": "string"
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

### `GET /api/ai/experience/:experienceId/sage-notes`

**Query:** `profileId` required (validates access to the Career ID profile).

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

### `PUT /api/ai/experience/:experienceId/sage-notes`

**Request:**

```json
{
  "profileId": "string",
  "content": "string",
  "metadata": {}
}
```

Upserts `sage_profile_notes` for `target_type: 'experience'`, `target_id: experienceId`, `note_type: 'sage_notes'`.

**Response:** success with saved row metadata (implementation-defined).

## Field Mapping

| Concept              | Career ID (`experience`)       | JobSearchSage (`sage_profile_notes`)        |
|----------------------|--------------------------------|---------------------------------------------|
| User-authored notes  | `context_notes` / `contextNotes` | —                                       |
| Sage-generated notes | — (not stored on experience)   | `content` where `note_type` = `sage_notes` |

| TypeScript (camelCase) | Source                                      |
|------------------------|---------------------------------------------|
| `contextNotes`         | `career_id.experience.context_notes` (unchanged) |
| `sageNotes` (UI/API)   | Loaded/saved via `/api/ai/experience/.../sage-notes`, backed by `sage_profile_notes` |

## Migration Plan

1. Supabase migration (JobSearchSage only): create `sage_profile_notes` + indexes + RLS policies
2. Implement `/api/ai/experience/*` endpoints + `sage_profile_notes` persistence + `server/utils/sage-experience-enhancer.ts`
3. Build frontend Sage UI components and wire sage-notes fetch/put

**Rollback (Career ID):** Not applicable — no Career ID migrations in this change.

**Rollback (JobSearchSage):** Drop `sage_profile_notes` table only if no production data to preserve.

## Risks / Trade-offs

- **10-second AI timeout** — Sage interview turns that require longer context may time out. Mitigation: keep conversation history to the last 3 turns (enforced max turn limit).
- **Sage notes overwrite** — Users who confirm a new interview lose the previous Sage-generated notes row content for that experience. Mitigation: display a confirmation warning before overwrite.
- **Nudge check adds a network call on every experience detail view** — Could add latency. Mitigation: fire the call after initial render (non-blocking); cache result for the session.
- **Cross-store reads** — Experience detail must load Career ID experience plus `GET .../sage-notes` for read-only Sage section. Mitigation: parallel fetch; handle missing sage-notes as empty.

## Resolved Decisions

**Max interview turns: 3.** After 3 user turns, Sage SHALL wrap up and return `done: true` with the accumulated output. The endpoint tracks turn count from `conversationHistory.length` (user messages only).

**Nudge banner behavior.** The nudge banner is not a separate dismissal action — it is a call-to-action that navigates the user to start a new HERO story session with the current experience preloaded and prompted. The banner disappears once the user navigates away. No persistence of nudge state is needed. The nudge check result is cached for the current page session only.

**Sage notes are strictly read-only to the user in the UI.** They are never exposed as an editable input. Users change Sage notes only by re-running the responsibility interview (notes help mode) and confirming, which `PUT`s replacement content to `sage_profile_notes`.
