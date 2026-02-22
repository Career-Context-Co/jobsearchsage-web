## MODIFIED Requirements

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

### Requirement: Resume Generation Page Layout
The application SHALL provide a split-pane resume generation interface at `/docs/resumes/[id]`.

#### Scenario: Display resume generation page
- **WHEN** the user navigates to `/docs/resumes/[id]`
- **THEN** the system SHALL display a page using the default layout (sidebar visible)
- **AND** the page SHALL have a title area with the resume title and an "Export" button to the far right
- **AND** the page SHALL display three tabs: "Content" (select what to include), "Editor" (edit selected content text), and "Designer" (styling)
- **AND** the page SHALL display a split-pane layout with tab controls on the left and a live resume preview on the right
- **AND** the "Content" tab SHALL be active by default

#### Scenario: Load resume data from saved snapshot
- **WHEN** the resume generation page loads at `/docs/resumes/[id]`
- **THEN** the system SHALL load the `content_snapshot` and `design_settings` from the `docs.resumes` record
- **AND** the editor SHALL initialize with the saved content selections and design settings
- **AND** the live preview SHALL render the resume from the saved snapshot

### Requirement: Session-Only State
The application SHALL manage resume generation state within the current session only, with persistence to the database on save.

#### Scenario: State preserved during tab switching
- **GIVEN** the user has made content selections on the Content Editor tab
- **WHEN** the user switches to the Designer tab and back to Content Editor
- **THEN** all content selections SHALL be preserved

#### Scenario: State persisted on save
- **GIVEN** the user has made content and style selections at `/docs/resumes/[id]`
- **WHEN** the user saves the resume
- **THEN** the system SHALL persist the current editable state to `docs.resumes.content_snapshot` and `docs.resumes.design_settings`
- **AND** the previous snapshot SHALL be replaced

#### Scenario: State cleared on navigation away without saving
- **GIVEN** the user has made unsaved changes at `/docs/resumes/[id]`
- **WHEN** the user navigates away without saving
- **THEN** unsaved changes SHALL be discarded
- **AND** returning to `/docs/resumes/[id]` SHALL load the last saved snapshot

## MODIFIED Requirements

### Requirement: Resume Sidebar Navigation
The application SHALL include a "Docs" collapsible group in the sidebar navigation containing a "Resumes" child item.

#### Scenario: Display Docs group in sidebar
- **WHEN** the user views any page with the default layout
- **THEN** the sidebar SHALL display a "Docs" navigation group
- **AND** the "Docs" group SHALL contain a "Resumes" child item linking to `/docs/resumes`
- **AND** the sidebar SHALL NOT display a flat "Resume" link

## REMOVED Requirements

### Requirement: Resume Sidebar Navigation (old)
**Reason**: Replaced by the "Docs" collapsible navigation group defined in the `docs-navigation` capability.
**Migration**: The flat "Resume" link at `/resumes/generate` is replaced by the "Docs > Resumes" group linking to `/docs/resumes`.
