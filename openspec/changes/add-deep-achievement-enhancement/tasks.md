# Implementation Tasks: Deep Profile Achievement Enhancement

## USER STORY CONTEXT

**Feature:** Deep Profile Achievement Enhancement  
**User Story:** As a user with a completed profile, I want to navigate to a dedicated enhancement page where I can deeply enhance my achievements by answering AI-generated questions about my work, so that I can transform vague descriptions into quantified, impressive achievement statements.

**Key Constraints:**
- Dedicated page at `/profile/enhance` (separate from onboarding)
- Conversational AI flow: generate questions → process answers → generate follow-ups OR enhanced achievements
- Store answers in component state for regeneration (not persisted to database)
- Add `last_enhanced_at` timestamp to track enhancement status
- Support both individual and bulk enhancement flows
- Coexists with light polish feature (separate use cases)

---

## PHASE 1: DATABASE

### DB-001: Add Enhancement Tracking Column
- [ ] Design migration to add `last_enhanced_at` column to `career_id.experience` table
- [ ] Create migration file: `deliverables/migrations/015_add_experience_enhancement_tracking.sql`
- [ ] Add column as nullable TIMESTAMPTZ (defaults to NULL for existing records)
- [ ] Add column comment explaining purpose
- [ ] Test migration on development database

**Dependencies:** None  
**Testable by:** Database team (verify column added, check existing records unaffected)  
**Success criteria:** Column added successfully, no data loss, existing queries still work

---

## PHASE 2: BACKEND

### BE-001: XYZ Method Enhancement Utility
- [ ] Create `server/utils/xyz-enhancer.ts` utility module
- [ ] Implement `generateXYZQuestions()` function (uses Context Gathering Prompt, generates 5-7 questions)
- [ ] Implement `generateXYZBullets()` function (uses Bullet Writing Prompt, generates 3-5 bullets)
- [ ] Add AI Gateway integration using GPT-4o model
- [ ] Load system prompts from `deliverables/prompts/` directory
- [ ] Add employment type handling (full-time, part-time, contract, internship)
- [ ] Add error handling for AI provider errors
- [ ] Add timeout handling (15s for questions, 20s for bullets)
- [ ] Export `XYZEnhancementError` class for error handling

**Dependencies:** None
**Testable by:** Backend team (unit tests with mock AI responses, test all employment types)
**Success criteria:** Functions generate XYZ-format questions and bullets, handle employment types correctly

---

### BE-002: XYZ Question Generation Endpoint
- [ ] Create `server/api/career-id/enhancement/generate-questions.post.ts`
- [ ] Accept request body: `{ experienceId: number, experience: Experience }`
- [ ] Validate required fields (experienceId, experience with title, employer, employmentType, highlights)
- [ ] Call `generateXYZQuestions()` from xyz-enhancer utility
- [ ] Return response: `{ success: true, questions: [{ id, text }] }` (5-7 questions)
- [ ] Add comprehensive error handling (validation, timeout, AI errors)
- [ ] Add request/response logging
- [ ] Document endpoint in API spec

**Dependencies:** BE-001
**Testable by:** Backend team (test with different employment types, verify question quality)
**Success criteria:** Endpoint generates 5-7 XYZ-focused questions, tailored to employment type

---

### BE-003: XYZ Bullet Generation Endpoint
- [ ] Create `server/api/career-id/enhancement/generate-bullets.post.ts`
- [ ] Accept request body: `{ experienceId: number, experience: Experience, answers: [{ questionId, answer }] }`
- [ ] Validate required fields and answer format
- [ ] Call `generateXYZBullets()` from xyz-enhancer utility
- [ ] Return response: `{ success: true, bullets: string[] }` (3-5 bullets)
- [ ] Add comprehensive error handling
- [ ] Add request/response logging
- [ ] Document endpoint in API spec

**Dependencies:** BE-001
**Testable by:** Backend team (test with various answer qualities, verify XYZ format)
**Success criteria:** Endpoint generates 3-5 XYZ-format bullets with metrics, appropriate verbs for employment type

---

## PHASE 3A: FRONTEND - TYPES & STORE

### FE-001: XYZ Enhancement Types
- [ ] Create `shared/types/enhancement.ts` file
- [ ] Define `XYZQuestion` type (id, text)
- [ ] Define `XYZAnswer` type (questionId, answer)
- [ ] Define `XYZEnhancementSession` type (experienceId, questions, answers, bullets)
- [ ] Define `EnhancementStatus` type (not_enhanced, enhanced, enhancing)
- [ ] Update `shared/types/careerId.ts` to add `lastEnhancedAt?: string` to Experience type

**Dependencies:** None
**Testable by:** Frontend team (type checking)
**Success criteria:** All XYZ-specific types defined, no TypeScript errors

---

### FE-002: Store XYZ Enhancement Actions
- [ ] Update `app/stores/careerIDStore.ts` with XYZ enhancement state
- [ ] Add state: `isGeneratingQuestions`, `isGeneratingBullets`, `enhancementError`
- [ ] Add action: `generateXYZQuestions(experienceId)` - calls BE-002
- [ ] Add action: `generateXYZBullets(experienceId, experience, answers)` - calls BE-003
- [ ] Add action: `saveEnhancedBullets(experienceId, bullets)` - calls existing PATCH endpoint
- [ ] Add error handling for all enhancement actions
- [ ] Add loading state management

**Dependencies:** FE-001, BE-002, BE-003
**Testable by:** Frontend team (test store actions with mock API)
**Success criteria:** Store actions work correctly, XYZ bullets generated properly

---

## PHASE 3B: FRONTEND - ENHANCEMENT PAGE

### FE-003: Enhancement Page Layout
- [ ] Create `app/pages/profile/enhance.vue` page
- [ ] Add page title and description
- [ ] Fetch all experiences from store on mount
- [ ] Display experience list with cards (company, title, dates)
- [ ] Show enhancement status badge for each experience (Not Enhanced / Enhanced on [date])
- [ ] Add "Enhance" button to each experience card
- [ ] Add "Enhance All" button at top of page
- [ ] Add empty state if no experiences exist
- [ ] Add navigation link from profile dashboard

**Dependencies:** FE-002  
**Testable by:** Frontend team (visual testing, navigation)  
**Success criteria:** Page displays correctly, shows all experiences, status indicators work

---

### FE-004: Enhancement Flow Modal
- [ ] Create `app/components/profile/EnhancementFlow.vue` component
- [ ] Implement modal/wizard UI with steps indicator
- [ ] Add Step 1: Question Generation (loading state)
- [ ] Add Step 2: Question Answering (form with text inputs)
- [ ] Add Step 3: Follow-up Questions (conditional, similar to Step 2)
- [ ] Add Step 4: Preview & Accept (comparison view)
- [ ] Add navigation between steps (Next, Back, Cancel)
- [ ] Add progress indicator
- [ ] Handle modal open/close state

**Dependencies:** FE-003  
**Testable by:** Frontend team (test modal flow, step navigation)  
**Success criteria:** Modal displays correctly, steps navigate properly, UI is intuitive

---

### FE-005: XYZ Question Form Component
- [ ] Create `app/components/profile/XYZQuestionForm.vue` component
- [ ] Accept props: `questions` (5-7 XYZ questions), `answers` (for pre-filling on regenerate)
- [ ] Display all questions or queue them (UI decision)
- [ ] Provide textarea input for each question
- [ ] Add "Skip" option for each question
- [ ] Add validation (at least one question answered)
- [ ] Emit `submit` event with answers array
- [ ] Add loading state during bullet generation

**Dependencies:** FE-001
**Testable by:** Frontend team (test with 5-7 questions, skip functionality)
**Success criteria:** Form displays XYZ questions, collects answers, validates properly

---

### FE-006: XYZ Bullet Preview Component
- [ ] Create `app/components/profile/XYZBulletPreview.vue` component
- [ ] Accept props: `originalHighlights`, `xyzBullets` (3-5 XYZ-format bullets)
- [ ] Display side-by-side comparison (original vs XYZ bullets)
- [ ] Highlight XYZ components (X=achievement, Y=metric, Z=method)
- [ ] Show employment-type-appropriate verbs used
- [ ] Add "Accept" button (emits `accept` event)
- [ ] Add "Regenerate" button (emits `regenerate` event)
- [ ] Add "Cancel" button (emits `cancel` event)
- [ ] Show loading state during save

**Dependencies:** FE-001
**Testable by:** Frontend team (test XYZ bullet display, verify metrics present)
**Success criteria:** Preview displays XYZ bullets correctly, highlights X/Y/Z components

---

### FE-007: XYZ Enhancement Flow Integration
- [ ] Integrate EnhancementFlow component into enhance.vue page
- [ ] Implement XYZ enhancement flow logic:
  - [ ] Step 1: Call `generateXYZQuestions()` on experience selection
  - [ ] Step 2: Display XYZQuestionForm (5-7 questions), collect answers
  - [ ] Step 3: Call `generateXYZBullets()` with answers
  - [ ] Step 4: Display XYZBulletPreview (3-5 bullets), handle accept/regenerate
- [ ] Store answers in component state for regeneration
- [ ] Handle accept: call `saveEnhancedBullets()`, update experience, close modal
- [ ] Handle regenerate: return to Step 2 with pre-filled answers
- [ ] Handle cancel: clear state, close modal
- [ ] Add error handling with toast notifications

**Dependencies:** FE-004, FE-005, FE-006, FE-002
**Testable by:** Frontend team (end-to-end XYZ flow testing)
**Success criteria:** XYZ flow works, bullets follow formula, regeneration works

---

### FE-008: Bulk Enhancement Flow
- [ ] Add "Enhance All" button to enhance.vue page
- [ ] Implement sequential enhancement logic:
  - [ ] Filter unenhanced experiences
  - [ ] Start enhancement flow for first experience
  - [ ] After accept, automatically start next experience
  - [ ] Show progress indicator (e.g., "2 of 5 enhanced")
  - [ ] Allow cancel at any time
- [ ] Save progress after each individual enhancement
- [ ] Handle completion (all experiences enhanced)
- [ ] Add toast notification for bulk completion

**Dependencies:** FE-007  
**Testable by:** Frontend team (test bulk flow, cancellation, progress)  
**Success criteria:** Bulk enhancement works, progress tracked, can cancel anytime

---

## PHASE 3C: FRONTEND - PROFILE DASHBOARD INTEGRATION

### FE-009: Profile Dashboard Enhancement Indicators
- [ ] Update `app/pages/profile/index.vue` profile dashboard
- [ ] Add enhancement status badge to experience cards
- [ ] Show "Enhanced on [date]" if `lastEnhancedAt` exists
- [ ] Add "Deep Enhance" button to each experience card
- [ ] Link "Deep Enhance" button to enhancement page with pre-selected experience
- [ ] Add navigation link to enhancement page in profile section
- [ ] Update experience card styling to show enhancement status

**Dependencies:** FE-007  
**Testable by:** Frontend team (visual testing, navigation)  
**Success criteria:** Dashboard shows enhancement status, navigation works

---

## PHASE 4: TESTING & REFINEMENT

### TEST-001: End-to-End Testing
- [ ] Test full enhancement flow with various experience types
- [ ] Test question generation quality with different achievement styles
- [ ] Test answer processing with vague vs detailed answers
- [ ] Test follow-up question generation
- [ ] Test enhancement quality (metrics, verbs, structure)
- [ ] Test regeneration flow with modified answers
- [ ] Test bulk enhancement with multiple experiences
- [ ] Test error scenarios (timeouts, API failures, network errors)

**Dependencies:** All FE tasks  
**Testable by:** QA team, Frontend team  
**Success criteria:** All flows work correctly, errors handled gracefully

---

### TEST-002: AI Prompt Refinement
- [ ] Gather sample enhancements from testing
- [ ] Evaluate question relevance and quality
- [ ] Evaluate enhancement quality (metrics, clarity, professionalism)
- [ ] Refine system prompts based on results
- [ ] Test refined prompts with same examples
- [ ] Iterate until quality meets standards

**Dependencies:** TEST-001  
**Testable by:** Product team, AI team  
**Success criteria:** Questions are relevant, enhancements are high quality

---

### TEST-003: Performance Optimization
- [ ] Measure API response times for question generation
- [ ] Measure API response times for answer processing
- [ ] Optimize AI prompts for faster responses
- [ ] Add caching if applicable
- [ ] Test with slow network conditions
- [ ] Ensure loading states provide good UX

**Dependencies:** TEST-001  
**Testable by:** Engineering team  
**Success criteria:** Response times acceptable, UX smooth even with delays

---

## VALIDATION CHECKLIST

Before marking this change as complete:

- [ ] User story exists in context/ folder and is documented ✅
- [ ] Tasks use ID system (DB-001, BE-001, FE-001) ✅
- [ ] Phases in correct order (Database → Backend → Frontend) ✅
- [ ] Tasks grouped by logical unit (one testable unit per task) ✅
- [ ] Dependencies listed for every task ✅
- [ ] Completed tasks show actual deliverables (not descriptions)
- [ ] No task too broad (must be completable in one focused effort) ✅
- [ ] All acceptance criteria from user story covered ✅
