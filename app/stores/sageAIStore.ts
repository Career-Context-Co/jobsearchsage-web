import { defineStore } from 'pinia'
import { useLocalStorageState } from '#imports'
import type { Experience } from '#shared/types/careerId'
import type { DiscoverySession } from '@/types/heroMoments'

type CapturedMomentInput = {
  title: string
  rawNotes: string
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

export const useSageAIStore = defineStore('sageAI', {
  state: () => ({
    discoverySession: null as DiscoverySession | null,
    isLoading: false,
    error: null as string | null
  }),

  actions: {
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

        this.discoverySession = {
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
              source_experience: sourceExperience ?? null
            }
          }
        }

        this.saveSessionToCache(this.discoverySession)

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
        const updatedConversation: Array<{ role: 'assistant' | 'user'; content: string }> = [
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
    }
  }
})