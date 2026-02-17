## ADDED Requirements

### Requirement: Resume Generation Entry Point
The application SHALL provide a discoverable entry point for resume generation from the profile dashboard.

#### Scenario: Display Generate Resume button on profile dashboard
- **GIVEN** a user has a completed profile with at least one work experience or education entry
- **WHEN** the user views their profile dashboard (`/profile`)
- **THEN** the system SHALL display a prominent "Generate Resume" button in the primary action area
- **AND** the button SHALL use the label "Generate Resume"
- **AND** clicking the button SHALL navigate the user to `/resumes/generate`

#### Scenario: Hide Generate Resume button when profile is incomplete
- **GIVEN** a user has no work experience and no education entries
- **WHEN** the user views their profile dashboard
- **THEN** the system SHALL NOT display the "Generate Resume" button

### Requirement: Resume Sidebar Navigation
The application SHALL include a "Resume" entry in the sidebar navigation.

#### Scenario: Display Resume in sidebar
- **WHEN** the user views any page with the default layout
- **THEN** the sidebar SHALL display a "Resume" navigation item alongside Home, Profile, and Settings
- **AND** clicking "Resume" SHALL navigate to `/resumes/generate`

### Requirement: Resume Generation Page Layout
The application SHALL provide a split-pane resume generation interface at `/resumes/generate`.

#### Scenario: Display resume generation page
- **WHEN** the user navigates to `/resumes/generate`
- **THEN** the system SHALL display a page using the default layout (sidebar visible)
- **AND** the page SHALL have a title area with "Resume" and an "Export PDF" button to the far right
- **AND** the page SHALL display three tabs: "Content" (select what to include), "Editor" (edit selected content text), and "Designer" (styling)
- **AND** the page SHALL display a split-pane layout with tab controls on the left and a live resume preview on the right
- **AND** the "Content" tab SHALL be active by default

#### Scenario: Load profile data into resume builder
- **WHEN** the resume generation page loads
- **THEN** the system SHALL read all profile data from the careerIDStore
- **AND** all content sections (summary, experiences, education, skills, certifications) SHALL be pre-selected (checked)
- **AND** the live preview SHALL render a complete resume with all profile content

### Requirement: Content Editor Tab
The application SHALL provide a Content Editor tab with collapsible sections and granular checkbox selection.

#### Scenario: Display content sections
- **WHEN** the user views the Content Editor tab
- **THEN** the system SHALL display collapsible accordion sections for: Professional Summary, Work Experience, Education, Skills, and Certifications
- **AND** each section SHALL be expandable/collapsible
- **AND** each section header SHALL display a checkbox to toggle the entire section

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

### Requirement: Editor Tab
The application SHALL provide an Editor tab that displays all selected content in editable form fields, allowing users to make session-only text edits before export.

#### Scenario: Display selected work experiences in editable format
- **GIVEN** the user has selected work experiences in the Content tab
- **WHEN** the user switches to the Editor tab
- **THEN** the system SHALL display each selected work experience in an editable form
- **AND** each experience SHALL show editable fields for job title, company name, start date, end date, and achievement bullets
- **AND** all fields SHALL contain the current content from the user's profile
- **AND** experiences that were not selected in the Content tab SHALL NOT appear

#### Scenario: Display selected education entries in editable format
- **GIVEN** the user has selected education entries in the Content tab
- **WHEN** the user views the Editor tab
- **THEN** the system SHALL display each selected education entry with editable fields for degree name, institution name, field of study, and dates

#### Scenario: Display selected skills in editable format
- **GIVEN** the user has selected skills in the Content tab
- **WHEN** the user views the Editor tab
- **THEN** the system SHALL display each selected skill in an editable text field

#### Scenario: Display selected certifications in editable format
- **GIVEN** the user has selected certifications in the Content tab
- **WHEN** the user views the Editor tab
- **THEN** the system SHALL display each selected certification with editable fields for name, issuer, and date

#### Scenario: Display professional summary in editable format
- **GIVEN** the user has enabled the professional summary in the Content tab
- **WHEN** the user views the Editor tab
- **THEN** the system SHALL display the summary in an editable textarea

#### Scenario: Update live preview in real-time during editing
- **GIVEN** the user is editing content in the Editor tab
- **WHEN** the user types or modifies any field
- **THEN** the live preview SHALL update immediately to reflect the change
- **AND** the preview SHALL show exactly how the edited content will appear in the final export

#### Scenario: Apply edits only to resume generation session
- **GIVEN** the user has edited content in the Editor tab and downloaded their resume
- **WHEN** the user exits the resume generation flow and views their profile
- **THEN** the profile SHALL display the original, unedited content
- **AND** the system SHALL NOT have modified the user's saved profile data

#### Scenario: Handle removed selections when navigating back to Content tab
- **GIVEN** the user has edited items in the Editor tab, switches to the Content tab, and unchecks one of the edited items
- **WHEN** the user returns to the Editor tab
- **THEN** the system SHALL no longer display the unchecked item
- **AND** the system SHALL discard any edits made to the removed item
- **AND** the system SHALL preserve edits to items that remain selected

#### Scenario: Preserve edits during tab switching
- **GIVEN** the user has made edits in the Editor tab
- **WHEN** the user switches to the Content or Designer tab and back to the Editor tab
- **THEN** all edits SHALL be preserved

#### Scenario: Display clear visual indication of editable fields
- **WHEN** the user views the Editor tab
- **THEN** the system SHALL visually distinguish editable fields with borders, background colors, or input styling
- **AND** field labels SHALL guide the user on what each field contains

### Requirement: Live Resume Preview
The application SHALL display a live HTML preview of the resume that updates in real-time.

#### Scenario: Update preview on content change
- **GIVEN** the user is on the Content Editor tab
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
The application SHALL provide a Designer tab with accent color selection.

#### Scenario: Display accent color picker
- **WHEN** the user switches to the Designer tab
- **THEN** the system SHALL display an accent color picker
- **AND** the default accent color SHALL be a professional color (e.g., dark teal or navy)
- **AND** changing the accent color SHALL immediately update the live preview

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
The application SHALL manage resume generation state within the current session only.

#### Scenario: State preserved during tab switching
- **GIVEN** the user has made content selections on the Content Editor tab
- **WHEN** the user switches to the Designer tab and back to Content Editor
- **THEN** all content selections SHALL be preserved

#### Scenario: State cleared on navigation away
- **GIVEN** the user has made content and style selections
- **WHEN** the user navigates away from `/resumes/generate` (via sidebar or browser)
- **THEN** all selections SHALL be discarded
- **AND** returning to `/resumes/generate` SHALL start fresh with all content pre-selected
