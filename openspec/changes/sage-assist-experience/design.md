## Context

The experience object currently stores `highlights` (string array of achievement bullets), `summary` (free-form role description), and `context_notes` (a catch-all text field for extra context). The `context_notes` field serves no clear purpose in the current UI and is used inconsistently.

The Sage Assist experience layer adds three AI-powered interactions on top of this data. Before those features can be built correctly, the notes field needs to be split into two clearly-owned fields: `user_notes` (user-authored, never touched by Sage) and `sage_notes` (Sage-generated output from the responsibility interview, freely overwritable by Sage).

Existing AI infrastructure in `server/utils/profile-experience-enhancer.ts` (Vercel AI SDK + AI Gateway, GPT-4o-mini, 10-second timeout via `Promise.race`) is the established pattern for all new AI utility functions.

## Goals / Non-Goals

**Goals:**
- Rename `context_notes` → `user_notes` cleanly across DB, transformer, type, endpoints, store, and components
- Add `sage_notes` as a Sage-exclusive write target
- Implement 3 new stateless AI endpoints using the existing AI Gateway pattern
- Deliver 3 frontend features in the experience detail view without disrupting the existing PATCH/form flow

**Non-Goals:**
- Prompt scripts or question flows for the responsibility interview — defined during implementation
- HERO nudge threshold scoring rules — defined during implementation
- Achievement enhancement trigger rules — defined during implementation
- Any changes to HERO stories, resume generation, or other profile sections
- Streaming AI responses — all Sage endpoints use standard `generateText` (non-streaming)

## Decisions

### Decision: Rename `context_notes` → `user_notes` rather than just adding `sage_notes`

**Choice**: Rename via Supabase migration.

**Rationale**: Keeping `context_notes` as the user field while adding `sage_notes` alongside it leaves an ambiguously named column in the DB forever. Renaming makes the ownership contract clear: `user_notes` is user-authored, `sage_notes` is AI-generated. The migration cost is low — `context_notes` is only referenced in the transformer, PATCH handler, type definition, store, and a small number of components.

**Alternative considered**: Keep `context_notes` for users and add `sage_notes`. Rejected because `context_notes` is a poor name for user-authored content and would need renaming later anyway.

### Decision: Two-call flow for achievement enhancement (questions then update)

**Choice**: First POST call returns questions; second POST call (with answers) returns the improved bullet.

**Rationale**: Mirrors the existing `gather-context` + `enhance-achievements` two-stage pattern. Allows the frontend to render questions and collect answers before making the improvement call. The alternative (single streaming call) is out of scope and adds client complexity.

**Alternative considered**: Single call that returns both questions and a speculative bullet in one shot. Rejected — quality of the improved bullet depends on the user's answers, not the original bullet alone.

### Decision: Single `/sage/interview` endpoint with a `mode` parameter

**Choice**: One endpoint with `mode: 'notes_help' | 'role_summary'` plus `conversationHistory[]`.

**Rationale**: Both modes share the same conversational turn structure (send message → receive next question or done). A single endpoint with a mode switch is simpler to maintain than two nearly-identical endpoints. The AI system prompt differs per mode but the request/response shape is identical.

**Alternative considered**: Two separate endpoints (`/sage/interview-notes` and `/sage/interview-summary`). Rejected — code duplication with no routing benefit.

### Decision: Nudge check is a stateless POST; nudge banner is a navigation CTA

**Choice**: Frontend calls the nudge check endpoint after the experience detail view loads. The banner is not dismissible — it presents a single call-to-action that navigates the user to start a new HERO story session with the current experience preloaded. Once the user navigates away, the banner is no longer shown in that page session. No dismissal state is persisted.

**Rationale**: The nudge's purpose is to route the user toward HERO story creation, not to surface information they can act on later. A dismiss action would let users ignore it indefinitely without taking action. If they don't want a HERO story, they simply ignore the banner; if they do, they click through. This avoids any need for a dismissal persistence column or user preference.

**Alternative considered**: Persist nudge dismissal per experience in the DB so it doesn't re-appear on future views. Deferred — can be added later if users find repeated nudges disruptive.

### Decision: `sage_notes` is overwritten (not appended) by the interview; read-only to the user

**Choice**: Each completed "notes help" interview replaces the full `sage_notes` content after user confirmation. `sage_notes` is never exposed as an editable input in any view.

**Rationale**: Sage's notes are a coherent block generated from a complete interview session. Appending from multiple sessions would produce a jumbled field. Keeping it read-only preserves the distinction between AI-generated content and the user's own `user_notes`. Users who want to change Sage's notes re-run the interview, which overwrites with a fresh result.

## API Contracts

### `POST .../sage/enhance-achievement`

**Request:**
```json
{
  "experience": {
    "title": "string",
    "employer": "string",
    "employmentType": "string"
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

### `POST .../sage/interview`

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
    "userNotes": "string | null",
    "sageNotes": "string | null"
  },
  "conversationHistory": [{ "role": "user | assistant", "content": "string" }]
}
```

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

### `POST .../sage/nudge-check`

**Request:**
```json
{
  "experience": {
    "id": "number",
    "title": "string",
    "employer": "string",
    "highlights": ["string"],
    "summary": "string | null",
    "userNotes": "string | null",
    "sageNotes": "string | null"
  }
}
```

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

## Field Mapping

| TypeScript (camelCase) | DB column (snake_case)  | Notes                             |
|------------------------|-------------------------|-----------------------------------|
| `userNotes`            | `user_notes`            | Renamed from `context_notes`      |
| `sageNotes`            | `sage_notes`            | New column, nullable TEXT         |

## Migration Plan

1. Write Supabase migration: `ALTER TABLE career_id.experience RENAME COLUMN context_notes TO user_notes; ALTER TABLE career_id.experience ADD COLUMN sage_notes TEXT;`
2. Update `shared/types/careerId.ts` — rename `contextNotes` → `userNotes`, add `sageNotes`
3. Update `server/utils/career-id-transformer.ts` — `transformExperience`
4. Update `server/api/.../experience/[id].patch.ts` — field mapping
5. Search and update all frontend references to `contextNotes` → `userNotes`
6. Build 3 new Sage endpoints + `server/utils/sage-experience-enhancer.ts`
7. Build 3 frontend Sage UI components

**Rollback**: If migration causes issues, rename `user_notes` back to `context_notes` and drop `sage_notes`. No data is lost.

## Risks / Trade-offs

- **10-second AI timeout** — Sage interview turns that require longer context may time out. Mitigation: keep conversation history to the last 3 turns (enforced max turn limit).
- **`sage_notes` overwrite** — Users who re-run the interview lose their previous Sage-generated notes. Mitigation: display a confirmation warning before overwrite.
- **Nudge check adds a network call on every experience detail view** — Could add latency. Mitigation: fire the call after initial render (non-blocking); cache result for the session.
- **`context_notes` rename is a breaking change** — Any client code or external integration relying on `contextNotes` will break. Mitigation: this field has no external consumers (internal SPA only); migration is atomic with code changes.

## Resolved Decisions

**Max interview turns: 3.** After 3 user turns, Sage SHALL wrap up and return `done: true` with the accumulated output. The endpoint tracks turn count from `conversationHistory.length` (user messages only).

**Nudge banner behavior.** The nudge banner is not a separate dismissal action — it is a call-to-action that navigates the user to start a new HERO story session with the current experience preloaded and prompted. The banner disappears once the user navigates away. No persistence of nudge state is needed. The nudge check result is cached for the current page session only.

**`sage_notes` is strictly read-only to the user.** It is never exposed as an editable input in any view. Users who want to change Sage's notes must re-run the responsibility interview (notes help mode), which overwrites `sage_notes` after confirmation.
