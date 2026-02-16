# Tasks: Add Resume Generation

> **Note:** This change is frontend-only. No new backend endpoints or database tables are needed — all profile data is already available via `careerIDStore`. Phase order: Frontend Prototype → Integration (wire to store).

---

## Phase 1A: Frontend Prototype

### FE-001: Resume Generation Page Shell & Routing
- [x] Create `app/pages/resumes/generate.vue` with `UDashboardPanel` layout (title "Resume", toolbar with tabs)
- [x] Add two tabs using `UTabs` or `UNavigationMenu`: "Content Editor" (icon: `i-lucide-file-text`) and "Designer" (icon: `i-lucide-palette`)
- [x] Add "Export PDF" button in the page header area (far right), disabled by default
- [x] Implement split-pane layout: left panel (scrollable, ~50% width) for tab content, right panel (sticky, ~50% width) for preview
- [x] Add "Resume" to sidebar navigation in `app/layouts/default.vue` (icon: `i-lucide-file-text`, route: `/resumes/generate`)
- [x] Ensure responsive behavior: on mobile, stack panels vertically or provide a toggle

**Dependencies:** None
**Success criteria:** Page loads at `/resumes/generate` with sidebar visible, two tabs render, split-pane layout displays with placeholder content on left and empty preview area on right. "Resume" appears in sidebar nav.

---

### FE-002: Content Editor — Section Accordion Structure
- [x] Create `app/components/resume/ContentEditor.vue` as the Content Editor tab content
- [x] Implement collapsible accordion sections using `UAccordion` for: Professional Summary, Work Experience, Education, Skills, Certifications
- [x] Each section header has a checkbox (via `UCheckbox`) to toggle the entire section on/off
- [x] Each section has expand/collapse behavior
- [x] Use mock/hardcoded data to prototype the section structure

**Dependencies:** FE-001
**Success criteria:** All five sections render as collapsible accordions with section-level checkboxes. Checking/unchecking a section header toggles all items within it. Sections expand and collapse.

---

### FE-003: Content Editor — Work Experience Nested Checkboxes
- [x] Within the Work Experience accordion, display each experience entry with: employer name, job title, and a checkbox
- [x] Within each experience entry, display individual highlight/bullet items with checkboxes
- [x] Display metadata inline: employment type, location type, date range
- [x] Implement parent-child checkbox logic: unchecking all bullets unchecks the experience; checking an experience checks all its bullets
- [x] Implement section-level checkbox logic: unchecking all experiences unchecks the section header
- [x] Create `app/components/resume/ContentSection.vue` as a reusable component for the checkbox tree pattern

**Dependencies:** FE-002
**Success criteria:** Work experience section shows nested checkboxes at experience and bullet level. Parent-child toggle logic works correctly in both directions. Section header checkbox reflects aggregate state (checked, unchecked, indeterminate).

---

### FE-004: Content Editor — Education, Skills, Certifications, Summary Sections
- [x] Education section: each entry shows institution, degree, area of study with a checkbox
- [x] Skills section: each skill displayed as a checkbox item (tag-style or list layout)
- [x] Certifications section: each entry shows name and issuer with a checkbox
- [x] Professional Summary section: single checkbox to include/exclude the summary text, with the summary displayed as read-only text
- [x] All sections use the same `ContentSection.vue` pattern or similar reusable approach

**Dependencies:** FE-002
**Success criteria:** All four sections render with appropriate content and checkboxes. Toggling works at section and item level.

---

### FE-005: Live Resume Preview Component
- [x] Create `app/components/resume/ResumePreview.vue` that renders a styled HTML resume
- [x] Preview includes: name header with contact info, professional summary, work experience with bullets, education, skills list, certifications
- [x] Style the preview to resemble a professional resume document (clean typography, section headers, proper spacing)
- [x] Preview panel is sticky/fixed position while left panel scrolls
- [x] Accept props for: selected content items, accent color
- [x] Render only the content items that are currently selected (checked)

**Dependencies:** FE-001
**Success criteria:** Preview renders a professional-looking resume from provided data. Only selected content appears. Changing selections immediately updates the preview. Preview stays visible while scrolling the left panel.

---

### FE-006: Designer Tab — Accent Color Picker
- [x] Create `app/components/resume/Designer.vue` as the Designer tab content
- [x] Display an accent color picker (preset color swatches + optional custom color input)
- [x] Default accent color: a professional color (e.g., dark teal `#0d9488` or navy `#1e3a5f`)
- [x] Changing the color updates the preview in real-time (section headers, name color)

**Dependencies:** FE-001, FE-005
**Success criteria:** Designer tab shows color picker. Selecting a color immediately updates the resume preview's accent color. Default color is applied on page load.

---

### FE-007: PDF Export
- [x] Install a client-side PDF generation library (e.g., `html2pdf.js` or `jsPDF` with `html2canvas`)
- [x] Wire the "Export PDF" button to generate a PDF from the `ResumePreview` component's rendered HTML
- [x] PDF should match the visual appearance of the HTML preview (fonts, colors, layout)
- [x] Downloaded file should be named sensibly (e.g., `resume.pdf` or `{firstName}_{lastName}_resume.pdf`)
- [x] Disable the "Export PDF" button when no content is selected
- [x] Show loading state on the button during PDF generation

**Dependencies:** FE-005
**Success criteria:** Clicking "Export PDF" downloads a PDF that matches the on-screen preview. Button is disabled when no content is selected. Loading indicator shows during generation.

**Note:** Implemented using browser's native print functionality (window.print()) with print-optimized CSS. Users can save as PDF from the print dialog.

---

## Phase 2: Integration (Wire to Store)

### FE-008: Wire Content Editor to careerIDStore
- [x] On page mount, read all profile data from `careerIDStore` (contactInfo, experience, education, profileSkills, certifications)
- [x] Initialize all content as selected (all checkboxes checked)
- [x] Pass selected content to `ResumePreview` component as reactive props
- [x] Ensure preview updates in real-time as checkboxes are toggled
- [x] Handle edge cases: empty sections (no experience, no education, etc.) — hide or show empty state

**Dependencies:** FE-002, FE-003, FE-004, FE-005
**Success criteria:** Page loads real profile data from the store. All content starts selected. Toggling checkboxes updates the preview in real-time. Empty sections are handled gracefully.

---

### FE-009: Generate Resume Button on Profile Dashboard
- [x] Add a "Generate Resume" button to `app/pages/profile/index.vue` in the primary action area (top of the profile content)
- [x] Button uses `UButton` with label "Generate Resume", primary color, and an appropriate icon (e.g., `i-lucide-file-text`)
- [x] Button navigates to `/resumes/generate` on click
- [x] Only show the button when the user has at least one work experience OR education entry (check `careerIDStore.sectionCounts`)
- [x] Hide the button when profile is in empty state or incomplete with no relevant data

**Dependencies:** FE-001
**Success criteria:** "Generate Resume" button appears on the profile dashboard when the user has experience or education data. Clicking it navigates to `/resumes/generate`. Button is hidden when no relevant profile data exists.

---

## Phase 3: Editor Tab (Content Editing Before Export)

> **Context:** The existing "Content Editor" tab is being renamed to "Content" (selection only). A new "Editor" tab is added between Content and Designer for editing selected content text before export. Edits are session-only and never written back to careerIDStore.

### FE-010: Rename Content Editor Tab & Add Editor Tab to Page Shell
- [x] Rename the existing "Content Editor" tab to "Content" (label and icon update in `generate.vue`)
- [x] Add a new "Editor" tab between Content and Designer (icon: `i-lucide-pencil`, value: `editor`)
- [x] Create `app/components/resume/ContentEditorForm.vue` as the Editor tab content component
- [x] Wire the new tab to display `ContentEditorForm` in the left panel when active

**Dependencies:** FE-001 (complete)
**Success criteria:** Three tabs render: Content, Editor, Designer. Switching between tabs works. Editor tab shows placeholder content.

---

### FE-011: Editable Data Layer (Session-Only Deep Copy)
- [x] In `generate.vue`, create an `editableData` reactive object that deep-copies `profileData` on initialization
- [x] The `editableData` object mirrors the structure of `profileData` but with mutable fields
- [x] Update `previewData` computed to read from `editableData` instead of `profileData` (so edits flow to preview)
- [x] Ensure the preview and PDF/DOCX export use `editableData` as the source of truth
- [x] When selections change in the Content tab, sync new selections into `editableData` (add newly selected items from profileData, remove deselected items, preserve edits on items that remain selected)

**Dependencies:** FE-010
**Success criteria:** `editableData` is initialized from profile data. Preview renders from `editableData`. Editing a field in `editableData` updates the preview in real-time. Deselecting an item in Content tab removes it from `editableData`. Re-selecting an item restores it from `profileData` (original, not edited).

---

### FE-012: Editor Tab — Work Experience Editable Forms
- [x] In `ContentEditorForm.vue`, display each selected work experience in an editable card/section
- [x] Each experience shows editable `UInput` fields for: job title, company/employer name
- [x] Each experience shows editable date fields for: start date, end date (using masked input or date picker, MM/YYYY format)
- [x] Each experience shows editable `UTextarea` fields for each selected achievement/highlight bullet
- [x] Display employment type and location type as read-only metadata (not editable)
- [x] Only show experiences that are currently selected in the Content tab
- [x] All fields use v-model bound to `editableData` so changes flow to preview in real-time

**Dependencies:** FE-011
**Success criteria:** Selected work experiences appear with editable fields. Typing in any field updates the preview immediately. Unselected experiences do not appear. Fields are visually styled as editable inputs with labels.

---

### FE-013: Editor Tab — Education, Skills, Certifications, Summary Editable Forms
- [x] Professional Summary: editable `UTextarea` for the summary text (only shown if summary is enabled in Content tab)
- [x] Education: each selected entry shows editable `UInput` fields for degree, institution, field of study, and date fields for start/end dates
- [x] Skills: each selected skill shows an editable `UInput` for the skill name
- [x] Certifications: each selected certification shows editable `UInput` fields for name, issuer, and issue date
- [x] All fields use v-model bound to `editableData`
- [x] Sections with no selected items are hidden

**Dependencies:** FE-011
**Success criteria:** All selected content types appear with appropriate editable fields. Editing any field updates the preview in real-time. Empty sections are hidden.

---

### FE-014: Editor Tab — Selection Sync & Edit Preservation
- [x] When user switches from Editor to Content tab, deselects an item, then returns to Editor: the deselected item is removed and its edits are discarded
- [x] When user switches from Editor to Content tab, selects a NEW item, then returns to Editor: the new item appears with original profile data (not edited)
- [x] Edits to items that remain selected are preserved across all tab switches (Content ↔ Editor ↔ Designer)
- [x] Verify that edits never propagate back to `careerIDStore` — profile data remains unchanged

**Dependencies:** FE-012, FE-013
**Success criteria:** Deselecting items removes them from Editor and discards edits. Newly selected items appear with original data. Edits persist across tab switches. Profile store is never modified.
