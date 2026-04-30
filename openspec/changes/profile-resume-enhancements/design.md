## Context

The profile skills page uses a row-per-skill editing form (name input + proficiency select + years input per skill) that is tedious for users with many skills. The resume editor conflates content selection and text editing into one tab, making both tasks harder. There is no way to pull updated profile content into an existing resume without creating a new one.

Current state:
- `app/pages/profile/skills.vue` — groups with row-per-skill forms when expanded; badge chips in collapsed view; delete-group saves locally but never persists
- `app/components/docs/resume/ContentEditorForm.vue` — single component handling both selection and text editing in one accordion
- `app/pages/docs/resumes/[id].vue` — 2-tab layout (Content, Design)
- `shared/types/docs.ts` — `ResumeDesignSettings` only has `accentColor`

## Goals / Non-Goals

**Goals:**
- Tag-chip based skill editing with inline popover for metadata (proficiency, years, move-to-group)
- Skill group reordering via ↑↓ buttons; fix delete-group persistence bug
- 3-tab resume editor: Content (select) → Edit (write + reorder) → Design (style)
- Additive "Sync from Profile" in Content tab — appends new items, never overwrites
- Header style presets (Classic / Bold / Minimal) in Designer
- Section reordering (↑↓) in Edit tab, persisted in `sectionOrder`
- No new external dependencies

**Non-Goals:**
- Drag-and-drop (native or library) — ↑↓ buttons are sufficient
- AI-assisted editing — separate branch
- Profile-level section ordering — only resume-level
- Cross-resume settings sync

## Decisions

### 1. Skills tag editing with popover — no library

**Decision**: Use `UPopover` from Nuxt UI wrapping a `UBadge` chip per skill. The popover contains a small form with `USelectMenu` (proficiency), `UInput` (years), and `USelectMenu` (move-to-group).

**Rationale**: `UInputTags` already exists and handles the add/remove flow. But UInputTags doesn't support per-tag metadata. The hybrid approach — UInputTags for fast entry + popover per badge for metadata — gives the best UX with no new deps.

**Alternative considered**: A separate drawer/modal per skill — rejected as too heavy for what's essentially 2 fields.

### 2. Delete group fix — auto-save on delete

**Decision**: After splicing a group from local state, immediately call the existing `saveSkillGroup`-equivalent logic (flatten all groups → `careerIDStore.saveSkills(allSkills)`).

**Rationale**: The current bug is that `deleteSkillGroup` only mutates local state. The save API already does an atomic full-replace of all skills, so calling it post-delete is safe and consistent.

### 3. Resume editor — split into 3 components

**Decision**: 
- Rename/repurpose `ContentEditorForm.vue` → `DocsResumeContentSelector.vue` (Tab 1: selection + sync)
- Create new `DocsResumeContentWriter.vue` (Tab 2: text editing + section reordering)
- Keep `DocsResumeDesigner.vue` (Tab 3: unchanged + header style)

**Rationale**: The current `ContentEditorForm.vue` already partially does both jobs. Splitting cleanly separates mental modes (what vs. how vs. look). The parent `[id].vue` page already owns `editableData` and passes it down — both Tab 1 and Tab 2 receive/emit the same prop shape.

**Alternative considered**: Keep one combined component with internal sub-tabs — rejected as it adds complexity without UX benefit.

### 4. Sync from Profile — additive by new ID

**Decision**: On sync, rebuild a fresh snapshot via `buildSnapshot()` (same function as resume creation in `resumes/index.vue`). For each section array, append only items whose `id` is NOT already present in `editableData`. New items are added with `selected: false` and a `isNew: true` flag (ephemeral, not persisted). Show a dismissible banner counting additions.

**Rationale**: Pure additive means no data loss. Since profile items have stable IDs (`exp.id`, `edu.id`, etc.), ID-based deduplication is reliable. The `isNew` flag is only used for visual badging until the user saves.

**Alternative considered**: Full replace with confirmation — rejected because users may have hand-edited bullets they want to keep.

### 5. sectionOrder stored in ResumeContent

**Decision**: Add `sectionOrder?: string[]` to `ResumeContent` (e.g. `['summary', 'workExperience', 'education', 'skills', 'certifications']`). Absence means default order. No DB schema change — resume content is stored as a JSON blob.

### 6. headerStyle stored in ResumeDesignSettings

**Decision**: Add `headerStyle?: 'classic' | 'bold' | 'minimal'` to `ResumeDesignSettings`. The `ResumePreview.vue` component reads `headerStyle` and applies one of three CSS patterns:
- `classic`: colored underline border-bottom on section headers
- `bold`: filled color block background on section headers  
- `minimal`: thin neutral line separator, no color

## Risks / Trade-offs

- **Skills popover UX on mobile**: A popover on a small chip may be cramped on narrow screens. Mitigation: ensure popover has min-width and renders above/below the chip rather than to the side.
- **Snapshot sync deduplication by ID**: Skills use `skill.name` as ID (see `resumes/index.vue` — `id: skill.name`). If a user renames a skill in profile, the old-named skill won't be deduplicated. Mitigation: acceptable edge case; pure additive means no data loss, user just sees both.
- **3-tab navigation**: "Edit" tab will be empty if nothing is selected in "Content". Mitigation: show a helpful empty state nudging the user to select content first.
- **ContentEditorForm refactor**: The existing component is referenced directly in `[id].vue`. Renaming requires updating the import. No other consumers found.
