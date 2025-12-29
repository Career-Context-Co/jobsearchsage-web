# Change: Add Deep Profile Achievement Enhancement

## Why

Users who have completed their Career Sage Profile often have vague, unquantified achievement descriptions that fail to showcase the true impact of their work. While the light polish feature helps improve grammar and clarity during onboarding, it doesn't address the fundamental problem: users lack the specific metrics, scope, outcomes, and context that make achievements compelling to recruiters and hiring managers.

Deep enhancement solves this by implementing the **XYZ Method** (recommended by Google recruiters) through a dedicated, post-profile-creation flow. The XYZ Method follows the formula: "Accomplished [X] as measured by [Y] by doing [Z]" where X = achievement, Y = quantifiable metric, Z = specific methods/tools used.

The AI uses two specialized prompts:
1. **Context Gathering Prompt:** Generates 5-7 targeted questions to extract X, Y, and Z components, tailored to employment type (full-time, part-time, contract, internship)
2. **Bullet Writing Prompt:** Generates 3-5 XYZ-format bullets with employment-type-appropriate action verbs and quantifiable metrics

This transforms generic statements like "Managed projects for the engineering team" into powerful XYZ-format achievements like "Led 5-person engineering team to deliver $2M customer portal, reducing support tickets by 40%"—dramatically improving resume quality and job search outcomes.

## What Changes

- Add new dedicated enhancement page at [`/profile/enhance`](../../app/pages/profile/enhance.vue) accessible from profile dashboard
- Implement **XYZ Method** with two specialized AI prompts:
  - **Context Gathering Prompt:** Generates 5-7 targeted questions to extract X (achievement), Y (metrics), Z (methods)
  - **Bullet Writing Prompt:** Generates 3-5 XYZ-format bullets with employment-type-appropriate verbs
- Create question generation endpoint using Context Gathering Prompt
- Create bullet generation endpoint using Bullet Writing Prompt
- Add database migration to add `last_enhanced_at` timestamp column to [`career_id.experience`](../../openspec/changes/archive/2025-12-11-add-profile-builder-form/deliverables/migrations/003_create_experience.sql) table
- Build enhancement page UI showing all work experiences with enhancement status indicators
- Implement XYZ enhancement flow: select experience → answer 5-7 questions → preview 3-5 XYZ bullets → accept/regenerate
- Store user answers per experience to enable regeneration without re-asking questions
- Update profile dashboard to show enhancement status and provide "Deep Enhance" action for each experience
- Handle enhancement failures gracefully without blocking profile usage

## Impact

### Affected Specs
- [`profile-builder`](../../openspec/specs/profile-builder/spec.md) - Adding deep achievement enhancement capability

### Affected Code

**Backend:**
- New endpoint: `server/api/career-id/enhancement/generate-questions.post.ts` - XYZ Context Gathering (5-7 questions)
- New endpoint: `server/api/career-id/enhancement/generate-bullets.post.ts` - XYZ Bullet Writing (3-5 bullets)
- New utility: `server/utils/xyz-enhancer.ts` - AI Gateway integration with XYZ Method prompts
- New migration: `server/migrations/015_add_experience_enhancement_tracking.sql` - Add `last_enhanced_at` column

**Frontend:**
- New page: [`app/pages/profile/enhance.vue`](../../app/pages/profile/enhance.vue) - Dedicated enhancement page
- New component: `app/components/profile/EnhancementFlow.vue` - XYZ enhancement wizard
- New component: `app/components/profile/XYZQuestionForm.vue` - Question answering interface (5-7 questions)
- New component: `app/components/profile/XYZBulletPreview.vue` - Preview XYZ bullets with X/Y/Z highlighting
- Update: [`app/pages/profile/index.vue`](../../app/pages/profile/index.vue) - Add "Deep Enhance" button to experience cards
- Update: [`app/stores/careerIDStore.ts`](../../app/stores/careerIDStore.ts) - Add XYZ enhancement actions and answer storage

**Types:**
- Update: [`shared/types/careerId.ts`](../../shared/types/careerId.ts) - Add `lastEnhancedAt` to Experience type
- New: `shared/types/enhancement.ts` - XYZ question and answer types

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
- Database migration adds nullable `last_enhanced_at` column to existing `career_id.experience` table
- No data migration required - column defaults to NULL for existing records
- Enhancement answers stored in component state (not persisted to database between sessions)
- Feature is opt-in via dedicated enhancement page (users can skip entirely)
