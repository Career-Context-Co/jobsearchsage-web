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

**Dependencies:** None  
**Success criteria:** First call with a bullet returns questions. Second call with bullet + answers returns an improved bullet string.

---

### BE-003: Responsibility interview endpoint

- [x] Add `conductInterview(mode, experience, conversationHistory)` to `server/utils/sage-experience-enhancer.ts`
  - Notes help mode: prompt targets Sage notes output (persisted separately via sage-notes PUT)
  - Role summary mode: prompt targets `summary` text (user confirms via Career ID PATCH)
  - Returns `{ done: false, message }` or `{ done: true, output }` based on turn count (≥3 user turns → wrap up)
- [x] Create `server/api/ai/experience/interview.post.ts`
  - Validate `mode` (`notes_help` | `role_summary`), `experience`, `conversationHistory`
  - Call `conductInterview`, return result
  - Handle AI errors with structured error response

**Dependencies:** BE-002  
**Success criteria:** Ongoing turns return `{ done: false, message }`. After 3 user turns, returns `{ done: true, output }`.

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

- [ ] Create `server/api/ai/experience/[experienceId]/sage-notes.get.ts` — query `profileId`; return current `content` for `sage_notes` row or null
- [ ] Create `server/api/ai/experience/[experienceId]/sage-notes.put.ts` — body: `profileId`, `content`, optional `metadata`; upsert `sage_profile_notes`

**Dependencies:** BE-001  
**Success criteria:** Frontend can load read-only Sage notes for display and persist after notes-help interview confirmation.

---

### BE-006: Postman collection

- [ ] Create `deliverables/sage-assist-experience-api.postman_collection.json` covering: enhance-achievement (both phases), interview (ongoing + completion), hero-nudge, GET sage-notes, PUT sage-notes
  - Error cases: missing `bullet`, missing `mode`, missing `experience`, invalid `mode`, missing `profileId`
  - Pre-configure `{{baseUrl}}`, `{{profileId}}`, `{{experienceId}}` variables

**Dependencies:** BE-002, BE-003, BE-004, BE-005  
**Success criteria:** Collection runs clean against local dev server with all tests passing.

---

## PHASE 3: FRONTEND

### FE-001: Load Sage notes for experience detail

- [ ] Add composable or small helper — `GET /api/ai/experience/:experienceId/sage-notes?profileId=...` — expose reactive `sageNotesContent` for the detail view
- [ ] Call when opening experience detail (parallel with profile data)

**Dependencies:** BE-005  
**Success criteria:** Read-only Sage notes available without storing them on `Experience` in Pinia beyond optional local cache.

---

### FE-002: Achievement enhancement UI

- [ ] Create `app/components/profile/sage/SageAchievementEnhancer.vue`
  - Accepts props: `experience` (title, employer, summary), `bullet` (string), `experienceId`, `profileId`
  - State machine: `idle` → `loading-questions` → `answering` → `loading-result` → `review` → `idle`
  - Calls `POST /api/ai/experience/enhance-achievement`
  - Emits `confirm(improvedBullet)` and `discard`; parent handles Career ID PATCH for `highlights`
- [ ] Wire into experience detail view — Sage enhance button per `highlights` entry

**Dependencies:** BE-002  
**Success criteria:** Enhancement flow works; confirm saves bullet via store PATCH to Career ID.

---

### FE-003: Responsibility interview UI

- [ ] Create `app/components/profile/sage/SageInterviewPanel.vue`
  - Props: `mode`, `experience`, `experienceId`, `profileId`
  - Calls `POST /api/ai/experience/interview` with `sageNotes` in payload when loaded from FE-001 (optional context)
  - On `done: true` for `notes_help`: confirm → `PUT /api/ai/experience/:experienceId/sage-notes` — if existing content, overwrite confirmation modal first
  - On `done: true` for `role_summary`: confirm → Career ID PATCH `summary` — overwrite confirmation if summary exists
- [ ] Wire entry points on experience detail — slide-over

**Dependencies:** FE-001, BE-003, BE-005  
**Success criteria:** Notes help persists via sage-notes API; role summary persists via Career ID PATCH.

---

### FE-004: HERO nudge banner

- [ ] Create `app/components/profile/sage/SageHeroNudge.vue` — props: `signal`, `context`, `experienceId`
  - CTA navigates to HERO story creation with experience preloaded
- [ ] On experience detail mount: `POST /api/ai/experience/hero-nudge` with experience snapshot including `sageNotes` from FE-001 and `contextNotes` from Career ID experience; cache result for session

**Dependencies:** FE-001, BE-004  
**Success criteria:** Nudge uses combined Career ID + Sage notes context.

---

### FE-005: Display Sage notes in experience detail view

- [ ] Read-only section "Sage Notes" — render when FE-001 returns non-empty content
- [ ] Never render Sage notes as an editable input
- [ ] Keep `contextNotes` editable via existing Career ID experience form behavior — no field rename in this change

**Dependencies:** FE-001  
**Success criteria:** Sage notes visible read-only from AI route; `contextNotes` unchanged.
