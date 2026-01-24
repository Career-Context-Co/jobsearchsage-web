# Design: HERO Story Form

## Context

The HERO Story Form is a single-page data entry experience for capturing a complete HERO story without guided steps, autosave, or AI. The form supports starting from scratch or with read-only context from an existing moment or experience entry.

## Goals / Non-Goals

### Goals

- Provide one-page form with the four HERO sections and all tagged fields.
- Allow users to fill fields in any order with clear labels and lightweight guidance.
- Save only on explicit user action (no autosave, no background persistence).
- Persist stories to a dedicated `career_id.hero_stories` table with required metadata and timestamps.
- Provide a clear post-save state with next actions.

### Non-Goals

- Bullet generation (AI or non-AI), enhancement, or editing suggestions
- Guided chat/session flow (covered by separate work)
- Autosave, draft saving, or recovery after navigation away
- Full story management page (list/filter/search) beyond what already exists

## Decisions

### 1) Data model: column-per-field (align with Supabase schema)

**Decision:** Persist HERO story content using dedicated columns per tagged field, matching the existing `career_id.hero_stories` table:

- Hurdle: `hurdle_problem`, `hurdle_scope`, `hurdle_stakes`
- Expectation: `expectation_role`, `expectation_goals`, `expectation_constraints`
- Response: `response_actions`, `response_tools`, `response_challenges`
- Outcome: `outcome_deliverable`, `outcome_metrics`, `outcome_impact`

**Rationale:** This avoids schema changes, matches existing conventions for profile entities, and simplifies API validation and queries.

**Schema reference (current):**

- `career_id.hero_stories`
  - `id` (prefixed, e.g. `story_...`) (PK)
  - `profile_id` (FK → `career_id.profiles.id`)
  - `title` (required)
  - All HERO tagged columns listed above (nullable)
  - `source_experience_id` (nullable FK → `career_id.experience.id`)
  - `created_at`, `updated_at`
  - `deleted_at`, `is_deleted` (soft delete)

### 2) API design: RESTful hero story endpoints

**Decision:** Use RESTful endpoints scoped to profile, consistent with other Career ID data:

- `GET /api/career-id/profile/:profileId/hero-stories` (optional for future; list)
- `POST /api/career-id/profile/:profileId/hero-stories` (create)
- `GET /api/career-id/profile/:profileId/hero-stories/:storyId` (fetch)
- `PATCH /api/career-id/profile/:profileId/hero-stories/:storyId` (update)
- `DELETE /api/career-id/profile/:profileId/hero-stories/:storyId` (delete/soft-delete)

**Rationale:** Keeps story lifecycle consistent with moments/experience patterns and simplifies store integration.

### 3) Routing: form as a destination from "Develop" actions

**Decision:** Use a single route family rooted at `/profile/hero`:

- Create new story: `/profile/hero?new`
- View/edit story: `/profile/hero/:storyId`

**Rationale:** Keeps HERO entry points (moments list + story form) under one area and matches the requested URL shape.

## Risks / Trade-offs

- **No autosave means data loss**: This is intentional per acceptance criteria; mitigate with clear UI copy and disabled navigation during save.
- **Schema decisions may evolve**: JSONB structure is chosen to support future bullet generation prompts; if future needs differ, migrations may be required.

## Schema Verification (Phase 1: DATABASE - Verified ✓)

### Verified Schema Mapping

The `career_id.hero_stories` table exists in Supabase and matches the form field requirements exactly:

| Column | Type | Nullable | Constraint | Purpose |
|--------|------|----------|-----------|---------|
| `id` | TEXT | NO | PRIMARY KEY | Public prefixed ID (e.g., `story_...`) |
| `internal_id` | BIGINT | NO | UNIQUE, IDENTITY | Internal database ID for sorting/partitioning |
| `profile_id` | TEXT | NO | FK → profiles(id) | Reference to parent profile |
| `title` | TEXT | NO | | User-provided story title (required for save) |
| **HURDLE SECTION** | | | | |
| `hurdle_problem` | TEXT | YES | | [PROBLEM] The specific challenge/opportunity |
| `hurdle_scope` | TEXT | YES | | [SCOPE] Size/scale/reach of the challenge |
| `hurdle_stakes` | TEXT | YES | | [STAKES] Why it mattered / what was at risk |
| **EXPECTATION SECTION** | | | | |
| `expectation_role` | TEXT | YES | | [ROLE] User's role/responsibility/authority |
| `expectation_goals` | TEXT | YES | | [GOALS] Targets to achieve (quantitative/qualitative) |
| `expectation_constraints` | TEXT | YES | | [CONSTRAINTS] Limits (budget/timeline/resources/etc.) |
| **RESPONSE SECTION** | | | | |
| `response_actions` | TEXT | YES | | [ACTIONS] Actions taken |
| `response_tools` | TEXT | YES | | [TOOLS] Tools/technologies/systems used |
| `response_challenges` | TEXT | YES | | [CHALLENGES] Obstacles overcome |
| **OUTCOME SECTION** | | | | |
| `outcome_deliverable` | TEXT | YES | | [DELIVERABLE] What was delivered |
| `outcome_metrics` | TEXT | YES | | [METRICS] Measurable results (numbers/percentages) |
| `outcome_impact` | TEXT | YES | | [IMPACT] Qualitative impact (org effects/recognition) |
| **RELATIONSHIPS & METADATA** | | | | |
| `source_experience_id` | INTEGER | YES | FK → experience(id) | Optional reference to source experience entry |
| `display_order` | INTEGER | NO | DEFAULT 0 | Display order within profile |
| `deleted_at` | TIMESTAMPTZ | YES | | Soft delete timestamp (NULL = active) |
| `is_deleted` | BOOLEAN | NO | DEFAULT false | Soft delete flag (false = active) |
| `created_at` | TIMESTAMPTZ | NO | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NO | DEFAULT NOW() | Last update timestamp |

### Key Design Validation

✅ **Form fields match schema:** All 12 HERO tagged fields (`hurdle_problem`, `hurdle_scope`, `hurdle_stakes`, `expectation_role`, `expectation_goals`, `expectation_constraints`, `response_actions`, `response_tools`, `response_challenges`, `outcome_deliverable`, `outcome_metrics`, `outcome_impact`) are present as nullable TEXT columns.

✅ **Required fields identified:** `title` is NOT NULL; all HERO fields are nullable (supporting progressive/non-linear entry).

✅ **ID strategy confirmed:** Table uses prefixed ID (`story_...` format) with dual-ID approach (text `id` + BIGINT `internal_id`), consistent with profiles and contact_info patterns.

✅ **Soft delete implemented:** Both `deleted_at` (timestamp) and `is_deleted` (boolean) columns present for audit trail and soft delete pattern.

✅ **Relationship tracking:** `source_experience_id` enables linking stories back to their source experience entries when applicable.

✅ **Access patterns supported:**
- Fetch all stories for a profile: `SELECT * FROM career_id.hero_stories WHERE profile_id = ? AND is_deleted = false ORDER BY display_order`
- Fetch single story for edit: `SELECT * FROM career_id.hero_stories WHERE id = ? AND profile_id = ?`
- Soft delete: `UPDATE career_id.hero_stories SET is_deleted = true, deleted_at = NOW() WHERE id = ?`

### Indexes Confirmed

- `idx_hero_stories_profile_id` - enables efficient filtering by profile
- `idx_hero_stories_id` - primary key lookup

## Open Questions (for follow-on issues)

- Should we add a `source_moment_id` column to `career_id.hero_stories` to persist moment → story traceability?
- How should "Generate bullets" be wired (route, modal, or future page)?
