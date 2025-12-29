# User Story: AI-Powered Achievement Light Polish

## Story
As a user creating my profile, I want AI to automatically improve my achievement descriptions as I write them, so that my career information sounds professional and polished without extra effort.

## Context
Light polish applies real-time AI enhancement to achievement text as users enter their professional experience during onboarding. The enhancement improves:

- Grammar and syntax - Corrects grammatical errors, fixes punctuation, ensures proper sentence structure
- Clarity and conciseness - Removes filler words, tightens phrasing, makes statements more direct
- Action verbs - Replaces weak verbs ("did", "worked on", "helped with") with strong action verbs ("led", "delivered", "implemented")

Light polish happens via button click without workflow interruption. Users write in their own voice and see the text improve to professional quality. The enhancement is subtle—it doesn't add new information, change meaning, or make the achievement quantified. It simply makes what the user wrote sound better.

Light polish operates on individual achievement entries within the work experience section. Each achievement (3-5 per job) can be polished independently or all at once. The polished version replaces the user's original text inline.

Users should perceive this as "the app making me sound professional" rather than "AI is rewriting my work." The enhancement should feel helpful, not intrusive.

## Acceptance Criteria

### AC 1.1: Button click enhancement trigger
- **GIVEN** a user is entering an achievement during profile creation
- **WHEN** the user clicks the 'enhance' button next to the achievement field
- **THEN** the system sends the achievement text to AI for light polish
- **AND** the enhancement happens without requiring user action or confirmation

### AC 1.2: Display enhanced achievement
- **GIVEN** the AI has generated a light polished version of the achievement
- **WHEN** the enhancement is complete
- **THEN** the system replaces the user's original text with the polished version in the input field

### AC 1.3: Preserve user intent and meaning
- **GIVEN** the AI is performing light polish
- **WHEN** generating the enhanced version
- **THEN** the system maintains the core meaning and facts of the user's original text
- **AND** the system only improves grammar, clarity, and action verbs without adding new information

### AC 1.4: Handle enhancement failures gracefully
- **GIVEN** the AI enhancement request fails or times out
- **WHEN** the error occurs
- **THEN** the system keeps the user's original text unchanged
- **AND** the system allows the user to continue profile creation without blocking progress

### AC 1.5: Store polished achievements
- **GIVEN** a user completes the onboarding form with light-polished achievements
- **WHEN** the user saves their profile
- **THEN** the system stores the polished achievement text (not the original)
- **AND** the stored achievements are available for resume generation and other features

## Additional Requirements (from clarification)
1. Enhancement Trigger: Both individual "Enhance" buttons (per achievement) AND "Enhance All" button (for all achievements in a job)
2. AI Provider: Use AI Gateway with GPT-4o (new endpoint, not resume extraction logic)
3. Feature Availability: Only during onboarding (post-creation editing is out of scope)
4. Visual Feedback: Highlight enhanced achievements with badge (similar to "Extracted" styling) + toast notification for successful enhancement
