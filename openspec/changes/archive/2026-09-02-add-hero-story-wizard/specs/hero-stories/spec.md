## MODIFIED Requirements

### Requirement: HERO Story Form Access and Initialization

The application SHALL provide an inline HERO Story Form that supports editing an existing HERO story without page navigation. Creating a new story SHALL be handled by the HERO story wizard rather than by this form.

#### Scenario: User starts a new story from scratch

- **WHEN** a user clicks "New HERO Story" in the "Your HERO Stories" section header
- **THEN** the system SHALL navigate to `/profile/hero-wizard`
- **AND** the system SHALL NOT display an inline create form on `/profile/hero`

#### Scenario: User starts a new story from a discovered moment

- **WHEN** a user clicks "Develop into HERO Story" on a discovered moment card
- **THEN** the system SHALL navigate to `/profile/hero-wizard`
- **AND** the system SHALL pre-fill the wizard's Title field with the moment's title
- **AND** the system SHALL set `source_experience_id` if the moment came from an experience entry

#### Scenario: User opens an existing story for editing

- **WHEN** a user clicks the pencil icon on a story card
- **THEN** the system SHALL expand that card to show the inline edit form
- **AND** the system SHALL populate all fields with the saved story values
- **AND** all other content on the page SHALL remain visible
- **AND** the system SHALL NOT navigate to a different route

---

### Requirement: HERO Story Form Fields and Structure

The inline HERO Story edit form SHALL display all four HERO sections with input fields for each required tag.

#### Scenario: User views the form sections

- **WHEN** a user views the inline HERO Story edit form
- **THEN** the system SHALL display four labeled sections: "The Hurdle", "The Expectation", "The Response", "The Outcome"
- **AND** each section SHALL contain textarea fields for its tagged properties:
  - Hurdle: `[PROBLEM]`, `[SCOPE]`, `[STAKES]`
  - Expectation: `[ROLE]`, `[GOALS]`, `[CONSTRAINTS]`
  - Response: `[ACTIONS]`, `[TOOLS]`, `[CHALLENGES]`
  - Outcome: `[DELIVERABLE]`, `[METRICS]`, `[IMPACT]`
- **AND** the user SHALL be able to fill fields in any order (no required order)
- **AND** all HERO fields except Title SHALL be optional (nullable)

---

### Requirement: HERO Story Title Validation

The system SHALL require a story Title to save a HERO story from the inline edit form. Title validation for newly created stories is governed by the HERO story wizard.

#### Scenario: Save is disabled when title is empty

- **WHEN** the Title field of the inline edit form is empty or contains only whitespace
- **THEN** the system SHALL disable the Update button

#### Scenario: Validation error is shown when saving without a title

- **WHEN** a user attempts to save the inline edit form with an empty or whitespace-only Title
- **THEN** the system SHALL NOT submit the request to the backend
- **AND** the system SHALL display a validation error message: "Story title is required"

---

### Requirement: No Autosave and No AI Calls

The inline HERO Story edit form SHALL not autosave and SHALL not invoke AI calls. This requirement applies to the inline edit form only; the HERO story wizard persists incrementally by design.

#### Scenario: User enters data without persistence

- **WHEN** a user edits any field of the inline edit form
- **THEN** the system SHALL keep edits only in local client state (Vue ref)
- **AND** the system SHALL NOT make API calls to the backend
- **AND** the system SHALL NOT persist changes to the database until the user explicitly clicks Update
- **AND** if the user closes the form or navigates away before saving, unsaved data is lost

#### Scenario: Wizard persistence is exempt

- **WHEN** a user progresses through the HERO story wizard
- **THEN** the no-autosave rule SHALL NOT apply
- **AND** the system SHALL persist the story incrementally as specified by the hero-story-wizard capability

---

### Requirement: Save HERO Story With Feedback

The system SHALL persist an inline HERO story edit only when the user clicks Update and SHALL provide clear success or error feedback. Persistence of newly created stories is governed by the HERO story wizard.

#### Scenario: User saves edits to an existing story

- **WHEN** a user clicks Update for an existing story
- **THEN** the system SHALL submit a `PATCH /api/career-id/profile/:profileId/hero-stories/:storyId` request with only the modified fields
- **AND** the system SHALL show a loading state during the API call
- **AND** upon success (200 OK), the system SHALL show a toast confirmation: "Your HERO story has been updated."
- **AND** the system SHALL close the inline edit card and refresh the story list

#### Scenario: Save fails

- **WHEN** saving fails due to a network error, server error, or validation error
- **THEN** the system SHALL show a toast error message: "Failed to update HERO story" or the server's specific error message
- **AND** the system SHALL keep the user's unsaved form state intact in the text fields
- **AND** the user SHALL be able to retry the save

---

### Requirement: HERO List Page Displays Stories and Moments

The `/profile/hero` page SHALL display both the user's created HERO stories and the user's discovered moments. Existing stories and moments are managed via inline editing (no page navigation); creating a new story navigates to the HERO story wizard.

#### Scenario: User views HERO list page

- **WHEN** a user navigates to `/profile/hero`
- **THEN** the system SHALL fetch active HERO stories from the backend via `GET /api/career-id/profile/:profileId/hero-stories`
- **AND** the system SHALL fetch discovered moments from the backend via `GET /api/career-id/profile/:profileId/hero-moments`
- **AND** both requests SHALL run in parallel
- **AND** the system SHALL display a "Your HERO Stories" collapsible section with:
  - Section title, count badge (number of stories), a "New HERO Story" button, and a "Get HERO Help" button
  - Collapsible chevron icon that toggles section expansion
- **AND** the system SHALL display a "Discovered HERO Moments" collapsible section with:
  - Section title, count badge (number of moments), and "Discover More Moments" button
  - Collapsible chevron icon that toggles section expansion
- **AND** both sections SHALL load asynchronously and show loading states ("Loading stories...", "Loading moments...") if needed
- **AND** error messages SHALL be shown if either request fails

#### Scenario: User creates a new story

- **WHEN** a user clicks "New HERO Story" in the "Your HERO Stories" section header
- **THEN** the system SHALL navigate to `/profile/hero-wizard`
- **AND** the system SHALL NOT display an inline create form
- **AND** the "Your HERO Stories" section SHALL NOT be hidden or replaced on `/profile/hero`

#### Scenario: User creates a new story from the empty state

- **WHEN** the profile has no HERO stories and the user activates the create action in the empty state
- **THEN** the system SHALL navigate to `/profile/hero-wizard`

#### Scenario: User resumes an unfinished story

- **WHEN** a story card represents a story with a title but none of its twelve HERO detail fields filled
- **THEN** the system SHALL display a control to continue that story in the wizard
- **AND** activating that control SHALL navigate to `/profile/hero-wizard` with that story's `storyId`

#### Scenario: User views a story inline

- **WHEN** a user views a story card in the "Your HERO Stories" section
- **THEN** the system SHALL display in view mode:
  - Story title (bold)
  - Creation date formatted as "Created on [Month] [Day], [Year]"
  - Pencil icon (edit) and trash icon (delete) buttons in the top-right corner

#### Scenario: User edits a story inline

- **WHEN** a user clicks the pencil icon on a story card
- **THEN** the card SHALL expand to show the inline edit form
- **AND** all form fields SHALL be pre-populated with the story's current values
- **AND** when the user modifies fields, changes SHALL be kept only in local state (no API calls)
- **AND** when the user clicks Update, the system SHALL submit to `PATCH /api/career-id/profile/:profileId/hero-stories/:storyId`
- **AND** upon success, the system SHALL close the edit form, show a confirmation toast, and refresh the card view
- **AND** if the user clicks Cancel, the card SHALL return to view mode without saving

#### Scenario: User deletes a story from the list

- **WHEN** a user clicks the trash icon on a story card
- **THEN** the system SHALL display a confirmation dialog: "Are you sure you want to delete this HERO story?"
- **AND** if the user confirms, the system SHALL submit to `DELETE /api/career-id/profile/:profileId/hero-stories/:storyId`
- **AND** the server SHALL soft-delete by setting `is_deleted = true` and `deleted_at = NOW()`
- **AND** upon success, the system SHALL remove the story from the list and show a confirmation toast: "HERO story deleted successfully."
- **AND** if delete fails, the system SHALL show an error toast and keep the story in the list

#### Scenario: User develops a moment into a story

- **WHEN** a user clicks "Develop into HERO Story" on a discovered moment card in the "Discovered HERO Moments" section
- **THEN** the system SHALL navigate to `/profile/hero-wizard` with the moment's title pre-filled in the Title field
- **AND** the system SHALL set the `source_experience_id` field if the moment had an associated experience
- **AND** the new story SHALL be created via `POST /api/career-id/profile/:profileId/hero-stories` when the user advances past the wizard's Basics step
- **AND** the new story SHALL include `source_experience_id` in the request body
- **AND** upon completion of the wizard, the system SHALL return to `/profile/hero` and show the new story in the "Your HERO Stories" list

---

### Requirement: AI Assistance Button Availability

The system SHALL provide a "Get AI Help" button for each HERO section that enables users to request AI-generated suggestions for refining their answers. AI assistance SHALL be available from the inline edit form and SHALL NOT be offered inside the HERO story wizard.

#### Scenario: Button displays on all sections

- **WHEN** a user views the inline HERO Story edit form
- **THEN** the system SHALL display a "Get AI Help" button on the Hurdle section
- **AND** the system SHALL display a "Get AI Help" button on the Expectation section
- **AND** the system SHALL display a "Get AI Help" button on the Response section
- **AND** the system SHALL display a "Get AI Help" button on the Outcome section

#### Scenario: Button enabled when section has input

- **WHEN** a user has entered text in at least one field within a HERO section
- **THEN** the "Get AI Help" button for that section SHALL be enabled
- **AND** the button SHALL be clickable

#### Scenario: Button disabled when section is empty

- **WHEN** all three fields in a HERO section are empty or contain only whitespace
- **THEN** the "Get AI Help" button for that section SHALL be disabled
- **AND** the button SHALL not respond to clicks

#### Scenario: Button is not offered inside the wizard

- **WHEN** a user is on any step of `/profile/hero-wizard`
- **THEN** the system SHALL NOT display a "Get AI Help" button
- **AND** the system SHALL NOT invoke any AI endpoint
