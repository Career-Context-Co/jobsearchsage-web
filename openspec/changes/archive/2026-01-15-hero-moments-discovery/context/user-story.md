# JSS-83: Hero Moments Discovery

## User Story

As a job seeker in a discovery session, I want to capture lightweight achievement moments with just a title and raw notes, so that I can explore and develop them into full HERO stories later without feeling pressured to complete them immediately.

---

## Additional Details

### What It Does

Hero Moments Discovery allows users to quickly capture career achievements during a guided discovery session without requiring them to fill out all 12 HERO framework fields. Instead of creating incomplete HERO stories that clutter the database and confuse the user experience, moments capture the raw essence of an achievement—what happened, why it mattered, and rough outcomes—in a conversational format. These moments serve as starting points that users can later develop into complete HERO stories at their own pace.

The discovery session becomes a lightweight, pressure-free experience focused on capturing and exploring achievements rather than perfecting narratives. Users can discover 3-5 moments in a single session, then review and develop them individually using the Story Builder.

### How It Works

**Discovery Session Flow:**

1. User enters the discovery session (this could be guided by an AI interviewer or manual entry)
2. The system asks questions about career achievements: "Tell me about a project you worked on that had real impact" or "Describe a challenge you overcame"
3. User provides a conversational response (2-4 sentences)
4. System captures the moment by extracting/generating:
   - **Title**: A short descriptor (5-10 words) of the achievement
   - **Raw Notes**: The unstructured narrative the user provided
5. User sees a confirmation of the captured moment and can either:
   - Continue discovering more moments
   - End the session
6. At session end, user sees a summary: "You discovered 4 moments. You can now develop these into full HERO stories."

**Moments Display (After Discovery):**

Users see their discovered moments in two places:

1. **In the Discovery Session** (during the session):
   - Running list of captured moments
   - Quick preview of title and first sentence of raw notes
   - Option to review, edit, or remove a moment before session ends

2. **On the HERO Stories Management Page** (alongside Stories):
   - Dedicated "Discovered Moments" section above or alongside "Your HERO Stories"
   - Shows all unconverted moments with a [Develop into Story] button
   - Shows count: "You have 5 discovered moments, 3 developed into stories"
   - Moments display in order of discovery (newest first)

### User Experience Example

**During Discovery Session:**
```
AI Coach: "Tell me about a project that had measurable impact on your team or company."

User Input: "I led a customer portal rebuild at my last job. The old portal was causing like 40% of support tickets. We migrated 500K users to a new React-based system with zero downtime. At the end, support tickets dropped from 200 a week to 110 a week, which saved the company a bunch of money."

System Captures:
├─ Title: "Customer Portal Migration"
├─ Raw Notes: "Led customer portal rebuild. Old portal caused 40% of support tickets affecting 500K users. Migrated to React with zero downtime. Support tickets reduced from 200/week to 110/week."
└─ [✓ Got it! What's another achievement?] [← End session]
```

**On HERO Management Page:**
```
┌─────────────────────────────────────────────────┐
│ DISCOVERED MOMENTS (5)                          │
│ You can develop these into full HERO stories    │
├─────────────────────────────────────────────────┤
│ 1. Customer Portal Migration                    │
│    Led customer portal rebuild. Old portal...   │
│    [Develop into Story] [Remove]                │
│                                                 │
│ 2. Team Training Program Launch                 │
│    Created and launched training program...    │
│    [Develop into Story] [Remove]                │
│                                                 │
│ 3. Performance Optimization Project             │
│    Optimized database queries reducing...       │
│    [Develop into Story] [Remove]                │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ YOUR HERO STORIES (2)                           │
│ Ready for resume and interview prep             │
├─────────────────────────────────────────────────┤
│ 1. Customer Portal Migration (95% complete)     │
│    [Edit] [Generate Bullets] [Delete]           │
│                                                 │
│ 2. Sales Process Redesign (80% complete)       │
│    [Edit] [Generate Bullets] [Delete]           │
└─────────────────────────────────────────────────┘
```

### What Gets Stored

Each moment captures:
- **Title**: Short, descriptive (5-10 words) — e.g., "Customer Portal Rebuild"
- **Raw Notes**: Conversational narrative (2-4 sentences) — what the user said, roughly transcribed
- **Source Experience**: Which job/role this achievement relates to (optional)
- **Discovery Session ID**: Which discovery session created this moment (for analytics)
- **Timestamps**: When the moment was created and if/when it was converted to a story
- **Conversion Link**: Once the moment is developed into a story, the system tracks which story it became

### Out of Scope

- Story Builder functionality (converting moments into full HERO stories with all 12 fields)
- AI enhancement or rewriting of moment titles or notes during discovery
- Exporting moments outside the app
- Sharing moments with other users
- Bulk operations on moments (delete multiple at once)
- Searching or filtering moments
- Mobile-specific discovery UI (this covers web; mobile can be a separate story)

---

## Acceptance Criteria

**AC 1.1: Start discovery session and capture first moment**
* Given a user has navigated to the discovery session
* When the system asks about an achievement and the user provides a response (2-4 sentences)
* Then the system displays a form to confirm the moment title and raw notes
* And the user can approve the captured moment, edit the title/notes, or reject it
* And upon approval, the moment is saved to the database and added to the session's moment list

**AC 1.2: Display captured moment in running discovery list**
* Given a user has captured a moment during the discovery session
* When the user looks at the discovery interface
* Then the system displays a running list of all moments captured in this session
* And each moment shows the title and first 1-2 sentences of raw notes
* And moments are displayed in the order they were discovered (newest first)

**AC 1.3: Continue discovering additional moments**
* Given a user has captured a moment
* When the user clicks "Continue" or the system prompts for the next achievement
* Then the discovery session continues with a new question
* And the user can capture additional moments in the same session
* And all moments remain visible in the running list without losing any data

**AC 1.4: Edit moment title or notes during discovery session**
* Given a user has captured a moment and it's displayed in the running list
* When the user clicks "Edit" on a moment card
* Then the system opens an edit form showing the current title and raw notes
* And the user can modify the title (up to 50 characters) and raw notes (up to 500 characters)
* And upon saving changes, the moment list is updated immediately with new values
* And the edit does not affect any other moments in the session

**AC 1.5: Remove a moment during discovery session**
* Given a user has captured a moment
* When the user clicks "Remove" on a moment card
* Then the system prompts for confirmation: "Remove this moment? You can't undo this."
* And upon confirmation, the moment is deleted from the current session
* And the moment does not appear in the running list or get saved to the database
* And if the user clicks "Cancel," the moment remains unchanged

**AC 1.6: Complete discovery session and view moment summary**
* Given a user has captured one or more moments
* When the user clicks "End Session" or "Finish"
* Then the system displays a summary showing: "You discovered [X] moments. You can now develop these into full HERO stories."
* And the summary shows a preview list of all discovered moments
* And the user can click a button to view their moments on the HERO management page
* And all moments are persisted to the database and associated with the user's profile

**AC 1.7: Display unconverted moments on HERO management page**
* Given a user has completed a discovery session with moments
* When the user navigates to the HERO Stories management page
* Then the system displays a "Discovered Moments" section above or alongside the "Your HERO Stories" section
* And the section shows a count: "You have [X] discovered moments"
* And each moment displays: title, first 2 sentences of raw notes, and timestamps showing when it was discovered
* And moments are sorted by recency (newest discovered first)
* And the section is clearly distinct from completed HERO stories

**AC 1.8: Distinguish moments from stories on management page**
* Given a user is viewing the HERO management page
* When the user looks at the Discovered Moments and HERO Stories sections
* Then the Discovered Moments section has a distinct visual style (different color, icon, or label)
* And each moment shows a status badge or label indicating "Discovered - Not Yet Developed"
* And each story shows a status indicating its completeness percentage
* And the interface makes it clear that moments are starting points that will become stories
* And a new user would understand the difference between a moment and a story without additional help

**AC 1.9: Access develop action for moments on management page**
* Given a user is viewing the Discovered Moments section on the HERO management page
* When the user clicks "[Develop into Story]" on a moment
* Then the user is navigated to the Story Builder with that moment loaded (out of scope for final implementation, but UI ready)
* And the Story Builder displays the moment's title and raw notes as context
* And the user understands they're now building a full HERO story from this moment

**AC 1.10: Track moment-to-story conversion**
* Given a user has discovered moments and later develops one into a story
* When the story is created from a moment
* Then the system establishes a link between the moment and the newly created story
* And the moment no longer appears in the Discovered Moments section (it's been converted)
* And the Discovered Moments count decreases by one
* And the Your HERO Stories count increases by one
* And the system can track conversion metrics: total moments discovered, moments converted, conversion rate

**AC 1.11: Handle discovery session without AI (manual moment entry)**
* Given a user wants to manually add moments without guided discovery
* When the user opens the manual moment entry interface
* Then the user can enter a title and raw notes directly (without AI prompting)
* And the moment is saved using the same process as AI-discovered moments
* And the moment appears in the Discovered Moments section alongside AI-discovered moments
* And there's no visual distinction between manually entered and AI-discovered moments

**AC 1.12: Preserve discovery session data on page refresh**
* Given a user is in an active discovery session
* When the user's browser refreshes or connection briefly drops
* Then the system preserves all moments captured so far in the session
* And upon refresh, the user returns to the discovery session at the point they left off
* And all previously captured moments remain in the running list
* And the user can continue discovering additional moments without losing progress
* And the session data is temporarily cached and finalized when the user clicks "End Session"