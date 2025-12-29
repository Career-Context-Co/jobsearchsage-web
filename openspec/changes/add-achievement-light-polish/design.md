# Design: AI-Powered Achievement Light Polish

## Context

Users creating their Career ID profile during onboarding need to enter 3-5 achievement descriptions per work experience entry. These achievements are critical for resume generation and showcasing professional impact, but users often struggle with:

- Grammatical errors and typos
- Weak or passive verb choices ("helped with", "worked on")
- Unclear or wordy phrasing
- Lack of professional polish

The light polish feature uses AI to improve achievement text quality while preserving the user's core meaning and facts. This is distinct from the resume extraction feature (which parses entire documents) - light polish operates on individual achievement strings and focuses on refinement rather than extraction.

### Constraints
- Must not add fabricated information or change core meaning
- Must handle failures gracefully without blocking onboarding
- Must work within existing AI Gateway infrastructure
- Must be fast enough for real-time use (< 5 seconds per achievement)
- Only available during onboarding (not post-creation editing - separate story)

### Stakeholders
- End users creating profiles (benefit from polished achievements)
- Resume generation feature (benefits from higher quality input data)
- Sage AI coaching (benefits from clearer career narratives)

## Goals / Non-Goals

### Goals
- Improve grammar, syntax, and punctuation in achievement text
- Replace weak verbs with strong action verbs
- Make phrasing more concise and direct
- Maintain user's original meaning and facts
- Provide seamless, non-intrusive enhancement experience
- Handle API failures gracefully

### Non-Goals
- Adding quantitative metrics or new information not in original text
- Rewriting achievements from scratch
- Providing multiple enhancement options for user to choose from
- Enhancing other profile sections (contact info, education, etc.)
- Post-creation editing enhancement (covered in separate story)
- Batch enhancement of all achievements across multiple jobs

## Decisions

### Decision 1: Use GPT-4o-mini via AI Gateway

**Rationale:**
- GPT-4o-mini provides excellent text refinement at lower cost
- Already using AI Gateway for resume extraction (consistent infrastructure)
- Vercel AI SDK provides structured output and error handling
- Good balance of quality and cost for achievement enhancement

**Alternatives Considered:**
- GPT-4o: Better quality but significantly more expensive (~10x cost)
- Gemini 2.5 Flash: Faster and cheaper, but less precise for subtle text refinement
- Claude 3.5 Sonnet: Excellent at writing, but not available via current AI Gateway setup

**Trade-offs:**
- Cost: GPT-4o-mini is cost-effective (~$0.001 per experience vs ~$0.01 for GPT-4o)
- Latency: Fast response times (~1-2s)
- Quality: Very good quality for text refinement, suitable for achievement polish

### Decision 2: Single "Enhance" Button Per Experience with Context

**Rationale:**
- Stateless API that takes experience slice (employer, title, highlights) for context-aware enhancement
- No need for profile or experience IDs during onboarding (data not yet saved)
- AI receives job context (employer, title) to provide better, more relevant enhancements
- Single API call per experience is more efficient than per-achievement calls
- Onboarding flow handles saving enhanced text to database

**Alternatives Considered:**
- Individual achievement buttons without context: Simpler but loses valuable context
- Auto-enhance on blur: Too intrusive, removes user control

**Trade-offs:**
- Less granular control: Users can't selectively enhance individual achievements
- Better enhancement quality: AI sees full job context for more appropriate polish
- More efficient: One API call per experience instead of multiple
- Simpler UX: One button per experience entry

### Decision 3: Visual Indicator with Badge + Highlight

**Rationale:**
- Users need to know which achievements have been enhanced
- Badge ("Enhanced" with sparkle icon) provides clear, scannable indicator
- Highlight (similar to "Extracted" styling) creates visual consistency
- Helps users track enhancement status across multiple achievements

**Alternatives Considered:**
- No indicator: Too subtle, users lose track of what's been enhanced
- Toast only: Notification disappears, no persistent indicator
- Icon only: Less clear than badge with text

**Trade-offs:**
- Visual noise: Badges add UI elements, but provide valuable context
- Consistency: Reuses "Extracted" pattern (cyan highlight + badge)

### Decision 4: Store Enhanced Text Only

**Rationale:**
- Enhanced text is the "final" version user wants to save
- No need to track original text (user can always re-edit)
- Simpler data model (no additional fields)
- Aligns with user story: "polished version replaces original"

**Alternatives Considered:**
- Store both original and enhanced: Adds complexity, unclear use case
- Store enhancement metadata: Unnecessary for MVP

**Trade-offs:**
- No undo: User can't revert to original (but can manually edit)
- Simplicity: Cleaner data model, easier to implement

### Decision 5: Synchronous Enhancement (No Background Jobs)

**Rationale:**
- Users expect immediate feedback when clicking "Enhance"
- Achievement text is short (typically 1-2 sentences)
- GPT-4o response time is acceptable for real-time use (~2-3 seconds)
- Simpler implementation (no job queue, no polling)

**Alternatives Considered:**
- Background job with polling: Adds complexity, worse UX for short text
- WebSocket streaming: Overkill for simple text replacement

**Trade-offs:**
- Blocking: User waits for API response (mitigated by loading state)
- Timeout risk: Network issues could cause delays (handled with 10s timeout)

## Technical Architecture

### API Endpoint Design

```
POST /api/career-id/resume/achievementEnhancer
```

**Request Body:**
```typescript
{
  employmentType: string
  employer: string
  title: string
  url?: string
  summary?: string
  highlights: string[]  // Array of achievement texts to enhance
}
```

**Response:**
```typescript
{
  success: true,
  enhanced: {
    highlights: string[]  // Enhanced achievement texts (same order as input)
  },
  duration: number   // Processing time in ms
}
```

**Note:** This endpoint is stateless and doesn't require profile or experience IDs since it's used during onboarding before data is saved to the database. The endpoint receives a slice of the experience object to provide context for better enhancement. The onboarding flow handles saving the enhanced text.

**Error Response:**
```typescript
{
  success: false,
  error: {
    code: 'TIMEOUT' | 'INVALID_INPUT' | 'AI_PROVIDER_ERROR',
    message: string
  }
}
```

### AI Prompt Strategy

**System Prompt:**
```
You are an expert career coach specializing in achievement writing.
Your task is to polish professional achievement descriptions while
preserving the user's original meaning and facts.

CONTEXT: You will receive job context (employer, title) and an array of achievements to enhance.

RULES:
1. Fix grammar, syntax, and punctuation errors in each achievement
2. Replace weak verbs with strong action verbs (led, delivered, implemented)
3. Make phrasing more concise and direct
4. Remove filler words and redundancy
5. Use the job context to inform enhancement but DO NOT add fabricated details
6. DO NOT add new information, metrics, or fabricated details
7. DO NOT change the core meaning or facts
8. Keep the same tense and perspective as the original
9. Return ONLY the enhanced achievements array in JSON format

EXAMPLES:
Input: "Helped with implementing a new system for tracking customer data"
Output: "Implemented a customer data tracking system"

Input: "Worked on improving the performance of the application"
Output: "Optimized application performance"
```

**User Prompt:**
```
Polish the achievements for this work experience:

Employer: {employer}
Title: {title}

Achievements to enhance:
{highlights array}

Return JSON: { "highlights": ["enhanced achievement 1", "enhanced achievement 2", ...] }
```

### Frontend Component Changes

**ExperienceSectionNew.vue:**
- Add `isEnhanced` flag to track enhanced achievements
- Add "Enhance" button for each work experience entry
- Add loading state for enhancement operation
- Add badge indicator for enhanced achievements
- Call store action `enhanceExperience(experienceData)` on button click
- Replace all achievement highlights with enhanced versions on success

**careerIDStore.ts:**
- Add `enhanceExperience(experienceSlice)` action
- Make API call to `/api/career-id/resume/achievementEnhancer`
- Send experience slice: `{ employmentType, employer, title, url, summary, highlights }`
- Handle loading state and errors
- Return enhanced highlights array to component

### Error Handling Strategy

1. **Validation Errors (400):**
   - Empty text: "Achievement text cannot be empty"
   - Text too long: "Achievement text must be under 500 characters"

2. **Timeout Errors (503):**
   - Display: "Enhancement timed out. Please try again."
   - Keep original text unchanged
   - Allow user to retry or continue without enhancement

3. **AI Provider Errors (500):**
   - Display: "Enhancement failed. Please try again or continue without enhancement."
   - Keep original text unchanged
   - Log error details for debugging

4. **Network Errors:**
   - Display: "Network error. Please check your connection and try again."
   - Keep original text unchanged

### Performance Considerations

- **Timeout:** 10 seconds per enhancement request
- **Rate Limiting:** None initially (can add if abuse detected)
- **Caching:** No caching (each experience is unique)
- **Context Size:** Entire experience object sent for context-aware enhancement

### Security Considerations

- **Input Validation:** Max 500 characters per achievement
- **API Key Protection:** AI Gateway key stored in server-side environment variables
- **PII Handling:** Achievement text may contain sensitive career information
  - Processed in-memory only
  - Not logged or stored separately
  - Sent to AI Gateway over HTTPS

## Risks / Trade-offs

### Risk 1: AI Enhancement Quality Variability

**Risk:** GPT-4o may occasionally produce awkward or incorrect enhancements

**Mitigation:**
- Users can manually edit enhanced text before saving
- Clear visual indicator shows which text was enhanced
- Users can skip enhancement entirely

**Likelihood:** Medium  
**Impact:** Low (user can fix manually)

### Risk 2: API Cost Escalation

**Risk:** High usage could increase AI Gateway costs significantly

**Mitigation:**
- Monitor usage and costs in production
- Add rate limiting if needed
- Consider switching to cheaper model (Gemini) if quality is acceptable

**Likelihood:** Low (onboarding is one-time per user)  
**Impact:** Medium (budget impact)

### Risk 3: Latency Degradation

**Risk:** Slow AI responses could frustrate users during onboarding

**Mitigation:**
- 10-second timeout with clear error message
- Loading state with spinner
- Allow users to continue without enhancement

**Likelihood:** Low (GPT-4o typically responds in 2-3s)  
**Impact:** Medium (UX degradation)

### Risk 4: Enhancement Changing Meaning

**Risk:** AI might subtly alter the meaning of achievements

**Mitigation:**
- Explicit prompt instructions to preserve meaning
- Users review enhanced text before saving
- Users can manually edit or revert

**Likelihood:** Low (GPT-4o is good at following instructions)  
**Impact:** High (data integrity issue)

## Migration Plan

### Phase 1: Backend Implementation
1. Create `server/utils/achievement-enhancer.ts` utility
2. Create `server/api/career-id/achievements/enhance.post.ts` endpoint
3. Add error handling and validation
4. Test with sample achievement text

### Phase 2: Frontend Implementation
1. Add `isEnhanced` flag to Experience type
2. Update ExperienceSectionNew component with enhance buttons
3. Add store action for enhancement
4. Add visual indicators (badge + highlight)
5. Add loading states and error handling

### Phase 3: Testing & Validation
1. Test individual achievement enhancement
2. Test "Enhance All" functionality
3. Test error scenarios (timeout, API failure)
4. Test visual indicators and UX flow
5. Verify enhanced text is saved correctly

### Phase 4: Deployment
1. Deploy backend changes
2. Deploy frontend changes
3. Monitor API usage and costs
4. Gather user feedback

### Rollback Plan
- Feature is additive and opt-in (users can skip enhancement)
- If critical issues arise, disable endpoint via feature flag
- No data migration needed (enhanced text is just regular text)

## Open Questions

1. **Should we add a character limit for achievements?**
   - Proposal: 500 characters max (typical achievement is 50-150 chars)
   - Rationale: Prevents abuse, keeps API costs reasonable

2. **Should we track enhancement metrics?**
   - Proposal: Track enhancement usage rate, success rate, and average latency
   - Rationale: Helps optimize feature and justify costs

3. **Should we allow users to "undo" enhancement?**
   - Proposal: No undo for MVP (users can manually edit)
   - Rationale: Simpler implementation, unclear if users would use it

4. **Should we show a preview before applying enhancement?**
   - Proposal: No preview for MVP (direct replacement)
   - Rationale: Faster UX, users can edit after if needed
