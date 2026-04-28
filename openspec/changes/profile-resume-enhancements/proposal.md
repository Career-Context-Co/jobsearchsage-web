## Why

The current skills editing UX on the profile page is clunky (row-per-skill forms) and the resume editor conflates content selection, writing, and design into two poorly-structured tabs. Users lack fine-grained control over resume section ordering, resume design options beyond accent color, and a safe way to pull new profile content into an existing resume without losing manual edits.

## What Changes

- **Skills page**: Replace row-per-skill form with tag-based chip editing; click a chip to edit proficiency/years inline; add "Move to group" on chips; add group reordering (↑↓); fix delete-group bug (auto-save after removal)
- **Resume editor tabs**: Restructure from 2 tabs (Content, Design) to 3 tabs (Content, Edit, Design) with clear separation of concerns
- **Resume Content tab**: Pure selection of snapshot items (checkboxes); "Sync from Profile" button that additively appends new profile items (unselected, badged as "New") without overwriting manual edits
- **Resume Edit tab**: Text editing and section reordering (↑↓) for selected items only
- **Resume Design tab**: Add header style option (Classic / Bold / Minimal) alongside existing accent color
- **Type changes**: Add `sectionOrder`, `headerStyle`, and `profileSnapshotAt` to resume types

## Capabilities

### New Capabilities
- `skills-tag-editor`: Tag-based skill chip editing on the profile skills page — add via UInputTags, click chip for proficiency/years/move-to-group popover, group reordering, delete group auto-save
- `resume-content-sync`: Additive profile-to-resume sync — appends new profile items (by ID) to an existing resume as unselected "New"-badged items; no overwrites

### Modified Capabilities
- `profile-builder`: Skills editing UX requirements change (tag-based input, group ordering, delete-group behavior)
- `resume-generation`: Resume editor now has 3 tabs; section ordering is user-controlled; header style is a new design setting

## Impact

- `app/pages/profile/skills.vue` — significant UX refactor
- `app/components/docs/resume/ContentEditorForm.vue` — split into ContentSelector (Tab 1) + refactored editor (Tab 2)
- `app/components/docs/resume/Designer.vue` — add header style controls
- `app/components/docs/resume/ResumePreview.vue` — render headerStyle variants
- `app/pages/docs/resumes/[id].vue` — 3-tab structure, sync action
- `shared/types/docs.ts` — add `sectionOrder`, `headerStyle`, `profileSnapshotAt`
- No API/DB schema changes required (resume content stored as JSON blob)
