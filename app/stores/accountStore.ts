import { defineStore } from 'pinia'

const STORAGE_KEY = 'jobsearchsage-account'

interface AccountState {
  features: {
    hero: boolean
  }
  // Future: theme, locale, notifications, etc.
}

export const useAccountStore = defineStore('account', {
  state: (): AccountState => ({
    features: {
      hero: false // HERO framework features - disabled by default
    }
  }),

  getters: {
    isHeroEnabled: (state) => state.features.hero
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
