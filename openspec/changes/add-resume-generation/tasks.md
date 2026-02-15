# Tasks: Add Resume Generation

> **Note:** This change is frontend-only. No new backend endpoints or database tables are needed — all profile data is already available via `careerIDStore`. Phase order: Frontend Prototype → Integration (wire to store).

---

## Phase 1A: Frontend Prototype

### FE-001: Resume Generation Page Shell & Routing
- [ ] Create `app/pages/resumes/generate.vue` with `UDashboardPanel` layout (title "Resume", toolbar with tabs)
- [ ] Add two tabs using `UTabs` or `UNavigationMenu`: "Content Editor" (icon: `i-lucide-file-text`) and "Designer" (icon: `i-lucide-palette`)
- [ ] Add "Export PDF" button in the page header area (far right), disabled by default
- [ ] Implement split-pane layout: left panel (scrollable, ~50% width) for tab content, right panel (sticky, ~50% width) for preview
- [ ] Add "Resume" to sidebar navigation in `app/layouts/default.vue` (icon: `i-lucide-file-text`, route: `/resumes/generate`)
- [ ] Ensure responsive behavior: on mobile, stack panels vertically or provide a toggle

**Dependencies:** None
**Success criteria:** Page loads at `/resumes/generate` with sidebar visible, two tabs render, split-pane layout displays with placeholder content on left and empty preview area on right. "Resume" appears in sidebar nav.

---

### FE-002: Content Editor — Section Accordion Structure
- [ ] Create `app/components/resume/ContentEditor.vue` as the Content Editor tab content
- [ ] Implement collapsible accordion sections using `UAccordion` for: Professional Summary, Work Experience, Education, Skills, Certifications
- [ ] Each section header has a checkbox (via `UCheckbox`) to toggle the entire section on/off
- [ ] Each section has expand/collapse behavior
- [ ] Use mock/hardcoded data to prototype the section structure

**Dependencies:** FE-001
**Success criteria:** All five sections render as collapsible accordions with section-level checkboxes. Checking/unchecking a section header toggles all items within it. Sections expand and collapse.

---

### FE-003: Content Editor — Work Experience Nested Checkboxes
- [ ] Within the Work Experience accordion, display each experience entry with: employer name, job title, and a checkbox
- [ ] Within each experience entry, display individual highlight/bullet items with checkboxes
- [ ] Display metadata inline: employment type, location type, date range
- [ ] Implement parent-child checkbox logic: unchecking all bullets unchecks the experience; checking an experience checks all its bullets
- [ ] Implement section-level checkbox logic: unchecking all experiences unchecks the section header
- [ ] Create `app/components/resume/ContentSection.vue` as a reusable component for the checkbox tree pattern

**Dependencies:** FE-002
**Success criteria:** Work experience section shows nested checkboxes at experience and bullet level. Parent-child toggle logic works correctly in both directions. Section header checkbox reflects aggregate state (checked, unchecked, indeterminate).

---

### FE-004: Content Editor — Education, Skills, Certifications, Summary Sections
- [ ] Education section: each entry shows institution, degree, area of study with a checkbox
- [ ] Skills section: each skill displayed as a checkbox item (tag-style or list layout)
- [ ] Certifications section: each entry shows name and issuer with a checkbox
- [ ] Professional Summary section: single checkbox to include/exclude the summary text, with the summary displayed as read-only text
- [ ] All sections use the same `ContentSection.vue` pattern or similar reusable approach

**Dependencies:** FE-002
**Success criteria:** All four sections render with appropriate content and checkboxes. Toggling works at section and item level.

---

### FE-005: Live Resume Preview Component
- [ ] Create `app/components/resume/ResumePreview.vue` that renders a styled HTML resume
- [ ] Preview includes: name header with contact info, professional summary, work experience with bullets, education, skills list, certifications
- [ ] Style the preview to resemble a professional resume document (clean typography, section headers, proper spacing)
- [ ] Preview panel is sticky/fixed position while left panel scrolls
- [ ] Accept props for: selected content items, accent color
- [ ] Render only the content items that are currently selected (checked)

**Dependencies:** FE-001
**Success criteria:** Preview renders a professional-looking resume from provided data. Only selected content appears. Changing selections immediately updates the preview. Preview stays visible while scrolling the left panel.

---

### FE-006: Designer Tab — Accent Color Picker
- [ ] Create `app/components/resume/Designer.vue` as the Designer tab content
- [ ] Display an accent color picker (preset color swatches + optional custom color input)
- [ ] Default accent color: a professional color (e.g., dark teal `#0d9488` or navy `#1e3a5f`)
- [ ] Changing the color updates the preview in real-time (section headers, name color)

**Dependencies:** FE-001, FE-005
**Success criteria:** Designer tab shows color picker. Selecting a color immediately updates the resume preview's accent color. Default color is applied on page load.

---

### FE-007: PDF Export
- [ ] Install a client-side PDF generation library (e.g., `html2pdf.js` or `jsPDF` with `html2canvas`)
- [ ] Wire the "Export PDF" button to generate a PDF from the `ResumePreview` component's rendered HTML
- [ ] PDF should match the visual appearance of the HTML preview (fonts, colors, layout)
- [ ] Downloaded file should be named sensibly (e.g., `resume.pdf` or `{firstName}_{lastName}_resume.pdf`)
- [ ] Disable the "Export PDF" button when no content is selected
- [ ] Show loading state on the button during PDF generation

**Dependencies:** FE-005
**Success criteria:** Clicking "Export PDF" downloads a PDF that matches the on-screen preview. Button is disabled when no content is selected. Loading indicator shows during generation.

---

## Phase 2: Integration (Wire to Store)

### FE-008: Wire Content Editor to careerIDStore
- [ ] On page mount, read all profile data from `careerIDStore` (contactInfo, experience, education, profileSkills, certifications)
- [ ] Initialize all content as selected (all checkboxes checked)
- [ ] Pass selected content to `ResumePreview` component as reactive props
- [ ] Ensure preview updates in real-time as checkboxes are toggled
- [ ] Handle edge cases: empty sections (no experience, no education, etc.) — hide or show empty state

**Dependencies:** FE-002, FE-003, FE-004, FE-005
**Success criteria:** Page loads real profile data from the store. All content starts selected. Toggling checkboxes updates the preview in real-time. Empty sections are handled gracefully.

---

### FE-009: Generate Resume Button on Profile Dashboard
- [ ] Add a "Generate Resume" button to `app/pages/profile/index.vue` in the primary action area (top of the profile content)
- [ ] Button uses `UButton` with label "Generate Resume", primary color, and an appropriate icon (e.g., `i-lucide-file-text`)
- [ ] Button navigates to `/resumes/generate` on click
- [ ] Only show the button when the user has at least one work experience OR education entry (check `careerIDStore.sectionCounts`)
- [ ] Hide the button when profile is in empty state or incomplete with no relevant data

**Dependencies:** FE-001
**Success criteria:** "Generate Resume" button appears on the profile dashboard when the user has experience or education data. Clicking it navigates to `/resumes/generate`. Button is hidden when no relevant profile data exists.
