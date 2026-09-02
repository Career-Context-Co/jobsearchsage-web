## MODIFIED Requirements

### Requirement: Resume Generation Page Layout
The application SHALL provide a split-pane resume generation interface at `/docs/resumes/[id]` with three tabs: Content, Edit, and Design.

#### Scenario: Display resume generation page with 3 tabs
- **WHEN** the user navigates to `/docs/resumes/[id]`
- **THEN** the system SHALL display a page with three tabs: "Content", "Edit", and "Design"
- **AND** the "Content" tab SHALL be active by default
- **AND** the page SHALL display a split-pane layout with tab controls on the left and a live resume preview on the right

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
- **AND** each item SHALL have a checkbox to include or exclude it from the resume

#### Scenario: Display Sync from Profile button
- **WHEN** the user views the Content tab
- **THEN** the system SHALL display a "Sync from Profile" button
- **AND** clicking it SHALL append new profile items (new IDs only) to each section as unselected, "New"-badged items
- **AND** a dismissible banner SHALL show how many items were added

#### Scenario: Show snapshot date
- **WHEN** the user views the Content tab
- **THEN** the system SHALL display when the resume's profile snapshot was last taken (e.g., "Snapshot taken Apr 28, 2026")

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

### Requirement: Designer Tab
The application SHALL provide a Designer tab with accent color selection and header style presets.

#### Scenario: Display accent color picker
- **WHEN** the user switches to the Designer tab
- **THEN** the system SHALL display an accent color picker with preset swatches
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
