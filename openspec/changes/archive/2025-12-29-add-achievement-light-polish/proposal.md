 # Change: Add AI-Powered Achievement Light Polish

## Why

Users entering professional achievements during profile onboarding often struggle to articulate their accomplishments in a polished, professional manner. Raw achievement text may contain grammatical errors, weak verb choices, or unclear phrasing that diminishes the impact of their career narrative. This creates friction in the onboarding experience and results in lower-quality profile data that undermines resume generation and other downstream features.

Light polish provides real-time AI enhancement that improves grammar, clarity, and action verbs without changing the user's core meaning or adding fabricated information. This helps users present their best professional selves while maintaining authenticity and ownership of their career story.

## What Changes

- Add AI-powered text enhancement capability for achievement descriptions during profile onboarding
- Create new backend API endpoint for experience enhancement using AI Gateway with GPT-4o-mini
- Add "Enhance" button UI for each work experience entry in ExperienceSectionNew component
- Implement visual indicators (badge + highlight) to show which achievements have been enhanced
- Store enhanced text (not original) in the database when user saves their profile
- Handle enhancement failures gracefully without blocking profile creation workflow

## Impact

### Affected Specs
- [`profile-builder`](../../specs/profile-builder/spec.md) - Adding achievement enhancement capability

### Affected Code
- **Backend:**
  - New endpoint: `server/api/career-id/resume/achievementEnhancer.post.ts` - AI enhancement API
  - New utility: `server/utils/achievement-enhancer.ts` - AI Gateway integration for text polish (uses GPT-4o-mini)
  
- **Frontend:**
  - [`app/components/profile/ExperienceSectionNew.vue`](../../app/components/profile/ExperienceSectionNew.vue) - Add enhance buttons and visual indicators
  - [`app/stores/careerIDStore.ts`](../../app/stores/careerIDStore.ts) - Add enhancement action
  - [`app/types/index.d.ts`](../../app/types/index.d.ts) - Add `isEnhanced` flag to Experience type

### Dependencies
- Requires AI Gateway API key configuration (already in place for resume extraction)
- Uses Vercel AI SDK (already installed)
- GPT-4o model access via AI Gateway

### Breaking Changes
None - This is an additive feature that enhances existing onboarding workflow

### Migration Notes
- No database schema changes required
- Enhanced achievements are stored as regular achievement text (no special handling)
- Feature is opt-in via button clicks (users can skip enhancement entirely)
