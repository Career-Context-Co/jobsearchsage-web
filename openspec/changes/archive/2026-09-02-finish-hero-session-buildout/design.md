## Context

The current HERO story session UI is split between `SessionPane.vue`, which wraps `HeroStorySession.vue`, and `HeroStorySession.vue`, which presents a picker for Hurdle and Expectation only. Response and Outcome are present in the UI data but marked unavailable. The current flow asks one structured field question at a time and stores progress in `hero_story_sessions` through `/api/ai/hero-session/start` and `/api/ai/hero-session/continue`.

The existing hero-session process is correct and should not be redesigned. It should be completed by adding Response and Outcome support that behaves the same way Hurdle and Expectation behave today: select a section, select a field, answer structured questions, preview the generated field text, and apply it to the form.

## Goals / Non-Goals

**Goals:**

- Enable Response and Outcome in the HERO session pane using the same existing structured hero-session flow as Hurdle and Expectation.
- Add the missing server and AI utility support so Response fields (`actions`, `tools`, `challenges`) and Outcome fields (`deliverable`, `metrics`, `impact`) work exactly like current Hurdle/Expectation fields.
- Let the user review generated HERO content before applying it to the story form or saving through existing HERO story persistence APIs.

**Non-Goals:**

- Do not change the current hero-session interaction model for Hurdle and Expectation.
- Do not introduce any new discovery or batch interview endpoint in this change.
- Do not add autosave for HERO story fields; persistence remains an explicit user action.
- Do not replace the existing HERO story create/update endpoints.
- Do not require the AI to generate resume bullets as part of this change.

## Decisions

### Keep HERO Session Endpoints Behavior Stable

Do not add a new mode to `/api/ai/hero-session/start` or `/api/ai/hero-session/continue`. Those endpoints should continue to support the current structured field flow:

- start a session for `profile_id`, `story_id`, `section_type`, and a specific `field`
- return one structured question
- accept one selected option/custom answer at a time
- generate final text for that field
- store session progress in `hero_story_sessions`

The existing endpoints already validate all four section types and include Response/Outcome field names in their allowed field list. The implementation should complete the missing server utility support and frontend availability rather than changing the endpoint contract. Adding new endpoint behavior here was considered and rejected because it would risk regressing Hurdle/Expectation.

### Add Response and Outcome as First-Class Structured Sections

`HeroStorySession.vue` should make Response and Outcome available and add the same supporting structures that Hurdle and Expectation already have:

- Response fields: `actions`, `tools`, `challenges`
- Outcome fields: `deliverable`, `metrics`, `impact`
- Field session state for each new field
- Previous field context rules within each section, matching the Hurdle/Expectation pattern
- Mapping from field ids to story form fields

This keeps the pane behavior consistent: users pick a section, pick a field, answer structured questions, review the generated field, and apply it to the form.

### Cover All HERO Session Field Mappings Explicitly

The existing hero-session final output must map every field to the existing camelCase story form fields:

- Hurdle: `hurdleProblem`, `hurdleScope`, `hurdleStakes`
- Expectation: `expectationRole`, `expectationGoals`, `expectationConstraints`
- Response: `responseActions`, `responseTools`, `responseChallenges`
- Outcome: `outcomeDeliverable`, `outcomeMetrics`, `outcomeImpact`

If server persistence stores any of these values in Supabase rows, it must continue using existing snake_case database columns through current transformers. No new snake_case to camelCase table mapping is introduced by this design.

## Risks / Trade-offs

- Response/Outcome may be partially supported server-side but not in prompts -> Audit `hero-story-enhancer` and structured question utilities so all six missing field paths have questions and final text generation.
- Adding duplicate section-specific logic could drift from existing behavior -> Reuse the current Hurdle/Expectation patterns for field configuration, session state, previous field context, and final output mapping.
- Enabling R/O before all prompt paths are complete could produce null suggestions -> Gate availability on working structured questions and final text generation for all six new fields.
- More fields increase component branching -> Prefer shared section metadata and field helpers over one-off conditionals where practical.

## Migration Plan

1. Complete Response and Outcome support in the existing hero-session AI utilities and structured question definitions.
2. Update `HeroStorySession.vue` / `SessionPane.vue` so Response and Outcome are available and use the same current field-level flow as Hurdle and Expectation.
3. Confirm existing Pinia hero-session store actions can start and continue Response/Outcome sessions with no contract changes.
4. Validate with `pnpm lint` and `pnpm typecheck`.

Rollback is low risk because Response/Outcome availability can be disabled in the pane without changing existing Hurdle/Expectation sessions.

## Resolved Questions

- **Are the structured question utilities complete for Response and Outcome?** No. The conversational system prompts (`RESPONSE_SYSTEM_PROMPT`, `OUTCOME_SYSTEM_PROMPT`) in `hero-story-enhancer.ts` already exist and are thorough. However, the *structured* question path is incomplete: `SectionField` in `hero-structured-questions.ts` only includes `HurdleField | ExpectationField`, so Response and Outcome fields cannot pass through `startStructuredEnhancement`, `continueStructuredEnhancement`, or `generateFieldTextFromAnswers`. The `fieldPrompts` map in `generateContextualQuestion` and the `getFieldSynthesisPrompt` function both need entries for all six new fields. This is the core backend work.
- **What field ordering should Response and Outcome use?** Canonical order matching Hurdle and Expectation: Response follows `actions → tools → challenges`, Outcome follows `deliverable → metrics → impact`.
