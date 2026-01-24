# Context: HERO Story Form

## Linear Issues

- Parent: `https://linear.app/career-context/issue/JSS-99/build-a-hero-story-with-a-form`
- Child: `https://linear.app/career-context/issue/JSS-100/hero-form-interface-with-context-and-sections`
- Child: `https://linear.app/career-context/issue/JSS-101/save-hero-story-with-confirmation-and-post-save-options`

## USER STORY

As a job seeker, I want to fill in a HERO story using a simple form where I can enter all information at once, so I can document my career achievements directly without step-by-step guidance.

## Key Notes (from JSS-99)

- Single-page form with all four HERO sections:
  - Hurdle, Expectation, Response, Outcome
- Each section includes inputs for its tagged fields:
  - Hurdle: `[PROBLEM]`, `[SCOPE]`, `[STAKES]`
  - Expectation: `[ROLE]`, `[GOALS]`, `[CONSTRAINTS]`
  - Response: `[ACTIONS]`, `[TOOLS]`, `[CHALLENGES]`
  - Outcome: `[DELIVERABLE]`, `[METRICS]`, `[IMPACT]`
- Title is required; pre-fill from moment title when applicable.
- Context panel (read-only) shown when story originates from a moment or experience.
- Manual save only (no autosave, no AI calls).
- Persist to `hero_stories` with `profile_id`, optional `source_experience_id`, and timestamps.
- Post-save options: view story, generate bullets (follow-on), or create new story.

## Acceptance Criteria (normalized)

1. Form initializes with context from moment, experience, or scratch
2. Form displays all HERO sections and all tagged input fields
3. Title field is required and validated
4. No autosave and no AI calls
5. Save button shows loading and success/error feedback
6. Save persists complete story into `hero_stories` with metadata
7. Nothing is saved until Save is clicked; navigating away loses unsaved data
8. After save, user is offered next actions (view, generate bullets, create new)

