## MODIFIED Requirements

### Requirement: Professional Experience Entry
The application SHALL allow users to enter multiple professional experience entries with structured fields. Each experience entry SHALL support a user-authored notes field (`user_notes`) and a Sage-generated notes field (`sage_notes`) in addition to the structured `highlights`, `summary`, and date/employer fields.

#### Scenario: Add work experience
- **WHEN** a user adds a professional experience entry
- **THEN** the form SHALL provide fields for company name, job title, start date, end date, and 3-5 accomplishments
- **AND** the user SHALL be able to add multiple job entries
- **AND** each accomplishment SHALL be a separate input field

#### Scenario: Required experience fields
- **WHEN** a user submits a professional experience entry
- **THEN** the system SHALL require company name, job title, and start date
- **AND** end date SHALL be optional (for current positions)
- **AND** at least one accomplishment SHALL be required

#### Scenario: User notes on experience
- **WHEN** a user edits an experience entry
- **THEN** the form SHALL expose a `user_notes` text area for free-form notes authored by the user
- **AND** the system SHALL persist `user_notes` via `PATCH /api/career-id/profile/:profileId/experience/:id`

#### Scenario: Sage notes are read-only to the user
- **WHEN** a user views an experience entry that has `sage_notes` content
- **THEN** the system SHALL display `sage_notes` as a read-only view labeled as Sage-generated
- **AND** the user SHALL NOT be able to edit `sage_notes` directly via any form or input
- **AND** `sage_notes` SHALL only be written by the Sage responsibility interview (notes help mode) upon user confirmation
- **AND** re-running the notes help interview SHALL overwrite `sage_notes` after the user confirms replacement
