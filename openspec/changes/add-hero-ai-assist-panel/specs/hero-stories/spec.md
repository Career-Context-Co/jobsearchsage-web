# Delta: hero-stories Specification

## ADDED Requirements

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
