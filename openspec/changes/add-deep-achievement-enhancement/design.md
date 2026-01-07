# Deep Achievement Enhancement - Technical Design

## Context

Users need a way to systematically enhance their work experience achievements after profile creation by providing additional context through AI-guided questioning. This feature is separate from the light polish feature (which enhances during onboarding) and provides a more thorough, conversational enhancement experience.

## Goals

- Provide dedicated enhancement page accessible post-profile-creation
- Generate contextual questions based on achievement analysis
- Support conversational flow with follow-up questions
- Allow users to enhance one experience at a time or all experiences in sequence
- Store answers temporarily for regeneration within the same session
- Track enhancement status with timestamps
- Maintain user control with preview, accept, and regenerate options

## Non-Goals

- Storing enhancement history or audit trails (only store final enhanced text)
- Persisting user answers between sessions (answers cleared after acceptance)
- Providing undo/revert functionality after acceptance
- Integrating deep enhancement into onboarding flow (separate feature)

## Architecture

### Frontend Architecture

The enhancement flow is integrated into the experience page with a 50% slide-out pane:

```
/profile/experience (Modified Page)
├── Experience List (left side, 50% width when pane open)
│   ├── Experience Cards
│   │   ├── View Mode
│   │   │   ├── Edit Button
│   │   │   └── Enhance Button (NEW)
│   │   └── Edit Mode (existing)
│   │       └── Enhance Button (NEW)
│   └── Active Card Highlight (when ?enhance=<id> param set)
│
└── Enhancement Pane (right side, 50% width, triggered by ?enhance param)
    ├── Round 1: Initial Questions
    │   ├── Loading state
    │   ├── Question groups (5-7 questions)
    │   └── Answer textarea inputs
    │
    ├── Round 2: Follow-up Questions (if any)
    │   ├── Read-only story notes from Round 1
    │   ├── New follow-up questions
    │   └── Answer textarea inputs
    │
    ├── Round 3: Context Review & Edit
    │   ├── Read-only accumulated story notes
    │   ├── Editable context notes textarea
    │   └── Next/Back/Cancel buttons
    │
    └── Round 4: Bullet Selection & Save
        ├── Read-only accumulated story notes
        ├── Generated XYZ bullets (3-5 pairs)
        ├── User selects preferred option for each bullet (primary vs secondary)
        └── Save/Back/Cancel buttons
```

**Component Hierarchy:**
```
experience.vue
├── ExperienceList (existing, modified for highlight)
│   └── ExperienceCard (modified with Enhance button)
│
└── EnhancementPane (NEW, conditional based on ?enhance param)
    ├── EnhancementQuestionRound (Round 1 & 2)
    ├── EnhancementContextReview (Round 3: Context Review)
    └── EnhancementBulletReview (Round 4: Bullet Selection)
```

**Key UX Features:**
- Pane triggered by `?enhance=<experienceId>` query parameter
- Active experience card highlighted when pane is open
- 50% width pane on desktop, full-width on mobile
- Smooth slide-in animation from right
- Four-round conversational flow: gather context → review context → generate bullets → select bullets

### Backend Architecture

```
API Endpoints:
├── POST /api/career-id/profile/[profileId]/experience/[id]/gather-context
│   ├── Input: { experience: Experience, context?: ContextObject }
│   ├── Output: { success: true, data: { questionGroups: QuestionGroup[], notes: StoryNote[] } }
│   ├── Uses XYZ Method Context Gathering Prompt
│   ├── Round 1: Generates 5-7 initial questions (no context)
│   └── Round 2+: Generates follow-up questions based on previous answers and story notes
│
├── POST /api/career-id/profile/[profileId]/experience/[id]/enhance-achievements
│   ├── Input: { experience: Experience, notes: StoryNote[] }
│   ├── Output: { success: true, data: { bullets: BulletPair[] } }
│   ├── Uses XYZ Method Bullet Writing Prompt
│   └── Final step: Generates 3-5 XYZ-format bullet pairs from accumulated story notes
│
└── PATCH /api/career-id/profile/:profileId/experience/:id (existing endpoint)
    ├── Extended to accept: { highlights?: string[], contextNotes?: string, lastEnhancedAt?: timestamp }
    ├── Updates experience with enhanced achievements and context notes
    └── Sets lastEnhancedAt timestamp on save
```

**XYZ Method Prompts:**
- **Context Gathering Prompt** ([`deliverables/prompts/context-gathering-prompt.md`](deliverables/prompts/context-gathering-prompt.md))
  - Generates 5-7 targeted questions based on employment type
  - Focuses on extracting X (achievement), Y (metrics), Z (methods)
  - Tailors questions to employment type (full-time, part-time, contract, internship)
  - Returns questionGroups organized by category for better presentation
  
- **Bullet Writing Prompt** ([`deliverables/prompts/bullet-writing-prompt.md`](deliverables/prompts/bullet-writing-prompt.md))
  - Generates 3-5 XYZ-format bullets from accumulated story notes
  - Uses employment-type-appropriate action verbs
  - Ensures every bullet has quantifiable metrics
  - Returns primary/secondary bullet pairs for user choice

### Data Flow

```mermaid
graph TD
    A[User clicks Enhance button] --> B[Set ?enhance=id query param]
    B --> C[Pane opens, Round 1 starts]
    C --> D[Call gather-context with experience]
    D --> E[Display 5-7 questions grouped by category]
    E --> F[User answers questions]
    F --> G[User clicks Next]
    G --> H{More follow-ups?}
    H -->|Yes| I[Call gather-context with context]
    I --> J[Display story notes + follow-up questions]
    J --> K[User answers follow-ups]
    K --> G
    H -->|No| L[Round 3: Display story notes + context textarea]
    L --> M[User edits context notes, clicks Next]
    M --> N[Call enhance-achievements with accumulated context]
    N --> O[Round 4: Display 3-5 bullet pairs with selection UI]
    O --> P[User selects preferred bullet for each pair]
    P --> Q[User clicks Save]
    Q --> R[Call PATCH endpoint to save selected bullets]
    R --> S[Update lastEnhancedAt timestamp]
    S --> T[Close pane, remove ?enhance param]
    T --> U[Show success message]
```

**Three-Round Flow:**

1. **Round 1: Initial Questions**
   - Call `gather-context(experience)` with no context
   - Display 5-7 questions organized by category
   - User answers (at least one required)
   - Store answers in component state
   - Generate story notes from answers (returned by API)

2. **Round 2: Follow-up Questions** (repeat if follow-ups exist)
   - Display story notes from previous round (read-only)
   - Call `gather-context(experience, context)` with answered questions
   - If no follow-up questions returned, skip to Round 3
   - If follow-ups exist, display them grouped by category
   - User answers follow-ups (optional, can skip round)
   - Append new answers and notes to context state

3. **Round 3: Context Review & Edit**
   - Display accumulated story notes (read-only)
   - Show editable context notes textarea for user to add/refine context
   - User modifies context notes or keeps them as-is
   - Click "Next" to proceed to bullet generation

4. **Round 4: Bullet Selection & Save**
   - Call `enhance-achievements(experience, accumulatedContext)` with all collected context
   - Display 3-5 XYZ bullet pairs
   - Each bullet shows primary AND secondary as equal, selectable options (radio buttons or toggle)
   - Visual indicator shows selected option for each bullet
   - User reviews and adjusts selections as needed
   - Click "Save" to persist selected bullets to profile
   - Click "Back" to return to Round 3 context editing
   - Click "Cancel" to discard and close pane

**Key Workflow Changes from Original Design:**
- **Four-round flow:** Separated context review (Round 3) from bullet selection (Round 4)
- **Deferred bullet generation:** Bullets generated AFTER context review, giving users chance to refine context first
- **Bullet selection UI:** Both primary and secondary options are now equal choices, not just "alternative"
- **User control:** Users can select preferred wording for each bullet before saving
- **Context accumulation:** All story notes and context fed into single bullet generation call

## Decisions

### Decision 1: Two-Prompt XYZ Method Workflow

**Choice:** Two separate API calls with distinct prompts (question generation → bullet writing)

**Rationale:**
- **Prompt 1 (Context Gathering):** Generates 5-7 targeted questions to extract X, Y, Z components
- **Prompt 2 (Bullet Writing):** Generates 3-5 XYZ-format bullets from user answers
- Separates concerns: question quality vs bullet quality
- Allows independent optimization of each prompt
- All questions returned at once (UI handles display/queueing)
- No follow-up questions needed - comprehensive initial questions

**Alternatives Considered:**
- Single prompt for both - Rejected: Less focused, harder to optimize
- Conversational flow with follow-ups - Rejected: More complex, user fatigue
- Streaming approach - Rejected: Unnecessary complexity for this use case

### Decision 2: Answer Storage & Context Persistence

**Choice:** Store answers in component state during session; persist context notes to database

**Rationale:**
- Answers only needed for regeneration within the same enhancement session
- Context notes (accumulated story understanding) have long-term value for future regenerations
- Database persistence enables users to regenerate with fresh questions but same context
- Reduces complexity of managing session data while preserving valuable context

**Alternatives Considered:**
- Store all answers in database - Rejected: Excessive storage, no clear value after session
- Store all in component state - Rejected: Loses valuable context accumulation for future use
- Store answers in localStorage - Rejected: Could persist stale data across sessions

### Decision 3: Database Schema Changes

**Choice:** Add `last_enhanced_at` timestamp and `context_notes` text columns to `career_id.experience` table

**Rationale:**
- Minimal schema change (two nullable columns)
- Enables enhancement status tracking and temporal information
- Context notes allow users to preserve interview understanding for future regenerations
- Allows sorting/filtering by enhancement status
- No need for separate enhancement history table

**SQL Migration:**
```sql
ALTER TABLE career_id.experience 
ADD COLUMN last_enhanced_at TIMESTAMPTZ,
ADD COLUMN context_notes TEXT;

COMMENT ON COLUMN career_id.experience.last_enhanced_at IS 
'Timestamp of last deep enhancement (NULL if never enhanced)';

COMMENT ON COLUMN career_id.experience.context_notes IS 
'User-provided context from enhancement flow (preserved for regenerations)';
```

**Alternatives Considered:**
- Separate enhancement_history table - Rejected: Over-engineered for current needs
- Boolean `is_enhanced` flag - Rejected: Loses temporal information
- Store context_notes in separate table - Rejected: Added complexity without benefit

### Decision 4: Pane Integration vs Dedicated Page

**Choice:** Integrate 50% slide-out pane into `/profile/experience` page, triggered by `?enhance=<id>` query parameter

**Rationale:**
- Keeps user in context (can see experience list while enhancing)
- Query param is cleaner than dedicated page navigation
- 50% pane allows side-by-side comparison of experience and enhancement flow
- Mobile responsive (full-width pane on mobile, 50% on desktop)
- Single URL for both list and enhancement (simpler routing)
- Active card highlighting provides clear visual feedback

**Alternatives Considered:**
- Dedicated `/profile/enhance` page - Rejected: Loses context of experience list, requires page navigation
- Full-screen modal - Rejected: Blocks view of other experiences
- Inline enhancement on card - Rejected: Too much UI complexity on card itself

### Decision 5: Four-Round Flow with Separated Context Review & Bullet Selection

**Choice:** Split into four rounds: context gathering (1-2) → context review (3) → bullet generation & selection (4)

**Rationale:**
- **Round 1-2:** Focus on context gathering through questions
- **Round 3:** Dedicated step for user to review, refine, and add final context before bullet generation
- **Round 4:** Generate bullets with complete context, then display both primary & secondary as equal choices
- Separates concerns: information gathering → context refinement → option selection
- Gives users explicit control point to adjust context before AI generates bullets
- Primary and secondary bullets become real alternatives users can choose between
- Reduces cognitive load: one focused task per round

**Implementation:**
- Round 3 does NOT generate bullets; just shows context editing UI
- "Next" from Round 3 triggers bullet generation endpoint with merged context
- Round 4 displays bullets with radio buttons or toggle for each pair
- Selected options stored in component state
- "Save" button persists selected bullets to database

**Alternatives Considered:**
- Three-round with bullets auto-generated at end - Rejected: Less user control, users can't refine context before bullet generation
- Single selection UI - Rejected: Only showing primary confuses users about secondary option
- Bulk regenerate - Rejected: Four-round flow makes regeneration clearer with explicit context refinement step

## Risks / Trade-offs

### Risk 1: Multi-Round Fatigue

**Risk:** Users may abandon after Round 1 or 2, losing accumulated context

**Mitigation:**
- Clear progress indicators showing round number (e.g., "Round 2 of 3")
- Display accumulated story notes at each round to show progress
- Allow skip to final step (or back navigation)
- Keep questions focused and concise (5-7 max per round)
- Show estimated time to completion

### Risk 2: AI Question Quality

**Risk:** AI may generate irrelevant or repetitive questions

**Mitigation:**
- Carefully crafted system prompts with employment type tailoring
- Test with diverse achievement examples
- Allow users to skip questions
- Gather feedback and refine prompts iteratively

### Risk 3: Enhancement Timeout

**Risk:** AI processing may take too long, causing poor UX

**Mitigation:**
- Set reasonable timeouts (30s for questions, 20s for bullets per task)
- Display clear loading states with progress messages
- Provide retry functionality
- Implement debouncing for input handling

### Risk 4: Context Notes Quality

**Risk:** Users may provide vague context notes, reducing bullet quality

**Mitigation:**
- Provide clear placeholder text with examples
- Show story notes above context textarea as reference
- Allow regeneration to try again with better context
- Validate that at least one story note exists before allowing save

### Risk 5: Query Parameter Loss

**Risk:** User navigates away and loses ?enhance param, losing pane state

**Mitigation:**
- Store enhancement state in store (not just component)
- Warn user if trying to close pane with unsaved answers
- Allow browser back button to restore pane state via query param

## Migration Plan

### Phase 1: Database Migration
1. Add `last_enhanced_at` and `context_notes` columns to `career_id.experience` table
2. Run migration on development environment
3. Verify columns added successfully
4. Deploy to production (non-breaking change)

### Phase 2: Backend Implementation
1. Create `server/utils/profile-experience-enhancer.ts` utility
2. Implement `generateXYZQuestions()` function with multi-round support
3. Implement `generateXYZBullets()` function
4. Create `/gather-context` endpoint for question generation
5. Create `/enhance-achievements` endpoint for bullet generation
6. Add comprehensive error handling
7. Test with various experience examples and employment types

### Phase 3: Frontend Implementation
1. Create enhancement types in `shared/types/enhancement.ts`
2. Update `careerId.ts` type definitions
3. Update store (`careerIDStore.ts`) with multi-round enhancement state
4. Modify `experience.vue` for query param handling and pane rendering
5. Create `EnhancementPane.vue` with step navigation (4 rounds)
6. Create `EnhancementQuestionRound.vue` (Rounds 1 & 2)
7. Create `EnhancementStep3.vue` (Round 3: Context Review)
8. Create `EnhancementStep4.vue` (Round 4: Bullet Selection)
9. Add "Enhance" buttons to experience cards (view and edit modes)
10. Update profile dashboard with enhancement status badge
11. Add navigation links from profile dashboard

### Phase 4: Testing & Refinement
1. Test full 4-round enhancement flow end-to-end
2. Test query parameter handling (`?enhance=<id>`)
3. Test error scenarios (timeouts, API failures, network errors)
4. Test multi-round context accumulation
5. Test bullet selection and persistence
6. Test mobile responsiveness (full-width pane)
7. Gather user feedback
8. Refine AI prompts based on results
9. Optimize performance

### Phase 5: Deployment
1. Deploy database migration to production
2. Deploy backend endpoints
3. Deploy frontend components
4. Monitor for errors and performance issues
5. Gather user feedback and iterate

### Rollback Plan
- Database migration is additive (can be rolled back by dropping columns)
- Feature is opt-in (users must click "Enhance" button to trigger pane)
- No breaking changes to existing profile functionality
- Can disable feature by removing query param handling and "Enhance" buttons

## Open Questions

1. **Context Notes Examples:** What examples should we show for context notes textarea?
   - **Recommendation:** Show examples like "Led team of 5", "Reduced costs by 30%", "Improved performance 5x"

2. **Mobile Pane Behavior:** Should pane be full-width on mobile or stacked vertically?
   - **Recommendation:** Full-width on mobile (easier interaction), 50% on desktop

3. **Round Limit:** What's the maximum number of rounds allowed?
   - **Recommendation:** 4 rounds (Round 1: initial, Round 2: follow-ups, Round 3: context review, Round 4: bullet selection)

4. **Skip to Final:** Should users be able to skip rounds and jump directly to final?
   - **Recommendation:** Allow skip from Round 2 if questions are too similar, but not from Round 1

5. **Context Notes Persistence:** Should context notes be visible in experience edit view?
   - **Recommendation:** Show in an info tooltip or separate section (not inline, to avoid clutter)
