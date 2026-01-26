# Design: AI Assistance Panel for HERO Story Form

## Context

The HERO story form provides 12 structured fields grouped into 4 sections (Hurdle, Expectation, Response, Outcome). Users need AI assistance to refine their raw input into polished achievement content, but this assistance must not disrupt their workflow or force them to accept suggestions. The AI assistance pattern developed here will be reused in the fully guided HERO Story Session (JSS-88).

## Goals / Non-Goals

### Goals
- Provide just-in-time AI coaching for any HERO section
- Keep suggestions separate from form content until user accepts
- Support iterative refinement through regeneration
- Maintain user control over when and what to accept
- Create reusable AI prompt patterns for section enhancement

### Non-Goals
- Generating full HERO stories from scratch (that's discovery session)
- Validating or scoring user content quality
- Forcing users to use AI assistance
- Cross-section AI processing (each section is independent)

## Decisions

### Session Model: One Session Per Section

**Decision:** Each "Get AI Help" button click creates a new session for that specific section, not a multi-section session.

**Rationale:**
- Simpler tracking and state management
- Clear separation of concerns (each section is independent)
- User can work on sections in any order
- Easier to abandon/retry individual sections
- Follows natural form-filling pattern

**Implementation:**
- `section_type` field stores single value: 'hurdle' | 'expectation' | 'response' | 'outcome'
- User can have up to 4 active sessions for one story (one per section)
- Each session has its own conversation history and final output

**Alternatives considered:**
- Multi-section sessions where one conversation covers multiple sections: Rejected due to added complexity and unclear UX benefits. Cross-section context could be added later if needed.

### Conversational Multi-Turn Enhancement

**Decision:** AI conducts a multi-turn conversation per section, not a single request/response.

**Rationale:**
- Users typically have empty or minimal fields when they request help
- Targeted questions extract information they haven't articulated yet
- Conversational flow feels more like coaching than tool usage
- Allows for clarification and follow-up questions
- Matches natural way people think about their achievements (answering questions vs. writing essays)

**Implementation:**
- Session-based conversation state (database-persisted, not in-memory)
- Each section enhancement is an independent conversation
- Conversation ends when AI has sufficient information and outputs final JSON
- User can regenerate to start fresh conversation with updated context

### Section-Scoped AI Processing

**Decision:** AI processes one section (3 fields) at a time, not the entire story.

**Rationale:**
- Reduces cognitive load - users can focus on one section
- Clear scope for conversation (3 specific tags to discuss)
- Matches user's mental model (they're filling out section-by-section)
- Enables more targeted questions per section type
- Conversations stay focused and don't overwhelm

**Alternatives considered:**
- Full story enhancement: Rejected due to complexity, overwhelming user with too many questions
- Single-field enhancement: Rejected as too granular, loses section context

### Side Panel UI Pattern

**Decision:** Use slide-in side panel overlay, not modal or inline expansion.

**Rationale:**
- Keeps form visible for context reference
- Doesn't block the entire form (users can still see other sections)
- Clear spatial separation between suggestions and actual form
- Easy to dismiss without scrolling
- Matches common AI assistance patterns (Copilot, ChatGPT sidebar)

**Alternatives considered:**
- Modal overlay: Rejected as too disruptive, blocks all content
- Inline expansion: Rejected as confusing (suggestions mixed with form fields)
- Bottom sheet: Rejected as harder to see both suggestions and form together

### Edit-Before-Accept Pattern

**Decision:** Allow inline editing of suggestions within the panel before accepting.

**Rationale:**
- Users can quickly tweak AI output without copy-paste workflow
- Supports "AI as starting point" mental model
- Reduces friction in refinement loop
- Matches user expectation from JSS-89 AC 4.2

**Implementation:**
- Suggestions render in editable textarea fields
- Edits are local to panel state (don't affect form)
- "Accept" button uses edited content, not original AI response

### Unlimited Regeneration

**Decision:** Support unlimited regeneration cycles within a single AI help session.

**Rationale:**
- Users may need multiple attempts to get desired suggestions
- Low cost per regeneration with section-scoped processing
- Builds user trust ("I can try again if I don't like this")
- Matches iterative creative process

**Rate limiting:** Add rate limiting at API layer if abuse becomes an issue (future concern).

### AI Prompt Strategy

**Decision:** Use interactive question loop with section-specific coaching, not simple refinement.

**Key insight:** Users will typically have empty or minimal fields when they click "Get AI Help". The AI's role is to ask targeted questions to extract information for each tag, not just polish existing text.

**Conversational approach:**
1. AI acknowledges hero moment context
2. AI asks targeted questions for each tag (PROBLEM → SCOPE → STAKES)
3. User responds to questions
4. AI asks clarifying follow-ups
5. Multiple turns until sufficient information gathered
6. AI summarizes and confirms with user
7. AI outputs final structured JSON with 3 fields

**Example Hurdle conversation flow:**
```
AI: "I see you're working on 'Reduced authentication latency by 80%' from your role as Senior Backend Engineer. Let's start with the PROBLEM. What specific issue with authentication were you seeing?"

User: "Login was taking 8-10 seconds"

AI: "Got it. What was causing the slow logins? Database queries, API calls, or something else?"

User: "Slow database queries and no caching"

AI: "Perfect. Now for SCOPE - who was affected by these slow logins?"

User: "Our whole engineering team of 25 people"

AI: "How often did people hit this issue?"

User: "Every single login, multiple times per day"

AI: "Now STAKES - what was at risk if this wasn't fixed?"

User: "It was blocking daily work and slowing down the whole team"

AI: "Great! Here's what I captured:
- Problem: 8-10 second logins from slow DB queries and no caching
- Scope: 25 engineers, every login, multiple times daily
- Stakes: Blocked workflows and reduced team productivity

Does this capture it?"

User: "Yes"

AI: [Outputs JSON]
```

**What to probe for per tag:** Each section's system prompt includes specific things to look for and ask about. See `deliverables/prompts/hero-section-enhancement-prompt.md` for full details.

### Error Handling Strategy

**Decision:** Graceful degradation with clear error messages and retry.

**Error scenarios:**
1. **Network timeout:** "The AI request timed out. Please try again."
2. **API error:** "Unable to get AI suggestions right now. Please try again later."
3. **Invalid response:** "Received unexpected response from AI. Please try again."
4. **Rate limit:** "You've made too many requests. Please wait a moment."

**Preservation:** Always keep user's original form content intact on error.

**Retry:** All errors show retry button that re-submits the same request.

### Session Tracking: Database-Persisted State

**Decision:** Store all session state in `public.hero_story_sessions` table, not in-memory cache.

**Rationale:**
- Survives server restarts
- Enables session history and analytics
- Allows session recovery if user refreshes page
- Audit trail for AI usage patterns
- Consistent with `hero_discovery_sessions` pattern

**Implementation:**
- `id`: Auto-incrementing INTEGER (not UUID) - consistent with existing tables
- `section_type`: Single TEXT value (one session = one section)
- `session_status`: 'active' | 'completed' | 'abandoned'
- `session_data`: JSONB with conversation_history, context, and final_output
- `moment_id`: Optional TEXT link to source hero moment

**New columns added to existing table:**
```sql
section_type TEXT NOT NULL DEFAULT 'hurdle'
session_status TEXT NOT NULL DEFAULT 'active'
moment_id TEXT NULL
```

### Context Strategy: Rich Experience Data

**Decision:** Pass full Experience object including summary, highlights, and context_notes.

**Rationale:**
- `summary` provides role overview for context-aware questions
- `highlights` shows existing achievements (avoid duplicate questions)
- `context_notes` contains rich context from previous AI enhancement sessions
- Enables AI to ask informed, specific questions based on user's actual work

**Implementation:**
- Include all Experience fields in API request
- AI prompts reference summary, highlights, and context_notes
- Questions become more specific based on available context

### Regeneration: Fresh Session

**Decision:** "Regenerate" starts a completely new session, not a continuation.

**Rationale:**
- Users want to try a different approach
- Fresh start with updated field values
- Previous session remains in history for analytics
- Simple mental model: "start over"

**Implementation:**
- Current session marked as 'abandoned'
- New session created with current form values
- No conversation state carried over

### Store Architecture

**Decision:** Extend existing `careerIDStore.ts` with AI enhancement conversation state.

**Rationale:**
- AI assistance is tightly coupled to HERO story management
- Keeps all HERO-related actions in one store
- Avoids store synchronization complexity
- Existing store already has profile and story state

**State to add:**
```typescript
{
  aiConversation: {
    session_id: number | null
    section_type: 'hurdle' | 'expectation' | 'response' | 'outcome' | null
    conversation_history: Array<{ role: 'assistant' | 'user', content: string }>
    is_active: boolean
    is_complete: boolean
    final_output: { field1: string, field2: string, field3: string } | null
  }
  isEnhancing: boolean
  enhancementError: string | null
}
```

**Actions to add:**
- `startEnhancement(profileId, storyId, section, context)` - start conversation, create session
- `continueEnhancement(userMessage)` - send user response, get next AI question
- `acceptEnhancement()` - populate form with final output
- `dismissEnhancement()` - mark session abandoned, clear state
- `regenerateEnhancement()` - start fresh session with updated context

**Alternative:** Create separate `heroAIStore.ts` if AI assistance expands significantly in future.

## Risks / Trade-offs

### Risk: AI quality varies

**Mitigation:**
- User always controls what enters the form (explicit accept required)
- Regenerate option allows trying again
- Inline editing lets users fix AI mistakes
- Form retains original content if user dismisses suggestions

### Risk: API latency impacts UX

**Mitigation:**
- Section-scoped processing keeps payloads small (faster response)
- Loading states set expectation during wait
- Panel remains open during loading (user sees progress)
- Timeout handling provides clear feedback

### Trade-off: Section independence vs. context

**Chosen:** Section independence (process 3 fields at a time)

**Cost:** AI loses cross-section context (e.g., can't reference Hurdle when refining Outcome)

**Benefit:** Faster responses, simpler UX, clearer scope

**Future:** If users need cross-section context, add "Enhance Entire Story" option later.

## Migration Plan

N/A - This is a new feature with no existing data or behavior to migrate.

## Open Questions

1. **Should we add optional context from source experience/moment?**
   - Lean: Yes, pass `source_experience_id` if available for richer AI context
   - Decision: Include in API design, populate from form state if present

2. **Should we track AI usage metrics?**
   - Lean: Yes, for product analytics
   - Decision: Add basic tracking (section_enhanced, regeneration_count) in future iteration

3. **Should we cache AI responses?**
   - Lean: No, users expect fresh suggestions on each click
   - Decision: No caching for MVP, revisit if cost becomes issue
