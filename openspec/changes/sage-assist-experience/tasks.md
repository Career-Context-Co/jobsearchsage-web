## PHASE 1: DATABASE

### DB-001: Create sage_profile_notes (JobSearchSage schema)

- [x] Create `deliverables/migrations/023_create_sage_profile_notes.sql` — table `sage_profile_notes` with columns: `id`, `user_id`, `profile_id`, `target_type`, `target_id`, `note_type`, `content`, `metadata`, timestamps; `UNIQUE (user_id, target_type, target_id, note_type)`; indexes for lookup by `(user_id, profile_id, target_type, target_id)`
- [x] Add RLS policies consistent with other JobSearchSage user-scoped tables
- [x] Apply migration to Supabase (local dev + staging)

**Dependencies:** None  
**Success criteria:** Table exists; authenticated user can read/write own rows only; logical keys only (no FK to Career ID).

**Note:** No Career ID (`career_id`) schema migrations as part of this change — `context_notes` on `experience` stays as-is.

---

## PHASE 2: BACKEND

### BE-001: sage_profile_notes persistence helper

- [x] Add server utilities (e.g. `server/utils/sage-profile-notes.ts`) — `getSageNotesForExperience`, `upsertSageNotesForExperience` using Supabase client against `sage_profile_notes`

**Dependencies:** DB-001  
**Success criteria:** Can read/write by `(user_id, profile_id, target_type='experience', target_id, note_type='sage_notes')`.

---

### BE-002: Achievement enhancement endpoint

- [x] Create `server/utils/sage-experience-enhancer.ts` — scaffold with `generateText` + AI Gateway pattern (matching `profile-experience-enhancer.ts`); add `generateAchievementQuestions(experience, bullet)` and `generateImprovedBullet(experience, bullet, answers)`
- [x] Create `server/api/ai/experience/enhance-achievement.post.ts`
  - Phase detection: if `answers` is absent/empty → `generateAchievementQuestions`, return `{ phase: 'questions', questions }`
  - If `answers` provided → `generateImprovedBullet`, return `{ phase: 'result', improvedBullet }`
  - Validate `experience` (`employer`, `title`, optional `summary`) and `bullet` required; return `VALIDATION_ERROR` if missing
  - Wrap AI errors with structured error response (mirror `XYZEnhancementError` pattern)
- [x] Upgrade achievement questions to the shared Sage question UI contract
  - Questions now support `single_choice` and `multi_choice`
  - Multi-select answers are accepted and formatted for final bullet generation
  - Prompt and parser bias measurable impact/tools/stakeholders/outcomes questions toward `multi_choice`

**Dependencies:** None  
**Success criteria:** First call with a bullet returns typed structured questions. Second call with bullet + answers returns an improved bullet string.

---

### BE-003: Responsibility interview endpoint

- [x] Add `conductInterview(mode, experience, conversationHistory)` to `server/utils/sage-experience-enhancer.ts`
  - Notes help mode: prompt targets Sage notes output (persisted separately via sage-notes PUT)
  - Role summary mode: prompt targets `summary` text (legacy free-text endpoint only)
  - Returns `{ done: false, message }` or `{ done: true, output }` based on turn count (≥3 user turns → wrap up)
- [x] Create `server/api/ai/experience/interview.post.ts`
  - Validate `mode` (`notes_help` | `role_summary`), `experience`, `conversationHistory`
  - Call `conductInterview`, return result
  - Handle AI errors with structured error response
- [x] Add structured responsibility question engine
  - Add `conductResponsibilityInterview(mode, experience, answers)` to `server/utils/sage-experience-enhancer.ts`
  - Create `server/api/ai/experience/responsibility.post.ts`
  - Return `{ done: false, questions }` or `{ done: true, output }`
  - Support `free_form`, `single_choice`, and `multi_choice`
  - Increase Sage experience AI timeout to 20 seconds
- [x] Add response interceptor contract layer
  - Create `server/utils/interceptors/sage-question-engine-interceptor.ts`
  - Extract, validate, normalize, and repair malformed model JSON before frontend rendering
  - Keep repair prompt/model separate from the main domain prompt

**Dependencies:** BE-002  
**Success criteria:** Responsibility flow uses typed question batches instead of free-text chat; invalid model output is blocked or repaired before reaching UI.

---

### BE-004: HERO nudge signal detection endpoint

- [x] Add `detectHeroSignal(experience)` to `server/utils/sage-experience-enhancer.ts`
  - Reads `highlights`, `summary`, `contextNotes`, `sageNotes` (request snapshot)
  - Returns `{ nudge: true, signal, context }` or `{ nudge: false }`
  - Returns `{ nudge: false }` immediately if all content fields are empty
- [x] Create `server/api/ai/experience/hero-nudge.post.ts`
  - Validate `experience` required
  - Call `detectHeroSignal`, return result
  - Handle AI errors

**Dependencies:** BE-002  
**Success criteria:** Endpoint returns `nudge: false` for empty experience; returns `nudge: true` with signal summary for experience with strong content.

---

### BE-005: Sage notes read/write endpoints

- [x] Create `server/api/ai/sage/notes.get.ts` — query: `profileId`, `targetType`, `targetId`, optional `noteType`; return current note `content` or null
- [x] Create `server/api/ai/sage/notes.put.ts` — body: `profileId`, `targetType`, `targetId`, `content`, optional `noteType`/`metadata`; upsert `sage_profile_notes`

**Dependencies:** BE-001  
**Success criteria:** Frontend can load read-only Sage notes for display and persist after notes-help interview confirmation.


## PHASE 3: FRONTEND

### FE-001: Load Sage notes for experience detail

- [x] Extend `app/stores/sageAIStore.ts` — fetch `GET /api/ai/sage/notes?profileId=...&targetType=experience&targetId=...&noteType=sage_notes` and expose reactive Sage notes state (e.g. content + updatedAt keyed by `profileId` + `targetId`) for the experience detail view
- [x] Call from experience detail (parallel with profile data) via store action, not a composable

**Dependencies:** BE-005  
**Success criteria:** Read-only Sage notes available from `sageAIStore` without putting them on the Career ID `Experience` model in `careerIDStore`.

---

### FE-002: Achievement enhancement UI

- [x] Create `app/components/profile/sage/SageAchievementEnhancer.vue`
  - Accepts props: `experience` (title, employer, summary), `bullet` (string), `experienceId`, `profileId`
  - State machine: `idle` → `loading-questions` → `answering` → `loading-result` → `review` → `idle`
  - Calls `POST /api/ai/experience/enhance-achievement`
  - Emits `confirm(improvedBullet)` and `discard`; parent handles Career ID PATCH for `highlights`
- [x] Reuse shared `SageQuestionView` in achievement enhancement
  - Displays `Choose one` / `Select all that apply` below each question
  - Supports multi-select, single-select with explicit Continue, custom "Other", Back navigation, and answer restoration
- [x] Create `app/components/profile/sage/SageExperienceSession.vue` — multi-step session panel (mirrors HeroStorySession)
  - `picker` view: 2-col grid — "Achievement Bullet" and "Responsibility"
  - `bullet-picker` view: lists the experience's `highlights` as selectable cards
  - `enhancing` view: renders `SageAchievementEnhancer` for the chosen bullet
  - Emits `confirm(bulletIndex, improvedBullet)`, `applySummary(summary)`, and `close`
- [x] Wire into experience edit card — single "Get AI Help" button (top-right header), opens `SageExperienceSession` in a `USlideover` (`:overlay="false" :modal="false" :inset="true"`, same config as HERO story AI panel); no per-bullet buttons

**Dependencies:** BE-002  
**Success criteria:** Enhancement flow works; confirm saves bullet via store PATCH to Career ID.

---

### FE-003: Responsibility interview UI

- [x] Create `app/components/profile/sage/SageInterviewPanel.vue`
  - Props: `mode`, `experience`, `experienceId`, `profileId`
  - Calls `POST /api/ai/experience/responsibility` with `sageNotes` in payload when loaded from FE-001 (optional context)
  - Uses `SageQuestionView` for `free_form`, `single_choice`, and `multi_choice`
  - Supports Back navigation within the current question batch and restores previous answers
  - On `done: true` for `notes_help`: confirm → `PUT /api/ai/sage/notes` with `targetType=experience` + `targetId=experienceId` — if existing content, overwrite confirmation modal first
  - On `done: true` for `role_summary`: confirm → emit generated text to the open experience edit card summary field; user reviews/edits and saves through the normal card form
- [x] Wire entry point on experience detail — the "Responsibility" card in `SageExperienceSession` picker activates `SageInterviewPanel` as a sub-view within the same `USlideover` (`:overlay="false" :modal="false" :inset="true"`); no separate drawer

**Dependencies:** FE-001, BE-003, BE-005  
**Success criteria:** Notes help persists via sage-notes API; role summary is copied into the open summary field and only persists when the user saves the experience card.

---

### FE-004: HERO nudge banner

- [x] Create `app/components/profile/sage/SageHeroNudge.vue` — props: `signal`, `context`, `experienceId`
  - CTA creates a linked partial HERO story and opens the HERO story session directly
- [x] After the user adds or saves an experience, or saves an AI-enhanced achievement, run `POST /api/ai/experience/hero-nudge` with the latest experience snapshot and cache result for the page session
  - Include summary, achievements, and Career ID `contextNotes` so the nudge reflects what the user just edited

**Dependencies:** FE-001, BE-004  
**Success criteria:** Nudge uses the latest saved Career ID experience content, uses short second-person copy, and only appears after a user saves new or edited experience content.

---

### FE-005: Display My Notes in experience detail view

- [x] Do not render hidden Sage Notes in the experience detail/edit card
- [x] Keep `contextNotes` editable via existing Career ID experience form behavior — no field rename in this change
- [x] Show `contextNotes` as "My Notes" after Summary in the experience detail card
- [x] Show "Copy to My Notes" only inside the Sage notes interview review; copied notes go into editable `contextNotes`, and user saves through the normal experience form
- [x] If the user closes the Sage notes interview without copying, generated Sage Notes are not visible in the experience detail UI

**Dependencies:** FE-001  
**Success criteria:** Only user-owned `contextNotes` are visible in the detail card; generated Sage Notes are visible only during the Sage interview review unless copied into My Notes.

---

## PHASE 4: FOLLOW-UP HARDENING

### FH-001: Extend question-engine/interceptor pattern beyond experience endpoints

- [ ] Decide whether HERO discovery/story-shaping endpoints should adopt `SageQuestionEngineResult`
- [ ] Move any reusable question-engine prompt/schema helpers out of experience-specific utilities if a second endpoint adopts the pattern
- [ ] Add lightweight fixtures/manual test payloads for malformed AI JSON, `single_choice`, `multi_choice`, and `free_form`

**Dependencies:** BE-003, FE-002, FE-003  
**Success criteria:** Future Sage/HERO AI flows can share the same validated question UI contract without duplicating prompt parsing logic.
