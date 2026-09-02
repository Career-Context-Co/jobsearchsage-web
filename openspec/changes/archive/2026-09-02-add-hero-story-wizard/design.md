## Context

HERO story creation currently lives inline on `/profile/hero`. The page owns a `formDataForCreate` ref holding all 12 HERO fields, a `isShowingCreateForm` toggle that swaps the story list out for a form, and roughly 250 lines of template rendering four sections of textareas. Saving posts once to `POST /api/career-id/profile/:profileId/hero-stories`.

The codebase already contains the pattern this change needs. `app/pages/profile/onboarding.vue` is a full-page stepped wizard: it sets `definePageMeta({ layout: 'fullscreen' })`, renders a `UStepper` inside a `UDashboardPanel`, keeps step components mounted with `v-show`, drives navigation from a footer rather than the stepper itself, and persists step progress so a returning user resumes where they left off. `app/pages/profile.vue` cooperates by rendering `<NuxtPage />` bare when the route is onboarding, bypassing the profile toolbar. This design reuses that structure rather than inventing a second wizard idiom.

**Visual reference:** before implementing any wizard UI, open `openspec/changes/add-hero-story-wizard/context/`. `html-mockup.html` is the source of truth for layout, step sequence, field labels, prompts, help-panel copy, and the three role example sets. `CleanShot 2026-08-14 at 12.24.45.png` is the visual target for a HERO section step (header, stepper, two-column form + help panel, footer). Use them for structure and copy only; do not port the mockup's inline styles. Implement with Nuxt UI components and semantic theme tokens.

Two constraints shape the work. First, `hero_stories` has no draft or status column, so anything persisted mid-flow is indistinguishable from a finished story. Second, the mockup's Basics step collects a "Summary" that has no column, and its experience link is free text where the real model has a `sourceExperienceId` foreign key.

## Goals / Non-Goals

**Goals:**

- Sequence HERO story creation into six steps so no screen presents more than three inputs.
- Put worked examples next to every field, in a role flavor the user picks, so guidance is useful outside engineering roles.
- Preserve in-progress work across refreshes and deliberate exits.
- Leave `/profile/hero` as a pure list-and-edit surface with a single obvious route into creation.
- Reuse the onboarding wizard pattern, the existing hero-stories endpoints, and existing `careerIDStore` actions.

**Non-Goals:**

- No AI inside the wizard. The `gather-context` / `synthesize` enhancement flow stays on the list and edit surfaces.
- No database migration, no API changes, no new fields on `HeroStory`.
- No change to how an existing story is edited from its card.
- No draft/status lifecycle modeled in the database.
- No rework of the HERO moments or discovery flows, which remain paused.

## Decisions

### Route lives at `/profile/hero-wizard`, a sibling of `/profile/hero`

The natural-looking `pages/profile/hero/wizard.vue` is not viable. Nuxt would treat the existing `pages/profile/hero.vue` as the parent route for anything under `pages/profile/hero/`, and that file has no `<NuxtPage />` outlet, so the child would never render. Converting `hero.vue` into a pass-through parent would mean restructuring the list page for no benefit. A flat sibling route avoids the problem entirely.

`app/pages/profile.vue` currently hardcodes `route.path === '/profile/onboarding'` to decide when to skip the profile toolbar. This generalizes to a small list of fullscreen child routes so the wizard gets the same bare treatment.

*Alternative considered:* rendering the wizard as a `UModal` or `USlideover` from the list page. Rejected because the side-by-side form and help panel needs horizontal room, and because the user explicitly asked for the resume-upload treatment, which is a dedicated page.

### Persist a real story row on leaving Basics, then patch per step

The wizard calls `careerIDStore.createStory` once the user advances past Basics, holds the returned `id`, and calls `updateStory` with that step's three fields on each subsequent advance. "Save & Exit" therefore needs no save at all — it is a navigation.

This is what makes progress durable, and it keeps the wizard honest about what the user has actually committed. It also leaves the door open for the deferred AI integration, whose endpoints require a real `story_id` and cannot operate on an unsaved draft. The existing experience-nudge flow already creates a partial story server-side before the interview begins, so a partially-filled row is an established state in this system rather than a new concept.

*Alternatives considered:* a single POST at the Review step, which loses everything on refresh and would later block AI integration; and mirroring to `localStorage`, which adds a second source of truth to reconcile and still leaves the AI problem unsolved.

### Section content lives in one config module, and steps are generated from it

The four HERO sections are structurally identical: a letter, a title, a question, a description, and exactly three fields that each carry a tag, a label, a prompt, and three role examples. Writing four near-duplicate step components would trip the same maintenance problem the current page has, where the create form and `HeroStoryCard`'s edit form each hand-maintain the same 12 fields.

Instead a single config module exports the section definitions, each field naming its `HeroStory` key via a `dbField` property, and one generic section-step component renders whichever section it is given. Adding or reordering a field becomes a config edit. The `dbField` mapping is also what turns a step's local answers into the `updateStory` payload, so the field-name-to-column relationship is stated exactly once.

This config is client-side presentation content and belongs in `app/utils/`, where Nuxt auto-imports it.

### Stepper is non-linear, with letters via the `indicator` slot

`UStepper` in Nuxt UI 4.1 exposes an `indicator` slot receiving `{ item, ui }`, which is how the S / H / E / R / O / check marks from the mockup get rendered in place of the default numbers. Completed sections show a check instead of their letter.

Onboarding passes `disabled` to make its steps non-clickable, but the mockup allows jumping freely between steps and the Review step's per-section Edit buttons depend on it. Rather than `disabled`, the wizard passes `:linear="false"`, the reka-ui prop that permits out-of-order navigation while keeping the steps interactive. Footer buttons still drive the primary path, and the component's exposed `next()`, `prev()`, `hasNext`, and `hasPrev` are used exactly as onboarding uses them.

Because a step can be reached out of order, the per-step patch-on-advance must send only that step's fields. A blanket patch of all 12 would overwrite sections the user reached by jumping backward.

### Basics drops Summary and binds the real experience foreign key

The mockup's Summary textarea has no column and nothing in the product reads it, so it is dropped rather than carried as dead state or given a migration it has not earned. The mockup's free-text experience field becomes a `USelectMenu` over `careerIDStore.experience`, writing the real `sourceExperienceId`, which is what the AI context-gathering endpoints already consume.

### Nuxt UI components and theme tokens throughout

The mockup's inline `oklch()` styles and hand-rolled circles are reference for structure and copy only. The implementation uses `UDashboardPanel`, `UDashboardNavbar`, `UStepper`, `UCard`, `UFormField`, `UInput`, `UTextarea`, `USelectMenu`, `UBadge`, and `UButton` with semantic tokens (`text-muted`, `border-default`, `primary`), consistent with the rest of the profile pages.

### No new persistence primitives

No table is added, so there are no new snake_case-to-camelCase mappings; the wizard writes through the existing endpoints, which already translate the 12 HERO columns. No new entity type is introduced, so no new ID prefix is needed — records continue to use the existing `hero_*` CUID2 prefix from `generatePrefixedId('hero')`.

## Risks / Trade-offs

**Abandoned drafts pollute the story list.** A user who fills in Basics and leaves has a titled story with 12 empty fields sitting in their list, indistinguishable from a finished one. → The wizard accepts a `storyId` query parameter so a story can be reopened where it was left, and `HeroStoryCard` surfaces a resume affordance when a story has no HERO fields filled. If this proves noisy in practice, the follow-up is a `status` column filtered out of the list query, which this design does not preclude.

**Autosave contradicts an existing spec requirement.** `hero-stories` currently specifies that the form never persists until an explicit save. → The requirement is rescoped to the edit form rather than deleted, so editing keeps its current behavior and only the wizard autosaves. The distinction is recorded in the spec delta so the contradiction is deliberate and visible.

**Partial saves can leave a story mid-flight if a patch fails.** A failed `updateStory` between steps means the row and the on-screen state disagree. → Step advance awaits the patch and surfaces a toast on failure, holding the user on the current step so they can retry, matching how `saveAndValidateCurrentStep` gates navigation in onboarding.

**Two creation entry points could drift apart.** Editing still happens through `HeroStoryCard`'s own 12-field form, which the wizard does not share. → Both read field labels and prompts from the new config module where practical, so copy stays in one place even though the layouts differ. Fully unifying the edit form with the wizard's section components is out of scope here.

**Concurrent spec edits.** The active `finish-hero-session-buildout` change also has a `hero-stories` delta. → Its delta only adds Response and Outcome AI session requirements, while this one modifies create-path and list-page requirements. The two touch disjoint requirements, but whichever archives second should re-validate.

## Open Questions

- Should the wizard block leaving Basics without a title, or allow an untitled draft? The current create form requires a title and the API enforces it, so the wizard requires it too, but this makes the very first step the only one that can fail validation.
- Should completing the wizard land the user on `/profile/hero` with the new story highlighted, reusing the existing `highlightStoryId` query parameter that the experience-nudge flow already uses?
