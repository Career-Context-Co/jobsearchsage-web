# Change: Add HERO Story Form

## Why

Users need a fast, straightforward way to document career achievements as complete HERO stories without a guided/chat flow. A single-page form that captures the full HERO structure (all fields at once) reduces friction, supports non-linear entry, and becomes the foundation for later bullet generation and deeper story workflows.

## What Changes

- **New Capability: HERO Story Form** - A single-page form for creating and editing a HERO story with all four sections (Hurdle, Expectation, Response, Outcome) and their tagged fields.
- **Context-Aware Initialization** - The form can be started from:
  - A discovered moment (pre-fills title, shows moment context as read-only reference)
  - An experience entry (shows experience context as read-only reference)
  - Scratch (no context panel)
- **Routing**:
  - New story: `/profile/hero?new`
  - Open/edit story: `/profile/hero/:storyId`
- **Manual Save Only** - No autosave and no AI calls; data persists only when the user clicks Save.
- **Persistence + Post-Save Options** - Saving writes to `hero_stories` with required metadata; after save, the user is offered actions to view the story, generate bullets (**coming soon / not implemented in this change**), or return to the `/profile/hero` list view to see created stories and discovered moments.

## Impact

- **Affected specs**: New capability `hero-stories` (added via change delta)
- **Affected code (expected)**:
  - Frontend: `app/pages/profile/hero.vue` (wire Develop → Story Form), new route(s) under `app/pages/profile/hero/` and components under `app/components/profile/hero/`
  - Backend: new story CRUD endpoints under `server/api/career-id/profile/[profileId]/hero-stories/*`
  - Database: new `career_id.hero_stories` table (and indexes)
- **Breaking changes**: None
- **New dependencies**: None

## Relationship to Existing HERO Work

- This change builds on the existing HERO entry points (e.g., discovered moments on `app/pages/profile/hero.vue`) by providing the missing “develop into story” destination.
- Bullet generation is explicitly **not** implemented here; the post-save “Generate bullets” action is a navigational/placeholder affordance for follow-on work.

