## MODIFIED Requirements

### Requirement: Resume List Page
The application SHALL provide a resume list page at `/docs/resumes` showing all saved resumes for the profile. The page SHALL read resume data exclusively from `docsStore` rather than calling the API directly.

#### Scenario: Display saved resumes
- **GIVEN** the user has one or more saved resumes
- **WHEN** the user navigates to `/docs/resumes`
- **THEN** the system SHALL display a list of all saved resumes for the profile
- **AND** each resume entry SHALL display the resume title and creation/update date
- **AND** clicking a resume entry SHALL navigate to `/docs/resumes/[id]`

#### Scenario: Display empty state when no resumes exist
- **GIVEN** the user has no saved resumes
- **WHEN** the user navigates to `/docs/resumes`
- **THEN** the system SHALL display an empty state with a prompt to create a new resume
- **AND** the system SHALL provide a "New Resume" action button

#### Scenario: Create new resume from list page
- **WHEN** the user clicks "New Resume" on the list page
- **THEN** the system SHALL call `docsStore.createResume()` which calls `POST /api/docs/resumes`
- **AND** the title SHALL be auto-generated as "[FirstName] [LastName] Resume [id]" using the profile's contact info
- **AND** the system SHALL navigate to `/docs/resumes/[id]` for the newly created record

### Requirement: Resume Snapshot Persistence
The application SHALL persist resume content and design settings to the `docs.resumes` database table. The editor page SHALL read and write resume data exclusively through `docsStore` rather than calling the API directly.

#### Scenario: Resume snapshot stored on creation
- **WHEN** a new resume is created
- **THEN** the system SHALL store a `content` JSONB capturing the full editable state (summary, work experience with highlights, education, skills, certifications)
- **AND** the system SHALL store a `design_settings` JSONB capturing accent color and section visibility
- **AND** the snapshot SHALL reflect the profile data at the time of creation

#### Scenario: Resume snapshot replaced on save
- **GIVEN** the user has opened a saved resume at `/docs/resumes/[id]` and made edits
- **WHEN** the user saves the resume
- **THEN** the system SHALL call `docsStore.updateResume(id, patch)` which calls `PUT /api/docs/resumes/:id`
- **AND** the system SHALL replace the existing `content` and `design_settings` in the `docs.resumes` record
- **AND** the `updated_at` timestamp SHALL be updated
- **AND** the previous snapshot SHALL be discarded (no versioning)

#### Scenario: Resume loads from snapshot
- **WHEN** the user navigates to `/docs/resumes/[id]`
- **THEN** the system SHALL call `docsStore.getResume(id)` to retrieve the record
- **AND** if the record is already cached in the store, no network request SHALL be made
- **AND** the editor SHALL initialize with the saved content and design settings
- **AND** the live preview SHALL reflect the saved state
