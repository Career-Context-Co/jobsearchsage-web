## ADDED Requirements

### Requirement: Delete Resume API Endpoint
The system SHALL provide a `DELETE /api/docs/resumes/:id` endpoint that soft-deletes the specified resume by setting `deleted_at = NOW()`.

#### Scenario: Successful soft delete
- **WHEN** an authenticated user sends `DELETE /api/docs/resumes/:id` for a resume they own
- **THEN** the system SHALL set `deleted_at = NOW()` on the `docs_resumes` row
- **AND** SHALL return `{ success: true }`
- **AND** the record SHALL no longer appear in `GET /api/docs/resumes` responses

#### Scenario: Delete rejected for resume not owned by user
- **WHEN** an authenticated user sends `DELETE /api/docs/resumes/:id` for a resume that belongs to another user
- **THEN** the system SHALL return a 404 response
- **AND** the record SHALL not be modified

#### Scenario: Delete rejected for non-existent resume
- **WHEN** an authenticated user sends `DELETE /api/docs/resumes/:id` for an ID that does not exist
- **THEN** the system SHALL return a 404 response

### Requirement: Delete Resume UI Affordance
The resume list page SHALL provide a delete action for each resume with a confirmation step before the deletion is committed.

#### Scenario: Delete button triggers confirmation
- **WHEN** the user clicks the delete button on a resume card
- **THEN** the card SHALL display a confirmation prompt with a Cancel and a Confirm Delete action
- **AND** no deletion SHALL be initiated at this point

#### Scenario: Confirming delete removes the resume
- **WHEN** the user confirms deletion
- **THEN** the system SHALL call `deleteResume(id)` on `docsStore`
- **AND** the resume card SHALL be removed from the list upon success
- **AND** `isSaving` SHALL be `true` during the operation and `false` upon completion

#### Scenario: Cancelling delete leaves the resume intact
- **WHEN** the user cancels the confirmation prompt
- **THEN** the confirmation UI SHALL dismiss
- **AND** the resume SHALL remain in the list unchanged

