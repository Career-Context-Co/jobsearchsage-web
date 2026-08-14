## Why

Creating a HERO story today means facing a single inline form with 12 empty textareas at once. There is no sense of progress, no guidance on what "good" looks like for any given field, and no examples for users whose work does not resemble the engineering-flavored placeholder text. The result is an intimidating blank-slate experience for the one action that produces the most valuable data in the product.

Onboarding already solved this shape of problem with a full-page stepped wizard for resume upload. Applying the same pattern to HERO story creation breaks the work into six manageable steps, shows role-relevant examples beside every field, and persists progress as the user goes so a mistimed refresh no longer costs them the whole story.

## What Changes

- Add a full-page HERO story creation wizard at `/profile/hero-wizard`, using the fullscreen layout and stepper pattern established by `/profile/onboarding`.
- Sequence creation across six steps: Basics (title and optional linked experience), then one step per HERO section (Hurdle, Expectation, Response, Outcome), then a Review step that summarizes every field before saving.
- Show a persistent help panel beside each HERO section step with the section's purpose and a worked example for each of its three fields. Examples are available in three role flavors (engineer, customer service, manager) and the user can shuffle between them, so the guidance fits non-technical careers.
- Display a running "N of 12 details captured" progress indicator, and let users jump directly to any step from the stepper or from the Review step's per-section Edit action.
- Persist a real HERO story record as soon as the user leaves the Basics step, then update it after each subsequent step. "Save & Exit" is available at any point and the wizard can be resumed later for a story that is still incomplete.
- **BREAKING** Remove the inline create form from `/profile/hero`. That page becomes list-and-edit only; every "create new" entry point (the stories section header, the empty state, the AI launcher's "Create new HERO story" option, and the moment-development path) routes into the wizard instead.
- **BREAKING** Creation no longer follows the "no autosave" rule. Editing an existing story from the list keeps its current explicit-save behavior; only the wizard autosaves.

Explicitly out of scope: AI assistance inside the wizard. The existing "Get HERO Help" enhancement flow stays on the list and edit surfaces, and wiring it into the wizard is a follow-up.

## Capabilities

### New Capabilities

- `hero-story-wizard`: The guided multi-step HERO story creation flow — route and layout, step sequencing and navigation, the Basics and per-section steps, the role-switchable help and examples panel, progress reporting, incremental draft persistence, save-and-exit, resume, and the Review-and-save step.

### Modified Capabilities

- `hero-stories`: Story creation moves out of the inline form and into the wizard. The "HERO Story Form Access and Initialization" requirement narrows to editing only, the create-from-moment scenario redirects to the wizard, "No Autosave and No AI Calls" is rescoped to the edit form, the create half of "Save HERO Story With Feedback" moves to the wizard capability, and the list page's create affordance becomes a link out rather than an inline form toggle.

## Impact

**New code**

- `app/pages/profile/hero-wizard.vue` — wizard route and step orchestration.
- `app/components/profile/hero/wizard/` — Basics step, a config-driven HERO section step, the help and examples panel, and the review step.
- A shared section configuration module holding each section's copy, its three field definitions with their `HeroStory` field mappings, and the three sets of role examples.

**Modified code**

- `app/pages/profile/hero.vue` — the inline create form and its associated state, validation, and AI "create" sentinel handling are removed; create actions navigate to the wizard.
- `app/pages/profile.vue` — the existing onboarding bypass generalizes so the wizard also renders without the profile toolbar.
- `app/components/profile/hero/HeroStoriesSection.vue` and `HeroSessionLauncher.vue` — create entry points point at the wizard, separated from the AI help action.
- `app/components/profile/hero/HeroStoryCard.vue` — gains a way to resume an incomplete story in the wizard.

**Visual reference**

- UX structure, step copy, field labels/prompts, and role examples live in `openspec/changes/add-hero-story-wizard/context/`. Use `html-mockup.html` for structure and copy and `CleanShot 2026-08-14 at 12.24.45.png` for layout. These are the source of truth for the wizard UI; they are not production code. Implement with Nuxt UI and app theme tokens.

**Unchanged**

- No database migration and no API changes. The wizard uses the existing `POST` and `PATCH` hero-stories endpoints and the existing `careerIDStore` actions. No new field is added to `HeroStory`.

**Known tradeoff**

- `hero_stories` has no draft status column, so a story abandoned mid-wizard appears in the list with a title and empty HERO fields. This already occurs via the experience-nudge flow, which creates a partial story server-side. The wizard makes such stories resumable rather than introducing a status column; adding one is a follow-up if abandoned drafts prove noisy.

**Coordination**

- The active `finish-hero-session-buildout` change also touches `hero-stories`, but only adds requirements for Response and Outcome AI sessions and the session pane. This change does not modify AI session behavior, so the two deltas should not collide.
