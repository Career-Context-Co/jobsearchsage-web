import { serverSupabaseClient } from '#supabase/server'
import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { ErrorCodes } from '@@/server/utils/error-handler'
import {
  generateHeroNudgeDiscoveryContinue,
  HeroNudgeDiscoveryError,
  type HeroStoryFieldUpdates
} from '@@/server/utils/hero-nudge-discovery-service'

const ROUTE_PATH = '/api/ai/hero-discovery/nudge/continue'

interface HeroNudgeDiscoveryContinueBody {
  sessionId?: number
  userMessage?: string
}

const STORY_FIELD_MAP: Record<keyof HeroStoryFieldUpdates, string> = {
  hurdleProblem: 'hurdle_problem',
  hurdleScope: 'hurdle_scope',
  hurdleStakes: 'hurdle_stakes',
  expectationRole: 'expectation_role',
  expectationGoals: 'expectation_goals',
  expectationConstraints: 'expectation_constraints',
  responseActions: 'response_actions',
  responseTools: 'response_tools',
  responseChallenges: 'response_challenges',
  outcomeDeliverable: 'outcome_deliverable',
  outcomeMetrics: 'outcome_metrics',
  outcomeImpact: 'outcome_impact'
}

function createValidationError(message: string) {
  return createError({
    statusCode: 400,
    statusMessage: 'Bad Request',
    data: {
      success: false,
      error: {
        code: ErrorCodes.VALIDATION_ERROR,
        message
      }
    }
  })
}

function createUnauthorizedError() {
  return createError({
    statusCode: 401,
    statusMessage: 'Unauthorized',
    data: {
      success: false,
      error: {
        code: ErrorCodes.UNAUTHORIZED,
        message: 'Not authenticated'
      }
    }
  })
}

function toStoryUpdatePayload(storyUpdates: HeroStoryFieldUpdates) {
  const payload: Record<string, string> = {}

  for (const [field, column] of Object.entries(STORY_FIELD_MAP)) {
    const value = storyUpdates[field as keyof HeroStoryFieldUpdates]
    if (typeof value === 'string' && value.trim()) {
      payload[column] = value.trim()
    }
  }

  return payload
}

export default eventHandler(async (event) => {
  const getElapsed = createTimer()
  logRequest('POST', ROUTE_PATH)

  try {
    const body = await readBody<HeroNudgeDiscoveryContinueBody>(event)
    const sessionId = body.sessionId
    const userMessage = body.userMessage

    if (!Number.isInteger(sessionId)) {
      throw createValidationError('sessionId is required')
    }

    if (typeof userMessage !== 'string' || userMessage.trim().length === 0) {
      throw createValidationError('userMessage is required')
    }

    const supabase = await serverSupabaseClient(event)
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw createUnauthorizedError()
    }

    const { data: session, error: sessionError } = await supabase
      .from('hero_discovery_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('session_type', 'experience_nudge_story')
      .single()

    if (sessionError || !session) {
      throw createValidationError('nudge discovery session not found')
    }

    const sessionData = session.session_data ?? {}
    const conversationHistory = Array.isArray(sessionData.conversation_history)
      ? sessionData.conversation_history
      : []
    const completedFields = Array.isArray(sessionData.story_progress?.completedFields)
      ? sessionData.story_progress.completedFields
      : []
    const result = await generateHeroNudgeDiscoveryContinue(
      userMessage.trim(),
      conversationHistory,
      sessionData.nudge ?? {},
      sessionData.source_snapshot ?? {},
      completedFields
    )
    const nextCompletedFields = Array.from(new Set([
      ...completedFields,
      ...result.completedFields,
      ...Object.keys(result.storyUpdates)
    ]))
    const updatedHistory = [
      ...conversationHistory,
      { role: 'user', content: userMessage.trim() },
      { role: 'assistant', content: result.aiMessage }
    ]
    const storyPayload = toStoryUpdatePayload(result.storyUpdates)

    if (Object.keys(storyPayload).length > 0 && session.hero_story_id) {
      const { error: storyError } = await supabase
        .schema('career_id')
        .from('hero_stories')
        .update(storyPayload)
        .eq('id', session.hero_story_id)
        .eq('profile_id', session.profile_id)

      if (storyError) {
        throw storyError
      }
    }

    const updatedSessionData = {
      ...sessionData,
      conversation_history: updatedHistory,
      story_progress: {
        answeredQuestions: updatedHistory.filter(entry => entry.role === 'user').length,
        completedFields: nextCompletedFields
      }
    }

    const { error: updateError } = await supabase
      .from('hero_discovery_sessions')
      .update({
        session_data: updatedSessionData,
        progress_count: nextCompletedFields.length
      })
      .eq('id', sessionId)

    if (updateError) {
      throw updateError
    }

    const duration = getElapsed()
    logSuccess('POST', ROUTE_PATH, duration, {
      sessionId,
      heroStoryId: session.hero_story_id,
      progressCount: nextCompletedFields.length
    })

    return {
      success: true,
      data: {
        message: result.aiMessage,
        storyUpdates: result.storyUpdates,
        completedFields: nextCompletedFields,
        shouldEndSession: result.shouldEndSession,
        heroStoryId: session.hero_story_id
      }
    }
  } catch (error: unknown) {
    const apiError = error as { statusCode?: number, message?: string }
    if (apiError?.statusCode) {
      logError('POST', ROUTE_PATH, error, { kind: 'request' })
      throw error
    }

    if (error instanceof HeroNudgeDiscoveryError) {
      const statusCode = error.code === 'TIMEOUT' ? 504 : 503
      throw createError({
        statusCode,
        statusMessage: statusCode === 504 ? 'Request Timeout' : 'Service Unavailable',
        data: {
          success: false,
          error: {
            code: error.code,
            message: error.message
          }
        }
      })
    }

    const duration = getElapsed()
    logError('POST', ROUTE_PATH, error, {
      duration,
      message: apiError?.message || 'Unknown error'
    })

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      data: {
        success: false,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'Failed to continue HERO nudge discovery'
        }
      }
    })
  }
})
