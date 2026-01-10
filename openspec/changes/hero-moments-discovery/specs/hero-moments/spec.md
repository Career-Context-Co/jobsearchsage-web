# Spec: Hero Moments Discovery

## Overview

Hero Moments Discovery enables users to capture lightweight achievement moments during guided discovery sessions. Moments consist of a title and raw notes, serving as starting points for developing full HERO stories later. This spec defines the requirements for capturing, displaying, managing, and converting moments.

---

## ADDED Requirements

### Requirement: Capture Moment During Discovery Session

The system SHALL capture a moment when a user provides a conversational response to an achievement question during a discovery session.

#### Scenario: User captures first moment
- Given a user has started a discovery session
- When the system asks "Tell me about a project you worked on that had real impact"
- And the user provides a 2-4 sentence response
- Then the system displays a confirmation form with:
  - Extracted or user-provided title (5-10 words)
  - Raw notes (the user's response)
  - Option to edit title or notes
  - Approve, Edit, or Reject buttons
- And upon approval, the moment is saved to the database
- And the moment is added to the session's running list

#### Scenario: User edits moment before approval
- Given a user has provided a response and sees the confirmation form
- When the user clicks "Edit" on the title or notes
- Then the user can modify the text inline
- And the changes are reflected in the confirmation form
- And upon approval, the edited values are saved

#### Scenario: User rejects a moment
- Given a user has provided a response and sees the confirmation form
- When the user clicks "Reject" or "Try Again"
- Then the moment is not saved
- And the system prompts for a new response
- And the previous response is discarded

---

### Requirement: Display Running List of Captured Moments

The system SHALL display all moments captured in the current discovery session in a running list.

#### Scenario: User sees captured moments during session
- Given a user has captured one or more moments in the current session
- When the user looks at the discovery session interface
- Then the system displays a running list of all captured moments
- And each moment shows:
  - Title (5-10 words)
  - First 1-2 sentences of raw notes
  - Timestamp of capture
  - Edit and Remove buttons
- And moments are displayed in order of discovery (newest first)
- And the list updates immediately when a new moment is captured

#### Scenario: User sees empty state before first capture
- Given a user has started a discovery session but captured no moments
- When the user looks at the discovery session interface
- Then the system displays an empty state message
- And the message says "No moments captured yet. Answer the question above to get started."
- And the empty state disappears when the first moment is captured

---

### Requirement: Edit Moment During Discovery Session

Users SHALL be able to edit a moment's title or raw notes while the discovery session is active.

#### Scenario: User edits moment title
- Given a user has captured a moment and it appears in the running list
- When the user clicks "Edit" on the moment card
- Then the system opens an edit form showing:
  - Current title (editable, max 50 characters)
  - Current raw notes (editable, max 500 characters)
  - Save and Cancel buttons
- And the user can modify the title
- And upon saving, the moment list is updated immediately
- And the edit does not affect other moments in the session

#### Scenario: User edits moment notes
- Given a user has captured a moment
- When the user clicks "Edit" and modifies the raw notes
- Then the changes are reflected in the moment card preview
- And the first 1-2 sentences are updated in the running list
- And the full notes are saved to the database

#### Scenario: User cancels edit
- Given a user has opened the edit form for a moment
- When the user clicks "Cancel"
- Then the edit form closes
- And no changes are saved
- And the moment remains unchanged in the running list

---

### Requirement: Remove Moment During Discovery Session

Users SHALL be able to remove a moment from the discovery session before the session ends.

#### Scenario: User removes a moment
- Given a user has captured a moment and it appears in the running list
- When the user clicks "Remove" on the moment card
- Then the system displays a confirmation dialog:
  - "Remove this moment? You can't undo this."
  - Confirm and Cancel buttons
- And upon confirmation, the moment is deleted from the session
- And the moment does not appear in the running list
- And the moment is not saved to the database
- And the running list updates immediately

#### Scenario: User cancels removal
- Given a user has clicked "Remove" and sees the confirmation dialog
- When the user clicks "Cancel"
- Then the dialog closes
- And the moment remains in the running list
- And no changes are made

---

### Requirement: Complete Discovery Session

Users SHALL be able to end a discovery session and see a summary of all discovered moments.

#### Scenario: User ends discovery session
- Given a user has captured one or more moments
- When the user clicks "End Session" or "Finish"
- Then the system displays a summary screen showing:
  - "You discovered [X] moments. You can now develop these into full HERO stories."
  - A preview list of all discovered moments (title + first sentence)
  - "View on HERO Management Page" button
  - "Start Another Discovery Session" button
- And all moments are finalized and persisted to the database
- And the discovery session is marked as complete

#### Scenario: User ends session with no moments
- Given a user has started a discovery session but captured no moments
- When the user clicks "End Session"
- Then the system displays a confirmation:
  - "You haven't captured any moments. Are you sure you want to end the session?"
  - Continue and Cancel buttons
- And upon confirmation, the session ends with no moments saved
- And the user is returned to the HERO management page

---

### Requirement: Display Unconverted Moments on Management Page

The system SHALL display all discovered moments that haven't been converted to stories on the HERO management page.

#### Scenario: User views discovered moments section
- Given a user has completed one or more discovery sessions with moments
- When the user navigates to the HERO Stories management page
- Then the system displays a "Discovered Moments" section
- And the section shows:
  - Section title: "Discovered Moments"
  - Count badge: "You have [X] discovered moments"
  - Subtitle: "You can develop these into full HERO stories"
- And the section is visually distinct from the "Your HERO Stories" section
- And moments are displayed in order of discovery (newest first)

#### Scenario: User sees moment cards on management page
- Given a user is viewing the Discovered Moments section
- When the user looks at the moment cards
- Then each card displays:
  - Moment title (5-10 words)
  - First 2 sentences of raw notes (truncated with ellipsis if longer)
  - Discovery timestamp ("Discovered on [date]")
  - Status badge: "Discovered - Not Yet Developed"
  - "Develop into Story" button
  - "Remove" button
- And the cards are clearly distinct from HERO story cards

#### Scenario: User sees empty state when no moments exist
- Given a user has no discovered moments
- When the user navigates to the HERO management page
- Then the Discovered Moments section is not displayed
- Or the section shows an empty state: "No discovered moments yet. Start a discovery session to capture achievements."

---

### Requirement: Distinguish Moments from Stories

The system SHALL provide clear visual distinction between discovered moments and completed HERO stories on the management page.

#### Scenario: User sees visual distinction
- Given a user is viewing the HERO management page
- When the user looks at the Discovered Moments and Your HERO Stories sections
- Then the sections have distinct visual styles:
  - Different background colors or borders
  - Different icons or badges
  - Different typography or spacing
- And each moment card shows a "Discovered - Not Yet Developed" status badge
- And each story card shows a completion percentage (e.g., "95% complete")
- And a new user would understand the difference without additional help

#### Scenario: User understands the workflow
- Given a user is viewing the management page for the first time
- When the user sees the Discovered Moments section
- Then the UI makes it clear that:
  - Moments are starting points
  - Stories are fully developed narratives
  - Moments can be developed into stories
  - The workflow is: Discover → Develop → Complete

---

### Requirement: Develop Moment into Story

Users SHALL be able to navigate to the Story Builder with a moment loaded as context.

#### Scenario: User clicks develop button
- Given a user is viewing a discovered moment on the management page
- When the user clicks "Develop into Story"
- Then the user is navigated to the Story Builder
- And the Story Builder displays:
  - The moment's title as a starting point
  - The moment's raw notes as context
  - A message: "You're developing this moment into a full HERO story"
  - All four HERO Framework sections (Hero, Encounter, Response, Outcome) ready for input
- And the user understands they're now building a complete story from this moment

#### Scenario: User develops moment and saves story
- Given a user has developed a moment into a story and saved it
- When the story is successfully created
- Then the system:
  - Establishes a link between the moment and the new story
  - Sets `converted_at` timestamp on the moment
  - Sets `converted_story_id` to the new story's ID
  - Removes the moment from the Discovered Moments section
  - Adds the story to the Your HERO Stories section
  - Decrements the Discovered Moments count by one
  - Increments the Your HERO Stories count by one

---

### Requirement: Track Moment-to-Story Conversion

The system SHALL track which moments have been converted to stories for analytics and user feedback.

#### Scenario: System tracks conversion
- Given a user has discovered moments and later develops one into a story
- When the story is created from a moment
- Then the system records:
  - `converted_at` timestamp on the moment
  - `converted_story_id` linking to the new story
  - Conversion event for analytics
- And the moment no longer appears in the Discovered Moments section
- And the Discovered Moments count decreases by one
- And the Your HERO Stories count increases by one

#### Scenario: User sees conversion metrics
- Given a user has discovered and converted moments
- When the user views the HERO management page
- Then the system displays:
  - "You have [X] discovered moments, [Y] developed into stories"
  - Conversion rate or progress indicator
  - Encouragement to develop remaining moments

---

### Requirement: Preserve Discovery Session State on Page Refresh

The system SHALL preserve users' discovery session state if the browser refreshes or connection drops.

#### Scenario: User's session survives page refresh
- Given a user is in an active discovery session with captured moments
- When the user's browser refreshes or connection briefly drops
- Then the system:
  - Preserves all moments captured so far in the session
  - Restores the session state on page reload
  - Returns the user to the discovery session at the point they left off
  - Displays all previously captured moments in the running list
- And the user can continue discovering additional moments without losing progress

#### Scenario: Session data is cached locally
- Given a user is in an active discovery session
- When the user captures a moment
- Then the system:
  - Saves the moment to the server immediately
  - Caches the session state locally (IndexedDB or localStorage)
  - Syncs the cache with the server after each action
- And if the page refreshes, the session is restored from the server

#### Scenario: Session is finalized on completion
- Given a user has completed a discovery session
- When the user clicks "End Session"
- Then the system:
  - Finalizes all moments in the session
  - Marks the session as complete
  - Clears the local cache
  - Displays the session summary

---

### Requirement: Manual Moment Entry

Users SHALL be able to manually add moments without guided discovery.

#### Scenario: User manually enters a moment
- Given a user wants to add a moment without guided discovery
- When the user accesses the manual moment entry interface
- Then the user can:
  - Enter a title (5-10 words, required)
  - Enter raw notes (2-4 sentences, required)
  - Optionally select a source experience
  - Click "Save Moment"
- And the moment is saved using the same process as discovered moments
- And the moment appears in the Discovered Moments section
- And there is no visual distinction between manually entered and discovered moments

---

### Requirement: Remove Moment from Management Page

Users SHALL be able to remove a discovered moment from the management page.

#### Scenario: User removes moment from management page
- Given a user is viewing a discovered moment on the management page
- When the user clicks "Remove"
- Then the system displays a confirmation dialog:
  - "Remove this moment? You can't undo this."
  - Confirm and Cancel buttons
- And upon confirmation, the moment is soft-deleted
- And the moment no longer appears in the Discovered Moments section
- And the Discovered Moments count decreases by one

---

## MODIFIED Requirements

### Requirement: HERO Stories Management Page

The HERO Stories management page SHALL be modified to include a Discovered Moments section.

#### Scenario: Management page displays both sections
- Given a user navigates to the HERO Stories management page
- When the page loads
- Then the system displays:
  - Discovered Moments section (if moments exist)
  - Your HERO Stories section
  - Each section with its own count and action buttons
- And the sections are visually distinct
- And the user can interact with moments and stories independently

---

## REMOVED Requirements

None. This is a new feature with no removed requirements.

---

## Acceptance Criteria Summary

- [x] AC 1.1: Start discovery session and capture first moment
- [x] AC 1.2: Display captured moment in running discovery list
- [x] AC 1.3: Continue discovering additional moments
- [x] AC 1.4: Edit moment title or notes during discovery session
- [x] AC 1.5: Remove a moment during discovery session
- [x] AC 1.6: Complete discovery session and view moment summary
- [x] AC 1.7: Display unconverted moments on HERO management page
- [x] AC 1.8: Distinguish moments from stories on management page
- [x] AC 1.9: Access develop action for moments on management page
- [x] AC 1.10: Track moment-to-story conversion
- [x] AC 1.11: Handle discovery session without AI (manual moment entry)
- [x] AC 1.12: Preserve discovery session data on page refresh
