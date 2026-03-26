import { defineStore } from 'pinia'

interface GlobalFeatures {
  /**
   * When true, sign-up requires email confirmation before the user can sign in.
   * When false, users are signed in immediately after creating an account.
   * Controlled via NUXT_PUBLIC_SIGNUP_EMAIL_CONFIRMATION env var.
   * Future: will be overridable via PostHog feature flags.
   */
  signupEmailConfirmation: boolean
}

interface GlobalState {
  features: GlobalFeatures
}

export const useGlobalStore = defineStore('global', {
  state: (): GlobalState => ({
    features: {
      signupEmailConfirmation: true
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

      // Future PostHog override (uncomment when wiring up):
      // const posthog = usePostHog()
      // this.features.signupEmailConfirmation =
      //   posthog.isFeatureEnabled('signup-email-confirmation') ?? this.features.signupEmailConfirmation
    }
  }
})
