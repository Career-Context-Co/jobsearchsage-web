# sage-assist-experience Specification

## Purpose
Define Sage Assist behavior for experience-level AI help, Sage notes, and HERO story nudges.

## Requirements

### Requirement: Achievement Enhancement

The system SHALL provide a per-bullet AI enhancement flow on individual `highlights` entries in the experience detail view. Sage analyzes the bullet for weak language, missing quantification, or missing scope/outcome context, returns targeted follow-up questions, accepts the user's answers, and returns an improved bullet. The original bullet SHALL be preserved until the user explicitly confirms the replacement.

#### Scenario: Trigger enhancement on a highlight

- **WHEN** a user clicks the Sage enhance action on a `highlights` entry
- **THEN** the system SHALL call `POST /api/ai/experience/enhance-achievement` with experience context (`employer`, `title`, optional `summary`) and the selected bullet
- **AND** the system SHALL display Sage's follow-up questions inline below the bullet

#### Scenario: Submit answers and receive improved bullet

- **WHEN** the user submits answers to Sage's follow-up questions
- **THEN** the system SHALL call the same endpoint with the original bullet and answered questions
- **AND** the system SHALL display the suggested improved bullet alongside the original
- **AND** the original bullet SHALL remain visible until the user confirms or discards

#### Scenario: Confirm enhanced bullet

- **WHEN** the user confirms the suggested bullet
- **THEN** the system SHALL replace the original `highlights` entry with the improved bullet via `PATCH /api/career-id/profile/:profileId/experience/:id`
- **AND** the inline Sage panel SHALL close

#### Scenario: Discard enhancement

- **WHEN** the user discards the suggestion
- **THEN** the original `highlights` entry SHALL remain unchanged
- **AND** the inline Sage panel SHALL close

#### Scenario: Enhancement request when highlight is empty

- **WHEN** a user triggers enhancement on an empty `highlights` entry
- **THEN** the system SHALL NOT call the endpoint
- **AND** the system SHALL display a message prompting the user to write a draft bullet first

### Requirement: Responsibility Interview

The system SHALL provide a conversational AI interview accessible from the experience detail view with two distinct modes. The "notes help" mode produces output that SHALL be persisted to `sage_profile_notes` (Sage notes for that experience) after user confirmation via `PUT /api/ai/sage/notes` (with `targetType=experience`, `targetId=:experienceId`). The "role summary" mode generates a `summary` that SHALL be saved via Career ID `PATCH` after confirmation. Both modes preserve existing persisted content until the user confirms replacement.

#### Scenario: Open notes help interview

- **WHEN** a user opens the "Help me write my notes" interview from the experience detail view
- **THEN** the system SHALL open an interview panel with `mode: notes_help`
- **AND** Sage SHALL begin the conversation by calling `POST /api/ai/experience/interview` with experience context and optional current Sage notes from `GET /api/ai/sage/notes` using `targetType=experience` and `targetId=:experienceId`

#### Scenario: Open role summary interview

- **WHEN** a user opens the "Describe this role" interview from the experience detail view
- **THEN** the system SHALL open an interview panel with `mode: role_summary`
- **AND** Sage SHALL begin the conversation by calling `POST /api/ai/experience/interview` with the experience context

#### Scenario: Conversational turn

- **WHEN** the user sends a message during an active interview session
- **THEN** the system SHALL call `POST /api/ai/experience/interview` with the updated `conversationHistory`
- **AND** the system SHALL display Sage's next question or response in the message thread

#### Scenario: Interview completion — notes help

- **WHEN** the interview endpoint returns `done: true` for `mode: notes_help`
- **THEN** the system SHALL display the generated notes content for user review
- **AND** the user SHALL be able to confirm (save via `PUT /api/ai/sage/notes` with `targetType=experience` and `targetId=:experienceId`) or discard

#### Scenario: Interview completion — role summary

- **WHEN** the interview endpoint returns `done: true` for `mode: role_summary`
- **THEN** the system SHALL display the generated summary for user review
- **AND** the user SHALL be able to confirm (save to `summary` via `PATCH /api/career-id/profile/:profileId/experience/:id`) or discard

#### Scenario: Existing content warning

- **WHEN** the user confirms interview output and persisted Sage notes or `summary` already has content
- **THEN** the system SHALL display a confirmation prompt warning that existing content will be replaced
- **AND** the user SHALL confirm before the overwrite proceeds

### Requirement: Sage notes display

The system SHALL display Sage-generated notes for an experience as read-only content when a row exists in `sage_profile_notes`. The user SHALL NOT edit Sage notes via the standard Career ID experience form.

#### Scenario: Display Sage notes when present

- **WHEN** `GET /api/ai/sage/notes` (for `targetType=experience`, `targetId=:experienceId`) returns non-empty content
- **THEN** the experience detail view SHALL show a read-only section labeled as Sage-generated
- **AND** the user SHALL NOT have a form field that edits Sage notes directly

### Requirement: Persistent HERO Nudge Signal Detection

The system SHALL analyze an experience entry's content (`highlights`, `summary`, `contextNotes` from Career ID, and Sage notes content from `sage_profile_notes` included in the request snapshot) and persist a HERO story nudge when strong HERO signal is detected. Strong signal includes: quantified results, cross-functional work, scope or leadership language, or challenges overcome. A nudge SHALL be keyed by profile, experience, and a content hash so repeated checks reuse the same active nudge until the experience content changes.

#### Scenario: Nudge check after experience content changes

- **WHEN** a user adds or updates an experience, updates its summary, updates an achievement, or updates its notes
- **THEN** the system SHALL call `POST /api/ai/experience/hero-nudge` with the latest saved experience snapshot
- **AND** the snapshot SHALL include `sageNotes` loaded from `sage_profile_notes` when available
- **AND** if the endpoint detects a strong signal, it SHALL create or return an active persisted HERO nudge for the current experience content hash

#### Scenario: Existing active nudge is reused

- **WHEN** the system checks an experience whose content hash matches an existing active HERO nudge
- **THEN** the endpoint SHALL return the existing nudge without calling the AI provider again
- **AND** the nudge banner SHALL display from persisted data

#### Scenario: Experience content changes after a nudge

- **WHEN** the system checks an experience whose content hash differs from an existing active nudge for the same experience
- **THEN** the system SHALL mark the older nudge stale
- **AND** it SHALL evaluate the new snapshot for a new active nudge

#### Scenario: Nudge banner content

- **WHEN** the nudge banner is displayed
- **THEN** it SHALL include a short second-person signal sentence
- **AND** it SHALL include one short second-person context sentence
- **AND** it SHALL include a call-to-action to start the HERO story interview
- **AND** it MAY include a dismiss action

#### Scenario: User accepts nudge

- **WHEN** the user clicks the nudge banner action
- **THEN** the system SHALL set `accepted_at` on the persisted nudge
- **AND** it SHALL create or reuse a partial HERO story linked to the source experience
- **AND** it SHALL create or reuse a HERO discovery session with `session_type='experience_nudge_story'`
- **AND** it SHALL open the HERO assistance panel for that nudge-driven story session

#### Scenario: User declines nudge

- **WHEN** the user dismisses or explicitly declines a nudge
- **THEN** the system SHALL set `declined_at` on the persisted nudge
- **AND** it SHALL stop showing that nudge while its content hash remains current

#### Scenario: No nudge returned

- **WHEN** the nudge check returns `nudge: false`
- **THEN** the system SHALL NOT display any nudge UI

#### Scenario: Nudge check when experience has no content

- **WHEN** the nudge check is called on an experience with empty `highlights`, `summary`, `contextNotes`, and no Sage notes content
- **THEN** the endpoint SHALL return `nudge: false`
- **AND** no nudge banner SHALL be shown

### Requirement: Nudge-Driven HERO Discovery Session

The system SHALL support a HERO discovery session mode that starts from a persisted HERO nudge and source experience instead of broad moment discovery. This session SHALL ask story-shaping questions and create or update a partial HERO story. It SHALL NOT create `hero_moments`.

#### Scenario: Start nudge-driven discovery

- **WHEN** a user accepts a HERO nudge
- **THEN** the system SHALL create or reuse a `hero_discovery_sessions` row with `session_type='experience_nudge_story'`
- **AND** the row SHALL reference the source experience, persisted nudge, and linked HERO story using first-class columns
- **AND** `session_data` SHALL store the source experience snapshot, nudge copy, conversation history, and story progress state

#### Scenario: Continue nudge-driven discovery

- **WHEN** the user answers a nudge-driven HERO discovery question
- **THEN** the system SHALL ask focused HERO story questions for missing Hurdle, Expectation, Response, and Outcome details
- **AND** the system SHALL update conversation history and story progress
- **AND** the system SHALL update `progress_count` based on story progress, not moment count

#### Scenario: Complete nudge-driven discovery

- **WHEN** the nudge-driven discovery session has enough story detail
- **THEN** the system SHALL update the linked partial HERO story
- **AND** it SHALL mark the discovery session completed
- **AND** it SHALL mark the nudge converted
- **AND** it SHALL open or return the linked HERO story session

#### Scenario: Legacy moment discovery remains isolated

- **WHEN** a session has `session_type='moment_discovery'`
- **THEN** existing `captured_moments` and `moment_count` behavior MAY continue to work for legacy flows
- **AND** nudge-driven sessions SHALL NOT read or write `captured_moments` or `moment_count`
