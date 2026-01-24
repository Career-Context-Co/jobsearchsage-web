# profile-builder Specification Deltas

## ADDED Requirements

### Requirement: Deep Achievement Enhancement Page Access
The application SHALL provide a dedicated achievement enhancement page accessible after profile creation.

#### Scenario: Navigate to enhancement page from profile dashboard
- **WHEN** a user with a completed profile navigates to the profile dashboard
- **THEN** the application SHALL display a "Deep Enhance Achievements" button or link
- **AND** clicking the button SHALL navigate to `/profile/enhance`
- **AND** the enhancement page SHALL display all work experiences from the user's profile

#### Scenario: Navigate to enhancement page from main navigation
- **WHEN** a user with a completed profile views the main navigation
- **THEN** the application SHALL provide a navigation link to the enhancement page
- **AND** the link SHALL be accessible from the profile section of the navigation

### Requirement: Experience Selection for Enhancement
The application SHALL allow users to select which work experience to enhance.

#### Scenario: Display all experiences with enhancement status
- **WHEN** a user views the enhancement page
- **THEN** the application SHALL display all work experiences in a list
- **AND** each experience SHALL show company name, job title, and date range
- **AND** each experience SHALL display an enhancement status indicator (not enhanced, enhanced, last enhanced date)
- **AND** each experience SHALL have an "Enhance" button

#### Scenario: Select experience to enhance
- **WHEN** a user clicks "Enhance" on a specific work experience
- **THEN** the application SHALL begin the enhancement flow for that experience
- **AND** the application SHALL focus on all achievements associated with that role

### Requirement: XYZ Method Question Generation
The application SHALL generate contextual questions using the XYZ method to gather achievement context.

#### Scenario: Generate XYZ-focused questions
- **WHEN** a user selects an experience to enhance
- **THEN** the system SHALL analyze the experience (title, employer, employment type, existing achievements)
- **AND** the system SHALL use the XYZ Context Gathering Prompt to generate 5-7 targeted questions
- **AND** the questions SHALL focus on extracting X (accomplishments), Y (metrics), Z (methods)
- **AND** the questions SHALL be tailored to the employment type (full-time, part-time, contract, internship)
- **AND** all questions SHALL be returned at once (no follow-ups)

#### Scenario: Display questions with employment type awareness
- **WHEN** questions are generated
- **THEN** the application SHALL display all 5-7 questions
- **AND** the questions SHALL be appropriate for the employment type
- **AND** internship questions SHALL focus on contributions and learning (not leadership)
- **AND** full-time questions SHALL focus on leadership and strategic impact

### Requirement: User Answer Collection
The application SHALL collect user answers to enhancement questions.

#### Scenario: Answer questions in guided flow
- **WHEN** a user is presented with enhancement questions
- **THEN** the application SHALL display questions one at a time or all at once
- **AND** the application SHALL provide text input fields for answers
- **AND** the application SHALL allow users to skip questions
- **AND** the application SHALL allow users to provide partial answers
- **AND** the application SHALL collect all responses before proceeding

#### Scenario: Validate answer submission
- **WHEN** a user submits their answers
- **THEN** the system SHALL validate that at least one question has been answered
- **AND** the system SHALL allow submission even if some questions are skipped
- **AND** the system SHALL proceed to enhancement generation

### Requirement: XYZ Method Bullet Generation
The application SHALL generate achievement bullets using the XYZ method formula.

#### Scenario: Generate XYZ-format bullets from answers
- **WHEN** the user submits answers to enhancement questions
- **THEN** the system SHALL use the XYZ Bullet Writing Prompt to generate 3-5 achievement bullets
- **AND** each bullet SHALL follow the formula: "Accomplished [X] as measured by [Y] by doing [Z]"
- **AND** each bullet SHALL start with an employment-type-appropriate action verb
- **AND** each bullet SHALL include at least one quantifiable metric
- **AND** bullets SHALL be 1-2 lines maximum for scannability

#### Scenario: Use employment-type-appropriate verbs
- **WHEN** generating bullets for full-time roles
- **THEN** the system SHALL use leadership verbs (led, architected, spearheaded, drove, established)
- **WHEN** generating bullets for internships
- **THEN** the system SHALL use collaborative verbs (assisted, supported, contributed, participated in)
- **AND** the system SHALL NOT use leadership verbs for internships

### Requirement: Enhanced Achievement Preview and Acceptance
The application SHALL allow users to preview and accept enhanced achievements.

#### Scenario: Display enhanced achievements for review
- **WHEN** enhancement generation completes
- **THEN** the application SHALL display all enhanced achievements for that experience
- **AND** each enhanced achievement SHALL be shown alongside its original version
- **AND** the application SHALL highlight what was added or changed
- **AND** the application SHALL provide "Accept" and "Regenerate" buttons

#### Scenario: Accept enhanced achievements
- **WHEN** a user clicks "Accept" on enhanced achievements
- **THEN** the system SHALL overwrite the original achievement text with enhanced versions
- **AND** the system SHALL update the `last_enhanced_at` timestamp for that experience
- **AND** the system SHALL mark the experience as enhanced on the enhancement page
- **AND** the system SHALL display a success message
- **AND** the user SHALL return to the enhancement page experience list

#### Scenario: Regenerate enhanced achievements
- **WHEN** a user clicks "Regenerate" on enhanced achievements
- **THEN** the application SHALL re-display the question flow
- **AND** the application SHALL pre-populate previous answers
- **AND** the user SHALL be able to modify their answers
- **AND** the system SHALL generate new enhanced versions with updated context
- **AND** the user SHALL be able to regenerate unlimited times

### Requirement: Enhancement Answer Storage
The application SHALL store user answers to enable regeneration without re-asking questions.

#### Scenario: Store answers for regeneration
- **WHEN** a user provides answers during enhancement
- **THEN** the system SHALL store the answers in component state
- **AND** the answers SHALL be associated with the specific experience being enhanced
- **AND** stored answers SHALL be used for regeneration if user clicks "Regenerate"

#### Scenario: Clear answers after acceptance
- **WHEN** a user accepts enhanced achievements
- **THEN** the system SHALL clear stored answers for that experience
- **AND** future enhancements of the same experience SHALL start with fresh questions

### Requirement: Enhancement Status Tracking
The application SHALL track which experiences have been enhanced and when.

#### Scenario: Display enhancement status on enhancement page
- **WHEN** viewing the enhancement page
- **THEN** each experience SHALL display its enhancement status
- **AND** unenhanced experiences SHALL show "Not Enhanced" status
- **AND** enhanced experiences SHALL show "Enhanced on [date]" status
- **AND** the application SHALL encourage users to enhance all experiences

#### Scenario: Display enhancement status on profile dashboard
- **WHEN** viewing the profile dashboard
- **THEN** enhanced experiences SHALL display a visual indicator (badge or icon)
- **AND** the indicator SHALL show the last enhanced date
- **AND** users SHALL be able to re-enhance previously enhanced experiences

### Requirement: Bulk Enhancement Option
The application SHALL allow users to enhance multiple experiences in sequence.

#### Scenario: Enhance all experiences
- **WHEN** a user clicks "Enhance All" on the enhancement page
- **THEN** the application SHALL begin enhancement flow for the first unenhanced experience
- **AND** after accepting or skipping, SHALL automatically proceed to the next experience
- **AND** the user SHALL be able to cancel bulk enhancement at any time
- **AND** progress SHALL be saved after each individual enhancement

### Requirement: Enhancement Quality Standards
The AI enhancement SHALL improve achievement quality while preserving user intent.

#### Scenario: Add quantitative metrics
- **WHEN** enhancing achievements with user-provided metrics
- **THEN** the system SHALL incorporate specific numbers, percentages, and dollar amounts
- **AND** the system SHALL place metrics prominently in achievement statements
- **AND** the system SHALL NOT fabricate metrics not provided by the user

#### Scenario: Add scope and context
- **WHEN** enhancing achievements with user-provided scope
- **THEN** the system SHALL incorporate team size, project duration, and organizational impact
- **AND** the system SHALL provide context that demonstrates scale and responsibility

#### Scenario: Improve action verbs and structure
- **WHEN** enhancing achievements
- **THEN** the system SHALL use strong action verbs (led, delivered, implemented, optimized)
- **AND** the system SHALL structure achievements using the STAR method (Situation, Task, Action, Result)
- **AND** the system SHALL maintain professional tone and clarity

#### Scenario: Preserve user meaning and authenticity
- **WHEN** enhancing achievements
- **THEN** the system SHALL NOT change the core meaning or facts
- **AND** the system SHALL NOT add information not provided by the user
- **AND** the system SHALL preserve the user's voice and authenticity

### Requirement: Enhancement Error Handling
The application SHALL handle enhancement failures gracefully without blocking profile usage.

#### Scenario: Handle question generation timeout
- **WHEN** question generation times out or takes longer than 15 seconds
- **THEN** the application SHALL display a timeout error message
- **AND** the application SHALL provide a "Retry" button
- **AND** the application SHALL allow the user to return to the enhancement page
- **AND** the application SHALL not block access to other profile features

#### Scenario: Handle enhancement generation timeout
- **WHEN** enhancement generation times out or takes longer than 20 seconds
- **THEN** the application SHALL display a timeout error message
- **AND** the application SHALL preserve the user's answers
- **AND** the application SHALL provide a "Retry" button
- **AND** the user SHALL be able to retry with the same answers

#### Scenario: Handle API failure
- **WHEN** the AI enhancement API returns an error
- **THEN** the application SHALL display a user-friendly error message
- **AND** the application SHALL preserve the user's answers
- **AND** the application SHALL provide a "Retry" button
- **AND** the application SHALL allow the user to return to the enhancement page

#### Scenario: Handle network error
- **WHEN** a network error occurs during enhancement
- **THEN** the application SHALL display a network error message
- **AND** the application SHALL preserve the user's answers
- **AND** the application SHALL provide a "Retry" button

### Requirement: Enhancement Data Persistence
The application SHALL persist enhanced achievements to the database.

#### Scenario: Save enhanced achievements to database
- **WHEN** a user accepts enhanced achievements
- **THEN** the system SHALL update the experience record in the database
- **AND** the system SHALL overwrite the original highlights array with enhanced versions
- **AND** the system SHALL update the `last_enhanced_at` timestamp
- **AND** the enhanced achievements SHALL be immediately available for resume generation

#### Scenario: No separate storage of originals
- **WHEN** enhanced achievements are saved
- **THEN** the system SHALL NOT store separate original and enhanced versions
- **AND** the system SHALL only persist the final enhanced text
- **AND** users SHALL not be able to revert to original text after acceptance

### Requirement: Enhancement User Experience
The application SHALL provide clear feedback and maintain user control throughout enhancement.

#### Scenario: Display enhancement progress
- **WHEN** enhancement is in progress
- **THEN** the application SHALL display a loading indicator
- **AND** the application SHALL show status messages (Generating questions, Processing answers, Creating enhanced achievements)
- **AND** the application SHALL disable action buttons to prevent duplicate requests

#### Scenario: Provide enhancement success feedback
- **WHEN** enhancement completes successfully
- **THEN** the application SHALL display a success toast notification
- **AND** the application SHALL show the enhanced achievements immediately
- **AND** the application SHALL update the enhancement status indicator

#### Scenario: Allow enhancement opt-out
- **WHEN** a user is on the enhancement page
- **THEN** the application SHALL allow the user to skip enhancement entirely
- **AND** the application SHALL not require enhancement to use other profile features
- **AND** the application SHALL allow users to return to enhancement at any time

#### Scenario: Maintain enhancement state during session
- **WHEN** a user is in the middle of enhancement flow
- **THEN** the application SHALL preserve their progress if they navigate away
- **AND** the application SHALL allow them to resume where they left off
- **AND** the application SHALL clear state after successful acceptance or explicit cancellation
