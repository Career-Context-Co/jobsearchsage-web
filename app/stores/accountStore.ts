import { defineStore } from 'pinia'

const STORAGE_KEY = 'jobsearchsage-account'

interface User {
  id: string
  email: string
  name?: string
  avatar?: string
}

interface AccountState {
  user: User | null
  profileId: string | null
  features: {
    hero: boolean
    bulletEnhancement: boolean
  }
  // Future: theme, locale, notifications, etc.
}

export const useAccountStore = defineStore('account', {
  state: (): AccountState => ({
    user: null,
    profileId: null,
    features: {
      hero: false, // HERO framework features - disabled by default
      bulletEnhancement: false // AI bullet enhancement - disabled by default
    }
  }),

  getters: {
    isAuthenticated: (state) => state.user !== null,
    isHeroEnabled: (state) => state.features.hero,
    isBulletEnhancementEnabled: (state) => state.features.bulletEnhancement
  },

  actions: {
    initializeAccount() {
      // Load saved preferences from localStorage
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
     * Hydrate user state from existing Supabase session
     * Called on app init to restore authenticated state
     */
    async hydrateFromSession() {
      const supabaseUser = useSupabaseUser()
      
      if (supabaseUser.value) {
        // User is authenticated, fetch their profile ID
        try {
          const response: any = await $fetch('/api/auth/session', {
            method: 'GET'
          })
          
          if (response?.data?.profileId) {
            this.user = {
              id: supabaseUser.value.id,
              email: supabaseUser.value.email || '',
              name: supabaseUser.value.user_metadata?.name,
              avatar: supabaseUser.value.user_metadata?.avatar_url
            }
            this.profileId = response.data.profileId
          }
        } catch (error) {
          console.warn('Failed to hydrate session:', error)
          // If session fetch fails, just use the Supabase user data
          this.user = {
            id: supabaseUser.value.id,
            email: supabaseUser.value.email || '',
            name: supabaseUser.value.user_metadata?.name,
            avatar: supabaseUser.value.user_metadata?.avatar_url
          }
          this.profileId = null
        }
      }
    },

    /**
     * Sign in with email and password
     */
    async signIn(email: string, password: string) {
      try {
        const response: any = await $fetch('/api/auth/sign-in', {
          method: 'POST',
          body: { email, password }
        })
        
        // Check if response indicates an error (shouldn't happen with non-throwing responses)
        if (!response.success || response.error) {
          throw new Error(response.error?.message || 'Sign in failed')
        }
        
        if (response.data) {
          // Establish client session
          const supabaseClient = useSupabaseClient()
          await supabaseClient.auth.setSession({
            access_token: response.data.session.accessToken,
            refresh_token: response.data.session.refreshToken
          })
          
          // Store user data
          this.user = response.data.user
          this.profileId = response.data.profileId
        }
        
        return response
      } catch (error: any) {
        // Extract error message from various possible structures
        const errorMessage = error?.data?.error?.message || 
                           error?.data?.message || 
                           error?.message || 
                           'Sign in failed'
        
        // Re-throw with clean error message
        throw new Error(errorMessage)
      }
    },

    /**
     * Sign up with email and password
     */
    async signUp(email: string, password: string) {
      try {
        const response: any = await $fetch('/api/auth/sign-up', {
          method: 'POST',
          body: { email, password }
        })
        
        // Check if response indicates an error
        if (!response.success || response.error) {
          throw new Error(response.error?.message || 'Sign up failed')
        }
        
        return response
      } catch (error: any) {
        // Extract error message from various possible structures
        const errorMessage = error?.data?.error?.message || 
                           error?.data?.message || 
                           error?.message || 
                           'Sign up failed'
        
        // Re-throw with clean error message
        throw new Error(errorMessage)
      }
    },

    /**
     * Sign out the current user
     */
    async signOut() {
      try {
        // Call server sign-out endpoint
        await $fetch('/api/auth/sign-out', {
          method: 'POST'
        })
        
        // Sign out client-side
        const supabaseClient = useSupabaseClient()
        await supabaseClient.auth.signOut()
        
        // Clear user state
        this.user = null
        this.profileId = null
        
        // Reset profile data
        const careerIDStore = useCareerIDStore()
        careerIDStore.resetProfile()
      } catch (error) {
        console.error('Sign out failed:', error)
        throw error
      }
    },

    /**
     * Enable or disable hero features (beta)
     */
    setHeroEnabled(enabled: boolean) {
      this.features.hero = enabled
      this._persist()
    },

    /**
     * Toggle hero features on/off
     */
    toggleHeroFeatures() {
      this.features.hero = !this.features.hero
      this._persist()
    },

    /**
     * Enable or disable AI bullet enhancement
     */
    setBulletEnhancementEnabled(enabled: boolean) {
      this.features.bulletEnhancement = enabled
      this._persist()
    },

    /**
     * Persist account preferences to localStorage
     */
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
