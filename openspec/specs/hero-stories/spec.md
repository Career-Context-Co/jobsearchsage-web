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

### Requirement: AI Assistance Button Availability

The system SHALL provide a "Get AI Help" button for each HERO section that enables users to request AI-generated suggestions for refining their answers.

#### Scenario: Button displays on all sections
- **WHEN** a user views the HERO Story Form in create or edit mode
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

---

### Requirement: AI Section Enhancement Conversation API

The system SHALL provide an API endpoint that conducts multi-turn conversations to help users build out HERO sections through targeted questioning.

#### Scenario: Start enhancement conversation
- **WHEN** a POST request is sent to `/api/ai/hero-story/enhance-section/start` with `section_type`, `moment_title`, `moment_description`, `current_values`, and optional `source_experience`
- **THEN** the system SHALL initialize a new conversation session
- **AND** the system SHALL return the AI's first coaching question for that section
- **AND** the response SHALL include: `{ success: true, ai_message: string, conversation_id: string, is_complete: false }`
- **AND** the response status SHALL be 200 OK

#### Scenario: Continue enhancement conversation
- **WHEN** a POST request is sent to `/api/ai/hero-story/enhance-section/continue` with `conversation_id` and `user_message`
- **THEN** the system SHALL add the user's message to the conversation history
- **AND** the system SHALL generate the next AI response (question or summary)
- **AND** the response SHALL include: `{ success: true, ai_message: string, is_complete: boolean }`
- **AND** if the conversation is complete, the response SHALL include: `final_output: { field1, field2, field3 }`
- **AND** the response status SHALL be 200 OK

#### Scenario: Validate section type on start
- **WHEN** a start request is sent with an invalid `section_type` (not "hurdle", "expectation", "response", or "outcome")
- **THEN** the system SHALL return a 400 Bad Request error
- **AND** the error message SHALL indicate the section_type is invalid

#### Scenario: Include source experience context
- **WHEN** a start request includes `source_experience` object with title, employer, employment_type, dates, summary, highlights, and context_notes
- **THEN** the system SHALL use the full experience context in the AI's questions and coaching
- **AND** the AI's questions SHALL reference the experience summary, highlights, and context notes when relevant
- **AND** the AI SHALL use these fields to ask more informed and specific questions

#### Scenario: Handle empty current values
- **WHEN** a start request includes `current_values` where all three fields are null or empty
- **THEN** the system SHALL start the conversation from scratch with initial probing questions
- **AND** the AI SHALL NOT assume the user has already filled anything out

#### Scenario: Handle partial current values
- **WHEN** a start request includes `current_values` where some fields have content
- **THEN** the system SHALL acknowledge the existing content in its questions
- **AND** the AI SHALL ask targeted questions to fill gaps and refine existing content

---

### Requirement: AI Conversation Panel Display

The system SHALL display an interactive AI conversation panel where the AI asks questions and users respond to build out HERO section content.

#### Scenario: Open panel and start conversation
- **WHEN** a user clicks "Get AI Help" on a HERO section
- **THEN** the system SHALL call the start enhancement API with section type, moment context, current field values, and optional experience
- **AND** the system SHALL display a loading state during API processing
- **AND** upon success, the system SHALL open a conversation panel from the right edge
- **AND** the panel SHALL display the section name as a header
- **AND** the panel SHALL show the AI's first coaching question
- **AND** the panel SHALL show a text input field for the user to respond
- **AND** the user's original form content SHALL remain visible and unchanged

#### Scenario: Display conversation history
- **WHEN** the AI conversation panel is open
- **THEN** the panel SHALL display all previous messages in the conversation thread
- **AND** AI messages SHALL be visually distinguished from user messages
- **AND** the most recent message SHALL be visible (auto-scroll)
- **AND** users SHALL be able to scroll up to see earlier messages

#### Scenario: User responds to AI question
- **WHEN** a user types a response and sends it
- **THEN** the system SHALL add the user's message to the conversation display
- **AND** the system SHALL call the continue enhancement API with the user's message
- **AND** the system SHALL display a loading indicator while waiting for AI response
- **AND** upon success, the system SHALL display the AI's next question or summary
- **AND** the conversation SHALL continue until the AI indicates completion

---

### Requirement: Accept AI-Generated Content

The system SHALL allow users to accept AI-generated content when the conversation is complete and populate form fields with the final structured output.

#### Scenario: Conversation completion and accept button
- **WHEN** the AI conversation reaches completion (is_complete: true)
- **THEN** the system SHALL display the AI's final summary of the extracted information
- **AND** the system SHALL enable the "Accept" button in the panel
- **AND** the "Accept" button SHALL be disabled during the conversation (before completion)

#### Scenario: Accept content into form
- **WHEN** a user clicks the "Accept" button after conversation completion
- **THEN** the system SHALL extract the final_output from the API response (3 fields)
- **AND** the system SHALL populate the corresponding form fields with the final output
- **AND** the system SHALL close the AI panel
- **AND** the form SHALL display the accepted content in the section's 3 fields
- **AND** the user SHALL be able to continue editing the form normally

#### Scenario: Accept maps content to correct fields
- **WHEN** a user accepts Hurdle content
- **THEN** the system SHALL populate hurdleProblem, hurdleScope, and hurdleStakes form fields

- **WHEN** a user accepts Expectation content
- **THEN** the system SHALL populate expectationRole, expectationGoals, and expectationConstraints form fields

- **WHEN** a user accepts Response content
- **THEN** the system SHALL populate responseActions, responseTools, and responseChallenges form fields

- **WHEN** a user accepts Outcome content
- **THEN** the system SHALL populate outcomeDeliverable, outcomeMetrics, and outcomeImpact form fields

---

### Requirement: Regenerate Conversation

The system SHALL allow users to start a fresh conversation with updated context if they're unsatisfied with the current conversation direction.

#### Scenario: Regenerate before completion
- **WHEN** a user clicks the "Regenerate" button during an active conversation (before is_complete: true)
- **THEN** the system SHALL discard the current conversation state
- **AND** the system SHALL start a new enhancement conversation using the current form field values
- **AND** the system SHALL display the AI's first question from the fresh conversation
- **AND** the panel SHALL remain open with cleared conversation history

#### Scenario: Regenerate after completion
- **WHEN** a user views the final summary (is_complete: true) and clicks "Regenerate"
- **THEN** the system SHALL discard the completed conversation and final output
- **AND** the system SHALL start a fresh conversation using the current form field values
- **AND** the system SHALL display the AI's first question
- **AND** the panel SHALL remain open

#### Scenario: Multiple regeneration cycles
- **WHEN** a user regenerates multiple times
- **THEN** the system SHALL allow unlimited regeneration attempts
- **AND** each regeneration SHALL start from scratch (no conversation state carried over)
- **AND** the form content SHALL remain unchanged until the user clicks "Accept"

---

### Requirement: Dismiss AI Conversation

The system SHALL allow users to dismiss the AI conversation panel without modifying their form content.

#### Scenario: Dismiss panel during conversation
- **WHEN** a user clicks the "Dismiss" or "Close" button during an active conversation
- **THEN** the system SHALL close the panel
- **AND** the system SHALL discard all conversation state (messages and partial output)
- **AND** the form fields SHALL remain unchanged with the user's original content

#### Scenario: Dismiss panel after completion
- **WHEN** a user clicks "Dismiss" after the conversation is complete (is_complete: true)
- **THEN** the system SHALL close the panel
- **AND** the system SHALL discard the final output without applying it to form
- **AND** the form fields SHALL remain unchanged

#### Scenario: Reopen AI help after dismissing
- **WHEN** a user dismisses the AI panel
- **AND** the user clicks "Get AI Help" again on the same section
- **THEN** the system SHALL start a fresh conversation with the current form values
- **AND** the system SHALL NOT restore any previous conversation state

---

### Requirement: AI Enhancement Error Handling

The system SHALL handle AI enhancement errors gracefully and provide clear feedback to users.

#### Scenario: Timeout error displays
- **WHEN** the AI enhancement API request times out (exceeds 30 seconds)
- **THEN** the system SHALL display an error message in the panel: "The AI request timed out. Please try again."
- **AND** the system SHALL show a "Retry" button
- **AND** the user's original form content SHALL remain unchanged

#### Scenario: API error displays
- **WHEN** the AI enhancement API returns an error response (4xx or 5xx)
- **THEN** the system SHALL display an error message in the panel with the server's error details
- **AND** the system SHALL show a "Retry" button
- **AND** the user's original form content SHALL remain unchanged

#### Scenario: Retry after error
- **WHEN** an AI enhancement request fails
- **AND** the user clicks the "Retry" button
- **THEN** the system SHALL re-submit the same enhancement request
- **AND** the system SHALL display a loading state during retry
- **AND** upon success, the system SHALL display suggestions normally

#### Scenario: Invalid response handling
- **WHEN** the AI returns a response that does not match the expected structure
- **THEN** the system SHALL display an error message: "Received unexpected response from AI. Please try again."
- **AND** the system SHALL show a "Retry" button
- **AND** the user's original form content SHALL remain unchanged

