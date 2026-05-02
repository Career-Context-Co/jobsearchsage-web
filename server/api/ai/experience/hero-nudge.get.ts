import { serverSupabaseClient } from '#supabase/server'
import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { ErrorCodes } from '@@/server/utils/error-handler'
import { getActiveHeroNudgesForProfile, mapHeroStoryNudge } from '@@/server/utils/hero-story-nudges'

const ROUTE_PATH = '/api/ai/experience/hero-nudge'

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
  logRequest('GET', ROUTE_PATH)

  try {
    const query = getQuery(event)
    const profileId = query.profileId

    if (!profileId || typeof profileId !== 'string') {
      throw createValidationError('profileId is required')
    }

    const supabase = await serverSupabaseClient(event)
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw createUnauthorizedError()
    }

    const nudges = await getActiveHeroNudgesForProfile(supabase, profileId)
    const duration = getElapsed()

    logSuccess('GET', ROUTE_PATH, duration, {
      profileId,
      nudgeCount: nudges.length
    })

    return {
      success: true,
      data: nudges.map(mapHeroStoryNudge)
    }
  } catch (error: unknown) {
    const apiError = error as { statusCode?: number, message?: string }
    if (apiError?.statusCode) {
      logError('GET', ROUTE_PATH, error, { kind: 'request' })
      throw error
    }

    const duration = getElapsed()
    logError('GET', ROUTE_PATH, error, {
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
          message: 'Failed to fetch hero nudges'
        }
      }
    })
  }
})
