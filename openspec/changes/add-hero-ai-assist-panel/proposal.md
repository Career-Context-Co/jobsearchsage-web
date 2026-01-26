# Change: Add AI Assistance Panel to HERO Story Form

## Why

Users filling out HERO story forms need just-in-time coaching to build out their achievement stories through targeted questions. Most users have empty or minimal fields when they seek help, and field labels alone don't provide sufficient guidance. An interactive AI coach that asks targeted questions per tag can extract the information users need to articulate, helping them discover what to write rather than struggling with blank fields. This conversational approach feels more like coaching than tool usage and helps users build compelling HERO stories through guided discovery.

## What Changes

- Add "Get AI Help" button to each of the four HERO sections (Hurdle, Expectation, Response, Outcome)
- Create AI conversation panel that conducts interactive coaching sessions through targeted questions
- Implement multi-turn conversation API (`/start` and `/continue` endpoints) with conversation state management
- Support chat-like interaction where AI asks questions and users respond iteratively
- Use hero moment title/description and source experience as context for more relevant questions
- Enable acceptance of AI-extracted content into form fields when conversation completes
- Allow unlimited regeneration (fresh conversation restart) if user wants different direction
- Add comprehensive error handling with user-friendly messages and retry capability

## Impact

- **Affected specs:** `hero-stories` (adds AI assistance requirements)
- **Affected code:**
  - Frontend: `app/components/profile/hero/HeroStoryCard.vue` (add help buttons)
  - Frontend: New component `app/components/profile/hero/AIConversationPanel.vue`
  - Frontend: `app/stores/careerIDStore.ts` (AI conversation state and actions)
  - Backend: New API endpoints `server/api/ai/hero-story/enhance-section/start.post.ts` and `continue.post.ts`
  - Backend: New utility `server/utils/hero-story-enhancer.ts` (conversational AI prompts, state management)
- **Dependencies:** Requires completed HERO story form from JSS-99 (already implemented)
- **Blocks:** JSS-88 (HERO Story Session) will reuse this AI assistance pattern
