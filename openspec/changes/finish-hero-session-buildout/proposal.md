## Why

The HERO interview flow is incomplete: Hurdle and Expectation can be developed through guided AI sessions, but Response and Outcome are still presented as coming soon. Completing the remaining two sections lets users build every part of a HERO story through the same guided session experience.

## What Changes

- Enable guided AI interview sessions for the Response and Outcome HERO sections using the same hero-session flow that already works for Hurdle and Expectation.
- Add the missing Response and Outcome server handling needed by the existing hero-session start/continue workflow.
- Update the HERO session pane so all four HERO sections can launch the current structured field interview experience consistently.
- Preserve user control: generated HERO story content is suggested for review before it is accepted into the story form or saved.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `hero-stories`: Extend HERO story AI assistance requirements to include Response and Outcome hero-session interviews.

## Impact

- Affected spec: `hero-stories`
- Frontend: `app/components/profile/hero/SessionPane.vue` and related HERO story/session components or stores that route users into section interviews.
- Backend: existing hero-session start/continue flows get missing Response and Outcome support.
- AI utilities: existing hero-session prompt/session logic maps all four HERO sections field-by-field.
- Data flow: persisted HERO story APIs remain the save boundary.
