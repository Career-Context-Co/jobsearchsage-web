# User Stories from Linear

## Parent Issue: JSS-89

**Title:** HERO Story AI Assistance Panel

**User Story:**
As a job seeker filling in a HERO story form, I want to click "Get AI Help" on any section and receive AI-generated suggestions, so I can refine my answers with just-in-time coaching without leaving the form.

**Additional Details:**
This story adds AI-powered assistance to the manual form from Story 1. Users can click a "Get AI Help" button on any HERO section (Hurdle, Expectation, Response, or Outcome). AI processes their current answers for that section and returns refined, tagged output with suggestions. Users can accept the suggestions (which populate the form fields), edit them inline, or regenerate for different suggestions. Multiple refinement cycles are allowed within a single session. The AI panel is a contextual overlay or side panel that doesn't interrupt the form workflow. AI calls are scoped to individual sections, not the entire story. This story defines the AI prompts, API structure, and refinement UX that will be reused by Story 3.

**Dependencies:**
- JSS-99 (Build a HERO Story with a Form) - Already complete ✅

**Blocks:**
- JSS-88 (HERO Story Session - Fully Guided Flow)

**Status:** In Progress

---

## Child Issue: JSS-94

**Title:** AI Help Panel with Accept/Dismiss

**Description:**
Add "Get AI Help" buttons to each HERO section (Hurdle, Expectation, Response, Outcome) that open a side panel with AI-generated suggestions. When clicked, send all current answers for that section to AI in one API call and display refined, tagged suggestions. Users can accept suggestions to populate form fields, dismiss without changes, or request help on another section. The button is disabled until at least one answer is entered. If AI processing fails, display a user-friendly error message and allow retry.

**Acceptance Criteria Satisfied:**
- AC 4.0: Get AI Help button exists on each HERO section
- AC 3.1: User submits section answers to AI in one API call
- AC 4.1: AI returns suggestions and user can accept them
- AC 4.4: User can dismiss or discard suggestions
- AC 8.1: Error handling displays user-friendly messages

**Status:** Todo

---

## Child Issue: JSS-95

**Title:** Regenerate AI Suggestions

**Description:**
Add a "Regenerate" button to the AI suggestions panel that sends the current section answers back to AI for alternative suggestions. Support unlimited regeneration cycles within a single AI help session so users can iterate until they find suggestions they want to accept. Once accepted into the form, users can edit the content directly in the form fields.

**Acceptance Criteria Satisfied:**
- AC 4.3: User can regenerate after editing for different suggestions

**Status:** Todo

---

## Full Acceptance Criteria from JSS-89

1. **AC 4.0:** Get AI Help button exists on each HERO section
   - Each of the four HERO sections (Hurdle, Expectation, Response, Outcome) displays a "Get AI Help" button
   - Button is positioned next to section header or at end of section fields
   - Button is disabled until user has entered at least one answer in the section

2. **AC 3.1:** User submits section answers to AI in one API call
   - When user clicks "Get AI Help", all current answers in that section are sent to AI in a single API call
   - API request includes: section type, all user answers for that section, and context (moment/experience data if available)
   - Request is sent with appropriate payload structure for AI processing

3. **AC 4.1:** AI returns suggestions and user can accept them
   - AI processes section answers and returns refined, tagged output
   - Suggestions are displayed in a side panel or overlay without replacing form fields
   - "Accept" button on the suggestion panel populates the form fields with suggested content
   - Form fields update immediately when suggestions are accepted

4. **AC 4.2:** User can edit suggestions without regenerating
   - User can manually edit suggested content within the suggestion panel before accepting
   - Edited suggestions can be accepted, which populates form fields with edited content
   - Editing does not trigger new AI processing

5. **AC 4.3:** User can regenerate after editing for different suggestions
   - After editing suggestions, user can click "Regenerate" button
   - System sends edited content back to AI for new refined output
   - AI generates alternative suggestions based on edited input
   - User can iterate multiple times within a single AI help session

6. **AC 4.4:** User can dismiss or discard suggestions
   - User can close the suggestion panel without accepting any suggestions
   - Dismissing keeps original form content unchanged
   - User can reopen "Get AI Help" for the same section to get new suggestions

7. **AC 8.1:** Error handling displays user-friendly messages
   - If AI request fails or times out, error message displays in the suggestion panel
   - User's original answers are preserved and visible in the form
   - User can retry the AI request without re-entering data
