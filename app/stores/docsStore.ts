import { defineStore } from 'pinia'
import type { ResumeContent, ResumeDesignSettings, ResumeListItem } from '#shared/types/docs'

type CreateResumePayload = {
  firstName?: string
  lastName?: string
  content?: ResumeContent
  designSettings?: ResumeDesignSettings
}

type UpdateResumePatch = {
  title?: string
  content?: ResumeContent
  designSettings?: ResumeDesignSettings
}

export const useDocsStore = defineStore('docs', {
  state: () => ({
    resumes: [] as ResumeListItem[],
    isListLoaded: false,
    isLoading: false,
    isSaving: false
  }),
  actions: {
    async listResumes() {
      if (this.isListLoaded) return this.resumes
      this.isLoading = true
      try {
        const result = await $fetch<{ success: boolean, data: Array<ResumeListItem & { createdAt?: string }> }>('/api/docs/resumes')
        if (!result.success) throw new Error('Failed to load resumes')
        this.resumes = (result.data || []).map(r => ({
          id: r.id,
          title: r.title,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt
        }))
        this.isListLoaded = true
        return this.resumes
      } finally {
        this.isLoading = false
      }
    },

    async getResume(id: string) {
      const existing = this.resumes.find(r => r.id === id)
      if (existing?.content) return existing

      this.isLoading = true
      try {
        const result = await $fetch<{ success: boolean, data: ResumeListItem }>(`/api/docs/resumes/${id}`)
        if (!result.success) throw new Error('Failed to load resume')

        const idx = this.resumes.findIndex(r => r.id === id)
        if (idx >= 0) {
          this.resumes.splice(idx, 1, { ...this.resumes[idx], ...result.data })
          return this.resumes[idx]
        }

        this.resumes.push(result.data)
        return result.data
      } finally {
        this.isLoading = false
      }
    },

    async createResume(payload: CreateResumePayload) {
      this.isSaving = true
      try {
        const result = await $fetch<{ success: boolean, data: ResumeListItem }>('/api/docs/resumes', {
          method: 'POST',
          body: payload
        })
        if (!result.success) throw new Error('Failed to create resume')
        this.resumes.unshift(result.data)
        return result.data
      } finally {
        this.isSaving = false
      }
    },

    async updateResume(id: string, patch: UpdateResumePatch) {
      this.isSaving = true
      try {
        const result = await $fetch<{ success: boolean, data: ResumeListItem }>(`/api/docs/resumes/${id}`, {
          method: 'PUT',
          body: patch
        })
        if (!result.success) throw new Error('Failed to update resume')

        const idx = this.resumes.findIndex(r => r.id === id)
        if (idx >= 0) {
          this.resumes.splice(idx, 1, { ...this.resumes[idx], ...result.data })
          return this.resumes[idx]
        }

        this.resumes.unshift(result.data)
        return result.data
      } finally {
        this.isSaving = false
      }
    },

    async deleteResume(id: string) {
      this.isSaving = true
      try {
        const result = await $fetch<{ success: boolean }>(`/api/docs/resumes/${id}`, {
          method: 'DELETE'
        })
        if (!result.success) throw new Error('Failed to delete resume')
        const idx = this.resumes.findIndex(r => r.id === id)
        if (idx >= 0) this.resumes.splice(idx, 1)
        this.isListLoaded = false
      } finally {
        this.isSaving = false
      }
    }
  }
})
