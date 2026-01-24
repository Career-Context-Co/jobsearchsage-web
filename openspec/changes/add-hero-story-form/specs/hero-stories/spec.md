# hero-stories Specification Delta (HERO Story Form)

## ADDED Requirements

### Requirement: HERO Story Form Access and Initialization

The application SHALL provide a single-page HERO Story Form that supports creating and editing a HERO story.

#### Scenario: User starts a new story from scratch
- **WHEN** a user navigates to `/profile/hero?new`
- **THEN** the system SHALL display the HERO Story Form with empty HERO fields
- **AND** the system SHALL display a required Title field

#### Scenario: User starts a new story from a discovered moment
- **WHEN** a user starts the HERO Story Form from a discovered moment
- **THEN** the system SHALL pre-fill the Title field using the moment title
- **AND** the system SHALL display the moment context in a read-only reference panel

#### Scenario: User starts a new story from an experience entry
- **WHEN** a user starts the HERO Story Form from an experience entry
- **THEN** the system SHALL display the experience context in a read-only reference panel

#### Scenario: User opens an existing story for editing
- **WHEN** a user navigates to `/profile/hero/:storyId`
- **THEN** the system SHALL load the story from `career_id.hero_stories`
- **AND** the system SHALL populate all fields with the saved values

---

### Requirement: HERO Story Form Fields and Structure

The HERO Story Form SHALL display all four HERO sections with input fields for each required tag.

#### Scenario: User views the form sections
- **WHEN** a user views the HERO Story Form
- **THEN** the system SHALL display four labeled sections: Hurdle, Expectation, Response, Outcome
- **AND** each section SHALL contain input fields for its tagged properties:
  - Hurdle: `[PROBLEM]`, `[SCOPE]`, `[STAKES]`
  - Expectation: `[ROLE]`, `[GOALS]`, `[CONSTRAINTS]`
  - Response: `[ACTIONS]`, `[TOOLS]`, `[CHALLENGES]`
  - Outcome: `[DELIVERABLE]`, `[METRICS]`, `[IMPACT]`
- **AND** the user SHALL be able to fill fields in any order

---

### Requirement: HERO Story Title Validation

The system SHALL require a story Title to save a HERO story.

#### Scenario: Save is disabled when title is empty
- **WHEN** the Title field is empty
- **THEN** the system SHALL disable the Save action

#### Scenario: Validation error is shown when saving without a title
- **WHEN** a user attempts to save without a Title
- **THEN** the system SHALL display a validation error message indicating Title is required

---

### Requirement: No Autosave and No AI Calls

The HERO Story Form SHALL not autosave and SHALL not invoke AI calls.

#### Scenario: User enters data without persistence
- **WHEN** a user edits any form field
- **THEN** the system SHALL keep edits only in local client state
- **AND** the system SHALL NOT persist changes until the user explicitly clicks Save

---

### Requirement: Save HERO Story With Feedback

The system SHALL persist a HERO story only when the user clicks Save and SHALL provide clear success or error feedback.

#### Scenario: User saves a new story
- **WHEN** a user clicks Save for a new story
- **THEN** the system SHALL create a new record in `career_id.hero_stories`
- **AND** the system SHALL set `profile_id` for the current user’s profile
- **AND** the system SHALL set `source_experience_id` when the story is created from an experience
- **AND** the system SHALL show a loading state during persistence
- **AND** upon success, the system SHALL show a confirmation message

#### Scenario: User saves edits to an existing story
- **WHEN** a user clicks Save for an existing story
- **THEN** the system SHALL update the corresponding record in `career_id.hero_stories`
- **AND** the system SHALL show a loading state during persistence
- **AND** upon success, the system SHALL show a confirmation message

#### Scenario: Save fails
- **WHEN** saving fails due to a network or server error
- **THEN** the system SHALL show a user-friendly error message
- **AND** the system SHALL keep the user’s unsaved form state intact

---

### Requirement: Post-Save Next Actions

After a successful save, the system SHALL offer the user next actions.

#### Scenario: User chooses to view saved story
- **WHEN** a user completes a successful save
- **THEN** the system SHALL offer a “View story” action
- **AND** when the user selects “View story”, the system SHALL navigate to `/profile/hero/:storyId`

#### Scenario: User sees generate bullets action (coming soon)
- **WHEN** a user completes a successful save
- **THEN** the system SHALL offer a “Generate bullets” action
- **AND** the system SHALL indicate the action is not yet available (e.g., “Coming soon”)

#### Scenario: User returns to HERO list page
- **WHEN** a user completes a successful save
- **THEN** the system SHALL offer a “Back to list” action
- **AND** when the user selects “Back to list”, the system SHALL navigate to `/profile/hero`

---

### Requirement: HERO List Page Displays Stories and Moments

The `/profile/hero` page SHALL display both the user’s created HERO stories and the user’s discovered moments.

#### Scenario: User views HERO list page
- **WHEN** a user navigates to `/profile/hero`
- **THEN** the system SHALL display a “Your HERO Stories” section
- **AND** the system SHALL display a “Discovered Moments” section

#### Scenario: User opens a story from the list
- **WHEN** a user selects a story from the “Your HERO Stories” section
- **THEN** the system SHALL navigate to `/profile/hero/:storyId`

