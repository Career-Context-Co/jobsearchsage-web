# Architecture Changes Summary

## Overview
Updated proposal.md and design.md to reflect the new pane-based integration approach for the Deep Achievement Enhancement feature. All files now align with the revised tasks.md implementation plan.

## Key Changes

### 1. **Page Architecture**
- **Previous:** Dedicated `/profile/enhance` page with modal dialog
- **New:** Integrated into `/profile/experience` page with 50% slide-out pane
- **Trigger:** `?enhance=<experienceId>` query parameter
- **Benefit:** Keeps user in context while enhancing

### 2. **Data Persistence**
- **Previous:** Only `last_enhanced_at` timestamp
- **New:** Added `context_notes` column for persisting user's interview context
- **Benefit:** Enables future regenerations with preserved context understanding

### 3. **Enhancement Flow**
- **Previous:** 4-step flow (Question Generation → Question Answering → Follow-ups → Preview & Accept)
- **New:** 3-round flow with context accumulation
  - **Round 1:** Initial questions (5-7 questions, no context)
  - **Round 2:** Follow-up questions (if needed, with accumulated story notes)
  - **Round 3:** Context review & bullet preview (editable context notes textarea)
- **Benefit:** Better context gathering with user control over refinement

### 4. **Components**
- **Previous:** 
  - EnhancementFlow (main wizard)
  - XYZQuestionForm (question display)
  - XYZBulletPreview (bullet preview)
  - Plus page and modal overhead

- **New:**
  - EnhancementPane (main pane container with step navigation)
  - EnhancementStep1 (Round 1: Initial questions)
  - EnhancementStep2 (Round 2: Follow-up questions)
  - EnhancementStep3 (Round 3: Context review & save)
  - Modified experience.vue (query param handling, pane rendering)

### 5. **API Endpoints**
- **Previous:** 
  - `/api/career-id/enhancement/generate-questions`
  - `/api/career-id/enhancement/generate-bullets`

- **New:**
  - `/api/career-id/profile/[profileId]/experience/[id]/gather-context` (multi-round support)
  - `/api/career-id/profile/[profileId]/experience/[id]/enhance-achievements`
  - Enhanced PATCH endpoint to save context notes

### 6. **Bulk Enhancement**
- **Previous:** Planned "Enhance All" feature with sequential flow
- **New:** Removed - each experience enhanced individually on demand via "Enhance" button
- **Benefit:** Simpler UX, each experience gets focused attention

### 7. **State Management**
- **Previous:** Component-level state with regeneration in same session
- **New:** Store-level multi-round state tracking with context accumulation
- **Benefits:** 
  - Persists across component reloads
  - Tracks round progression
  - Accumulates story notes across rounds

## Files Updated

1. **proposal.md**
   - Updated "What Changes" section with pane-based approach
   - Updated "Affected Code" section with new component names and file paths
   - Updated "Migration Notes" with context notes persistence
   - Line changes: 15-28 (What Changes), 37-56 (Affected Code), 71-76 (Migration Notes)

2. **design.md**
   - Replaced entire "Architecture" section with new pane-based design
   - Updated "Data Flow" with 3-round flow diagram and explanation
   - Updated "Decision 2" to clarify context notes persistence
   - Updated "Decision 3" with context_notes column in migration
   - Replaced "Decision 4" (Page vs Modal) with "Pane Integration vs Dedicated Page"
   - Replaced "Decision 5" (Bulk Enhancement) with "Multi-Round Context Gathering"
   - Updated "Risks" section with new risks relevant to multi-round flow
   - Updated "Migration Plan" phases to reflect new architecture
   - Updated "Open Questions" for new concerns

## Alignment with tasks.md

✅ **PHASE 3B Tasks:**
- FE-003: Modify experience.vue ✓ (query param handling, highlight, buttons)
- FE-004: Create EnhancementPane.vue ✓ (step navigation)
- FE-005: Create EnhancementStep1.vue ✓ (Round 1 questions)
- FE-006: Create EnhancementStep2.vue ✓ (Round 2 follow-ups)
- FE-007: Create EnhancementStep3.vue ✓ (Round 3 context review)
- FE-008: Implement multi-round flow logic ✓ (3-round orchestration)
- FE-009: Update profile dashboard ✓ (status badge & Deep Enhance link)

✅ **Database:**
- DB-001: Now includes both `last_enhanced_at` and `context_notes` columns

✅ **Removed:**
- Bulk enhancement ("Enhance All" button)
- Dedicated /profile/enhance page
- Modal dialog approach

## Consistency Check

| Aspect | proposal.md | design.md | tasks.md | Status |
|--------|-------------|-----------|----------|--------|
| Page location | `/profile/experience` pane | `/profile/experience` pane | `/profile/experience` pane | ✅ |
| Trigger | `?enhance=<id>` param | `?enhance=<id>` param | `?enhance=<id>` param | ✅ |
| Rounds | 3 rounds | 3 rounds | 3 rounds | ✅ |
| Components | Pane + Step1-3 | Pane + Step1-3 | Pane + Step1-3 | ✅ |
| API endpoints | gather-context, enhance-achievements | gather-context, enhance-achievements | gather-context, enhance-achievements | ✅ |
| Context notes | Yes (persisted) | Yes (persisted) | Yes (persisted) | ✅ |
| Bulk enhancement | Removed | Removed | Removed | ✅ |

All three documents are now fully aligned and consistent.

