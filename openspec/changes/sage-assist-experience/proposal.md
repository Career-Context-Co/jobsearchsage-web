## Why

Most users undersell their experience not because the work wasn't meaningful, but because they can't recall or articulate it under pressure. The experience object is where that problem lives — sparse `highlights`, vague language, older roles barely filled in. Sage's job here is to work with what already exists (`highlights`, `summary`, `user_notes`, `sage_notes`) and make it better, not generate content from scratch.

## What Changes

- **BREAKING** — `context_notes` column on `career_id.experience` is renamed to `user_notes`. All references updated across transformer, type, PATCH endpoint, store, and components.
- New `sage_notes` column (`text`, nullable) added to `career_id.experience`. This is exclusively written by Sage's "help me write my notes" interview sub-flow — never touched by the user directly via the standard form.
- Three new Sage AI endpoints added under `POST /api/career-id/profile/:profileId/experience/:id/sage/`:
  - `enhance-achievement` — per-bullet enhancement with a two-call Q&A flow
  - `interview` — conversational interview with two modes (`notes_help` → writes `sage_notes`; `role_summary` → generates `summary`)
  - `nudge-check` — signal detection across `highlights`, `summary`, `user_notes`, `sage_notes` returning a HERO nudge if strong signal is detected
- Three new frontend features in the experience detail view:
  - Inline achievement enhancement panel on each `highlights` entry
  - Responsibility interview slide-over (mode-aware: notes help or role summary)
  - HERO nudge banner — non-blocking CTA that navigates to a new HERO story session with the current experience preloaded

## Capabilities

### New Capabilities

- `sage-assist-experience`: AI enhancement layer on the experience object — achievement enhancement, responsibility interview, and HERO nudge signal detection. Covers all three Sage endpoints and their corresponding frontend interactions.

### Modified Capabilities

- `profile-builder`: **BREAKING** — the `experience` data model gains a `user_notes` field (renamed from `context_notes`) and a new `sage_notes` field. Requirement: experience entries now carry two distinct note fields with separate write ownership (user vs. Sage).

## Impact

**Database**
- `career_id.experience` — rename `context_notes` → `user_notes`; add `sage_notes TEXT` (nullable)

**Backend**
- `shared/types/careerId.ts` — rename `contextNotes` → `userNotes`, add `sageNotes` on `Experience` interface
- `server/utils/career-id-transformer.ts` — update `transformExperience` field mapping
- `server/api/career-id/profile/[profileId]/experience/[id].patch.ts` — update field mapping
- `server/api/career-id/profile/[profileId]/experience/[id]/sage/enhance-achievement.post.ts` (new)
- `server/api/career-id/profile/[profileId]/experience/[id]/sage/interview.post.ts` (new)
- `server/api/career-id/profile/[profileId]/experience/[id]/sage/nudge-check.post.ts` (new)
- `server/utils/sage-experience-enhancer.ts` (new AI utility)

**Frontend**
- `app/stores/careerIDStore.ts` — rename `contextNotes` → `userNotes` references, add `sageNotes`
- Any components referencing `contextNotes` — updated to `userNotes`
- New Sage UI components in `app/components/profile/sage/` (enhancement panel, interview panel, nudge banner)

**No impact on**
- Resume generation — operates off `highlights` and `summary` which are unchanged in purpose
- HERO stories — Sage nudge navigates into the existing HERO story flow but does not modify it
- Education, certifications, skills — unaffected
