import { defineStore } from 'pinia'
import type {
  Profile,
  Experience,
  Education,
  Certification,
  ProfileSkill,
  ProfileSocialLink,
  ContactInfo,
  ProfileResponse,
} from '../../shared/types/careerId'

export const useCareerIDStore = defineStore('careerID', {
  state: () => ({

    // Core profile data (flat structure for ease of use)
    profile: null as Profile | null,
    experience: [] as Experience[],
    education: [] as Education[],
    certifications: [] as Certification[],
    profileSkills: [] as ProfileSkill[],
    profileSocialLinks: [] as ProfileSocialLink[],
    contactInfo: null as ContactInfo | null,

    // UI state
    isLoading: false,
    isSaving: false,
    error: null as string | null,
    lastSaved: null as string | null,
  }),

  getters: {
    // Check if profile exists
    isProfileLoaded: (state) => state.profile !== null,

    // Check if contact info exists
    hasContactInfo: (state) => state.contactInfo !== null,

    // Section counts object
    sectionCounts: (state) => ({
      experience: state.experience.length,
      education: state.education.length,
      certifications: state.certifications.length,
      skills: state.profileSkills.length,
      socialLinks: state.profileSocialLinks.length,
    }),

    // Skills grouped by proficiency level
    skillsByProficiency: (state) => {
      const grouped: Record<'beginner' | 'intermediate' | 'advanced' | 'expert', ProfileSkill[]> = {
        beginner: [],
        intermediate: [],
        advanced: [],
        expert: [],
      }

      state.profileSkills.forEach((skill) => {
        grouped[skill.proficiencyLevel].push(skill)
      })

      return grouped
    },

    // Calculate completion percentage based on filled sections
    completionPercentage(): number {
      const sections = [
        this.isProfileLoaded,
        this.hasContactInfo,
        this.sectionCounts.experience > 0,
        this.sectionCounts.education > 0,
        this.sectionCounts.certifications > 0,
        this.sectionCounts.skills > 0,
        this.sectionCounts.socialLinks > 0,
      ]

      const completedSections = sections.filter(Boolean).length
      return Math.round((completedSections / sections.length) * 100)
    },
  },

  actions: {
    // 5.4.4 Error state management
    setError(error: string | null) {
      this.error = error
    },

    clearError() {
      this.error = null
    },

    // 5.4.3 Reset all state (for logout/switching profiles)
    resetProfile() {
      this.profile = null
      this.experience = []
      this.education = []
      this.certifications = []
      this.profileSkills = []
      this.profileSocialLinks = []
      this.contactInfo = null
      this.isLoading = false
      this.isSaving = false
      this.error = null
      this.lastSaved = null
    },

    // 5.4.1 Fetch complete profile with all sections
    async fetchProfile(profileId: string) {
      this.isLoading = true
      this.error = null

      try {
        const response = await $fetch<{ success: boolean; data: ProfileResponse }>(
          `/api/career-id/profile/${profileId}`
        )

        if (!response.success || !response.data) {
          throw new Error('Failed to fetch profile')
        }

        // API returns data already in camelCase format
        const data = response.data

        // Populate all state sections
        this.profile = data.profile
        this.experience = data.experience || []
        this.education = data.education || []
        this.certifications = data.certifications || []
        this.profileSkills = data.profileSkills || []
        this.profileSocialLinks = data.profileSocialLinks || []
        this.contactInfo = data.contactInfo || null
        this.lastSaved = new Date().toISOString()
      } catch (error: any) {
        const errorMessage = error?.data?.message || error?.message || 'Failed to fetch profile'
        this.error = errorMessage
        throw error
      } finally {
        this.isLoading = false
      }
    },

    // 5.4.2 Create new profile shell
    async createProfile(userId: string) {
      this.isSaving = true
      this.error = null

      try {
        const response = await $fetch<{
          success: boolean
          message: string
          data: { profile: Profile }
        }>('/api/career-id/profile', {
          method: 'POST',
          body: { userId },
        })

        if (!response.success || !response.data?.profile) {
          throw new Error('Failed to create profile')
        }

        // API returns data already in camelCase format
        const profile = response.data.profile

        // Set the new profile in state
        this.profile = profile
        this.lastSaved = new Date().toISOString()

        return profile
      } catch (error: any) {
        const errorMessage = error?.data?.message || error?.message || 'Failed to create profile'
        this.error = errorMessage
        throw error
      } finally {
        this.isSaving = false
      }
    },
  },
})