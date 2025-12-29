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

### FE-001: Enhancement State Management
- [x] Track enhancement state at component/store level (similar to isExtracted for resume extraction)
- [x] No changes needed to core type definitions
- [x] Enhancement state managed locally in components during session

**Dependencies:** None
**Testable by:** Frontend team (component state management)
**Success criteria:** Enhancement state properly tracked without modifying core types

---

## PHASE 3: FRONTEND - STORE INTEGRATION

### FE-002: Store Enhancement Action
- [x] Add `enhanceExperience(experienceSlice)` action to `app/stores/careerIDStore.ts`
- [x] Implement API call to `/api/career-id/resume/achievementEnhancer`
- [x] Send experience slice: `{ employmentType, employer, title, url, summary, highlights }`
- [x] Add loading state management (`isEnhancingExperience: boolean`)
- [x] Add error handling with user-friendly messages
- [x] Return enhanced highlights array or throw error
- [x] Add JSDoc comments documenting component-level state tracking pattern

**Dependencies:** BE-002, FE-001
**Testable by:** Frontend team (unit tests, manual testing)
**Success criteria:** Store action successfully calls API and handles responses

---

## PHASE 4: FRONTEND - COMPONENT UI

### FE-003: Add Enhancement Button to ExperienceSectionNew
- [x] Add "Enhance" button for each work experience entry (not per achievement)
- [x] Style button consistently with existing UI (use UButton component)
- [x] Add sparkle icon (`i-lucide-sparkles`) to enhance button
- [x] Position button appropriately (next to achievements section label)
- [x] Ensure button is accessible and keyboard-navigable

**Dependencies:** None
**Testable by:** Frontend team (visual testing)
**Success criteria:** Button appears correctly and matches design system

---

### FE-004: Implement Experience Enhancement Logic
- [x] Add `isEnhancing` state to track which experience is being enhanced
- [x] Add component-level `enhancedHighlights` Set to track enhancement state (similar to extraction pattern)
- [x] Implement `enhanceExperience()` component method
- [x] Build experience slice: `{ employmentType, employer, title, url, summary, highlights }`
- [x] Call store action `careerIDStore.enhanceExperience(experienceSlice)`
- [x] Replace all achievement highlights with enhanced versions on success
- [x] Track enhancement state in component-level Set (not in core types)
- [x] Display loading spinner on button during enhancement
- [x] Disable button during enhancement
- [x] Show toast notification on success
- [x] Show error toast on failure (keep original text)
- [x] Handle validation (ensure experience has highlights)

**Dependencies:** FE-002, FE-003
**Testable by:** Frontend team (manual testing)
**Success criteria:** Experience enhancement works end-to-end, all achievements updated

---

### FE-005: Add Visual Indicators for Enhanced Achievements
- [x] Track `isEnhanced` state at component level (similar to `isExtracted` pattern for resume data)
- [x] Display "Enhanced" badge with sparkle icon for enhanced achievements
- [x] Apply cyan/teal highlight styling (similar to "Extracted" indicator)
- [x] Position badge above achievement textarea in both modes
- [x] Ensure badge is visible in both add and edit modes
- [x] Remove badge from component state if user manually edits enhanced text
- [x] Add watcher to detect manual edits and clear component-level `isEnhanced` flag

**Dependencies:** FE-004
**Testable by:** Frontend team (visual testing)
**Success criteria:** Enhanced achievements are clearly marked with badge and highlight

---

### FE-006: Enhancement Error Handling and UX Polish
- [x] Add validation for empty highlights array (show inline toast)
- [x] Display user-friendly error messages for different error types
- [x] Retry capability available (user can click Enhance button again)
- [x] Original text preserved on all error scenarios
- [x] Add loading states with appropriate spinners
- [x] Disable enhance button during enhancement

**Dependencies:** FE-004, FE-005
**Testable by:** Frontend team (error scenario testing)
**Success criteria:** All error scenarios handled gracefully with clear user feedback

