# Change: Implement Hero Moments Discovery

## Why

Users feel pressured to complete full HERO stories immediately during discovery sessions, leading to incomplete entries that clutter the database and create a poor user experience. They need a lightweight way to capture raw achievement moments—just a title and conversational notes—without committing to the full 12-field HERO Framework. This allows users to explore and discover multiple achievements in a single session, then develop them into complete stories at their own pace.

## What Changes

- **New Capability: Hero Moments Capture** - Users can quickly capture lightweight achievement moments with just a title and raw notes during discovery sessions
- **Discovery Session Flow** - Users answer guided questions about achievements and the system captures moments with minimal friction
- **Moments Management** - Users see discovered moments in a dedicated section on the HERO Stories management page, distinct from completed stories
- **Moment-to-Story Conversion** - Users can develop moments into full HERO stories using the Story Builder (UI ready, Story Builder integration out of scope)
- **Session Persistence** - Discovery session state is preserved across page refreshes until the user completes the session

**API Structure Decision:**
- Hero moments CRUD: `/api/career-id/profile/:profileId/moments/*`
- Discovery sessions: `/api/career-id/discovery-sessions/*`

## Impact

- **Affected specs**: `profile-builder` (new hero-moments capability added)
- **Affected code**:
  - Frontend: New discovery session page, moments management section on HERO page, components for moment capture/edit/display
  - Backend: New moments CRUD endpoints and discovery session endpoints
  - Database: New tables for hero moments and discovery sessions
- **Breaking changes**: None
- **New dependencies**: None (uses existing tech stack)
- **User-visible changes**: New "Discovered Moments" section on HERO Stories management page, new discovery session interface

## Replaces

This change does **not** replace any previous work. It is a prerequisite feature that enables the HERO Stories workflow by providing a lightweight entry point for moment discovery.

## Relationship to HERO Stories

Hero Moments Discovery is a **prerequisite** to the HERO Stories feature (2026-01-10-add-hero-stories). The workflow is:

1. **Hero Moments Discovery** (this change): User captures lightweight moments during discovery sessions
2. **Hero Stories** (existing): User develops moments into full HERO stories using the Story Builder

This separation allows users to:
- Discover multiple moments without pressure to complete them
- Review and prioritize moments before investing time in full story development
- Develop moments into stories at their own pace
- Track discovery and conversion metrics
