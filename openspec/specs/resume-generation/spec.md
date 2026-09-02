## ADDED Requirements

### Requirement: Resume Generation Entry Point
The application SHALL provide a discoverable entry point for resume generation from the profile dashboard.

#### Scenario: Display Generate Resume button on profile dashboard
- **GIVEN** a user has a completed profile with at least one work experience or education entry
- **WHEN** the user views their profile dashboard (`/profile`)
- **THEN** the system SHALL display a prominent "Generate Resume" button in the primary action area
- **AND** the button SHALL use the label "Generate Resume"
- **AND** clicking the button SHALL navigate the user to `/docs/resumes`

#### Scenario: Hide Generate Resume button when profile is incomplete
- **GIVEN** a user has no work experience and no education entries
- **WHEN** the user views their profile dashboard
- **THEN** the system SHALL NOT display the "Generate Resume" button

### Requirement: Resume Sidebar Navigation
The application SHALL include a "Docs" collapsible group in the sidebar navigation containing a "Resumes" child item.

#### Scenario: Display Docs group in sidebar
- **WHEN** the user views any page with the default layout
- **THEN** the sidebar SHALL display a "Docs" navigation group
- **AND** the "Docs" group SHALL contain a "Resumes" child item linking to `/docs/resumes`
- **AND** the sidebar SHALL NOT display a flat "Resume" link

### Requirement: Resume Generation Page Layout
The application SHALL provide a split-pane resume generation interface at `/docs/resumes/[id]` with three tabs: Content, Edit, and Design.

#### Scenario: Display resume generation page with 3 tabs
- **WHEN** the user navigates to `/docs/resumes/[id]`
- **THEN** the system SHALL display a page with three tabs: "Content", "Edit", and "Design"
- **AND** the "Content" tab SHALL be active by default
- **AND** the page SHALL display a split-pane layout with tab controls on the left and a live resume preview on the right
- **AND** the page SHALL have a title area with the resume title and an "Export" button to the far right
- **AND** the page SHALL use the default layout (sidebar visible)

#### Scenario: Load resume data from saved snapshot
- **WHEN** the resume generation page loads at `/docs/resumes/[id]`
- **THEN** the system SHALL load the `content` and `design_settings` from the `docs.resumes` record
- **AND** the editor SHALL initialize with the saved content selections and design settings
- **AND** the live preview SHALL render the resume from the saved snapshot

### Requirement: Content Tab
The application SHALL provide a Content tab for selecting which profile snapshot items to include in the resume and syncing new profile data.

#### Scenario: Display content sections with checkboxes
- **WHEN** the user views the Content tab
- **THEN** the system SHALL display collapsible accordion sections for: Professional Summary, Work Experience, Education, Skills, and Certifications
- **AND** each section SHALL be expandable/collapsible
- **AND** each section header SHALL display a checkbox to toggle the entire section
- **AND** each item SHALL have a checkbox to include or exclude it from the resume

#### Scenario: Display Sync from Profile button
- **WHEN** the user views the Content tab
- **THEN** the system SHALL display a "Sync from Profile" button
- **AND** clicking it SHALL append new profile items (new IDs only) to each section as unselected, "New"-badged items
- **AND** a dismissible banner SHALL show how many items were added

#### Scenario: Show snapshot date
- **WHEN** the user views the Content tab
- **THEN** the system SHALL display when the resume's profile snapshot was last taken (e.g., "Snapshot taken Apr 28, 2026")

#### Scenario: Select work experience content at granular level
- **WHEN** the user expands the Work Experience section
- **THEN** the system SHALL display each experience entry with a checkbox
- **AND** each experience entry SHALL display the employer name and job title
- **AND** within each experience, the system SHALL display individual highlight/bullet checkboxes
- **AND** the user SHALL be able to check/uncheck individual bullets independently
- **AND** unchecking all bullets within an experience SHALL uncheck the experience entry
- **AND** checking an experience entry SHALL check all its bullets

#### Scenario: Select education content
- **WHEN** the user expands the Education section
- **THEN** the system SHALL display each education entry with a checkbox
- **AND** each entry SHALL display the institution, degree type, and area of study

#### Scenario: Select skills content
- **WHEN** the user expands the Skills section
- **THEN** the system SHALL display each skill with a checkbox
- **AND** skills SHALL be displayed as a list or tag-style layout with individual toggles

#### Scenario: Select certifications content
- **WHEN** the user expands the Certifications section
- **THEN** the system SHALL display each certification with a checkbox
- **AND** each entry SHALL display the certification name and issuer

#### Scenario: Toggle Professional Summary
- **WHEN** the user expands the Professional Summary section
- **THEN** the system SHALL display the summary text with a single checkbox to include/exclude it

### Requirement: Edit Tab
The application SHALL provide an Edit tab showing only selected items in editable form fields with section and item reordering controls.

#### Scenario: Display only selected items
- **WHEN** the user views the Edit tab
- **THEN** the system SHALL display only items that are selected (checked) in the Content tab
- **AND** unselected items SHALL NOT appear

#### Scenario: Edit text fields for selected items
- **WHEN** the user views an experience, education, or certification in the Edit tab
- **THEN** the system SHALL display editable fields for all text content
- **AND** the live preview SHALL update in real-time as the user types

#### Scenario: Display selected work experiences in editable format
- **GIVEN** the user has selected work experiences in the Content tab
- **WHEN** the user switches to the Edit tab
- **THEN** the system SHALL display each selected work experience in an editable form
- **AND** each experience SHALL show editable fields for job title, company name, start date, end date, and achievement bullets
- **AND** all fields SHALL contain the current content from the user's profile
- **AND** experiences that were not selected in the Content tab SHALL NOT appear

#### Scenario: Display selected education entries in editable format
- **GIVEN** the user has selected education entries in the Content tab
- **WHEN** the user views the Edit tab
- **THEN** the system SHALL display each selected education entry with editable fields for degree name, institution name, field of study, and dates

#### Scenario: Display selected skills in editable format
- **GIVEN** the user has selected skills in the Content tab
- **WHEN** the user views the Edit tab
- **THEN** the system SHALL display each selected skill in an editable text field

#### Scenario: Display selected certifications in editable format
- **GIVEN** the user has selected certifications in the Content tab
- **WHEN** the user views the Edit tab
- **THEN** the system SHALL display each selected certification with editable fields for name, issuer, and date

#### Scenario: Display professional summary in editable format
- **GIVEN** the user has enabled the professional summary in the Content tab
- **WHEN** the user views the Edit tab
- **THEN** the system SHALL display the summary in an editable textarea

#### Scenario: Reorder sections with up/down buttons
- **WHEN** the user views the Edit tab
- **THEN** each section header SHALL display ↑ and ↓ buttons
- **AND** clicking SHALL move the section up or down in the resume order
- **AND** the live preview SHALL reflect the new section order immediately
- **AND** the order SHALL be persisted in `sectionOrder` when the resume is saved

#### Scenario: Reorder items within a section
- **WHEN** the user views items within a section in the Edit tab
- **THEN** each item SHALL display ↑ and ↓ buttons
- **AND** clicking SHALL swap the item's position with the adjacent item

#### Scenario: Empty state when nothing selected
- **WHEN** the user views the Edit tab with no items selected in Content
- **THEN** the system SHALL display an empty state with a message directing the user to select content first

#### Scenario: Edits do not affect the profile
- **WHEN** a user edits text in the Edit tab
- **THEN** the changes SHALL only apply to the resume document
- **AND** the user's saved profile data SHALL remain unchanged

#### Scenario: Update live preview in real-time during editing
- **GIVEN** the user is editing content in the Edit tab
- **WHEN** the user types or modifies any field
- **THEN** the live preview SHALL update immediately to reflect the change
- **AND** the preview SHALL show exactly how the edited content will appear in the final export

#### Scenario: Handle removed selections when navigating back to Content tab
- **GIVEN** the user has edited items in the Edit tab, switches to the Content tab, and unchecks one of the edited items
- **WHEN** the user returns to the Edit tab
- **THEN** the system SHALL no longer display the unchecked item
- **AND** the system SHALL discard any edits made to the removed item
- **AND** the system SHALL preserve edits to items that remain selected

#### Scenario: Preserve edits during tab switching
- **GIVEN** the user has made edits in the Edit tab
- **WHEN** the user switches to the Content or Designer tab and back to the Edit tab
- **THEN** all edits SHALL be preserved

#### Scenario: Display clear visual indication of editable fields
- **WHEN** the user views the Edit tab
- **THEN** the system SHALL visually distinguish editable fields with borders, background colors, or input styling
- **AND** field labels SHALL guide the user on what each field contains

### Requirement: Live Resume Preview
The application SHALL display a live HTML preview of the resume that updates in real-time.

#### Scenario: Update preview on content change
- **GIVEN** the user is on the Content tab
- **WHEN** the user checks or unchecks any content item
- **THEN** the live preview on the right side SHALL update immediately to reflect the change
- **AND** checked items SHALL appear in the preview
- **AND** unchecked items SHALL NOT appear in the preview

#### Scenario: Preview layout
- **WHEN** the user views the resume preview
- **THEN** the preview SHALL render as styled HTML resembling a professional resume document
- **AND** the preview SHALL include the user's name, contact info, and job title as a header
- **AND** the preview SHALL organize content into labeled sections (e.g., "WORK EXPERIENCE", "EDUCATION", "SKILLS")
- **AND** the preview panel SHALL be sticky/fixed while the left panel scrolls

#### Scenario: Preview with accent color
- **GIVEN** the user has selected an accent color in the Designer tab
- **WHEN** the user views the preview
- **THEN** section headers and the user's name SHALL use the selected accent color

### Requirement: Designer Tab
The application SHALL provide a Designer tab with accent color selection and header style presets.

#### Scenario: Display accent color picker
- **WHEN** the user switches to the Designer tab
- **THEN** the system SHALL display an accent color picker with preset swatches
- **AND** the default accent color SHALL be a professional color (e.g., dark teal or navy)
- **AND** changing the accent color SHALL immediately update the live preview

#### Scenario: Display header style presets
- **WHEN** the user views the Designer tab
- **THEN** the system SHALL display three header style options: Classic, Bold, and Minimal
- **AND** Classic SHALL render section headers with a colored underline
- **AND** Bold SHALL render section headers with a filled color block background
- **AND** Minimal SHALL render section headers with a thin neutral separator line
- **AND** selecting a style SHALL immediately update the live preview

#### Scenario: Header style persisted on save
- **WHEN** the user saves the resume after selecting a header style
- **THEN** the selected style SHALL be stored in `design_settings.headerStyle`
- **AND** the style SHALL be restored when the resume is loaded again

### Requirement: PDF Export
The application SHALL allow users to export the current resume as a PDF file.

#### Scenario: Export resume as PDF
- **GIVEN** the user has at least one content item selected
- **WHEN** the user clicks the "Export PDF" button
- **THEN** the system SHALL generate a PDF from the current resume preview
- **AND** the system SHALL download the PDF file to the user's device
- **AND** the PDF SHALL match the content and styling shown in the live preview

#### Scenario: Disable export with no content
- **GIVEN** the user has no content items selected (all checkboxes unchecked)
- **WHEN** the user views the "Export PDF" button
- **THEN** the button SHALL be disabled
- **AND** the system SHALL display a message indicating content must be selected

### Requirement: Session-Only State
The application SHALL manage resume generation state within the current session only, with persistence to the database on save.

#### Scenario: State preserved during tab switching
- **GIVEN** the user has made content selections on the Content tab
- **WHEN** the user switches to the Designer tab and back to Content
- **THEN** all content selections SHALL be preserved

#### Scenario: State persisted on save
- **GIVEN** the user has made content and style selections at `/docs/resumes/[id]`
- **WHEN** the user saves the resume
- **THEN** the system SHALL persist the current editable state to `docs.resumes.content` and `docs.resumes.design_settings`
- **AND** the previous snapshot SHALL be replaced

#### Scenario: State cleared on navigation away without saving
- **GIVEN** the user has made unsaved changes at `/docs/resumes/[id]`
- **WHEN** the user navigates away without saving
- **THEN** unsaved changes SHALL be discarded
- **AND** returning to `/docs/resumes/[id]` SHALL load the last saved snapshot
