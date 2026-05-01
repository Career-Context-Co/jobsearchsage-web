## Why

Most users undersell their experience not because the work wasn't meaningful, but because they can't recall or articulate it under pressure. The experience object is where that problem lives — sparse `highlights`, vague language, older roles barely filled in. Sage's job here is to work with what already exists (`highlights`, `summary`, `context_notes`, plus Sage-generated notes loaded from JobSearchSage-owned storage) and make it better, not generate content from scratch.

Career ID is intended as a reusable profile API consumed by multiple apps; Sage-generated notes SHALL NOT live on `career_id.experience`. They are stored in `sage_profile_notes` (JobSearchSage schema) and referenced by logical Career ID keys (`profile_id`, `target_type`, `target_id`).

**This change does not alter the Career ID database schema or rename Career ID fields.** Existing `context_notes` on `career_id.experience` and the corresponding API shape (`contextNotes`) remain as-is.

## What Changes

- **JobSearchSage schema** — New `sage_profile_notes` table stores Sage-generated notes keyed to Career ID profile objects (e.g. experience) via logical references — no FK into Career ID tables. Content for the responsibility interview "notes help" mode is written here (`note_type` such as `sage_notes`).
- Sage AI endpoints live under `/api/ai/experience/` (not under `/api/career-id/.../sage/`):
  - `POST .../enhance-achievement` — per-bullet enhancement with a two-call Q&A flow
  - `POST .../interview` — conversational interview with two modes (`notes_help` → output confirmed via sage-notes API; `role_summary` → generates `summary` via Career ID PATCH)
  - `POST .../nudge-check` — signal detection across `highlights`, `summary`, `contextNotes`, and Sage notes content (from request snapshot or loaded `sageNotes` for the experience)
  - `GET .../:experienceId/sage-notes` — read current Sage notes for an experience
  - `PUT .../:experienceId/sage-notes` — upsert Sage notes after interview confirmation (overwrites prior row per uniqueness constraint)
- Three new frontend features in the experience detail view:
  - Inline achievement enhancement panel on each `highlights` entry
  - Responsibility interview slide-over (mode-aware: notes help or role summary)
  - HERO nudge banner — non-blocking CTA that navigates to a new HERO story session with the current experience preloaded

## Capabilities

### New Capabilities

- `sage-assist-experience`: AI enhancement layer on the experience object — achievement enhancement, responsibility interview, and HERO nudge signal detection. Sage-owned persistence via `sage_profile_notes`; Career ID PATCH remains unchanged for notes shape (`contextNotes` maps to existing `context_notes`).

### Modified Capabilities

- `profile-builder`: Sage-generated notes are not part of the Career ID experience schema; they are loaded/saved via `/api/ai/experience/.../sage-notes`. No Career ID schema or field rename in this change.

## Impact

**Database (Career ID)**

- None — no migrations to `career_id.experience` or other Career ID tables for this change.

**Database (JobSearchSage)**

- New table `sage_profile_notes` — logical links to Career ID profile objects (`profile_id`, `target_type`, `target_id`, `note_type`, `content`, timestamps); RLS aligned with other JSS tables

**Backend**

- No changes required to `shared/types/careerId.ts`, `career-id-transformer.ts`, or Career ID PATCH solely for this OpenSpec — unless implementation discovers gaps (none anticipated for `contextNotes`-only payloads).
- `server/api/ai/experience/enhance-achievement.post.ts` (new)
- `server/api/ai/experience/interview.post.ts` (new)
- `server/api/ai/experience/nudge-check.post.ts` (new)
- `server/api/ai/experience/[experienceId]/sage-notes.get.ts` (new)
- `server/api/ai/experience/[experienceId]/sage-notes.put.ts` (new)
- `server/utils/sage-experience-enhancer.ts` (new AI utility)
- Server utilities for `sage_profile_notes` CRUD (shared with sage-notes handlers)

**Frontend**

- Composable or dedicated fetch for Sage notes — `GET /api/ai/experience/:experienceId/sage-notes`; confirm notes-help interview via `PUT` (not Career ID PATCH for Sage content)
- New Sage UI components in `app/components/profile/sage/` (enhancement panel, interview panel, nudge banner)
- Existing `contextNotes` on experience continues as today — no rename task.

**No impact on**

- Resume generation — operates off `highlights` and `summary` which are unchanged in purpose
- HERO stories — Sage nudge navigates into the existing HERO story flow but does not modify it
- Education, certifications, skills — unaffected
