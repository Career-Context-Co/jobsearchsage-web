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
  HeroStory
} from '#shared/types/careerId'
import type {
  QuestionGroup,
  ContextStory,
  ContextObject,
  ResumeBullet,
  GatherContextResponse,
  EnhanceAchievementsResponse
} from '#shared/types/enhancement'
import type { HeroMoment } from '@/types/heroMoments'

type HeroMomentApiResponse = {
  id: string | number
  profileId: string
  title: string
  rawNotes: string
  sourceExperienceId?: string | number | null
  discoverySessionId?: number | null
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
  convertedAt?: string | null
  convertedStoryId?: string | number | null
}

type HeroStoryApiResponse = HeroStory & {
  internalId?: number | null
}

const mapHeroMoment = (moment: HeroMomentApiResponse): HeroMoment => ({
  id: moment.id,
  profile_id: moment.profileId,
  title: moment.title,
  raw_notes: moment.rawNotes,
  source_experience_id: moment.sourceExperienceId ?? null,
  discovery_session_id: moment.discoverySessionId ?? null,
  created_at: moment.createdAt,
  updated_at: moment.updatedAt,
  deleted_at: moment.deletedAt ?? null,
  converted_at: moment.convertedAt ?? null,
  converted_story_id: moment.convertedStoryId ?? null
})

const sortMomentsByDateDesc = (moments: HeroMoment[]) => {
  return [...moments].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
}

const sortStories = (stories: HeroStory[]) => {
  return [...stories].sort((a, b) => {
    if (a.displayOrder !== b.displayOrder) {
      return a.displayOrder - b.displayOrder
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
}

export const useCareerIDStore = defineStore('careerID', {
  state: () => ({
    profileId: null as string | null,
    userId: null as string | null,
    // Core profile data (flat structure for ease of use)
    profile: null as Profile | null,
    experience: [] as Experience[],
    education: [] as Education[],
    certifications: [] as Certification[],
    profileSkills: [] as ProfileSkill[],
    profileSocialLinks: [] as ProfileSocialLink[],
    contactInfo: null as ContactInfo | null,
    heroMoments: [] as HeroMoment[],
    heroStories: [] as HeroStory[],

    // UI state
    isLoading: false,
    isSaving: false,
    error: null as string | null,
    lastSaved: null as string | null,

    // Resume extraction state
    isExtracting: false,
    hasPerformedExtraction: false,
    extractionError: null as string | null,
    extractionResult: null as {
      contactInfo: Partial<ContactInfo> | null
      socialLinks: Array<{ platformId: number, url: string, displayOrder: number }>
      experience: Array<Omit<Experience, 'id' | 'profileId' | 'createdAt' | 'updatedAt'>>
      education: Array<Omit<Education, 'id' | 'profileId' | 'createdAt' | 'updatedAt'>>
      profileSkills: string[]
      certifications: Array<Omit<Certification, 'id' | 'profileId' | 'createdAt' | 'updatedAt'>>
    } | null,

    // Achievement enhancement state
    isEnhancingExperience: false,

    // Context enhancement API state (component manages flow state)
    isGeneratingQuestions: false,
    isGeneratingBullets: false
  }),

  getters: {
    // Check if profile exists
    isProfileLoaded: state => state.profile !== null,

    // Check if contact info exists
    hasContactInfo: state => state.contactInfo !== null,

    // Section counts object
    sectionCounts: state => ({
      experience: state.experience.length,
      education: state.education.length,
      certifications: state.certifications.length,
      skills: state.profileSkills.length,
      socialLinks: state.profileSocialLinks.length
    }),

    unconvertedMomentsCount: state => state.heroMoments.length,

    // Skills grouped by proficiency level
    skillsByProficiency: (state) => {
      const grouped: Record<'beginner' | 'intermediate' | 'advanced' | 'expert', ProfileSkill[]> = {
        beginner: [],
        intermediate: [],
        advanced: [],
        expert: []
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
        this.sectionCounts.socialLinks > 0
      ]

      const completedSections = sections.filter(Boolean).length
      return Math.round((completedSections / sections.length) * 100)
    }
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
      this.heroMoments = []
      this.heroStories = []
      this.isLoading = false
      this.isSaving = false
      this.error = null
      this.lastSaved = null
    },

    // Fetch profile for the currently authenticated user via /me endpoint.
    // Uses jss_user_id server-side — no client-supplied profileId needed.
    // Throws on error; throws with status 404 if no profile exists yet.
    async fetchProfileByUser() {
      this.isLoading = true
      this.error = null

      try {
        const response = await $fetch<{ success: boolean, data: ProfileResponse }>(
          '/api/career-id/profile/me'
        )

        if (!response.success || !response.data) {
          throw new Error('Failed to fetch profile')
        }

        const data = response.data
        this.profile = data.profile
        this.profileId = data.profile.id
        this.experience = data.experience || []
        this.education = data.education || []
        this.certifications = data.certifications || []
        this.profileSkills = data.profileSkills || []
        this.profileSocialLinks = data.profileSocialLinks || []
        this.contactInfo = data.contactInfo || null
        this.lastSaved = new Date().toISOString()

        // Sync profileId back to accountStore so sub-pages and session stay consistent
        useAccountStore().profileId = data.profile.id
      } catch (error: any) {
        this.error = getApiErrorMessage(error, 'Failed to fetch profile')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    // 5.4.1 Fetch complete profile with all sections
    async fetchProfile(profileId: string) {
      this.isLoading = true
      this.error = null

      try {
        const response = await $fetch<{ success: boolean, data: ProfileResponse }>(
          `/api/career-id/profile/${profileId}`
        )

        if (!response.success || !response.data) {
          throw new Error('Failed to fetch profile')
        }

        // API returns data already in camelCase format
        const data = response.data

        // Populate all state sections
        this.profile = data.profile
        this.profileId = data.profile.id
        this.experience = data.experience || []
        this.education = data.education || []
        this.certifications = data.certifications || []
        this.profileSkills = data.profileSkills || []
        this.profileSocialLinks = data.profileSocialLinks || []
        this.contactInfo = data.contactInfo || null
        this.lastSaved = new Date().toISOString()
      } catch (error: any) {
        this.error = getApiErrorMessage(error, 'Failed to fetch profile')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    // 5.4.2 Create new profile shell
    async createProfile() {
      this.isSaving = true
      this.error = null

      try {
        const response = await $fetch<{
          success: boolean
          message: string
          data: { profile: Profile }
        }>('/api/career-id/profile', {
          method: 'POST'
        })

        if (!response.success || !response.data?.profile) {
          throw new Error('Failed to create profile')
        }

        // API returns data already in camelCase format
        const profile = response.data.profile

        // Set the new profile in state
        this.profile = profile
        this.profileId = profile.id
        this.lastSaved = new Date().toISOString()

        // Sync profileId to accountStore so menu/settings stay consistent
        useAccountStore().profileId = profile.id

        return profile
      } catch (error: any) {
        this.error = getApiErrorMessage(error, 'Failed to create profile')
        throw error
      } finally {
        this.isSaving = false
      }
    },

    async updateProfile(profileId: string, data: { completionStatus?: 'incomplete' | 'verified' | 'complete' }) {
      this.isSaving = true
      this.error = null

      try {
        const response = await $fetch<{
          success: boolean
          message: string
          data: Profile
        }>(`/api/career-id/profile/${profileId}`, {
          method: 'PATCH',
          body: data
        })

        if (!response.success || !response.data) {
          throw new Error('Failed to update profile')
        }

        // API returns data already in camelCase format
        const profile = response.data

        // Update the profile in state
        this.profile = profile
        this.lastSaved = new Date().toISOString()

        return profile
      } catch (error: any) {
        this.error = getApiErrorMessage(error, 'Failed to update profile')
        throw error
      } finally {
        this.isSaving = false
      }
    },

    // 5.6.1 Add new education entry
    async addEducation(data: Omit<Education, 'id' | 'profileId' | 'createdAt' | 'updatedAt'>) {
      if (!this.profile?.id) {
        throw new Error('No profile loaded')
      }

      this.isSaving = true
      this.error = null

      try {
        const response = await $fetch<{
          success: boolean
          message: string
          data: Education
        }>(`/api/career-id/profile/${this.profile.id}/education`, {
          method: 'POST',
          body: data
        })

        if (!response.success || !response.data) {
          throw new Error('Failed to add education')
        }

        // API returns data already in camelCase format
        const education = response.data

        // Add to local state
        this.education.push(education)
        this.lastSaved = new Date().toISOString()

        return education
      } catch (error: any) {
        this.error = getApiErrorMessage(error, 'Failed to add education')
        throw error
      } finally {
        this.isSaving = false
      }
    },

    // 5.6.2 Update existing education entry
    async updateEducation(id: number, data: Partial<Omit<Education, 'id' | 'profileId' | 'createdAt' | 'updatedAt'>>) {
      if (!this.profile?.id) {
        throw new Error('No profile loaded')
      }

      this.isSaving = true
      this.error = null

      try {
        const response = await $fetch<{
          success: boolean
          message: string
          data: Education
        }>(`/api/career-id/profile/${this.profile.id}/education/${id}`, {
          method: 'PATCH',
          body: data
        })

        if (!response.success || !response.data) {
          throw new Error('Failed to update education')
        }

        // API returns data already in camelCase format
        const updatedEducation = response.data

        // Update in local state
        const index = this.education.findIndex(edu => edu.id === id)
        if (index !== -1) {
          this.education[index] = updatedEducation
        }
        this.lastSaved = new Date().toISOString()

        return updatedEducation
      } catch (error: any) {
        this.error = getApiErrorMessage(error, 'Failed to update education')
        throw error
      } finally {
        this.isSaving = false
      }
    },

    // 5.6.3 Delete education entry
    async deleteEducation(id: number) {
      if (!this.profile?.id) {
        throw new Error('No profile loaded')
      }

      this.isSaving = true
      this.error = null

      try {
        const response = await $fetch<{
          success: boolean
          message: string
        }>(`/api/career-id/profile/${this.profile.id}/education/${id}`, {
          method: 'DELETE'
        })

        if (!response.success) {
          throw new Error('Failed to delete education')
        }

        // Remove from local state
        this.education = this.education.filter(edu => edu.id !== id)
        this.lastSaved = new Date().toISOString()
      } catch (error: any) {
        this.error = getApiErrorMessage(error, 'Failed to delete education')
        throw error
      } finally {
        this.isSaving = false
      }
    },

    // 5.7.1 Add new certification entry
    async addCertification(data: Omit<Certification, 'id' | 'profileId' | 'createdAt' | 'updatedAt'>) {
      if (!this.profile?.id) {
        throw new Error('No profile loaded')
      }

      this.isSaving = true
      this.error = null

      try {
        const response = await $fetch<{
          success: boolean
          message: string
          data: Certification
        }>(`/api/career-id/profile/${this.profile.id}/certifications`, {
          method: 'POST',
          body: data
        })

        if (!response.success || !response.data) {
          throw new Error('Failed to add certification')
        }

        // API returns data already in camelCase format
        const certification = response.data

        // Add to local state
        this.certifications.push(certification)
        this.lastSaved = new Date().toISOString()

        return certification
      } catch (error: any) {
        this.error = getApiErrorMessage(error, 'Failed to add certification')
        throw error
      } finally {
        this.isSaving = false
      }
    },

    // 5.7.2 Update existing certification entry
    async updateCertification(id: number, data: Partial<Omit<Certification, 'id' | 'profileId' | 'createdAt' | 'updatedAt'>>) {
      if (!this.profile?.id) {
        throw new Error('No profile loaded')
      }

      this.isSaving = true
      this.error = null

      try {
        const response = await $fetch<{
          success: boolean
          message: string
          data: Certification
        }>(`/api/career-id/profile/${this.profile.id}/certifications/${id}`, {
          method: 'PATCH',
          body: data
        })

        if (!response.success || !response.data) {
          throw new Error('Failed to update certification')
        }

        // API returns data already in camelCase format
        const updatedCertification = response.data

        // Update in local state
        const index = this.certifications.findIndex(cert => cert.id === id)
        if (index !== -1) {
          this.certifications[index] = updatedCertification
        }
        this.lastSaved = new Date().toISOString()

        return updatedCertification
      } catch (error: any) {
        this.error = getApiErrorMessage(error, 'Failed to update certification')
        throw error
      } finally {
        this.isSaving = false
      }
    },

    // 5.7.3 Delete certification entry
    async deleteCertification(id: number) {
      if (!this.profile?.id) {
        throw new Error('No profile loaded')
      }

      this.isSaving = true
      this.error = null

      try {
        const response = await $fetch<{
          success: boolean
          message: string
        }>(`/api/career-id/profile/${this.profile.id}/certifications/${id}`, {
          method: 'DELETE'
        })

        if (!response.success) {
          throw new Error('Failed to delete certification')
        }

        // Remove from local state
        this.certifications = this.certifications.filter(cert => cert.id !== id)
        this.lastSaved = new Date().toISOString()
      } catch (error: any) {
        this.error = getApiErrorMessage(error, 'Failed to delete certification')
        throw error
      } finally {
        this.isSaving = false
      }
    },

    // 5.9.1 Create contact info entry
    async createContactInfo(data: Omit<ContactInfo, 'id' | 'internalId' | 'profileId' | 'createdAt' | 'updatedAt'>) {
      if (!this.profile?.id) {
        throw new Error('No profile loaded. Please create a profile first.')
      }

      this.isSaving = true
      this.error = null

      try {
        // Clean phone number before sending (remove any formatting)
        const cleanedData = {
          ...data,
          phone: data.phone ? data.phone.replace(/[\s\-\(\)\.]/g, '') : null
        }

        const response = await $fetch<{
          success: boolean
          message: string
          data: ContactInfo
        }>(`/api/career-id/profile/${this.profile.id}/contact`, {
          method: 'POST',
          body: cleanedData
        })

        if (!response.success || !response.data) {
          throw new Error('Failed to create contact info')
        }

        // API returns data already in camelCase format
        const contactInfo = response.data

        // Set in local state
        this.contactInfo = contactInfo
        this.lastSaved = new Date().toISOString()

        return contactInfo
      } catch (error: any) {
        this.error = getApiErrorMessage(error, 'Failed to create contact info')
        throw error
      } finally {
        this.isSaving = false
      }
    },

    // 5.9.2 Update existing contact info entry
    async updateContactInfo(id: string, data: Partial<Omit<ContactInfo, 'id' | 'internalId' | 'profileId' | 'createdAt' | 'updatedAt'>>) {
      if (!this.profile?.id) {
        throw new Error('No profile loaded')
      }

      this.isSaving = true
      this.error = null

      try {
        // Clean phone number before sending (remove any formatting)
        const cleanedData = {
          ...data,
          phone: data.phone ? data.phone.replace(/[\s\-\(\)\.]/g, '') : data.phone
        }

        const response = await $fetch<{
          success: boolean
          message: string
          data: ContactInfo
        }>(`/api/career-id/profile/${this.profile.id}/contact/${id}`, {
          method: 'PATCH',
          body: cleanedData
        })

        if (!response.success || !response.data) {
          throw new Error('Failed to update contact info')
        }

        // API returns data already in camelCase format
        const updatedContactInfo = response.data

        // Update in local state
        this.contactInfo = updatedContactInfo
        this.lastSaved = new Date().toISOString()

        return updatedContactInfo
      } catch (error: any) {
        this.error = getApiErrorMessage(error, 'Failed to update contact info')
        throw error
      } finally {
        this.isSaving = false
      }
    },

    // 5.9.3 Delete contact info entry
    async deleteContactInfo(id: string) {
      if (!this.profile?.id) {
        throw new Error('No profile loaded')
      }

      this.isSaving = true
      this.error = null

      try {
        const response = await $fetch<{
          success: boolean
          message: string
        }>(`/api/career-id/profile/${this.profile.id}/contact/${id}`, {
          method: 'DELETE'
        })

        if (!response.success) {
          throw new Error('Failed to delete contact info')
        }

        // Remove from local state
        this.contactInfo = null
        this.lastSaved = new Date().toISOString()
      } catch (error: any) {
        this.error = getApiErrorMessage(error, 'Failed to delete contact info')
        throw error
      } finally {
        this.isSaving = false
      }
    },

    // 5.8.1 Save skills — atomically replaces the full skills array (one PUT)
    async saveSkills(skills: ProfileSkill[]) {
      if (!this.profile?.id) {
        throw new Error('No profile loaded')
      }

      this.isSaving = true
      this.error = null

      try {
        // Strip transient UI flags before persisting
        const skillsToSave = skills.map(({ isExtracted: _, ...skill }) => skill)

        const response = await $fetch<{
          success: boolean
          message: string
          data: ProfileSkill[]
        }>(`/api/career-id/profile/${this.profile.id}/skills`, {
          method: 'PUT',
          body: skillsToSave
        })

        if (!response.success || !response.data) {
          throw new Error('Failed to save skills')
        }

        this.profileSkills = response.data
        this.lastSaved = new Date().toISOString()

        return response.data
      } catch (error: any) {
        this.error = getApiErrorMessage(error, 'Failed to save skills')
        throw error
      } finally {
        this.isSaving = false
      }
    },

    // 5.8.2 Search skills for autocomplete
    async searchSkills(query: string) {
      try {
        const response = await $fetch<{
          success: boolean
          data: Array<{
            id: number
            skill_name: string
            category: string
            description?: string
          }>
        }>(`/api/reference/skills/search?q=${encodeURIComponent(query)}`)

        if (!response.success) {
          throw new Error('Failed to search skills')
        }

        return response.data
      } catch (error: any) {
        this.error = getApiErrorMessage(error, 'Failed to search skills')
        throw error
      }
    },

    // 5.10.1 Add social links (bulk operation)
    async addSocialLinks(links: Array<Omit<ProfileSocialLink, 'id' | 'profileId' | 'platformNameCache' | 'createdAt' | 'updatedAt'>>) {
      if (!this.profile?.id) {
        throw new Error('No profile loaded. Please create a profile first.')
      }

      this.isSaving = true
      this.error = null

      try {
        const response = await $fetch<{
          success: boolean
          message: string
          data: ProfileSocialLink[]
        }>(`/api/career-id/profile/${this.profile.id}/socials`, {
          method: 'POST',
          body: links
        })

        if (!response.success || !response.data) {
          throw new Error('Failed to add social links')
        }

        // API returns data already in camelCase format
        const addedLinks = response.data

        // Remove old extracted links (without IDs) before adding new ones
        // This prevents duplicates when saving extracted social links
        this.profileSocialLinks = this.profileSocialLinks.filter(link => link.id)

        // Add the newly created links with IDs
        this.profileSocialLinks.push(...addedLinks)
        this.lastSaved = new Date().toISOString()

        return addedLinks
      } catch (error: any) {
        this.error = getApiErrorMessage(error, 'Failed to add social links')
        throw error
      } finally {
        this.isSaving = false
      }
    },

    // 5.10.2 Update social link
    async updateSocialLink(id: number, data: Partial<Pick<ProfileSocialLink, 'url' | 'displayOrder'>>) {
      if (!this.profile?.id) {
        throw new Error('No profile loaded')
      }

      this.isSaving = true
      this.error = null

      try {
        const response = await $fetch<{
          success: boolean
          message: string
          data: ProfileSocialLink
        }>(`/api/career-id/profile/${this.profile.id}/socials/${id}`, {
          method: 'PATCH',
          body: data
        })

        if (!response.success || !response.data) {
          throw new Error('Failed to update social link')
        }

        // API returns data already in camelCase format
        const updatedLink = response.data

        // Update in local state
        const index = this.profileSocialLinks.findIndex(link => link.id === id)
        if (index !== -1) {
          this.profileSocialLinks[index] = updatedLink
        }
        this.lastSaved = new Date().toISOString()

        return updatedLink
      } catch (error: any) {
        this.error = getApiErrorMessage(error, 'Failed to update social link')
        throw error
      } finally {
        this.isSaving = false
      }
    },

    // 5.10.3 Delete social link
    async deleteSocialLink(id: number) {
      if (!this.profile?.id) {
        throw new Error('No profile loaded')
      }

      this.isSaving = true
      this.error = null

      try {
        const response = await $fetch<{
          success: boolean
          message: string
        }>(`/api/career-id/profile/${this.profile.id}/socials/${id}`, {
          method: 'DELETE'
        })

        if (!response.success) {
          throw new Error('Failed to delete social link')
        }

        // Remove from local state
        this.profileSocialLinks = this.profileSocialLinks.filter(link => link.id !== id)
        this.lastSaved = new Date().toISOString()
      } catch (error: any) {
        this.error = getApiErrorMessage(error, 'Failed to delete social link')
        throw error
      } finally {
        this.isSaving = false
      }
    },

    // 5.10.4 Fetch social platforms for dropdown
    async fetchSocialPlatforms() {
      try {
        const response = await $fetch<{
          success: boolean
          data: Array<{
            id: number
            platform_name: string
            display_name: string
            icon?: string
            base_url?: string
          }>
        }>('/api/reference/social-platforms')

        if (!response.success) {
          throw new Error('Failed to fetch social platforms')
        }

        return response.data
      } catch (error: any) {
        this.error = getApiErrorMessage(error, 'Failed to fetch social platforms')
        throw error
      }
    },

    // Hero stories CRUD actions
    async fetchStories(profileId: string) {
      if (this.heroStories.length > 0) {
        return this.heroStories
      }

      this.isLoading = true
      this.error = null

      try {
        const response = await $fetch<{
          success: boolean
          data: HeroStoryApiResponse[]
        }>(`/api/career-id/profile/${profileId}/hero-stories`)

        if (!response.success || !response.data) {
          throw new Error('Failed to fetch stories')
        }

        const activeStories = response.data.filter(story => !story.isDeleted && !story.deletedAt)
        this.heroStories = sortStories(activeStories)

        return this.heroStories
      } catch (error: any) {
        this.error = getApiErrorMessage(error, 'Failed to fetch stories')
        console.error('fetchStories failed', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async createStory(
      profileId: string,
      payload: {
        title: string
        hurdleProblem?: string | null
        hurdleScope?: string | null
        hurdleStakes?: string | null
        expectationRole?: string | null
        expectationGoals?: string | null
        expectationConstraints?: string | null
        responseActions?: string | null
        responseTools?: string | null
        responseChallenges?: string | null
        outcomeDeliverable?: string | null
        outcomeMetrics?: string | null
        outcomeImpact?: string | null
        sourceExperienceId?: number | null
        displayOrder?: number
      }
    ) {
      this.isSaving = true
      this.error = null

      try {
        const response = await $fetch<{
          success: boolean
          message: string
          data: HeroStoryApiResponse
        }>(`/api/career-id/profile/${profileId}/hero-stories`, {
          method: 'POST',
          body: payload
        })

        if (!response.success || !response.data) {
          throw new Error('Failed to create story')
        }

        const createdStory = response.data
        this.heroStories = sortStories([createdStory, ...this.heroStories.filter(story => story.id !== createdStory.id)])
        this.lastSaved = new Date().toISOString()

        return createdStory
      } catch (error: any) {
        this.error = getApiErrorMessage(error, 'Failed to create story')
        console.error('createStory failed', error)
        throw error
      } finally {
        this.isSaving = false
      }
    },

    async updateStory(
      profileId: string,
      storyId: string,
      payload: Partial<{
        title: string
        hurdleProblem?: string | null
        hurdleScope?: string | null
        hurdleStakes?: string | null
        expectationRole?: string | null
        expectationGoals?: string | null
        expectationConstraints?: string | null
        responseActions?: string | null
        responseTools?: string | null
        responseChallenges?: string | null
        outcomeDeliverable?: string | null
        outcomeMetrics?: string | null
        outcomeImpact?: string | null
        sourceExperienceId?: number | null
        displayOrder?: number
      }>
    ) {
      this.isSaving = true
      this.error = null

      try {
        const response = await $fetch<{
          success: boolean
          message: string
          data: HeroStoryApiResponse
        }>(`/api/career-id/profile/${profileId}/hero-stories/${storyId}`, {
          method: 'PATCH',
          body: payload
        })

        if (!response.success || !response.data) {
          throw new Error('Failed to update story')
        }

        const updatedStory = response.data
        if (updatedStory.isDeleted || updatedStory.deletedAt) {
          this.heroStories = this.heroStories.filter(story => story.id !== updatedStory.id)
        } else {
          const index = this.heroStories.findIndex(story => story.id === updatedStory.id)
          if (index !== -1) {
            this.heroStories[index] = updatedStory
          } else {
            this.heroStories = [updatedStory, ...this.heroStories]
          }
          this.heroStories = sortStories(this.heroStories)
        }

        this.lastSaved = new Date().toISOString()

        return updatedStory
      } catch (error: any) {
        this.error = getApiErrorMessage(error, 'Failed to update story')
        console.error('updateStory failed', error)
        throw error
      } finally {
        this.isSaving = false
      }
    },

    async deleteStory(profileId: string, storyId: string) {
      this.isSaving = true
      this.error = null

      try {
        const response = await $fetch<{
          success: boolean
          message: string
        }>(`/api/career-id/profile/${profileId}/hero-stories/${storyId}`, {
          method: 'DELETE'
        })

        if (!response.success) {
          throw new Error('Failed to delete story')
        }

        this.heroStories = this.heroStories.filter(story => story.id !== storyId)
        this.lastSaved = new Date().toISOString()

        return response
      } catch (error: any) {
        this.error = getApiErrorMessage(error, 'Failed to delete story')
        console.error('deleteStory failed', error)
        throw error
      } finally {
        this.isSaving = false
      }
    },

    // Hero moments CRUD actions
    async fetchMoments(profileId: string) {
      if (this.heroMoments.length > 0) {
        return this.heroMoments
      }

      this.isLoading = true
      this.error = null

      try {
        const response = await $fetch<{
          success: boolean
          data: HeroMomentApiResponse[]
        }>(`/api/career-id/profile/${profileId}/hero-moments`)

        if (!response.success || !response.data) {
          throw new Error('Failed to fetch moments')
        }

        const mappedMoments = response.data.map(mapHeroMoment)
        this.heroMoments = sortMomentsByDateDesc(
          mappedMoments.filter(moment => !moment.converted_at && !moment.deleted_at)
        )

        return this.heroMoments
      } catch (error: any) {
        this.error = getApiErrorMessage(error, 'Failed to fetch moments')
        console.error('fetchMoments failed', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async createMoments(
      profileId: string,
      momentsData: Array<{
        title: string
        rawNotes: string
        sourceExperienceId?: string | number | null
        discoverySessionId?: number | null
      }>
    ) {
      this.isSaving = true
      this.error = null

      try {
        const response = await $fetch<{
          success: boolean
          message: string
          data: HeroMomentApiResponse[]
        }>(`/api/career-id/profile/${profileId}/hero-moments`, {
          method: 'POST',
          body: momentsData
        })

        if (!response.success || !response.data) {
          throw new Error('Failed to create moments')
        }

        const createdMoments = response.data.map(mapHeroMoment)
        const unconverted = createdMoments.filter(moment => !moment.converted_at && !moment.deleted_at)
        this.heroMoments = sortMomentsByDateDesc([...unconverted, ...this.heroMoments])
        this.lastSaved = new Date().toISOString()

        return createdMoments
      } catch (error: any) {
        this.error = getApiErrorMessage(error, 'Failed to create moments')
        console.error('createMoments failed', error)
        throw error
      } finally {
        this.isSaving = false
      }
    },

    async updateMoment(
      profileId: string,
      momentId: string | number,
      momentData: {
        title?: string
        rawNotes?: string
        sourceExperienceId?: string | number | null
      }
    ) {
      this.isSaving = true
      this.error = null

      try {
        const response = await $fetch<{
          success: boolean
          message: string
          data: HeroMomentApiResponse
        }>(`/api/career-id/profile/${profileId}/hero-moments/${momentId}`, {
          method: 'PATCH',
          body: momentData
        })

        if (!response.success || !response.data) {
          throw new Error('Failed to update moment')
        }

        const updatedMoment = mapHeroMoment(response.data)
        const index = this.heroMoments.findIndex(moment => moment.id === updatedMoment.id)

        if (updatedMoment.converted_at || updatedMoment.deleted_at) {
          this.heroMoments = this.heroMoments.filter(moment => moment.id !== updatedMoment.id)
        } else if (index !== -1) {
          this.heroMoments[index] = updatedMoment
        } else {
          this.heroMoments = sortMomentsByDateDesc([updatedMoment, ...this.heroMoments])
        }

        this.lastSaved = new Date().toISOString()

        return updatedMoment
      } catch (error: any) {
        this.error = getApiErrorMessage(error, 'Failed to update moment')
        console.error('updateMoment failed', error)
        throw error
      } finally {
        this.isSaving = false
      }
    },

    async deleteMoment(profileId: string, momentId: string | number) {
      this.isSaving = true
      this.error = null

      try {
        const response = await $fetch<{
          success: boolean
          message: string
        }>(`/api/career-id/profile/${profileId}/hero-moments/${momentId}`, {
          method: 'DELETE'
        })

        if (!response.success) {
          throw new Error('Failed to delete moment')
        }

        this.heroMoments = this.heroMoments.filter(moment => moment.id !== momentId)
        this.lastSaved = new Date().toISOString()

        return response
      } catch (error: any) {
        this.error = getApiErrorMessage(error, 'Failed to delete moment')
        console.error('deleteMoment failed', error)
        throw error
      } finally {
        this.isSaving = false
      }
    },

    // 5.5.1 Add new experience entry
    async addExperience(data: Omit<Experience, 'id' | 'profileId' | 'createdAt' | 'updatedAt'>) {
      if (!this.profile?.id) {
        throw new Error('No profile loaded')
      }

      this.isSaving = true
      this.error = null

      try {
        const response = await $fetch<{
          success: boolean
          message: string
          data: Experience
        }>(`/api/career-id/profile/${this.profile.id}/experience`, {
          method: 'POST',
          body: data
        })

        if (!response.success || !response.data) {
          throw new Error('Failed to add experience')
        }

        // API returns data already in camelCase format
        const experience = response.data

        // Add to local state
        this.experience.push(experience)
        this.lastSaved = new Date().toISOString()

        return experience
      } catch (error: any) {
        this.error = getApiErrorMessage(error, 'Failed to add experience')
        throw error
      } finally {
        this.isSaving = false
      }
    },

    // 5.5.2 Update existing experience entry
    async updateExperience(id: number, data: Partial<Omit<Experience, 'id' | 'profileId' | 'createdAt' | 'updatedAt'>>) {
      if (!this.profile?.id) {
        throw new Error('No profile loaded')
      }

      this.isSaving = true
      this.error = null

      try {
        const response = await $fetch<{
          success: boolean
          message: string
          data: Experience
        }>(`/api/career-id/profile/${this.profile.id}/experience/${id}`, {
          method: 'PATCH',
          body: data
        })

        if (!response.success || !response.data) {
          throw new Error('Failed to update experience')
        }

        // API returns data already in camelCase format
        const updatedExperience = response.data

        // Update in local state
        const index = this.experience.findIndex(exp => exp.id === id)
        if (index !== -1) {
          this.experience[index] = updatedExperience
        }
        this.lastSaved = new Date().toISOString()

        return updatedExperience
      } catch (error: any) {
        this.error = getApiErrorMessage(error, 'Failed to update experience')
        throw error
      } finally {
        this.isSaving = false
      }
    },

    // 5.5.3 Delete experience entry
    async deleteExperience(id: number) {
      if (!this.profile?.id) {
        throw new Error('No profile loaded')
      }

      this.isSaving = true
      this.error = null

      try {
        const response = await $fetch<{
          success: boolean
          message: string
        }>(`/api/career-id/profile/${this.profile.id}/experience/${id}`, {
          method: 'DELETE'
        })

        if (!response.success) {
          throw new Error('Failed to delete experience')
        }

        // Remove from local state
        this.experience = this.experience.filter(exp => exp.id !== id)
        this.lastSaved = new Date().toISOString()
      } catch (error: any) {
        this.error = getApiErrorMessage(error, 'Failed to delete experience')
        throw error
      } finally {
        this.isSaving = false
      }
    },

    // Resume extraction actions
    async extractResumeData(file: File) {
      this.isExtracting = true
      this.extractionError = null
      this.extractionResult = null

      try {
        // Create FormData for multipart upload
        const formData = new FormData()
        formData.append('file', file)

        // Call the extraction endpoint
        const response = await $fetch<{
          success: boolean
          message: string
          data: {
            contactInfo: Partial<ContactInfo> | null
            socialLinks: Array<{ platformId: number, url: string, displayOrder: number }>
            experience: Array<Omit<Experience, 'id' | 'profileId' | 'createdAt' | 'updatedAt'>>
            education: Array<Omit<Education, 'id' | 'profileId' | 'createdAt' | 'updatedAt'>>
            profileSkills: string[]
            certifications: Array<Omit<Certification, 'id' | 'profileId' | 'createdAt' | 'updatedAt'>>
          }
          metadata: {
            filename: string
            fileSize: number
            extractionTimeMs: number
            extractedCounts: {
              experience: number
              education: number
              skills: number
              certifications: number
            }
          }
        }>('/api/career-id/resume/extract', {
          method: 'POST',
          body: formData
        })

        if (!response.success || !response.data) {
          throw new Error('Failed to extract resume data')
        }

        // Store extraction result
        this.extractionResult = response.data
        this.hasPerformedExtraction = true

        return response
      } catch (error: any) {
        this.extractionError = getApiErrorMessage(error, 'Failed to extract resume data')
        throw error
      } finally {
        this.isExtracting = false
      }
    },

    applyExtractionToProfile() {
      if (!this.extractionResult) {
        throw new Error('No extraction result to apply')
      }

      const result = this.extractionResult

      // Apply contact info (overwrite with extracted data and mark as extracted)
      if (result.contactInfo) {
        const existing = this.contactInfo || {} as ContactInfo
        const extracted = result.contactInfo

        // Helper to check if a value is different (only consider non-empty extracted values)
        const isDifferent = (extractedVal: any, existingVal: any): boolean => {
          // If extracted value is empty/null/undefined, not different
          if (extractedVal === null || extractedVal === undefined || extractedVal === '') return false
          // If array, check if empty
          if (Array.isArray(extractedVal) && extractedVal.length === 0) return false
          // If existing value is empty/null/undefined and extracted has value, it's different
          if (existingVal === null || existingVal === undefined || existingVal === '') return true
          // If both have values, compare them (normalize strings for comparison)
          if (typeof extractedVal === 'string' && typeof existingVal === 'string') {
            return extractedVal.trim().toLowerCase() !== existingVal.trim().toLowerCase()
          }
          // For arrays (websites), compare contents
          if (Array.isArray(extractedVal) && Array.isArray(existingVal)) {
            if (extractedVal.length !== existingVal.length) return true
            return extractedVal.some((val, idx) => val !== existingVal[idx])
          }
          return extractedVal !== existingVal
        }

        // Determine which fields are actually different
        const extractedFields = {
          firstName: extracted.firstName ? isDifferent(extracted.firstName, existing.firstName) : false,
          lastName: extracted.lastName ? isDifferent(extracted.lastName, existing.lastName) : false,
          email: extracted.email ? isDifferent(extracted.email, existing.email) : false,
          phone: extracted.phone ? isDifferent(extracted.phone, existing.phone) : false,
          jobTitle: extracted.jobTitle ? isDifferent(extracted.jobTitle, existing.jobTitle) : false,
          city: extracted.city ? isDifferent(extracted.city, existing.city) : false,
          stateRegion: extracted.stateRegion ? isDifferent(extracted.stateRegion, existing.stateRegion) : false,
          country: extracted.country ? isDifferent(extracted.country, existing.country) : false,
          postalCode: extracted.postalCode ? isDifferent(extracted.postalCode, existing.postalCode) : false,
          summary: extracted.summary ? isDifferent(extracted.summary, existing.summary) : false,
          websites: extracted.websites && extracted.websites.length > 0 ? isDifferent(extracted.websites, existing.websites) : false
        }

        // Check if any field is actually extracted (different)
        const hasAnyExtractedFields = Object.values(extractedFields).some(val => val === true)

        // Merge extracted values with existing, preferring extracted when available
        this.contactInfo = {
          // Preserve database fields if they exist
          id: existing.id,
          internalId: existing.internalId,
          profileId: existing.profileId,
          createdAt: existing.createdAt,
          updatedAt: existing.updatedAt,
          // Use extracted values (overwrite existing)
          firstName: extracted.firstName ?? existing.firstName ?? '',
          lastName: extracted.lastName ?? existing.lastName ?? '',
          email: extracted.email ?? existing.email ?? '',
          phone: extracted.phone ?? existing.phone ?? null,
          jobTitle: extracted.jobTitle ?? existing.jobTitle ?? null,
          city: extracted.city ?? existing.city ?? null,
          stateRegion: extracted.stateRegion ?? existing.stateRegion ?? null,
          country: extracted.country ?? existing.country ?? null,
          postalCode: extracted.postalCode ?? existing.postalCode ?? null,
          summary: extracted.summary ?? existing.summary ?? null,
          websites: extracted.websites ?? existing.websites ?? [],
          willingToRelocate: extracted.willingToRelocate ?? existing.willingToRelocate ?? false,
          isExtracted: hasAnyExtractedFields,
          extractedFields: hasAnyExtractedFields ? extractedFields : undefined
        } as ContactInfo
      }

      // Merge experience - keep both old and new, show duplicates with isExtracted flag
      if (result.experience.length > 0) {
        this.experience = [...this.experience, ...result.experience as Experience[]]
      }

      // Merge education - keep both old and new, show duplicates with isExtracted flag
      if (result.education.length > 0) {
        this.education = [...this.education, ...result.education as Education[]]
      }

      // Merge skills - all extracted skills go to "Extracted" group with isExtracted flag
      if (result.profileSkills.length > 0) {
        const newSkills = result.profileSkills.map((skillName, index) => ({
          name: skillName,
          group: 'Extracted',
          proficiencyLevel: 'intermediate' as const,
          yearsExperience: null,
          displayOrder: this.profileSkills.length + index,
          isExtracted: true
        }))

        this.profileSkills = [...this.profileSkills, ...newSkills as ProfileSkill[]]
      }

      // Merge certifications - keep both old and new, show duplicates with isExtracted flag
      if (result.certifications.length > 0) {
        this.certifications = [...this.certifications, ...result.certifications as Certification[]]
      }

      // Merge social links - replace dummy links (no id) with extracted ones
      if (result.socialLinks && result.socialLinks.length > 0) {
        // Remove any dummy social links (links without IDs)
        const savedLinks = this.profileSocialLinks.filter(link => link.id !== undefined)

        // Transform extracted links to ProfileSocialLink format
        const transformedLinks = result.socialLinks.map(link => ({
          ...link,
          platformNameCache: this.getPlatformNameById(link.platformId),
          isExtracted: true
        })) as ProfileSocialLink[]

        // Keep only saved links + extracted links (removing dummy data)
        this.profileSocialLinks = [...savedLinks, ...transformedLinks]
      }

      // Clear extraction result after applying
      this.extractionResult = null
      this.extractionError = null
    },

    // Helper to get platform name by ID (for social links)
    getPlatformNameById(platformId: number): string {
      const platformMap: Record<number, string> = {
        1: 'linkedin',
        2: 'github',
        3: 'twitter',
        4: 'instagram',
        5: 'facebook'
      }
      return platformMap[platformId] || 'unknown'
    },

    // Clear extracted and unsaved data (for "Take a Break" functionality)
    clearExtractedData() {
      // Remove extracted contact info fields (keep existing saved data)
      if (this.contactInfo?.isExtracted && !this.contactInfo.id) {
        // If contact info was only extracted and never saved, clear it entirely
        this.contactInfo = null
      } else if (this.contactInfo?.isExtracted) {
        // If contact info has an ID (saved), just remove the isExtracted flag
        this.contactInfo.isExtracted = false
        this.contactInfo.extractedFields = undefined
      }

      // Remove extracted and unsaved experience entries
      this.experience = this.experience.filter(exp => !exp.isExtracted || exp.id !== undefined)

      // Remove extracted and unsaved education entries
      this.education = this.education.filter(edu => !edu.isExtracted || edu.id !== undefined)

      // Remove extracted skills that haven't been saved yet
      this.profileSkills = this.profileSkills.filter(skill => !skill.isExtracted)

      // Remove extracted and unsaved certifications
      this.certifications = this.certifications.filter(cert => !cert.isExtracted || cert.id !== undefined)

      // Remove extracted and unsaved social links
      this.profileSocialLinks = this.profileSocialLinks.filter(link => !link.isExtracted || link.id !== undefined)

      this.hasPerformedExtraction = false
      console.log('Cleared all extracted and unsaved data')
    },

    /**
     * Generate initial questions for context gathering (Round 1)
     *
     * Calls the /gather-context endpoint with experience data to generate
     * initial questions for the enhancement flow.
     *
     * @param experience - Full experience object from store
     * @returns Promise resolving to question groups and initial story notes
     * @throws Error with user-friendly message on generation failure
     */
    async generateInitialQuestions(experience: Experience): Promise<{
      questionGroups: QuestionGroup[]
      notes: ContextStory[]
    }> {
      this.isGeneratingQuestions = true

      try {
        const response = await $fetch<GatherContextResponse>(
          `/api/career-id/profile/${experience.profileId}/experience/${experience.id}/gather-context`,
          {
            method: 'POST',
            body: { experience }
          }
        )

        if (!response.success || !response.data) {
          throw new Error('Failed to generate questions: Invalid response format')
        }

        return response.data
      } catch (error: any) {
        let errorMessage = 'Failed to generate questions'

        if (error?.data?.error?.code === 'TIMEOUT') {
          errorMessage = 'Question generation timed out. Please try again.'
        } else {
          errorMessage = getApiErrorMessage(error, errorMessage)
        }

        throw new Error(errorMessage)
      } finally {
        this.isGeneratingQuestions = false
      }
    },

    /**
     * Generate follow-up questions based on previous answers (Round 2+)
     *
     * Calls the /gather-context endpoint with accumulated context from previous rounds
     * to generate targeted follow-up questions.
     *
     * @param experience - Full experience object from store
     * @param context - Accumulated context from previous rounds
     * @returns Promise resolving to follow-up question groups and updated story notes
     * @throws Error with user-friendly message on generation failure
     */
    async generateFollowUpQuestions(experience: Experience, context: ContextObject): Promise<{
      questionGroups: QuestionGroup[]
      notes: ContextStory[]
    }> {
      this.isGeneratingQuestions = true

      try {
        const response = await $fetch<GatherContextResponse>(
          `/api/career-id/profile/${experience.profileId}/experience/${experience.id}/gather-context`,
          {
            method: 'POST',
            body: { experience, context }
          }
        )

        if (!response.success || !response.data) {
          throw new Error('Failed to generate follow-up questions: Invalid response format')
        }

        return response.data
      } catch (error: any) {
        let errorMessage = 'Failed to generate follow-up questions'

        if (error?.data?.error?.code === 'TIMEOUT') {
          errorMessage = 'Follow-up question generation timed out. Please try again.'
        } else {
          errorMessage = getApiErrorMessage(error, errorMessage)
        }

        throw new Error(errorMessage)
      } finally {
        this.isGeneratingQuestions = false
      }
    },

    /**
     * Generate final resume bullets from context notes (Round 3)
     *
     * Calls the /enhance-achievements endpoint with accumulated context notes
     * to generate final XYZ-format resume bullets.
     *
     * @param experience - Full experience object from store
     * @param notes - Accumulated story notes from context gathering rounds
     * @returns Promise resolving to generated resume bullet pairs
     * @throws Error with user-friendly message on generation failure
     */
    async generateFinalBullets(experience: Experience, notes: ContextStory[]): Promise<ResumeBullet[]> {
      this.isGeneratingBullets = true

      try {
        const response = await $fetch<EnhanceAchievementsResponse>(
          `/api/career-id/profile/${experience.profileId}/experience/${experience.id}/enhance-achievements`,
          {
            method: 'POST',
            body: { experience, notes }
          }
        )

        if (!response.success || !response.data?.bullets) {
          throw new Error('Failed to generate bullets: Invalid response format')
        }

        return response.data.bullets
      } catch (error: any) {
        let errorMessage = 'Failed to generate resume bullets'

        if (error?.data?.error?.code === 'TIMEOUT') {
          errorMessage = 'Bullet generation timed out. Please try again.'
        } else {
          errorMessage = getApiErrorMessage(error, errorMessage)
        }

        throw new Error(errorMessage)
      } finally {
        this.isGeneratingBullets = false
      }
    },

    /**
     * Enhance achievement descriptions using AI-powered light polish
     *
     * This action sends an experience slice (job context + achievements) to the
     * AI enhancement endpoint and returns polished achievement descriptions.
     * Components track enhancement state locally (similar to isExtracted pattern).
     *
     * @param experienceSlice - Experience data slice containing job context and achievement highlights
     * @returns Promise resolving to enhanced highlights array in same order as input
     * @throws Error with user-friendly message on enhancement failure
     */
    async enhanceExperience(experienceSlice: {
      employmentType: string
      employer: string
      title: string
      url?: string
      summary?: string
      highlights: string[]
    }): Promise<string[]> {
      this.isEnhancingExperience = true
      this.error = null

      const posthog = usePostHog()
      posthog?.capture('ai_enhancement_started', {
        employer: experienceSlice.employer,
        title: experienceSlice.title,
        employment_type: experienceSlice.employmentType,
        highlights_count: experienceSlice.highlights.length
      })

      try {
        const response = await $fetch<{
          success: boolean
          enhanced: {
            highlights: string[]
          }
          duration: number
        }>('/api/career-id/resume/achievementEnhancer', {
          method: 'POST',
          body: experienceSlice
        })

        if (!response.success || !response.enhanced?.highlights) {
          throw new Error('Enhancement failed: Invalid response format')
        }

        posthog?.capture('ai_enhancement_completed', {
          employer: experienceSlice.employer,
          title: experienceSlice.title,
          highlights_count: response.enhanced.highlights.length,
          duration_ms: response.duration
        })

        return response.enhanced.highlights
      } catch (error: any) {
        let errorMessage = 'Failed to enhance achievements'

        if (error?.data?.error?.code === 'TIMEOUT' || error?.data?.error?.code === 'ENHANCEMENT_TIMEOUT') {
          errorMessage = 'Enhancement timed out. Please try again.'
        } else if (error?.data?.error?.code === 'INVALID_INPUT') {
          errorMessage = 'Invalid experience data provided.'
        } else if (error?.data?.error?.code === 'ENHANCEMENT_SERVICE_ERROR' || error?.data?.error?.code === 'AI_PROVIDER_ERROR') {
          errorMessage = 'Enhancement service is temporarily unavailable. Please try again.'
        } else {
          errorMessage = getApiErrorMessage(error, errorMessage)
        }

        posthog?.captureException(error)
        this.error = errorMessage
        throw new Error(errorMessage)
      } finally {
        this.isEnhancingExperience = false
      }
    },

    async generateInitialQuestionsTracked(experience: Experience) {
      const posthog = usePostHog()
      posthog?.capture('ai_context_questions_generated', {
        experience_employer: experience.employer,
        experience_title: experience.title,
        round: 1
      })
      return this.generateInitialQuestions(experience)
    },

    async generateFinalBulletsTracked(experience: Experience, notes: ContextStory[]) {
      const result = await this.generateFinalBullets(experience, notes)
      const posthog = usePostHog()
      posthog?.capture('ai_bullets_generated', {
        experience_employer: experience.employer,
        experience_title: experience.title,
        bullets_count: result.length
      })
      return result
    }
  }
})
