# Implementation Tasks: AI-Powered Achievement Light Polish

## PHASE 1: BACKEND

### BE-001: Achievement Enhancement Utility
- [x] Create `server/utils/achievement-enhancer.ts`
- [x] Implement `enhanceExperienceAchievements(experienceSlice)` function using Vercel AI SDK
- [x] Configure AI Gateway with GPT-4o-mini model
- [x] Create system prompt for context-aware light polish (uses employer, title for context)
- [x] Add input validation (experience slice with highlights array)
- [x] Add timeout handling (10 seconds)
- [x] Add error types: `TIMEOUT`, `INVALID_INPUT`, `AI_PROVIDER_ERROR`
- [x] Return enhanced highlights array in same order as input
- [x] Add unit tests for enhancement logic

**Dependencies:** None
**Testable by:** Backend team (test with sample experience slice)
**Success criteria:** Utility successfully enhances experience achievements with proper error handling

---

### BE-002: Enhancement API Endpoint
- [x] Create `server/api/career-id/resume/achievementEnhancer.post.ts`
- [x] Implement POST endpoint accepting experience slice: `{ employmentType, employer, title, url, summary, highlights }`
- [x] Call `enhanceExperienceAchievements()` utility
- [x] Return `{ success: true, enhanced: { highlights: string[] }, duration: number }` on success (with dummy data)
- [x] Return error response with appropriate HTTP status codes (400, 503, 500)
- [x] Add request validation using existing validation utilities
- [x] Add error handling and logging
- [x] Document endpoint in API spec comments

**Dependencies:** BE-001
**Testable by:** Backend team (curl/Postman tests)
**Success criteria:** Endpoint successfully enhances experience achievements and handles errors gracefully

---

## PHASE 2: FRONTEND - TYPE DEFINITIONS

### FE-001: Update Type Definitions
- [ ] Add `isEnhanced?: boolean` flag to Experience type in `app/types/index.d.ts`
- [ ] Ensure flag is optional (for backward compatibility)
- [ ] Run type checking to verify no breaking changes

**Dependencies:** None  
**Testable by:** Frontend team (type checking)  
**Success criteria:** Type definitions updated without breaking existing code

---

## PHASE 3: FRONTEND - STORE INTEGRATION

### FE-002: Store Enhancement Action
- [ ] Add `enhanceExperience(experienceSlice)` action to `app/stores/careerIDStore.ts`
- [ ] Implement API call to `/api/career-id/resume/achievementEnhancer`
- [ ] Send experience slice: `{ employmentType, employer, title, url, summary, highlights }`
- [ ] Add loading state management (`isEnhancingExperience: boolean`)
- [ ] Add error handling with user-friendly messages
- [ ] Return enhanced highlights array or throw error
- [ ] Add JSDoc comments for the action

**Dependencies:** BE-002, FE-001
**Testable by:** Frontend team (unit tests, manual testing)
**Success criteria:** Store action successfully calls API and handles responses

---

## PHASE 4: FRONTEND - COMPONENT UI

### FE-003: Add Enhancement Button to ExperienceSectionNew
- [ ] Add "Enhance" button for each work experience entry (not per achievement)
- [ ] Style button consistently with existing UI (use UButton component)
- [ ] Add sparkle icon (`i-lucide-sparkles`) to enhance button
- [ ] Position button appropriately (e.g., in experience card header or action area)
- [ ] Ensure button is accessible and keyboard-navigable

**Dependencies:** None
**Testable by:** Frontend team (visual testing)
**Success criteria:** Button appears correctly and matches design system

---

### FE-004: Implement Experience Enhancement Logic
- [ ] Add `isEnhancing` state to track which experience is being enhanced
- [ ] Implement `enhanceExperience(experienceIndex: number)` component method
- [ ] Build experience slice: `{ employmentType, employer, title, url, summary, highlights }`
- [ ] Call store action `careerIDStore.enhanceExperience(experienceSlice)`
- [ ] Replace all achievement highlights with enhanced versions on success
- [ ] Set `isEnhanced` flag on all achievements in the experience
- [ ] Display loading spinner on button during enhancement
- [ ] Disable button during enhancement
- [ ] Show toast notification on success
- [ ] Show error toast on failure (keep original text)
- [ ] Handle validation (ensure experience has highlights)

**Dependencies:** FE-002, FE-003
**Testable by:** Frontend team (manual testing)
**Success criteria:** Experience enhancement works end-to-end, all achievements updated

---

### FE-005: Add Visual Indicators for Enhanced Achievements
- [ ] Add `isEnhanced` tracking to achievement form data
- [ ] Display "Enhanced" badge with sparkle icon for enhanced achievements
- [ ] Apply cyan/teal highlight styling (similar to "Extracted" indicator)
- [ ] Position badge next to achievement textarea label or in achievement list
- [ ] Ensure badge is visible in both add and edit modes
- [ ] Remove badge if user manually edits enhanced text
- [ ] Add watcher to detect manual edits and clear `isEnhanced` flag

**Dependencies:** FE-004
**Testable by:** Frontend team (visual testing)
**Success criteria:** Enhanced achievements are clearly marked with badge and highlight

---

### FE-006: Enhancement Error Handling and UX Polish
- [ ] Add validation for empty highlights array (show inline error)
- [ ] Display user-friendly error messages for different error types
- [ ] Add retry capability for failed enhancements
- [ ] Ensure original text is preserved on all error scenarios
- [ ] Add loading states with appropriate spinners
- [ ] Disable enhance button during enhancement
- [ ] Add keyboard shortcuts (optional: Ctrl+E to enhance)

**Dependencies:** FE-004, FE-005
**Testable by:** Frontend team (error scenario testing)
**Success criteria:** All error scenarios handled gracefully with clear user feedback

