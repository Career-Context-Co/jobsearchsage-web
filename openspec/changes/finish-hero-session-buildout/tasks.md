## 1. Database Assessment

- [x] 1.1 Confirm `hero_story_sessions` can store Response and Outcome structured session data without schema changes.
- [x] 1.2 Confirm existing HERO story persistence already has fields for `responseActions`, `responseTools`, `responseChallenges`, `outcomeDeliverable`, `outcomeMetrics`, and `outcomeImpact`.
- [x] 1.3 Add a migration only if the existing session or story schema is missing required Response/Outcome storage.

## 2. Backend Hero Session Support

- [x] 2.1 Audit `server/api/ai/hero-session/start.post.ts` and `continue.post.ts` to confirm Response and Outcome requests follow the same path as Hurdle and Expectation.
- [x] 2.2 Widen `SectionField` type in `hero-structured-questions.ts` to include `ResponseField` (`'actions' | 'tools' | 'challenges'`) and `OutcomeField` (`'deliverable' | 'metrics' | 'impact'`).
- [x] 2.3 Add `fieldPrompts` entries for all six new fields (`actions`, `tools`, `challenges`, `deliverable`, `metrics`, `impact`) in the `generateContextualQuestion` function within `hero-story-enhancer.ts`. The conversational system prompts (`RESPONSE_SYSTEM_PROMPT`, `OUTCOME_SYSTEM_PROMPT`) already exist — only the structured question prompt strings and `getFieldSynthesisPrompt` entries are missing.
- [x] 2.4 Add `getFieldSynthesisPrompt` return cases for all six Response/Outcome fields to enable final text generation from structured answers.
- [x] 2.5 Confirm hero-session final text generation and field mapping return the correct camelCase form keys for all six Response and Outcome fields (mappings already exist in `SECTION_DB_FIELD_NAMES`).
- [x] 2.6 Verify source experience and previous field context are passed through consistently for Response and Outcome sessions.

## 3. Store and Types

- [x] 3.1 Confirm the existing Sage AI store hero-session start and continue actions accept `response` and `outcome` section types without contract changes.
- [x] 3.2 Confirm shared HERO story field types already include all Response and Outcome fields used by the session output.
- [x] 3.3 Add or tighten local TypeScript unions/helpers for HERO section ids and field ids if needed to avoid `any` casts while preserving current behavior.

## 4. Frontend Enablement

- [x] 4.1 Add Response and Outcome field metadata to the HERO story session UI, including Actions, Tools, Challenges, Deliverable, Metrics, and Impact.
- [x] 4.2 Enable Response and Outcome in the section picker and remove their "Coming Soon" disabled state.
- [x] 4.3 Add field session state for Response and Outcome that matches the existing Hurdle and Expectation session tracking pattern.
- [x] 4.4 Extend field selection, previous-field context, next-step options, and back-navigation logic so Response and Outcome behave like the existing sections. Use canonical field ordering: Response follows `actions → tools → challenges`, Outcome follows `deliverable → metrics → impact`.
- [x] 4.5 Extend accept/apply behavior so Response suggestions populate `responseActions`, `responseTools`, and `responseChallenges`, and Outcome suggestions populate `outcomeDeliverable`, `outcomeMetrics`, and `outcomeImpact`.

## 5. Integration

- [ ] 5.1 Manually exercise a Response Actions session from the pane through start, continue, completion, preview, and apply.
- [ ] 5.2 Manually exercise a Response Tools or Challenges session to verify previous Response field context is used when available.
- [ ] 5.3 Manually exercise an Outcome Metrics session from the pane through start, continue, completion, preview, and apply.
- [ ] 5.4 Manually exercise an Outcome Impact session to verify previous Outcome field context is used when available.
- [ ] 5.5 Confirm applying suggestions updates only local form state and does not save the HERO story until the user explicitly saves the form.

## 6. Validation

- [x] 6.1 Run `pnpm lint` and fix introduced lint issues.
- [x] 6.2 Run `pnpm typecheck` and fix introduced type errors.
- [x] 6.3 Run `openspec validate finish-hero-session-buildout --strict` and fix any artifact issues.
