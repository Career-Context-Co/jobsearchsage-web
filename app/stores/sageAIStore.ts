import { defineStore } from 'pinia'
import { useLocalStorageState } from '#imports'
import type { Experience } from '#shared/types/careerId'
import type { DiscoverySession } from '@/types/heroMoments'

type CapturedMomentInput = {
  title: string
  rawNotes: string
}

type HeroNudgeDiscoveryStartParams = {
  profileId: string
  nudgeId: string
  experience: Experience
}

const dedupeCapturedMoments = (moments: CapturedMomentInput[]) => {
  const seen = new Set<string>()
  return moments.filter((moment) => {
    const key = `${moment.title}||${moment.rawNotes}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

const HERO_DISCOVERY_CACHE_KEY = 'sageAI.heroDiscoverySession'
const HERO_DISCOVERY_CACHE_TTL_MS = 1000 * 60 * 60 * 24

/** Matches server `SAGE_NOTES_NOTE_TYPE` — sage AI notes for an experience target */
const SAGE_EXPERIENCE_NOTES_TYPE = 'sage_notes'

export type ExperienceSageNotesState = {
  content: string | null
  updatedAt: string | null
  loading: boolean
  error: string | null
}

function experienceSageNotesKey(profileId: string, experienceId: number) {
  return `${profileId}:${experienceId}`
}

const isSessionIncomplete = (session: DiscoverySession) => {
  return session.session_status !== 'completed' && session.session_status !== 'abandoned'
}

let discoverySessionStage: ReturnType<typeof useLocalStorageState<DiscoverySession>> | null = null

const getDiscoverySessionStage = () => {
  if (!discoverySessionStage) {
    discoverySessionStage = useLocalStorageState<DiscoverySession>(HERO_DISCOVERY_CACHE_KEY, {
      ttlMs: HERO_DISCOVERY_CACHE_TTL_MS,
      shouldCache: isSessionIncomplete
    })
  }

  return discoverySessionStage
}

type HeroEnhancementSession = {
  id: number | null
  profile_id: string | null
  story_id: string | null
  section_type: string | null
}

export const useSageAIStore = defineStore('sageAI', {
  state: () => ({
    discoverySession: null as DiscoverySession | null,
    heroEnhancementSession: null as HeroEnhancementSession | null,
    isLoading: false,
    error: null as string | null,
    /** Sage profile notes for experience rows: key `${profileId}:${experienceId}` */
    experienceSageNotesByKey: {} as Record<string, ExperienceSageNotesState>
  }),

  getters: {
    experienceSageNotesFor:
      state =>
        (profileId: string, experienceId: number): ExperienceSageNotesState | null => {
          const key = experienceSageNotesKey(profileId, experienceId)
          return state.experienceSageNotesByKey[key] ?? null
        }
  },

  actions: {
    async loadSageNotesForExperience(profileId: string, experienceId: number) {
      const key = experienceSageNotesKey(profileId, experienceId)
      const prev = this.experienceSageNotesByKey[key]
      this.experienceSageNotesByKey[key] = {
        content: prev?.content ?? null,
        updatedAt: prev?.updatedAt ?? null,
        loading: true,
        error: null
      }

      try {
        const response = await $fetch<{
          success: boolean
          data: { content: string | null, updatedAt: string | null }
        }>('/api/ai/sage/notes', {
          query: {
            profileId,
            targetType: 'experience',
            targetId: String(experienceId),
            noteType: SAGE_EXPERIENCE_NOTES_TYPE
          }
        })

        if (!response.success) {
          throw new Error('Failed to load Sage notes')
        }

        this.experienceSageNotesByKey[key] = {
          content: response.data?.content ?? null,
          updatedAt: response.data?.updatedAt ?? null,
          loading: false,
          error: null
        }
      } catch (error: unknown) {
        const e = error as { data?: { error?: { message?: string } }, message?: string }
        const errorMessage
          = e?.data?.error?.message
            || e?.message
            || 'Failed to load Sage notes'
        this.experienceSageNotesByKey[key] = {
          content: prev?.content ?? null,
          updatedAt: prev?.updatedAt ?? null,
          loading: false,
          error: errorMessage
        }
        console.error('loadSageNotesForExperience failed', error)
      }
    },
    setError(error: string | null) {
      this.error = error
    },

    async startDiscoverySession(
      profileId: string,
      userContext?: {
        name?: string
        current_role?: string
        years_experience?: number
        source_experience?: Experience | null
      }
    ) {
      this.isLoading = true
      this.error = null

      try {
        const { name, current_role, years_experience, source_experience } = userContext ?? {}
        const sourceExperience = source_experience ?? null

        const body: Record<string, any> = {
          profile_id: profileId
        }

        const userContextPayload = { name, current_role, years_experience }
        if (Object.values(userContextPayload).some(value => value !== undefined)) {
          body.user_context = userContextPayload
        }

        if (sourceExperience) {
          body.source_experience = sourceExperience
        }

        const response = await $fetch<{
          success: boolean
          ai_message: string
          session_id: number
        }>('/api/ai/hero-discovery/start', {
          method: 'POST',
          body
        })

        if (!response.success || !response.session_id) {
          throw new Error('Failed to start discovery session')
        }

        const session: DiscoverySession = {
          id: response.session_id,
          profile_id: profileId,
          session_status: 'active',
          started_at: new Date().toISOString(),
          ended_at: null,
          moment_count: 0,
          session_data: {
            conversation_history: [
              { role: 'assistant' as const, content: response.ai_message }
            ],
            captured_moments: [],
            user_context: {
              name,
              current_role,
              years_experience,
              source_experience_id: sourceExperience?.id ?? null,
              source_experience: sourceExperience ? { ...sourceExperience } : null
            }
          }
        }

        this.discoverySession = session
        this.saveSessionToCache(session)

        return response
      } catch (error: any) {
        const errorMessage = error?.data?.error?.message || error?.message || 'Failed to start discovery session'
        this.error = errorMessage
        console.error('startDiscoverySession failed', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async continueDiscoverySession(
      sessionId: number,
      userMessage: string,
      capturedMoments: CapturedMomentInput[]
    ) {
      this.isLoading = true
      this.error = null

      try {
        const response = await $fetch<{
          success: boolean
          ai_message: string
          should_end_session: boolean
          session_state: {
            captured_moments: CapturedMomentInput[]
            session_id: number
          }
        }>('/api/ai/hero-discovery/continue', {
          method: 'POST',
          body: {
            session_id: sessionId,
            user_message: userMessage,
            captured_moments: capturedMoments
          }
        })

        if (!response.success) {
          throw new Error('Failed to continue discovery session')
        }

        const updatedCapturedMoments = response.session_state?.captured_moments ?? capturedMoments
        const dedupedCapturedMoments = dedupeCapturedMoments(updatedCapturedMoments)
        const updatedConversation: Array<{ role: 'assistant' | 'user', content: string }> = [
          ...(this.discoverySession?.session_data?.conversation_history ?? []),
          { role: 'user', content: userMessage },
          { role: 'assistant', content: response.ai_message }
        ]

        if (this.discoverySession && this.discoverySession.id === sessionId) {
          this.discoverySession = {
            ...this.discoverySession,
            moment_count: dedupedCapturedMoments.length,
            session_data: {
              ...this.discoverySession.session_data,
              conversation_history: updatedConversation,
              captured_moments: dedupedCapturedMoments
            }
          }
        }

        if (this.discoverySession) {
          this.saveSessionToCache(this.discoverySession)
        }

        return response
      } catch (error: any) {
        const errorMessage = error?.data?.error?.message || error?.message || 'Failed to continue discovery session'
        this.error = errorMessage
        console.error('continueDiscoverySession failed', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async endDiscoverySession(sessionId: number) {
      this.isLoading = true
      this.error = null

      try {
        const capturedMoments = this.discoverySession?.session_data?.captured_moments ?? []
        const userContext = this.discoverySession?.session_data?.user_context

        const response = await $fetch<{
          success: boolean
          ai_message: string
          captured_moments: CapturedMomentInput[]
          session_complete: boolean
          next_endpoint: string
        }>('/api/ai/hero-discovery/end', {
          method: 'POST',
          body: {
            session_id: sessionId,
            captured_moments: capturedMoments,
            user_context: userContext
          }
        })

        if (!response.success) {
          throw new Error('Failed to end discovery session')
        }

        if (this.discoverySession && this.discoverySession.id === sessionId) {
          const conversationHistory = [
            ...(this.discoverySession.session_data?.conversation_history ?? []),
            { role: 'assistant' as const, content: response.ai_message }
          ]
          const dedupedCapturedMoments = dedupeCapturedMoments(response.captured_moments ?? capturedMoments)

          this.discoverySession = {
            ...this.discoverySession,
            session_status: 'completed',
            ended_at: new Date().toISOString(),
            moment_count: dedupedCapturedMoments.length,
            session_data: {
              ...this.discoverySession.session_data,
              conversation_history: conversationHistory,
              captured_moments: dedupedCapturedMoments
            }
          }
        }

        this.clearSessionCache()

        return response
      } catch (error: any) {
        const errorMessage = error?.data?.error?.message || error?.message || 'Failed to end discovery session'
        this.error = errorMessage
        console.error('endDiscoverySession failed', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async startNudgeDiscoverySession(params: HeroNudgeDiscoveryStartParams) {
      const { profileId, nudgeId, experience } = params
      this.isLoading = true
      this.error = null

      try {
        const response = await $fetch<{
          success: boolean
          data: {
            sessionId: number
            heroStoryId: string
            message: string
          }
        }>('/api/ai/hero-discovery/nudge/start', {
          method: 'POST',
          body: {
            profileId,
            nudgeId,
            experience
          }
        })

        if (!response.success || !response.data?.sessionId) {
          throw new Error('Failed to start HERO nudge discovery')
        }

        const session: DiscoverySession = {
          id: response.data.sessionId,
          profile_id: profileId,
          session_status: 'active',
          started_at: new Date().toISOString(),
          ended_at: null,
          moment_count: 0,
          session_type: 'experience_nudge_story',
          source_type: 'experience',
          source_experience_id: experience.id,
          hero_nudge_id: nudgeId,
          hero_story_id: response.data.heroStoryId,
          progress_count: 0,
          session_data: {
            mode: 'experience_nudge_story',
            conversation_history: [
              { role: 'assistant' as const, content: response.data.message }
            ],
            source_snapshot: { ...experience },
            nudge: { id: nudgeId },
            story_progress: {
              answeredQuestions: 0,
              completedFields: []
            }
          }
        }

        this.discoverySession = session
        this.saveSessionToCache(session)

        return response.data
      } catch (error: unknown) {
        const e = error as { data?: { error?: { message?: string } }, message?: string }
        const errorMessage = e?.data?.error?.message || e?.message || 'Failed to start HERO nudge discovery'
        this.error = errorMessage
        console.error('startNudgeDiscoverySession failed', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async continueNudgeDiscoverySession(sessionId: number, userMessage: string) {
      this.isLoading = true
      this.error = null

      try {
        const response = await $fetch<{
          success: boolean
          data: {
            message: string
            completedFields: string[]
            shouldEndSession: boolean
            heroStoryId: string | null
          }
        }>('/api/ai/hero-discovery/nudge/continue', {
          method: 'POST',
          body: {
            sessionId,
            userMessage
          }
        })

        if (!response.success) {
          throw new Error('Failed to continue HERO nudge discovery')
        }

        if (this.discoverySession && this.discoverySession.id === sessionId) {
          const history = this.discoverySession.session_data?.conversation_history ?? []
          const updatedHistory = [
            ...history,
            { role: 'user' as const, content: userMessage },
            { role: 'assistant' as const, content: response.data.message }
          ]

          this.discoverySession = {
            ...this.discoverySession,
            hero_story_id: response.data.heroStoryId ?? this.discoverySession.hero_story_id,
            progress_count: response.data.completedFields.length,
            session_data: {
              ...this.discoverySession.session_data,
              conversation_history: updatedHistory,
              story_progress: {
                answeredQuestions: updatedHistory.filter(entry => entry.role === 'user').length,
                completedFields: response.data.completedFields
              }
            }
          }
        }

        if (this.discoverySession) {
          this.saveSessionToCache(this.discoverySession)
        }

        return response.data
      } catch (error: unknown) {
        const e = error as { data?: { error?: { message?: string } }, message?: string }
        const errorMessage = e?.data?.error?.message || e?.message || 'Failed to continue HERO nudge discovery'
        this.error = errorMessage
        console.error('continueNudgeDiscoverySession failed', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async endNudgeDiscoverySession(sessionId: number) {
      this.isLoading = true
      this.error = null

      try {
        const response = await $fetch<{
          success: boolean
          data: {
            sessionId: number
            heroStoryId: string | null
          }
        }>('/api/ai/hero-discovery/nudge/end', {
          method: 'POST',
          body: { sessionId }
        })

        if (!response.success) {
          throw new Error('Failed to end HERO nudge discovery')
        }

        if (this.discoverySession && this.discoverySession.id === sessionId) {
          this.discoverySession = {
            ...this.discoverySession,
            session_status: 'completed',
            ended_at: new Date().toISOString(),
            hero_story_id: response.data.heroStoryId ?? this.discoverySession.hero_story_id
          }
        }

        this.clearSessionCache()

        return response.data
      } catch (error: unknown) {
        const e = error as { data?: { error?: { message?: string } }, message?: string }
        const errorMessage = e?.data?.error?.message || e?.message || 'Failed to end HERO nudge discovery'
        this.error = errorMessage
        console.error('endNudgeDiscoverySession failed', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    saveSessionToCache(session: DiscoverySession) {
      getDiscoverySessionStage().save(session)
    },

    restoreSessionFromCache(profileId?: string) {
      const cachedSession = getDiscoverySessionStage().restore()

      if (!cachedSession) {
        return null
      }

      if (profileId && cachedSession.profile_id !== profileId) {
        return null
      }

      this.discoverySession = cachedSession
      return cachedSession
    },

    clearSessionCache() {
      getDiscoverySessionStage().clear()
    },

    async syncSessionWithServer(sessionId: number) {
      const session = this.discoverySession

      if (!session || session.id !== sessionId) {
        return null
      }

      if (!isSessionIncomplete(session)) {
        this.clearSessionCache()
        return session
      }

      const history = session.session_data?.conversation_history ?? []
      const lastEntry = history[history.length - 1]

      if (lastEntry?.role !== 'user') {
        return session
      }

      const capturedMoments = session.session_data?.captured_moments ?? []
      return await this.continueDiscoverySession(sessionId, lastEntry.content, capturedMoments)
    },

    // Hero Enhancement Session Methods
    async startHeroEnhancementSession(
      profileId: string,
      storyId: string,
      sectionType: string,
      currentValues: Record<string, string>,
      options?: {
        momentTitle?: string
        momentDescription?: string
        field?: string // NEW: for structured mode
        previousFieldResults?: Record<string, string> // NEW: context from previous fields
        sourceExperience?: Experience // NEW: linked experience for context
      }
    ) {
      this.isLoading = true
      this.error = null

      try {
        const body: Record<string, any> = {
          profile_id: profileId,
          story_id: storyId,
          section_type: sectionType,
          current_values: currentValues
        }

        if (options?.momentTitle) {
          body.moment_title = options.momentTitle
        }

        if (options?.momentDescription) {
          body.moment_description = options.momentDescription
        }

        if (options?.field) {
          body.field = options.field
        }

        if (options?.previousFieldResults) {
          body.previous_field_results = options.previousFieldResults
        }

        if (options?.sourceExperience) {
          body.source_experience = options.sourceExperience
        }

        const response = await $fetch<{
          success: boolean
          session_id: number
          ai_message?: string
          suggestions?: Record<string, string>
          // Structured mode fields
          field?: string
          current_question?: any
          is_complete: boolean
        }>('/api/ai/hero-session/start', {
          method: 'POST',
          body
        })

        if (!response.success || !response.session_id) {
          throw new Error('Failed to start hero enhancement session')
        }

        this.heroEnhancementSession = {
          id: response.session_id,
          profile_id: profileId,
          story_id: storyId,
          section_type: sectionType
        }

        return response
      } catch (error: any) {
        const errorMessage = error?.data?.error?.message || error?.message || 'Failed to start hero enhancement session'
        this.error = errorMessage
        console.error('startHeroEnhancementSession failed', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async continueHeroEnhancementSession(
      sessionId: number,
      input: {
        userMessage?: string // For conversational mode
        selectedOption?: string // For structured mode
        customText?: string // For structured mode with "Other" option
      }
    ) {
      this.isLoading = true
      this.error = null

      try {
        const body: Record<string, any> = {
          session_id: sessionId
        }

        // Support both conversational and structured modes
        if (input.userMessage) {
          body.user_message = input.userMessage
        }

        if (input.selectedOption) {
          body.selected_option = input.selectedOption
        }

        if (input.customText) {
          body.custom_text = input.customText
        }

        const response = await $fetch<{
          success: boolean
          ai_message?: string
          is_complete: boolean
          final_output?: Record<string, string>
          // Structured mode fields
          current_question?: any
        }>('/api/ai/hero-session/continue', {
          method: 'POST',
          body
        })

        if (!response.success) {
          throw new Error('Failed to continue hero enhancement session')
        }

        return response
      } catch (error: any) {
        const errorMessage = error?.data?.error?.message || error?.message || 'Failed to continue hero enhancement session'
        this.error = errorMessage
        console.error('continueHeroEnhancementSession failed', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async endHeroEnhancementSession(
      sessionId: number,
      status: 'completed' | 'abandoned' = 'completed'
    ) {
      this.isLoading = true
      this.error = null

      try {
        const response = await $fetch<{
          success: boolean
        }>('/api/ai/hero-session/end', {
          method: 'POST',
          body: {
            session_id: sessionId,
            status
          }
        })

        if (!response.success) {
          throw new Error('Failed to end hero enhancement session')
        }

        // Clear the session state
        this.heroEnhancementSession = null

        return response
      } catch (error: any) {
        const errorMessage = error?.data?.error?.message || error?.message || 'Failed to end hero enhancement session'
        this.error = errorMessage
        console.error('endHeroEnhancementSession failed', error)
        throw error
      } finally {
        this.isLoading = false
      }
    }
  }
})
