## MODIFIED Requirements

### Requirement: Skills Entry
The application SHALL allow users to enter and manage skills using a tag-chip interface grouped by category, replacing the row-per-skill form.

#### Scenario: Add skills via tag input
- **WHEN** a user expands a skill group
- **THEN** the application SHALL display a tag input where the user types a skill name and presses Enter to add it
- **AND** the skill SHALL appear as a chip badge immediately in the group

#### Scenario: Edit skill metadata via chip popover
- **WHEN** a user clicks a skill chip
- **THEN** the application SHALL open an inline popover with proficiency level, years of experience, and a "Move to group" dropdown
- **AND** changes SHALL be staged locally until the group is saved

#### Scenario: Remove a skill
- **WHEN** a user clicks the × on a skill chip
- **THEN** the skill SHALL be removed from the group immediately (staged locally)

#### Scenario: Move skill between groups
- **WHEN** a user selects a different group from the "Move to group" dropdown in the skill popover
- **THEN** the skill SHALL transfer to the selected group immediately

#### Scenario: View skills in collapsed state
- **WHEN** a skill group is collapsed
- **THEN** the application SHALL display the group's skills as badge chips
- **AND** skills SHALL be easily scannable

#### Scenario: Reorder skill groups
- **WHEN** a user clicks ↑ or ↓ on a skill group header
- **THEN** the group SHALL swap positions with the adjacent group
- **AND** the new order SHALL be persisted on save

#### Scenario: Delete skill group persists
- **WHEN** a user deletes a skill group
- **THEN** the application SHALL immediately save the remaining groups to the database
- **AND** the deleted group SHALL NOT reappear on refresh
