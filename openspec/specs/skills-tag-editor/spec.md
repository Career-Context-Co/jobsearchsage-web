# skills-tag-editor Specification

## Purpose

Define the tag-chip skill editing UX on the profile Skills section: chip-based add/remove/edit, group reordering, and immediate persistence on group delete.

## Requirements

### Requirement: Tag-chip based skill editing
The application SHALL display skills within each group as interactive chip tags that support adding, removing, and editing metadata inline, replacing the row-per-skill form.

#### Scenario: Add a new skill via tag input
- **WHEN** a skill group is expanded
- **THEN** the application SHALL display a `UInputTags`-style input where the user types a skill name and presses Enter to add it as a chip
- **AND** the new chip SHALL appear immediately in the group

#### Scenario: Remove a skill chip
- **WHEN** a user clicks the × on a skill chip
- **THEN** the skill SHALL be removed from the group immediately
- **AND** the removal SHALL be staged locally until the group is saved

#### Scenario: Open skill metadata popover
- **WHEN** a user clicks a skill chip (not the × button)
- **THEN** the application SHALL open a popover containing:
  - Proficiency level selector (beginner / intermediate / advanced / expert)
  - Years of experience numeric input
  - "Move to group" dropdown listing all other groups
- **AND** changes in the popover SHALL update the chip's data immediately

#### Scenario: Move skill to another group
- **WHEN** a user selects a different group in the "Move to group" dropdown within the skill popover
- **THEN** the skill SHALL be removed from the current group and added to the selected group
- **AND** the target group SHALL not need to be open for the move to succeed

### Requirement: Skill group reordering
The application SHALL allow users to reorder skill groups using ↑↓ controls.

#### Scenario: Reorder skill groups with up/down buttons
- **WHEN** a skill group card is displayed
- **THEN** the application SHALL show ↑ and ↓ buttons on each group header
- **AND** the ↑ button SHALL be disabled for the first group
- **AND** the ↓ button SHALL be disabled for the last group
- **AND** clicking ↑ or ↓ SHALL swap the group's position with the adjacent group immediately

#### Scenario: Group order persisted on save
- **WHEN** the user saves after reordering groups
- **THEN** the new group order SHALL be reflected in the saved skill data
- **AND** the display order SHALL match the saved order on next page load

### Requirement: Delete skill group with persistence
The application SHALL delete a skill group and immediately persist the deletion to the database.

#### Scenario: Delete group persists on confirm
- **WHEN** a user confirms deletion of a skill group
- **THEN** the application SHALL remove the group from local state
- **AND** SHALL immediately save all remaining skill groups to the database
- **AND** SHALL show a success toast on completion
- **AND** the deleted group SHALL NOT reappear on page refresh

#### Scenario: Non-deletable groups cannot be deleted
- **WHEN** viewing the "No Group" (ungrouped skills) group
- **THEN** the application SHALL NOT display a delete button for that group
