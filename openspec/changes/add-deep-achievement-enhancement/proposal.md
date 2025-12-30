# Change: Add Deep Profile Achievement Enhancement

## Why

Users who have completed their Career Sage Profile often have vague, unquantified achievement descriptions that fail to showcase the true impact of their work. While the light polish feature helps improve grammar and clarity during onboarding, it doesn't address the fundamental problem: users lack the specific metrics, scope, outcomes, and context that make achievements compelling to recruiters and hiring managers.

Deep enhancement solves this by implementing the **XYZ Method** (recommended by Google recruiters) through a dedicated, post-profile-creation flow. The XYZ Method follows the formula: "Accomplished [X] as measured by [Y] by doing [Z]" where X = achievement, Y = quantifiable metric, Z = specific methods/tools used.

The AI uses two specialized prompts:
1. **Context Gathering Prompt:** Generates 5-7 targeted questions to extract X, Y, and Z components, tailored to employment type (full-time, part-time, contract, internship)
2. **Bullet Writing Prompt:** Generates 3-5 XYZ-format bullets with employment-type-appropriate action verbs and quantifiable metrics

This transforms generic statements like "Managed projects for the engineering team" into powerful XYZ-format achievements like "Led 5-person engineering team to deliver $2M customer portal, reducing support tickets by 40%"—dramatically improving resume quality and job search outcomes.

## What Changes

- Integrate XYZ enhancement flow into [`/profile/experience`](../../app/pages/profile/experience.vue) page with 50% slide-out pane triggered by `?enhance=<id>` query parameter
- Implement **XYZ Method** with two specialized AI prompts:
  - **Context Gathering Prompt:** Generates 5-7 targeted questions to extract X (achievement), Y (metrics), Z (methods)
  - **Bullet Writing Prompt:** Generates 3-5 XYZ-format bullets with employment-type-appropriate verbs
- Create question generation endpoint using Context Gathering Prompt
- Create bullet generation endpoint using Bullet Writing Prompt
- Add database migration to add `last_enhanced_at` timestamp and `context_notes` columns to [`career_id.experience`](../../openspec/changes/archive/2025-12-11-add-profile-builder-form/deliverables/migrations/003_create_experience.sql) table
- Build 50% slide-out pane UI with 3-round enhancement flow (Round 1: initial questions → Round 2: follow-ups → Round 3: context review & save)
- Implement XYZ enhancement flow: click "Enhance" button → pane opens with `?enhance=<id>` param → answer 5-7 questions across 3 rounds → edit context notes → preview 3-5 XYZ bullets → accept/regenerate
- Store user answers and context notes per experience to enable regeneration within the same session
- Persist context notes to database for future reference and regenerations
- Update experience cards to show "Enhance" button in view and edit modes
- Update profile dashboard to show enhancement status and provide "Deep Enhance" link to experience enhancement page
- Handle enhancement failures gracefully without blocking profile usage

## Impact

### Affected Specs
- [`profile-builder`](../../openspec/specs/profile-builder/spec.md) - Adding deep achievement enhancement capability

### Affected Code

**Backend:**
- New endpoint: `server/api/career-id/profile/[profileId]/experience/[id]/gather-context.post.ts` - XYZ Context Gathering (5-7 questions)
- New endpoint: `server/api/career-id/profile/[profileId]/experience/[id]/enhance-achievements.post.ts` - XYZ Bullet Writing (3-5 bullets)
- New utility: `server/utils/profile-experience-enhancer.ts` - AI Gateway integration with XYZ Method prompts
- New migration: `server/migrations/015_add_experience_enhancement_tracking.sql` - Add `last_enhanced_at` and `context_notes` columns

**Frontend:**
- Modified: [`app/pages/profile/experience.vue`](../../app/pages/profile/experience.vue) - Add query param handling, "Enhance" buttons, pane rendering
- New component: `app/components/profile/EnhancementPane.vue` - Main pane container with step navigation
- New component: `app/components/profile/EnhancementStep1.vue` - Round 1: Initial questions
- New component: `app/components/profile/EnhancementStep2.vue` - Round 2: Follow-up questions with story notes
- New component: `app/components/profile/EnhancementStep3.vue` - Round 3: Context notes + bullet preview
- Update: [`app/pages/profile/index.vue`](../../app/pages/profile/index.vue) - Add enhancement status badge and "Deep Enhance" link to experience cards
- Update: [`app/stores/careerIDStore.ts`](../../app/stores/careerIDStore.ts) - Add XYZ enhancement actions and multi-round state tracking

**Types:**
- Update: [`shared/types/careerId.ts`](../../shared/types/careerId.ts) - Add `lastEnhancedAt` and `contextNotes` to Experience type
- New: `shared/types/enhancement.ts` - XYZ question, story notes, context, and bullet pair types

**Deliverables:**
- [`deliverables/prompts/xyz-method-guide.md`](deliverables/prompts/xyz-method-guide.md) - XYZ Method overview
- [`deliverables/prompts/context-gathering-prompt.md`](deliverables/prompts/context-gathering-prompt.md) - System prompt for question generation
- [`deliverables/prompts/bullet-writing-prompt.md`](deliverables/prompts/bullet-writing-prompt.md) - System prompt for bullet generation

### Dependencies
- Requires AI Gateway API key configuration (already in place)
- Uses Vercel AI SDK (already installed)
- GPT-4o model access via AI Gateway for conversational enhancement

### Breaking Changes
None - This is an additive feature that enhances existing profile functionality

### Migration Notes
- Database migration adds nullable `last_enhanced_at` and `context_notes` columns to existing `career_id.experience` table
- No data migration required - columns default to NULL for existing records
- Enhancement answers stored in component state during session (not persisted to database between sessions)
- Context notes persist to database for future reference and regenerations
- Feature is opt-in via query parameter on experience page (users can skip entirely)
