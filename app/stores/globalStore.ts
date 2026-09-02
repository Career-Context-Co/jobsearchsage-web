import { defineStore } from 'pinia'

interface GlobalFeatures {
  /**
   * When true, sign-up requires email confirmation before the user can sign in.
   * When false, users are signed in immediately after creating an account.
   * Controlled via NUXT_PUBLIC_SIGNUP_EMAIL_CONFIRMATION env var.
   * Future: will be overridable via PostHog feature flags.
   */
  signupEmailConfirmation: boolean
  /**
   * When true, HERO product surfaces are visible (Profile/sidebar tab,
   * /profile/hero, /profile/hero-wizard, experience HERO nudge).
   * Controlled via NUXT_PUBLIC_HERO_ENABLED env var (must be the string "true").
   * Defaults to false — delayed launch kill switch.
   * Future: will be overridable via PostHog feature flags.
   */
  hero: boolean
  /**
   * When true, experience "Get AI Help" (Sage assist slideover) is available.
   * Controlled via NUXT_PUBLIC_SAGE_ASSIST_ENABLED env var (must be the string "true").
   * Defaults to false — delayed launch kill switch.
   * Future: will be overridable via PostHog feature flags.
   */
  sageAssist: boolean
}

interface GlobalState {
  features: GlobalFeatures
}

export const useGlobalStore = defineStore('global', {
  state: (): GlobalState => ({
    features: {
      signupEmailConfirmation: true,
      hero: false,
      sageAssist: false
    }
  }),

  actions: {
    /**
     * Seed feature flags from runtimeConfig.
     * Called once at app init (account.client.ts plugin).
     * Future: merge PostHog remote flags here after identity is established.
     */
    bootstrap() {
      const config = useRuntimeConfig()
      this.features.signupEmailConfirmation =
        config.public.signupEmailConfirmation ?? true
      this.features.hero = config.public.hero === true
      this.features.sageAssist = config.public.sageAssist === true

      // Future PostHog override (uncomment when wiring up):
      // const posthog = usePostHog()
      // this.features.signupEmailConfirmation =
      //   posthog.isFeatureEnabled('signup-email-confirmation') ?? this.features.signupEmailConfirmation
      // this.features.hero =
      //   posthog.isFeatureEnabled('hero') ?? this.features.hero
      // this.features.sageAssist =
      //   posthog.isFeatureEnabled('sage-assist') ?? this.features.sageAssist
    }
  }
})
