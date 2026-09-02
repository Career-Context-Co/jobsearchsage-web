# resume-content-sync Specification

## Purpose

Define the "Sync from Profile" action that additively appends new profile items into a resume snapshot without overwriting existing selections or edits.

## Requirements

### Requirement: Sync from Profile action
The application SHALL provide a "Sync from Profile" action in the resume Content tab that additively appends new profile items to the resume without overwriting existing content.

#### Scenario: Sync appends new items only
- **WHEN** the user clicks "Sync from Profile"
- **THEN** the system SHALL rebuild a fresh snapshot from the current `careerIDStore` data
- **AND** for each section (workExperience, education, skills, certifications), SHALL append only items whose `id` is NOT already present in the resume's `editableData`
- **AND** appended items SHALL have `selected: false`
- **AND** existing items SHALL remain unchanged (selections, text edits, order preserved)

#### Scenario: New items are visually badged
- **WHEN** items are appended by a sync operation
- **THEN** each newly appended item SHALL display a "New" badge
- **AND** the badge SHALL remain visible until the user saves the resume or dismisses it

#### Scenario: Sync result banner shown
- **WHEN** a sync completes
- **THEN** a dismissible banner SHALL appear stating how many items were added (e.g., "2 items added from your profile")
- **AND** if no new items were found, the banner SHALL state "Your resume is up to date with your profile"

#### Scenario: Sync with no profile changes
- **WHEN** the user clicks "Sync from Profile" and the profile has no items with new IDs
- **THEN** no items SHALL be appended
- **AND** no existing items SHALL be modified

#### Scenario: Sync does not overwrite edited content
- **WHEN** a user has manually edited a bullet point in the resume Editor tab and then syncs
- **THEN** the existing item with that ID SHALL remain in place with the user's edits intact
- **AND** the sync SHALL NOT replace the edited item with the profile version
