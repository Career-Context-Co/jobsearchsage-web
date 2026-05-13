## ADDED Requirements

### Requirement: Response HERO Session Support

The system SHALL allow users to build the Response section through the existing structured HERO session flow.

#### Scenario: User starts a Response field session
- **WHEN** a user opens the HERO session pane for a story
- **THEN** the system SHALL show the Response section as available
- **AND** the Response section SHALL offer field sessions for Actions, Tools, and Challenges
- **AND** each Response field session SHALL use the existing `/api/ai/hero-session/start` workflow with `section_type` set to `response`

#### Scenario: User completes a Response field session
- **WHEN** the user completes a Response field session
- **THEN** the system SHALL generate a suggestion for the selected Response field
- **AND** accepting the suggestion SHALL map Actions to `responseActions`
- **AND** accepting the suggestion SHALL map Tools to `responseTools`
- **AND** accepting the suggestion SHALL map Challenges to `responseChallenges`
- **AND** the system SHALL not save the HERO story until the user explicitly saves the form

#### Scenario: Response session continues with existing contract
- **WHEN** a Response field session is active
- **AND** the user answers a structured question
- **THEN** the system SHALL continue the session through the existing `/api/ai/hero-session/continue` workflow
- **AND** the request and response shape SHALL match the existing Hurdle and Expectation field-session contract

### Requirement: Outcome HERO Session Support

The system SHALL allow users to build the Outcome section through the existing structured HERO session flow.

#### Scenario: User starts an Outcome field session
- **WHEN** a user opens the HERO session pane for a story
- **THEN** the system SHALL show the Outcome section as available
- **AND** the Outcome section SHALL offer field sessions for Deliverable, Metrics, and Impact
- **AND** each Outcome field session SHALL use the existing `/api/ai/hero-session/start` workflow with `section_type` set to `outcome`

#### Scenario: User completes an Outcome field session
- **WHEN** the user completes an Outcome field session
- **THEN** the system SHALL generate a suggestion for the selected Outcome field
- **AND** accepting the suggestion SHALL map Deliverable to `outcomeDeliverable`
- **AND** accepting the suggestion SHALL map Metrics to `outcomeMetrics`
- **AND** accepting the suggestion SHALL map Impact to `outcomeImpact`
- **AND** the system SHALL not save the HERO story until the user explicitly saves the form

#### Scenario: Outcome session continues with existing contract
- **WHEN** an Outcome field session is active
- **AND** the user answers a structured question
- **THEN** the system SHALL continue the session through the existing `/api/ai/hero-session/continue` workflow
- **AND** the request and response shape SHALL match the existing Hurdle and Expectation field-session contract

### Requirement: HERO Session Pane Shows All Sections

The HERO session pane SHALL let users choose any HERO section that has structured field-session support.

#### Scenario: All HERO sections are selectable
- **WHEN** a user opens the HERO session pane for a story
- **THEN** the pane SHALL show Hurdle, Expectation, Response, and Outcome as selectable sections
- **AND** Response SHALL NOT display a "Coming Soon" state
- **AND** Outcome SHALL NOT display a "Coming Soon" state

#### Scenario: Section picker preserves existing behavior
- **WHEN** a user selects any HERO section
- **THEN** the pane SHALL show that section's field picker
- **AND** the pane SHALL preserve the existing field-level session behavior used by Hurdle and Expectation
