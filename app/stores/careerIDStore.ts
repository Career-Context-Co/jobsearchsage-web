import { defineStore } from 'pinia'
import type {
  Profile,
  Experience,
  Education,
  Certification,
  ProfileSkill,
  ProfileSocialLink,
  ContactInfo,
  ProfileResponse
} from '../../shared/types/careerId'

export const useCareerIDStore = defineStore('careerID', {
  state: () => ({
    profileId: 'prof_iyuj6m90g1ji',
    userId: 'user-demo-001',
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

    // Resume extraction state
    isExtracting: false,
    extractionError: null as string | null,
    extractionResult: null as {
      contactInfo: Partial<ContactInfo> | null
      socialLinks: Array<{ platformId: number, url: string, displayOrder: number }>
      experience: Array<Omit<Experience, 'id' | 'profileId' | 'createdAt' | 'updatedAt'>>
      education: Array<Omit<Education, 'id' | 'profileId' | 'createdAt' | 'updatedAt'>>
      profileSkills: string[]
      certifications: Array<Omit<Certification, 'id' | 'profileId' | 'createdAt' | 'updatedAt'>>
    } | null
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
    async createProfile() {
      this.isSaving = true
      this.error = null

      try {
        const response = await $fetch<{
          success: boolean
          message: string
          data: { profile: Profile }
        }>('/api/career-id/profile', {
          method: 'POST',
          body: { userId: this.userId }
        })

        if (!response.success || !response.data?.profile) {
          throw new Error('Failed to create profile')
        }

        // API returns data already in camelCase format
        const profile = response.data.profile

        // Set the new profile in state
        this.profile = profile
        // Store the profileId for future use
        this.profileId = profile.id
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

    async updateProfile(profileId: string, data: { completionStatus?: 'incomplete' | 'partial' | 'complete' }) {
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
        const errorMessage = error?.data?.message || error?.message || 'Failed to update profile'
        this.error = errorMessage
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
        const errorMessage = error?.data?.message || error?.message || 'Failed to add education'
        this.error = errorMessage
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
        const errorMessage = error?.data?.message || error?.message || 'Failed to update education'
        this.error = errorMessage
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
        const errorMessage = error?.data?.message || error?.message || 'Failed to delete education'
        this.error = errorMessage
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
        const errorMessage = error?.data?.message || error?.message || 'Failed to add certification'
        this.error = errorMessage
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
        const errorMessage = error?.data?.message || error?.message || 'Failed to update certification'
        this.error = errorMessage
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
        const errorMessage = error?.data?.message || error?.message || 'Failed to delete certification'
        this.error = errorMessage
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
        const response = await $fetch<{
          success: boolean
          message: string
          data: ContactInfo
        }>(`/api/career-id/profile/${this.profile.id}/contact`, {
          method: 'POST',
          body: data
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
        const errorMessage = error?.data?.message || error?.message || 'Failed to create contact info'
        this.error = errorMessage
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
        const response = await $fetch<{
          success: boolean
          message: string
          data: ContactInfo
        }>(`/api/career-id/profile/${this.profile.id}/contact/${id}`, {
          method: 'PATCH',
          body: data
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
        const errorMessage = error?.data?.message || error?.message || 'Failed to update contact info'
        this.error = errorMessage
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
        const errorMessage = error?.data?.message || error?.message || 'Failed to delete contact info'
        this.error = errorMessage
        throw error
      } finally {
        this.isSaving = false
      }
    },

    // 5.8.1 Add skills (bulk operation)
    async addSkills(skills: Array<Omit<ProfileSkill, 'id' | 'profileId' | 'skillId' | 'skill' | 'createdAt' | 'updatedAt'>>) {
      if (!this.profile?.id) {
        throw new Error('No profile loaded')
      }

      this.isSaving = true
      this.error = null

      try {
        const response = await $fetch<{
          success: boolean
          message: string
          data: ProfileSkill[]
        }>(`/api/career-id/profile/${this.profile.id}/skills`, {
          method: 'POST',
          body: skills
        })

        if (!response.success || !response.data) {
          throw new Error('Failed to add skills')
        }

        // API returns data already in camelCase format
        const addedSkills = response.data

        // Add to local state
        this.profileSkills.push(...addedSkills)
        this.lastSaved = new Date().toISOString()

        return addedSkills
      } catch (error: any) {
        const errorMessage = error?.data?.message || error?.message || 'Failed to add skills'
        this.error = errorMessage
        throw error
      } finally {
        this.isSaving = false
      }
    },

    // 5.8.2 Update skills (bulk operation)
    async updateSkills(skills: Array<{ id: number } & Partial<Pick<ProfileSkill, 'name' | 'group' | 'proficiencyLevel' | 'yearsExperience' | 'displayOrder'>>>) {
      if (!this.profile?.id) {
        throw new Error('No profile loaded')
      }

      this.isSaving = true
      this.error = null

      try {
        const response = await $fetch<{
          success: boolean
          status: number
          message: string
          updated: number
          failed: number
          results: Array<{
            index: number
            id: number
            status: number
            success: boolean
            data?: ProfileSkill
            error?: { code: string, message: string }
          }>
        }>(`/api/career-id/profile/${this.profile.id}/skills`, {
          method: 'PATCH',
          body: skills
        })

        // Update successful skills in local state
        response.results.forEach((result) => {
          if (result.success && result.data) {
            const index = this.profileSkills.findIndex(skill => skill.id === result.id)
            if (index !== -1) {
              this.profileSkills[index] = result.data
            }
          }
        })

        this.lastSaved = new Date().toISOString()

        return response
      } catch (error: any) {
        const errorMessage = error?.data?.message || error?.message || 'Failed to update skills'
        this.error = errorMessage
        throw error
      } finally {
        this.isSaving = false
      }
    },

    // 5.8.3 Delete skills (bulk operation)
    async deleteSkills(ids: number[]) {
      if (!this.profile?.id) {
        throw new Error('No profile loaded')
      }

      this.isSaving = true
      this.error = null

      try {
        const response = await $fetch<{
          success: boolean
          message: string
        }>(`/api/career-id/profile/${this.profile.id}/skills`, {
          method: 'DELETE',
          body: { ids }
        })

        if (!response.success) {
          throw new Error('Failed to delete skills')
        }

        // Remove from local state
        this.profileSkills = this.profileSkills.filter(skill => !ids.includes(skill.id))
        this.lastSaved = new Date().toISOString()
      } catch (error: any) {
        const errorMessage = error?.data?.message || error?.message || 'Failed to delete skills'
        this.error = errorMessage
        throw error
      } finally {
        this.isSaving = false
      }
    },

    // 5.8.4 Search skills for autocomplete
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
        const errorMessage = error?.data?.message || error?.message || 'Failed to search skills'
        this.error = errorMessage
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

        // Add to local state
        this.profileSocialLinks.push(...addedLinks)
        this.lastSaved = new Date().toISOString()

        return addedLinks
      } catch (error: any) {
        const errorMessage = error?.data?.message || error?.message || 'Failed to add social links'
        this.error = errorMessage
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
        const errorMessage = error?.data?.message || error?.message || 'Failed to update social link'
        this.error = errorMessage
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
        const errorMessage = error?.data?.message || error?.message || 'Failed to delete social link'
        this.error = errorMessage
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
        const errorMessage = error?.data?.message || error?.message || 'Failed to fetch social platforms'
        this.error = errorMessage
        throw error
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
        const errorMessage = error?.data?.message || error?.message || 'Failed to add experience'
        this.error = errorMessage
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
        const errorMessage = error?.data?.message || error?.message || 'Failed to update experience'
        this.error = errorMessage
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
        const errorMessage = error?.data?.message || error?.message || 'Failed to delete experience'
        this.error = errorMessage
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

        return response
      } catch (error: any) {
        const errorMessage = error?.data?.error?.message || error?.message || 'Failed to extract resume data'
        this.extractionError = errorMessage
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

      // Merge social links - keep both old and new
      if (result.socialLinks && result.socialLinks.length > 0) {
        // Transform to ProfileSocialLink format
        const transformedLinks = result.socialLinks.map(link => ({
          ...link,
          platformNameCache: this.getPlatformNameById(link.platformId),
          isExtracted: true
        })) as ProfileSocialLink[]

        this.profileSocialLinks = [...this.profileSocialLinks, ...transformedLinks]
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
    }
  }
})
