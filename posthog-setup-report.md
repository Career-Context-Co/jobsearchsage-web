<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into JobSearchSage. The `@posthog/nuxt` module was installed and configured with automatic client-side error tracking (`capture_exceptions: true`) and server-side exception autocapture (`enableExceptionAutocapture: true`). A shared server-side PostHog Node client utility was created at `server/utils/posthog.ts`. User identification is performed on the client side at sign-in and sign-up, with matching session/distinct IDs forwarded to server-side events via `x-posthog-session-id` and `x-posthog-distinct-id` headers. PostHog keys are read from environment variables (`NUXT_PUBLIC_POSTHOG_KEY`, `NUXT_PUBLIC_POSTHOG_HOST`) set in `.env.local`.

## Events instrumented

| Event Name | Description | File(s) |
|---|---|---|
| `user_signed_up` | User successfully created a new account via email | `app/pages/signin.vue` |
| `user_signed_in` | User successfully signed in via email; `posthog.identify()` called with email | `app/pages/signin.vue` |
| `user_signed_out` | User signed out; `posthog.reset()` called to clear identity | `app/stores/accountStore.ts` |
| `resume_uploaded` | User successfully uploaded and extracted data from a resume file; includes extracted section counts | `app/pages/profile/onboarding.vue` |
| `onboarding_step_completed` | User completed a step in the onboarding wizard (contact, experience, education, etc.) | `app/pages/profile/onboarding.vue` |
| `onboarding_completed` | User finished the full profile onboarding flow; includes profile completion stats | `app/pages/profile/onboarding.vue` |
| `onboarding_abandoned` | User clicked "Take a Break" and left onboarding early; includes current step | `app/pages/profile/onboarding.vue` |
| `ai_enhancement_started` | User initiated AI-powered achievement enhancement for an experience entry | `app/stores/careerIDStore.ts` |
| `ai_enhancement_completed` | AI achievement enhancement completed successfully; includes duration and bullet count | `app/stores/careerIDStore.ts` |
| `ai_context_questions_generated` | AI generated context-gathering questions for XYZ bullet enhancement (Round 1) | `app/stores/careerIDStore.ts` |
| `ai_bullets_generated` | AI generated final XYZ-format resume bullets from context notes | `app/stores/careerIDStore.ts` |
| `server_user_signed_in` | Server-side: sign-in API request processed; links to client session via headers | `server/api/auth/sign-in.post.ts` |
| `server_resume_extracted` | Server-side: Resume data successfully extracted by AI; includes file size and extraction timing | `server/api/career-id/resume/extract.post.ts` |

## Files created or modified

| File | Change |
|---|---|
| `nuxt.config.ts` | Added `@posthog/nuxt` module, `posthogConfig`, and `runtimeConfig.public.posthog` |
| `server/utils/posthog.ts` | **New** — Shared PostHog Node singleton for server-side event capture |
| `app/pages/signin.vue` | Added `usePostHog()`, user identification on sign-in, `user_signed_up`/`user_signed_in` events, exception capture |
| `app/pages/profile/onboarding.vue` | Added `usePostHog()`, `resume_uploaded`, `onboarding_step_completed`, `onboarding_completed`, `onboarding_abandoned` events |
| `app/stores/accountStore.ts` | Added `user_signed_out` event and `posthog.reset()` on sign-out |
| `app/stores/careerIDStore.ts` | Added `ai_enhancement_started`, `ai_enhancement_completed`, exception capture; added `generateInitialQuestionsTracked` and `generateFinalBulletsTracked` wrapper actions |
| `server/api/auth/sign-in.post.ts` | Added `server_user_signed_in` server-side event with session correlation |
| `server/api/career-id/resume/extract.post.ts` | Added `server_resume_extracted` server-side event with extraction metadata |
| `.env.local` | Added `NUXT_PUBLIC_POSTHOG_KEY` and `NUXT_PUBLIC_POSTHOG_HOST` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- 📊 **Dashboard — Analytics basics**: [https://us.posthog.com/project/324344/dashboard/1310387](https://us.posthog.com/project/324344/dashboard/1310387)

### Insights

1. **Sign Ups & Sign Ins (Daily)** — Daily trend of new sign-ups vs. returning sign-ins
   [https://us.posthog.com/project/324344/insights/keoLXGGJ](https://us.posthog.com/project/324344/insights/keoLXGGJ)

2. **Onboarding Funnel** — Conversion from sign-up → resume upload → onboarding complete
   [https://us.posthog.com/project/324344/insights/mZBLeLcc](https://us.posthog.com/project/324344/insights/mZBLeLcc)

3. **Onboarding Drop-off Rate** — Weekly comparison of onboarding completions vs. abandonments
   [https://us.posthog.com/project/324344/insights/EKN4W7Zp](https://us.posthog.com/project/324344/insights/EKN4W7Zp)

4. **AI Feature Adoption** — Weekly usage of all AI-powered features (enhancement, context questions, bullet generation)
   [https://us.posthog.com/project/324344/insights/GNInX2vi](https://us.posthog.com/project/324344/insights/GNInX2vi)

5. **Resume Upload to Profile Completion Funnel** — Activation funnel from resume upload through full profile completion
   [https://us.posthog.com/project/324344/insights/ge8BGwk2](https://us.posthog.com/project/324344/insights/ge8BGwk2)

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/posthog-integration-nuxt-4/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
