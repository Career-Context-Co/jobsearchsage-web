# Change: Add Resume Generation

## Why
Users have built rich career profiles with experiences, education, skills, certifications, and enhanced achievement bullets — but currently have no way to turn that data into a downloadable resume. Resume generation is the core value proposition that transforms a Career ID profile into a tangible job search asset. The settings page already has a disabled "Resume Generation" feature toggle, indicating this has been planned.

## What Changes
- Add a "Generate Resume" button on the profile dashboard that navigates to the resume generation page
- Create a new `/resumes/generate` page using the default layout (sidebar visible) with a split-pane interface: content editor on the left, live HTML resume preview on the right
- Implement a tabbed interface with two tabs: **Content Editor** (select/deselect profile content at granular level) and **Designer** (accent color picker for v1)
- Content Editor provides collapsible accordion sections (Professional Summary, Work Experience, Education, Skills, Certifications) with nested checkboxes — users can toggle entire sections, individual entries, or specific bullets within an experience
- Live HTML preview updates in real-time as users check/uncheck content
- "Export PDF" button in the page header generates and downloads a PDF from the current preview
- Add "Resume" as a top-level item in the sidebar navigation
- All state is component-local (refs/reactive in the page and its child components) — no Pinia store needed since this is a single-session flow

## What Does NOT Change
- No new database tables or API endpoints for resume storage (session-only, no persistence)
- No saving partial resume progress to return later
- No DOCX export (PDF only for v1)
- No multiple templates (single clean template with configurable accent color)
- No job-matching, analyzer, or cover letter features
- Profile data is read-only during resume generation — edits happen back on the profile pages

## Impact
- Affected specs: NEW `resume-generation` capability
- Affected code:
  - `app/pages/resumes/generate.vue` - NEW: Main resume generation page with split-pane layout
  - `app/components/resume/` - NEW: Component directory for resume builder UI
    - `ContentEditor.vue` - Accordion sections with nested checkboxes
    - `Designer.vue` - Accent color picker
    - `ResumePreview.vue` - Live HTML resume preview
    - `ContentSection.vue` - Reusable collapsible section with checkbox tree
  - `app/layouts/default.vue` - MODIFIED: Add "Resume" to sidebar navigation
  - `app/pages/profile/index.vue` - MODIFIED: Add "Generate Resume" button

## Capabilities
- `resume-generation` - NEW capability for generating downloadable resumes from profile data

## Design Notes
- Use existing Nuxt UI components (UPageCard, UAccordion, UCheckbox, UTabs, etc.) consistent with the app's design language
- The split-pane layout should be responsive — on mobile, preview could stack below the editor or be toggled
- Preview renders as styled HTML (not an embedded PDF) for real-time reactivity
- PDF generation from the HTML preview (client-side library like html2pdf.js or jsPDF)
- Content is pre-populated from `careerIDStore` — all experiences, education, skills, etc. start as checked, and users deselect what they don't want
