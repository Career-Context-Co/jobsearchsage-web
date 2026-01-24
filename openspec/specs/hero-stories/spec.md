# hero-stories Specification

## Purpose

Users need a fast, straightforward way to document career achievements as complete HERO stories without a guided flow. A single-page form that captures the full HERO structure (all four sections with tagged fields at once) reduces friction, supports non-linear entry, and becomes the foundation for later bullet generation and deeper story workflows.

## Requirements

### Requirement: HERO Story Form Access and Initialization

The application SHALL provide a single-page HERO Story Form that supports creating and editing a HERO story without page navigation.

#### Scenario: User starts a new story from scratch
- **WHEN** a user clicks "Create Story" in the "Your HERO Stories" section header
- **THEN** the system SHALL display the HERO Story Form with empty fields for all 12 HERO tags
- **AND** the form SHALL remain on the same page (inline replacement, not navigation)
- **AND** the system SHALL display a required Title field with validation message

#### Scenario: User starts a new story from a discovered moment
- **WHEN** a user clicks "Develop into HERO Story" on a discovered moment card
- **THEN** the system SHALL pre-fill the Title field with the moment's title (client-side)
- **AND** the system SHALL set `source_experience_id` if the moment came from an experience entry
- **AND** the system SHALL display the create form inline

#### Scenario: User opens an existing story for editing
- **WHEN** a user clicks the pencil icon on a story card
- **THEN** the system SHALL expand that card to show the inline edit form
- **AND** the system SHALL populate all fields with the saved story values
- **AND** all other content on the page SHALL remain visible
- **AND** the system SHALL NOT navigate to a different route

---

### Requirement: HERO Story Form Fields and Structure

The HERO Story Form SHALL display all four HERO sections with input fields for each required tag.

#### Scenario: User views the form sections
- **WHEN** a user views the HERO Story Form (create or edit)
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

The system SHALL require a story Title to save a HERO story.

#### Scenario: Save is disabled when title is empty
- **WHEN** the Title field is empty or contains only whitespace
- **THEN** the system SHALL disable the Save/Update button
- **AND** the button text SHALL show "Save" for create or "Update" for edit

#### Scenario: Validation error is shown when saving without a title
- **WHEN** a user attempts to save with an empty or whitespace-only Title
- **THEN** the system SHALL NOT submit the request to the backend
- **AND** the system SHALL display a validation error message: "Story title is required"

---

### Requirement: No Autosave and No AI Calls

The HERO Story Form SHALL not autosave and SHALL not invoke AI calls.

#### Scenario: User enters data without persistence
- **WHEN** a user edits any form field
- **THEN** the system SHALL keep edits only in local client state (Vue ref)
- **AND** the system SHALL NOT make API calls to the backend
- **AND** the system SHALL NOT persist changes to the database until the user explicitly clicks Save/Update
- **AND** if the user closes the form or navigates away before saving, unsaved data is lost

---

### Requirement: Save HERO Story With Feedback

The system SHALL persist a HERO story only when the user clicks Save/Update and SHALL provide clear success or error feedback.

#### Scenario: User saves a new story
- **WHEN** a user clicks Save for a new story
- **THEN** the system SHALL submit a `POST /api/career-id/profile/:profileId/hero-stories` request with all form fields
- **AND** the request body SHALL include: title (required), hurdleProblem, hurdleScope, hurdleStakes, expectationRole, expectationGoals, expectationConstraints, responseActions, responseTools, responseChallenges, outcomeDeliverable, outcomeMetrics, outcomeImpact, sourceExperienceId (optional)
- **AND** the system SHALL show a loading state during the API call
- **AND** upon success (201 Created), the system SHALL show a toast confirmation: "Your HERO story '{{title}}' has been created."
- **AND** the system SHALL close the create form and refresh the story list to show the new story

#### Scenario: User saves edits to an existing story
- **WHEN** a user clicks Update for an existing story
- **THEN** the system SHALL submit a `PATCH /api/career-id/profile/:profileId/hero-stories/:storyId` request with only the modified fields
- **AND** the system SHALL show a loading state during the API call
- **AND** upon success (200 OK), the system SHALL show a toast confirmation: "Your HERO story has been updated."
- **AND** the system SHALL close the inline edit card and refresh the story list

#### Scenario: Save fails
- **WHEN** saving fails due to a network error, server error, or validation error
- **THEN** the system SHALL show a toast error message: "Failed to [create|update] HERO story" or the server's specific error message
- **AND** the system SHALL keep the user's unsaved form state intact in the text fields
- **AND** the user SHALL be able to retry the save

---

### Requirement: HERO List Page Displays Stories and Moments

The `/profile/hero` page SHALL display both the user's created HERO stories and the user's discovered moments. Stories and moments are managed via inline editing (no page navigation).

#### Scenario: User views HERO list page
- **WHEN** a user navigates to `/profile/hero`
- **THEN** the system SHALL fetch active HERO stories from the backend via `GET /api/career-id/profile/:profileId/hero-stories`
- **AND** the system SHALL fetch discovered moments from the backend via `GET /api/career-id/profile/:profileId/hero-moments`
- **AND** both requests SHALL run in parallel
- **AND** the system SHALL display a "Your HERO Stories" collapsible section with:
  - Section title, count badge (number of stories), and "Create Story" button
  - Collapsible chevron icon that toggles section expansion
- **AND** the system SHALL display a "Discovered HERO Moments" collapsible section with:
  - Section title, count badge (number of moments), and "Discover More Moments" button
  - Collapsible chevron icon that toggles section expansion
- **AND** both sections SHALL load asynchronously and show loading states ("Loading stories...", "Loading moments...") if needed
- **AND** error messages SHALL be shown if either request fails

#### Scenario: User creates a new story
- **WHEN** a user clicks "Create Story" in the "Your HERO Stories" section header
- **THEN** the system SHALL display an inline create form on the page
- **AND** the "Your HERO Stories" section SHALL be temporarily hidden (replaced by the form)
- **AND** the form SHALL have empty fields for all HERO sections and a required Title
- **AND** when the user clicks Save, the system SHALL submit to `POST /api/career-id/profile/:profileId/hero-stories`
- **AND** upon success, the system SHALL close the form, show a confirmation toast, and refresh the story list

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
- **THEN** the system SHALL display the create form with the moment's title pre-filled in the Title field
- **AND** the system SHALL set the `source_experience_id` field if the moment had an associated experience
- **AND** when the user saves the form, the new story SHALL be created via `POST /api/career-id/profile/:profileId/hero-stories`
- **AND** the new story SHALL include `source_experience_id` in the request body
- **AND** upon success, the system SHALL close the form and refresh the "Your HERO Stories" list to show the new story
