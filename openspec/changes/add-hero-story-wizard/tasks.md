## 1. Frontend Prototype

Build the full wizard UI against local component state only. No API calls, no persistence — the goal is to settle the step layout, the section config shape, and the navigation behaviour before wiring anything up.

**Visual reference:** before starting, open `openspec/changes/add-hero-story-wizard/context/`. Use `html-mockup.html` for layout, step sequence, field labels, prompts, help-panel copy, and role examples. Use `CleanShot 2026-08-14 at 12.24.45.png` for the HERO section-step layout (header, stepper, two-column form + help panel, footer). Structure and copy from the mockup; styling from Nuxt UI and app theme tokens.

**Dependencies:** None

- [ ] 1.1 Create `app/utils/heroWizardSections.ts` exporting the four HERO section definitions (key, letter, title, question, description) with three fields each carrying `key`, `tag`, `label`, `prompt`, `dbField`, and `examples` for the engineer, customer service, and manager flavors. Copy all field copy and examples from `openspec/changes/add-hero-story-wizard/context/html-mockup.html`. Confirm every `dbField` matches a real key on `HeroStory`.
- [ ] 1.2 Create `app/pages/profile/hero-wizard.vue` with `definePageMeta({ layout: 'fullscreen' })`, a `UDashboardPanel` and `UDashboardNavbar` header showing the live story title (falling back to "Untitled HERO Story") plus a "Save & Exit" control, and local state for the active step and all 13 draft values.
- [ ] 1.3 Add the `UStepper` with six items (Basics, Hurdle, Expectation, Response, Outcome, Review), passing `:linear="false"` so steps are reachable out of order, and use the `#indicator` slot to render `S`, the section letter, or a check for Review. Show a completion check on any non-active step whose fields are all filled.
- [ ] 1.4 Add the footer navigation: a back control hidden on Basics, and a forward control whose label names the destination ("Continue to The Expectation" through the sections, "Review Story" on Outcome).
- [ ] 1.5 Add the "{filled} of 12 details captured" counter, counting only HERO detail fields with at least one non-whitespace character and excluding title and linked experience.
- [ ] 1.6 Create `app/components/profile/hero/wizard/BasicsStep.vue` with a required title `UInput`, a control for whether the story is tied to a job or experience, and a `USelectMenu` of experience entries labelled by job title and employer. No summary field.
- [ ] 1.7 Create `app/components/profile/hero/wizard/SectionStep.vue` rendering any one section from the config: letter, title, italic question, description, and three `UFormField` plus `UTextarea` blocks each tagged with a `UBadge`.
- [ ] 1.8 Create `app/components/profile/hero/wizard/HelpExamplesPanel.vue` as a sticky panel showing tag, label, prompt, and example per field, with a shuffle control cycling engineer to customer service to manager and back. Lift the selected role to the page so it persists across section steps.
- [ ] 1.9 Create `app/components/profile/hero/wizard/ReviewStep.vue` with a summary block for Basics and one per HERO section, each with an edit control that jumps to its step, empty values shown as a de-emphasised "Not filled in yet", and a full-width "Save HERO Story" action.
- [ ] 1.10 Style every step with Nuxt UI components and semantic theme tokens (`text-muted`, `border-default`, `primary`), matching the layout in `openspec/changes/add-hero-story-wizard/context/CleanShot 2026-08-14 at 12.24.45.png`. Do not carry over the mockup's inline `oklch()` styles or hand-rolled markup.
- [ ] 1.11 Update `app/pages/profile.vue` to generalize the hardcoded `/profile/onboarding` bypass into a list of fullscreen child routes that also includes `/profile/hero-wizard`, so the wizard renders without the profile toolbar.

## 2. Types

**Dependencies:** 1.1

- [ ] 2.1 Define the section config types (section, field, and example-role union) so `dbField` is constrained to keys of `HeroStory` and a missing or misspelled mapping fails typecheck.
- [ ] 2.2 Define the wizard draft state type covering the title, `sourceExperienceId`, and the twelve HERO detail fields.

## 3. Backend and Database Assessment

No endpoint or schema work is expected. These tasks confirm that assumption before integration begins.

**Dependencies:** 2.1, 2.2

- [ ] 3.1 Confirm `POST /api/career-id/profile/:profileId/hero-stories` accepts a title-only body with optional `sourceExperienceId`, so the Basics step can create a record before any HERO field exists.
- [ ] 3.2 Confirm `PATCH /api/career-id/profile/:profileId/hero-stories/:storyId` applies a partial body containing only one section's three fields without clearing the others.
- [ ] 3.3 Confirm no migration is required: the wizard adds no summary column and no draft status column, and reuses the existing `hero_*` ID generation.

## 4. Wizard Persistence Integration

Replace the mockup's local-only state with incremental persistence through the existing `careerIDStore` actions.

**Dependencies:** 1.2 through 1.9, 3.1, 3.2

- [ ] 4.1 On advancing from Basics with a valid title and no existing record, call `careerIDStore.createStory` with the title and any `sourceExperienceId`, and retain the returned story id for the rest of the session. Do not create a second record if the user returns to Basics and advances again.
- [ ] 4.2 Block advancing from Basics when the title is empty or whitespace: show "Story title is required" and create no record.
- [ ] 4.3 On advancing from a HERO section step, call `careerIDStore.updateStory` with only that step's three fields, so jumping backward through the stepper cannot overwrite other sections.
- [ ] 4.4 On returning to Basics for an existing story and advancing again, patch the changed title or linked experience.
- [ ] 4.5 Handle persistence failure on advance: stay on the current step, show an error toast, retain entered values, and allow retry via the forward control.
- [ ] 4.6 Wire "Save & Exit" to persist the current step and navigate to `/profile/hero`, creating no record when pressed on Basics before the story exists.
- [ ] 4.7 Support resuming: accept a `storyId` query parameter, load that story, populate every step from its saved values, and route subsequent advances to that story.
- [ ] 4.8 Support prefill: accept title and source experience query parameters and populate the corresponding Basics fields, leaving them editable.
- [ ] 4.9 Wire "Save HERO Story" on Review to persist anything outstanding, show a confirmation, and navigate to `/profile/hero`. On failure, stay on Review with an error and allow retry.

## 5. HERO List Page Rework

Reduce `/profile/hero` to list and edit only, and point every create entry point at the wizard.

**Dependencies:** 1.2, 4.9

- [ ] 5.1 Remove the inline create form from `app/pages/profile/hero.vue` along with `isShowingCreateForm`, `formDataForCreate`, `formErrors`, `resetCreateForm`, `startAddingStory`, `cancelAddingStory`, and `handleSaveNewStory`.
- [ ] 5.2 Remove the `'create'` story-id sentinel: drop `applyAISuggestionsToCreateForm` and the create branch of `handleAcceptAISuggestions`, so the AI panel only ever targets a persisted story.
- [ ] 5.3 Update `app/components/profile/hero/HeroStoriesSection.vue` to offer a primary "New HERO Story" action that navigates to the wizard, separate from the existing "Get HERO Help" action that opens the AI launcher. Apply the same split to the empty state.
- [ ] 5.4 Update `app/components/profile/hero/HeroSessionLauncher.vue` so "Create new HERO story" navigates to the wizard instead of opening the inline form.
- [ ] 5.5 Add a "continue in wizard" control to `app/components/profile/hero/HeroStoryCard.vue` shown only when a story has a title but none of its twelve HERO detail fields filled, linking to `/profile/hero-wizard?storyId=...`.
- [ ] 5.6 Update the moment-development handlers so they navigate to the wizard with title and source experience prefilled, rather than opening the inline create form. These paths sit behind the currently hidden moments UI but must not reference removed state.
- [ ] 5.7 Confirm no AI control renders on any wizard step and that the wizard invokes no AI endpoint.

## 6. Validation

**Dependencies:** 4.9, 5.6

- [ ] 6.1 Run `pnpm lint` and fix any introduced issues.
- [ ] 6.2 Run `pnpm typecheck` and fix any introduced issues.
- [ ] 6.3 Walk the wizard end to end: create from the list, complete all six steps, save, and confirm the story appears with every field persisted.
- [ ] 6.4 Verify partial flows: "Save & Exit" from a middle step, then resume that story from the list and confirm saved values reload into the right steps.
- [ ] 6.5 Verify out-of-order navigation: jump backward via the stepper, edit an earlier section, advance, and confirm no other section's fields were cleared.
