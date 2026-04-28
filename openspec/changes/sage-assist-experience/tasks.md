## PHASE 1: DATABASE

### DB-001: Rename context_notes and add sage_notes
- [ ] Create `deliverables/migrations/022_rename_context_notes_to_user_notes.sql` — `ALTER TABLE career_id.experience RENAME COLUMN context_notes TO user_notes;`
- [ ] Create `deliverables/migrations/023_add_sage_notes.sql` — `ALTER TABLE career_id.experience ADD COLUMN sage_notes TEXT;`
- [ ] Apply both migrations to Supabase (local dev + staging)
- [ ] Verify existing `context_notes` data is preserved under `user_notes`

**Dependencies:** None
**Success criteria:** `career_id.experience` has `user_notes` (renamed) and `sage_notes` (new, nullable) columns. No data loss.

---

## PHASE 2: BACKEND

### BE-001: Field rename — type, transformer, PATCH endpoint
- [ ] Update `shared/types/careerId.ts` — rename `contextNotes` → `userNotes`, add `sageNotes?: string | null` on `Experience` interface
- [ ] Update `server/utils/career-id-transformer.ts` — rename `contextNotes` mapping to `userNotes`, add `sageNotes: data.sage_notes ?? null` in `transformExperience`
- [ ] Update `server/api/career-id/profile/[profileId]/experience/[id].patch.ts` — rename `context_notes` → `user_notes` in `updateData`, add `if (body.sageNotes !== undefined) updateData.sage_notes = body.sageNotes`

**Dependencies:** DB-001
**Success criteria:** `PATCH` on an experience entry accepts `userNotes` and `sageNotes`, persists correctly, and returns both fields in the response.

---

### BE-002: Achievement enhancement endpoint
- [ ] Create `server/utils/sage-experience-enhancer.ts` — scaffold the AI utility file with `generateText` + AI Gateway pattern (matching `profile-experience-enhancer.ts`); add `generateAchievementQuestions(experience, bullet)` and `generateImprovedBullet(experience, bullet, answers)` functions
- [ ] Create `server/api/career-id/profile/[profileId]/experience/[id]/sage/enhance-achievement.post.ts`
  - Phase detection: if `answers` is absent/empty → call `generateAchievementQuestions`, return `{ phase: 'questions', questions }`
  - If `answers` provided → call `generateImprovedBullet`, return `{ phase: 'result', improvedBullet }`
  - Validate `experience` and `bullet` required; return `VALIDATION_ERROR` if missing
  - Wrap AI errors with structured error response (mirror `XYZEnhancementError` pattern)

**Dependencies:** BE-001 (for `Experience` type)
**Success criteria:** First call with a bullet returns questions. Second call with bullet + answers returns an improved bullet string.

---

### BE-003: Responsibility interview endpoint
- [ ] Add `conductInterview(mode, experience, conversationHistory)` to `server/utils/sage-experience-enhancer.ts`
  - Notes help mode: system prompt focused on extracting role context for `sage_notes`
  - Role summary mode: system prompt focused on generating a `summary`
  - Returns `{ done: false, message }` or `{ done: true, output }` based on turn count (≥3 user turns → wrap up)
- [ ] Create `server/api/career-id/profile/[profileId]/experience/[id]/sage/interview.post.ts`
  - Validate `mode` (`notes_help` | `role_summary`), `experience`, `conversationHistory` required
  - Call `conductInterview`, return result
  - Handle AI errors with structured error response

**Dependencies:** BE-002 (shared utility file)
**Success criteria:** Ongoing turns return `{ done: false, message }`. After 3 user turns, returns `{ done: true, output }`.

---

### BE-004: HERO nudge signal detection endpoint
- [ ] Add `detectHeroSignal(experience)` to `server/utils/sage-experience-enhancer.ts`
  - Reads `highlights`, `summary`, `userNotes`, `sageNotes`
  - Returns `{ nudge: true, signal, context }` or `{ nudge: false }`
  - Returns `{ nudge: false }` immediately if all content fields are empty
- [ ] Create `server/api/career-id/profile/[profileId]/experience/[id]/sage/nudge-check.post.ts`
  - Validate `experience` required
  - Call `detectHeroSignal`, return result
  - Handle AI errors

**Dependencies:** BE-002 (shared utility file)
**Success criteria:** Endpoint returns `nudge: false` for empty experience; returns `nudge: true` with signal summary for experience with strong content.

---

### BE-005: Postman collection
- [ ] Create `deliverables/sage-assist-experience-api.postman_collection.json` covering all 3 new Sage endpoints
  - Happy path: enhance-achievement (questions phase), enhance-achievement (result phase), interview (ongoing turn), interview (completion), nudge-check (nudge true), nudge-check (nudge false)
  - Error cases: missing `bullet`, missing `mode`, missing `experience`, invalid `mode` value
  - Pre-configure `{{baseUrl}}`, `{{profileId}}`, `{{experienceId}}` variables

**Dependencies:** BE-002, BE-003, BE-004
**Success criteria:** Collection runs clean against local dev server with all tests passing.

---

## PHASE 3: FRONTEND

### FE-001: Field rename — store and existing components
- [ ] Update `app/stores/careerIDStore.ts` — rename all `contextNotes` → `userNotes` references
- [ ] Update `app/components/profile/EnhancementPane.vue` — rename `contextNotes` → `userNotes`
- [ ] Update `app/components/profile/EnhancementContextReview.vue` — rename `contextNotes` → `userNotes`
- [ ] Run `pnpm typecheck` — confirm no remaining `contextNotes` references

**Dependencies:** BE-001
**Success criteria:** `pnpm typecheck` passes. No TypeScript errors on the renamed field.

---

### FE-002: Achievement enhancement UI
- [ ] Create `app/components/profile/sage/SageAchievementEnhancer.vue`
  - Accepts props: `experience` (title, employer, employmentType), `bullet` (string), `experienceId`
  - State machine: `idle` → `loading-questions` → `answering` → `loading-result` → `review` → `idle`
  - Renders Sage's questions with text input per question
  - On submit: calls enhance-achievement endpoint (result phase), displays `improvedBullet` alongside original
  - Emits `confirm(improvedBullet)` and `discard` events; parent handles PATCH
  - Shows error state if endpoint fails
- [ ] Wire into experience detail view — add Sage enhance button on each `highlights` entry; mount `SageAchievementEnhancer` inline below the bullet on activation

**Dependencies:** FE-001, BE-002
**Success criteria:** Can trigger enhancement on a bullet, answer questions, see improved bullet, confirm (saves via store PATCH) or discard.

---

### FE-003: Responsibility interview UI
- [ ] Create `app/components/profile/sage/SageInterviewPanel.vue`
  - Accepts props: `mode` (`notes_help` | `role_summary`), `experience`, `experienceId`
  - Renders message thread (user + Sage turns)
  - On mount: fires first interview turn with empty `conversationHistory`
  - Each user message appends to `conversationHistory` and calls interview endpoint
  - On `done: true`: displays output for review with confirm/discard actions
  - Confirm for `notes_help` → store PATCH with `sageNotes` — if `sageNotes` already exists, show overwrite confirmation modal first
  - Confirm for `role_summary` → store PATCH with `summary` — if `summary` already exists, show overwrite confirmation modal first
  - Emits `close` when done or discarded
- [ ] Wire into experience detail view — add two entry points: "Help me write my notes" (mode: notes_help) and "Describe this role" (mode: role_summary); open `SageInterviewPanel` as a slide-over

**Dependencies:** FE-001, BE-003
**Success criteria:** Full interview flow works for both modes. Overwrite confirmation appears when field already has content. Output saves correctly to the right field.

---

### FE-004: HERO nudge banner
- [ ] Create `app/components/profile/sage/SageHeroNudge.vue`
  - Accepts props: `signal` (string), `context` (string), `experienceId`
  - Displays non-blocking banner with signal summary and a single CTA button
  - CTA navigates to HERO story creation with `sourceExperienceId` preloaded (use existing `navigateTo` + HERO story route)
  - Banner is hidden after CTA click (component-level state, no persistence)
- [ ] Wire into experience detail view — on mount, call nudge-check endpoint; if `nudge: true`, render `SageHeroNudge`; cache result in component state so re-renders don't re-trigger the call

**Dependencies:** FE-001, BE-004
**Success criteria:** Nudge banner appears when endpoint returns `nudge: true`. CTA navigates to HERO story creation with experience preloaded. Does not re-trigger after CTA is clicked within the same view session.

---

### FE-005: Display sage_notes in experience detail view
- [ ] Update experience detail view to display `sageNotes` as a read-only section labeled "Sage Notes" — only rendered when `sageNotes` is non-empty
- [ ] Ensure `sageNotes` is never rendered as an editable input in any view
- [ ] Display `userNotes` (renamed from `contextNotes`) in its existing editable position

**Dependencies:** FE-001
**Success criteria:** `sageNotes` content is visible and read-only. `userNotes` is editable as before. No form field allows direct edit of `sageNotes`.
