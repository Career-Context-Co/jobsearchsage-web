## 1. Types

- [x] 1.1 Add `sectionOrder?: string[]` to `ResumeContent` in `shared/types/docs.ts`
- [x] 1.2 Add `headerStyle?: 'classic' | 'bold' | 'minimal'` to `ResumeDesignSettings` in `shared/types/docs.ts`
- [x] 1.3 Add `profileSnapshotAt?: string` to `ResumeDesignSettings` in `shared/types/docs.ts`

## 2. Profile Skills — Tag-Chip Editing

- [x] 2.1 Replace the row-per-skill form in `app/pages/profile/skills.vue` expanded state with `UInputTags` for adding/removing skill chips
- [x] 2.2 Add a `UPopover` on each skill chip that contains proficiency `USelectMenu`, years `UInput`, and "Move to group" `USelectMenu`
- [x] 2.3 Implement "Move to group" logic: remove skill from source group, append to target group in local state
- [x] 2.4 Add ↑↓ buttons to skill group card headers; implement swap-by-index reordering in local state
- [x] 2.5 Fix delete-group bug: after splicing the group from local state, immediately call the full skills save (flatten all groups → `careerIDStore.saveSkills`)
- [x] 2.6 Remove the per-group Save/Cancel buttons from the expanded view; replace with a single "Save Changes" button in each group header that saves all groups atomically (groups now auto-stage, save is explicit per group)

## 3. Resume Editor — 3-Tab Restructure

- [x] 3.1 Update `app/pages/docs/resumes/[id].vue` to have three tabs: Content, Edit, Design (replacing the existing 2-tab Content/Design)
- [x] 3.2 Create `app/components/docs/resume/ContentSelector.vue` — Content tab component: accordion with checkboxes for selection, "Sync from Profile" button, snapshot date display
- [x] 3.3 Refactor `app/components/docs/resume/ContentEditorForm.vue` → Edit tab: remove selection checkboxes, keep only text editing and item ordering (↑↓); add section-level ↑↓ reordering; show empty state when nothing selected
- [x] 3.4 Wire `sectionOrder` into Edit tab: initialize from `editableData.sectionOrder` (or default order); emit updated order on section move; pass to `ResumePreview`

## 4. Resume Editor — Sync from Profile

- [x] 4.1 Extract `buildSnapshot()` from `app/pages/docs/resumes/index.vue` into a shared composable `app/composables/useResumeSnapshot.ts` so it can be called from ContentSelector
- [x] 4.2 Implement sync logic in `ContentSelector.vue`: diff fresh snapshot IDs against existing `editableData` IDs per section; append new items with `selected: false` and `isNew: true`
- [x] 4.3 Display a dismissible banner in ContentSelector after sync showing count of added items (or "up to date" message)
- [x] 4.4 Display a "New" badge on appended items in ContentSelector
- [x] 4.5 Show snapshot date in ContentSelector header using `designSettings.profileSnapshotAt`; update `profileSnapshotAt` on sync

## 5. Resume Editor — Design Tab Header Style

- [x] 5.1 Add three header style preset buttons (Classic / Bold / Minimal) to `app/components/docs/resume/Designer.vue`
- [x] 5.2 Wire `headerStyle` as a v-model prop from `[id].vue` → `Designer.vue` (alongside existing `accentColor`)
- [x] 5.3 Implement the three header style variants in `app/components/docs/resume/ResumePreview.vue`:
  - `classic`: colored `border-bottom` on section headings using `accentColor`
  - `bold`: filled background block using `accentColor` with white text
  - `minimal`: thin neutral `border-bottom`, no color
- [x] 5.4 Ensure `headerStyle` and `profileSnapshotAt` are included when saving via `docsStore.updateResume`

## 6. Resume Editor — Preview Respects Section Order

- [x] 6.1 Update `app/components/docs/resume/ResumePreview.vue` to render sections in the order defined by `sectionOrder` (or default order if absent)
