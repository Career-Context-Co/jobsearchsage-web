## MODIFIED Requirements

### Requirement: Professional Experience Entry

The application SHALL allow users to enter multiple professional experience entries with structured fields. Each experience entry SHALL support the existing user-authored notes field (`context_notes` / `contextNotes`) in addition to the structured `highlights`, `summary`, and date/employer fields. Sage-generated notes are not stored on the Career ID experience model; they are owned by JobSearchSage (`sage_profile_notes`) and are out of scope for this capability except where the UI loads them via the Sage API.

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

#### Scenario: Context notes on experience

- **WHEN** a user edits an experience entry
- **THEN** the form SHALL expose the existing notes field for free-form context authored by the user (Career ID `context_notes` / API `contextNotes`)
- **AND** the system SHALL persist it via `PATCH /api/career-id/profile/:profileId/experience/:id` as today
