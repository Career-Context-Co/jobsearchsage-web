## ADDED Requirements

### Requirement: Wizard Route and Layout

The application SHALL provide a dedicated full-page HERO story creation wizard at `/profile/hero-wizard` that renders without the profile section navigation.

#### Scenario: User opens the wizard

- **WHEN** a user navigates to `/profile/hero-wizard`
- **THEN** the system SHALL render the wizard using the `fullscreen` layout
- **AND** the system SHALL NOT render the profile navigation toolbar around the wizard
- **AND** the system SHALL display a header showing the current story title, or "Untitled HERO Story" when no title has been entered
- **AND** the header SHALL include a "Save & Exit" control

#### Scenario: Wizard is reached from the HERO list page

- **WHEN** a user activates a create action on `/profile/hero`
- **THEN** the system SHALL navigate to `/profile/hero-wizard`
- **AND** the system SHALL NOT display an inline create form on `/profile/hero`

---

### Requirement: Step Sequence and Navigation

The wizard SHALL present six steps in order — Basics, The Hurdle, The Expectation, The Response, The Outcome, and Review — and SHALL allow the user to move between them both sequentially and directly.

#### Scenario: User views the step indicator

- **WHEN** a user is on any wizard step
- **THEN** the system SHALL display a stepper with six steps labelled "Basics", "Hurdle", "Expectation", "Response", "Outcome", and "Review"
- **AND** each step indicator SHALL show its marker: `S` for Basics, the section letter (`H`, `E`, `R`, `O`) for each HERO step, and a check for Review
- **AND** the currently active step SHALL be visually distinguished from the others
- **AND** a step whose fields are all filled SHALL display a completion check in place of its letter when it is not the active step

#### Scenario: User advances with the primary control

- **WHEN** a user activates the forward control on a step before Review
- **THEN** the system SHALL persist that step's values (per the Incremental Draft Persistence requirement)
- **AND** upon successful persistence the system SHALL display the next step
- **AND** the forward control label SHALL name the destination, in the form "Continue to The Expectation", and SHALL read "Review Story" on the Outcome step

#### Scenario: User moves backward

- **WHEN** a user activates the back control on any step after Basics
- **THEN** the system SHALL display the previous step
- **AND** the system SHALL retain all values entered on the step being left

#### Scenario: User jumps directly to a step

- **WHEN** a user selects any step in the stepper
- **THEN** the system SHALL display that step regardless of whether intervening steps are complete
- **AND** the system SHALL retain all values already entered on other steps

#### Scenario: Back control is unavailable on the first step

- **WHEN** a user is on the Basics step
- **THEN** the system SHALL NOT offer a back control

---

### Requirement: Basics Step Captures Title and Linked Experience

The Basics step SHALL capture the story title and an optional link to an existing experience entry, and SHALL require a title before the user may proceed.

#### Scenario: User views the Basics step

- **WHEN** a user is on the Basics step
- **THEN** the system SHALL display a required "Story Title" text input
- **AND** the system SHALL display a control asking whether the story is tied to a specific job or experience
- **AND** the system SHALL NOT display a summary field

#### Scenario: User links the story to an experience

- **WHEN** a user indicates the story is tied to a specific job or experience
- **THEN** the system SHALL display a selector listing the profile's existing experience entries
- **AND** selecting an entry SHALL set `sourceExperienceId` to that experience's identifier
- **AND** the selector SHALL identify each entry by its job title and employer

#### Scenario: User marks the story as standalone

- **WHEN** a user indicates the story is not tied to a specific job or experience
- **THEN** the system SHALL leave `sourceExperienceId` unset
- **AND** the system SHALL hide the experience selector

#### Scenario: User attempts to leave Basics without a title

- **WHEN** a user activates the forward control while the title is empty or contains only whitespace
- **THEN** the system SHALL NOT advance to the next step
- **AND** the system SHALL NOT create a story record
- **AND** the system SHALL display the validation message "Story title is required"

---

### Requirement: HERO Section Steps

Each of the four HERO section steps SHALL present that section's identity and exactly its three tagged fields.

#### Scenario: User views a HERO section step

- **WHEN** a user is on the Hurdle, Expectation, Response, or Outcome step
- **THEN** the system SHALL display the section letter, its title, and its guiding question
- **AND** the system SHALL display a short description of what the section is for
- **AND** the system SHALL display exactly three text areas, one per tagged field for that section:
  - Hurdle: `[PROBLEM]`, `[SCOPE]`, `[STAKES]`
  - Expectation: `[ROLE]`, `[GOALS]`, `[CONSTRAINTS]`
  - Response: `[ACTIONS]`, `[TOOLS]`, `[CHALLENGES]`
  - Outcome: `[DELIVERABLE]`, `[METRICS]`, `[IMPACT]`
- **AND** each field SHALL display its tag, its label, and a prompt describing what to write
- **AND** all HERO section fields SHALL be optional

#### Scenario: Section fields map to story fields

- **WHEN** the system persists a HERO section step
- **THEN** each field SHALL be written to its corresponding HERO story field:
  - `[PROBLEM]` to `hurdleProblem`, `[SCOPE]` to `hurdleScope`, `[STAKES]` to `hurdleStakes`
  - `[ROLE]` to `expectationRole`, `[GOALS]` to `expectationGoals`, `[CONSTRAINTS]` to `expectationConstraints`
  - `[ACTIONS]` to `responseActions`, `[TOOLS]` to `responseTools`, `[CHALLENGES]` to `responseChallenges`
  - `[DELIVERABLE]` to `outcomeDeliverable`, `[METRICS]` to `outcomeMetrics`, `[IMPACT]` to `outcomeImpact`

#### Scenario: User leaves a section step entirely blank

- **WHEN** a user activates the forward control on a HERO section step with no fields filled
- **THEN** the system SHALL advance to the next step
- **AND** the system SHALL NOT display a validation error

---

### Requirement: Help and Examples Panel

Each HERO section step SHALL display a help panel offering a worked example for every field on that step, with examples available in multiple role flavors.

#### Scenario: User views the help panel

- **WHEN** a user is on a HERO section step
- **THEN** the system SHALL display a help panel alongside the step's fields
- **AND** the panel SHALL show one entry per field on that step
- **AND** each entry SHALL show the field's tag, label, prompt, and a concrete example answer

#### Scenario: User switches the example role

- **WHEN** a user activates the shuffle control in the help panel
- **THEN** the system SHALL replace every displayed example with the equivalent example for the next role flavor
- **AND** the system SHALL cycle through the engineer, customer service, and manager flavors in order, returning to the first after the last
- **AND** the panel SHALL indicate which role flavor is currently shown
- **AND** the selected role flavor SHALL persist as the user moves between HERO section steps

#### Scenario: Help panel is absent outside section steps

- **WHEN** a user is on the Basics step or the Review step
- **THEN** the system SHALL NOT display the help and examples panel

---

### Requirement: Progress Reporting

The wizard SHALL continuously report how many of the twelve HERO detail fields the user has filled in.

#### Scenario: User sees the running count

- **WHEN** a user is on any wizard step
- **THEN** the system SHALL display a count in the form "{filled} of 12 details captured"
- **AND** a field SHALL count as filled only when it contains at least one non-whitespace character
- **AND** the count SHALL exclude the title and the linked experience

#### Scenario: Count updates as the user types

- **WHEN** a user fills in or clears a HERO detail field
- **THEN** the system SHALL update the displayed count without requiring navigation

---

### Requirement: Incremental Draft Persistence

The wizard SHALL persist the story to the backend as the user progresses, creating the record when the user leaves the Basics step and updating it as each subsequent step is completed.

#### Scenario: Story record is created on leaving Basics

- **WHEN** a user advances from the Basics step with a valid title for a story that does not yet exist
- **THEN** the system SHALL submit a `POST /api/career-id/profile/:profileId/hero-stories` request
- **AND** the request body SHALL include the title and, when a linked experience was chosen, `sourceExperienceId`
- **AND** the system SHALL retain the returned story identifier for the remainder of the wizard
- **AND** the system SHALL NOT create a second record if the user returns to Basics and advances again

#### Scenario: Section values are persisted on advancing

- **WHEN** a user advances from a HERO section step
- **THEN** the system SHALL submit a `PATCH /api/career-id/profile/:profileId/hero-stories/:storyId` request
- **AND** the request body SHALL contain only the three fields belonging to the step being left
- **AND** the system SHALL NOT include fields belonging to other sections in that request

#### Scenario: Basics edits are persisted on returning forward

- **WHEN** a user returns to the Basics step for an already-created story, changes the title or linked experience, and advances
- **THEN** the system SHALL submit a `PATCH /api/career-id/profile/:profileId/hero-stories/:storyId` request with the changed values

#### Scenario: Persistence fails while advancing

- **WHEN** a persistence request fails due to a network error, server error, or validation error
- **THEN** the system SHALL NOT advance to the next step
- **AND** the system SHALL display an error message
- **AND** the system SHALL retain the user's entered values on the current step
- **AND** the user SHALL be able to retry by activating the forward control again

---

### Requirement: Save and Exit

The wizard SHALL allow the user to leave at any point without losing work already persisted.

#### Scenario: User exits after the story has been created

- **WHEN** a user activates "Save & Exit" on any step after the story record exists
- **THEN** the system SHALL persist the current step's values
- **AND** the system SHALL navigate to `/profile/hero`
- **AND** the story SHALL appear in the story list with all values persisted so far

#### Scenario: User exits from Basics before any record exists

- **WHEN** a user activates "Save & Exit" on the Basics step before a story record has been created
- **THEN** the system SHALL navigate to `/profile/hero`
- **AND** the system SHALL NOT create a story record

---

### Requirement: Resume an Incomplete Story

The wizard SHALL be able to reopen an existing HERO story so a user can continue work started in an earlier session.

#### Scenario: User resumes a story by identifier

- **WHEN** a user navigates to `/profile/hero-wizard` with a `storyId` query parameter naming an existing story
- **THEN** the system SHALL load that story
- **AND** the system SHALL populate every step with the story's saved values
- **AND** subsequent step advances SHALL update that story rather than creating a new one

#### Scenario: List offers to resume an unfinished story

- **WHEN** a story in the HERO story list has a title but none of its twelve HERO detail fields filled
- **THEN** the system SHALL offer a control to continue that story in the wizard
- **AND** activating it SHALL navigate to `/profile/hero-wizard` with that story's `storyId`

#### Scenario: Wizard is opened with prefilled values

- **WHEN** the wizard is opened with a title or source experience supplied as query parameters
- **THEN** the system SHALL prefill the corresponding Basics fields with those values
- **AND** the user SHALL be able to change them before advancing

---

### Requirement: Review and Save

The Review step SHALL summarise every value the user has entered, allow jumping back to correct any section, and complete the wizard.

#### Scenario: User views the Review step

- **WHEN** a user reaches the Review step
- **THEN** the system SHALL display a summary block for Basics and one for each of the four HERO sections
- **AND** the Basics block SHALL show the title and the linked experience, or "Standalone story" when none was linked
- **AND** each HERO block SHALL show its section letter, its title, and each of its three fields with the entered value
- **AND** any field left empty SHALL display "Not filled in yet" in a visually de-emphasised style

#### Scenario: User corrects a section from Review

- **WHEN** a user activates the edit control on any summary block
- **THEN** the system SHALL display the step corresponding to that block
- **AND** the step SHALL be populated with the values shown in the summary

#### Scenario: User completes the wizard

- **WHEN** a user activates "Save HERO Story" on the Review step
- **THEN** the system SHALL persist any values not yet written to the story
- **AND** upon success the system SHALL show a confirmation message
- **AND** the system SHALL navigate to `/profile/hero`
- **AND** the completed story SHALL appear in the story list

#### Scenario: Final save fails

- **WHEN** the final save fails due to a network error or server error
- **THEN** the system SHALL remain on the Review step
- **AND** the system SHALL display an error message
- **AND** the user SHALL be able to retry
