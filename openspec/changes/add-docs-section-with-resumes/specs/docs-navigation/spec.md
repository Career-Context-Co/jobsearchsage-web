## ADDED Requirements

### Requirement: Docs Section in Sidebar Navigation
The application SHALL replace the flat "Resume" sidebar link with a collapsible "Docs" navigation group containing document-type sub-items.

#### Scenario: Display Docs group in sidebar
- **WHEN** the user views any page with the default layout
- **THEN** the sidebar SHALL display a "Docs" navigation group with a document icon
- **AND** the "Docs" group SHALL be collapsible/expandable like the "Profile" group
- **AND** the "Docs" group SHALL contain a "Resumes" child item linking to `/docs/resumes`
- **AND** the "Docs" group SHALL contain a "Cover Letters" child item that is visually disabled or labeled "Coming Soon"
- **AND** the sidebar SHALL NOT display a flat "Resume" link

#### Scenario: Navigate to Resumes from Docs group
- **WHEN** the user clicks "Resumes" in the Docs navigation group
- **THEN** the system SHALL navigate to `/docs/resumes`
- **AND** the sidebar SHALL close on mobile viewports

#### Scenario: Cover Letters shows coming soon state
- **WHEN** the user views the "Cover Letters" item in the Docs navigation group
- **THEN** the item SHALL be visually distinct (e.g., muted/disabled styling)
- **AND** clicking it SHALL NOT navigate away from the current page

### Requirement: Home Page Docs Entry Point
The application SHALL update the home page resume card to link to the Docs section.

#### Scenario: Home page resume card links to Docs
- **WHEN** the user views the home page (`/`)
- **THEN** the resume/documents card SHALL link to `/docs/resumes`
- **AND** the card SHALL NOT link to `/resumes/generate`
