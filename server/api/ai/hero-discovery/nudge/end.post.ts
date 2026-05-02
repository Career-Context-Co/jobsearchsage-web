import { serverSupabaseClient } from '#supabase/server'
import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { ErrorCodes } from '@@/server/utils/error-handler'
import { convertHeroStoryNudge } from '@@/server/utils/hero-story-nudges'

const ROUTE_PATH = '/api/ai/hero-discovery/nudge/end'

interface HeroNudgeDiscoveryEndBody {
  sessionId?: number
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

export default eventHandler(async (event) => {
  const getElapsed = createTimer()
  logRequest('POST', ROUTE_PATH)

  try {
    const body = await readBody<HeroNudgeDiscoveryEndBody>(event)
    const sessionId = body.sessionId

    if (!Number.isInteger(sessionId)) {
      throw createValidationError('sessionId is required')
    }

    const supabase = await serverSupabaseClient(event)
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw createUnauthorizedError()
    }

    const { data: session, error: sessionError } = await supabase
      .from('hero_discovery_sessions')
      .select('id, hero_nudge_id, hero_story_id, session_data')
      .eq('id', sessionId)
      .eq('session_type', 'experience_nudge_story')
      .single()

    if (sessionError || !session) {
      throw createValidationError('nudge discovery session not found')
    }

    const sessionData = session.session_data ?? {}
    const { error: updateError } = await supabase
      .from('hero_discovery_sessions')
      .update({
        session_status: 'completed',
        ended_at: new Date().toISOString(),
        session_data: {
          ...sessionData,
          completed_at: new Date().toISOString()
        }
      })
      .eq('id', sessionId)

    if (updateError) {
      throw updateError
    }

    if (session.hero_nudge_id) {
      await convertHeroStoryNudge(supabase, session.hero_nudge_id)
    }

    const duration = getElapsed()
    logSuccess('POST', ROUTE_PATH, duration, {
      sessionId,
      heroStoryId: session.hero_story_id
    })

    return {
      success: true,
      data: {
        sessionId,
        heroStoryId: session.hero_story_id
      }
    }
  } catch (error: unknown) {
    const apiError = error as { statusCode?: number, message?: string }
    if (apiError?.statusCode) {
      logError('POST', ROUTE_PATH, error, { kind: 'request' })
      throw error
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
          message: 'Failed to end HERO nudge discovery'
        }
      }
    })
  }
})
