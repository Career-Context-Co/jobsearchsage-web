import { defineStore } from 'pinia'

const STORAGE_KEY = 'jobsearchsage-account'

interface User {
  id: string
  email: string
  firstName?: string | null
  lastName?: string | null
  preferredName?: string | null
}

interface AccountState {
  user: User | null
  profileId: string | null
  features: {
    hero: boolean
    bulletEnhancement: boolean
  }
}

export const useAccountStore = defineStore('account', {
  state: (): AccountState => ({
    user: null,
    profileId: null,
    features: {
      hero: false,
      bulletEnhancement: false
    }
  }),

  getters: {
    isAuthenticated: state => state.user !== null,
    isHeroEnabled: state => state.features.hero,
    isBulletEnhancementEnabled: state => state.features.bulletEnhancement
  },

  actions: {
    initializeAccount() {
      if (import.meta.client) {
        try {
          const saved = localStorage.getItem(STORAGE_KEY)
          if (saved) {
            const parsed = JSON.parse(saved)
            if (parsed.features) {
              this.features = { ...this.features, ...parsed.features }
            }
          }
        } catch (e) {
          console.warn('Failed to load account preferences:', e)
        }
      }
    },

    /**
     * Hydrate user state from existing Supabase session.
     * Called on app init to restore authenticated state.
     * Session endpoint now returns name fields and profileId from public.users.
     *
     * On page reload, useSupabaseUser() may be null while the Supabase client is
     * still restoring its session from localStorage. We fall back to getSession()
     * so hydration always succeeds when a session exists.
     */
    async hydrateFromSession() {
      const supabaseUser = useSupabaseUser()

      let userId: string | undefined
      let userEmail: string | undefined

      if (supabaseUser.value) {
        userId = supabaseUser.value.id
        userEmail = supabaseUser.value.email
      } else {
        const supabase = useSupabaseClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          userId = session.user.id
          userEmail = session.user.email
        }
      }

      if (!userId) return

      try {
        // Fetch full user data (name fields + profileId) from public.users in one request,
        // then set the complete user object in a single assignment so components that
        // initialize from the store see all fields at once — no watchers needed.
        const response: any = await $fetch('/api/auth/session', { method: 'GET' })
        this.user = {
          id: userId,
          email: userEmail || '',
          firstName: response?.data?.firstName ?? null,
          lastName: response?.data?.lastName ?? null,
          preferredName: response?.data?.preferredName ?? null
        }
        this.profileId = response?.data?.profileId ?? null
      } catch {
        // Session endpoint throws 401 only if not authenticated — shouldn't happen here.
        // Still set minimal user so isAuthenticated stays true.
        this.user = {
          id: userId,
          email: userEmail || ''
        }
        this.profileId = null
      }
    },

    /**
     * Sign in with email and password.
     */
    async signIn(email: string, password: string) {
      try {
        const response: any = await $fetch('/api/auth/sign-in', {
          method: 'POST',
          body: { email, password }
        })

        if (!response.success || response.error) {
          throw new Error(response.error?.message || 'Sign in failed')
        }

        if (response.data) {
          const supabaseClient = useSupabaseClient()
          await supabaseClient.auth.setSession({
            access_token: response.data.session.accessToken,
            refresh_token: response.data.session.refreshToken
          })

          // Store full user data returned from sign-in (includes name fields from public.users)
          this.user = response.data.user
          this.profileId = response.data.profileId
        }

        return response
      } catch (error: any) {
        const errorMessage = error?.data?.error?.message
          || error?.data?.message
          || error?.message
          || 'Sign in failed'
        throw new Error(errorMessage)
      }
    },

    /**
     * Sign up with email, password, and optional name fields.
     */
    async signUp(
      email: string,
      password: string,
      firstName?: string,
      lastName?: string,
      preferredName?: string
    ) {
      try {
        const response: any = await $fetch('/api/auth/sign-up', {
          method: 'POST',
          body: { email, password, firstName, lastName, preferredName }
        })

        if (!response.success || response.error) {
          throw new Error(response.error?.message || 'Sign up failed')
        }

        return response
      } catch (error: any) {
        const errorMessage = error?.data?.error?.message
          || error?.data?.message
          || error?.message
          || 'Sign up failed'
        throw new Error(errorMessage)
      }
    },

    /**
     * Update the current user's name fields in public.users.
     */
    async updateUser(data: { firstName?: string, lastName?: string, preferredName?: string }) {
      const response: any = await $fetch('/api/auth/user', {
        method: 'PATCH',
        body: data
      })

      if (this.user && response?.data) {
        this.user.firstName = response.data.firstName ?? this.user.firstName
        this.user.lastName = response.data.lastName ?? this.user.lastName
        this.user.preferredName = response.data.preferredName ?? this.user.preferredName
      }

      return response
    },

    /**
     * Sign out the current user.
     */
    async signOut() {
      const supabaseClient = useSupabaseClient()
      await supabaseClient.auth.signOut()

      const posthog = usePostHog()
      posthog?.capture('user_signed_out')
      posthog?.reset()

      this.user = null
      this.profileId = null

      const careerIDStore = useCareerIDStore()
      careerIDStore.resetProfile()
    },

    setHeroEnabled(enabled: boolean) {
      this.features.hero = enabled
      this._persist()
    },

    toggleHeroFeatures() {
      this.features.hero = !this.features.hero
      this._persist()
    },

    setBulletEnhancementEnabled(enabled: boolean) {
      this.features.bulletEnhancement = enabled
      this._persist()
    },

    _persist() {
      if (import.meta.client) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            features: this.features
          }))
        } catch (e) {
          console.warn('Failed to save account preferences:', e)
        }
      }
    }
  }
})
