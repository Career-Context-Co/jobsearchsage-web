import { serverSupabaseClient } from '#supabase/server'
import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { ErrorCodes } from '@@/server/utils/error-handler'
import { declineHeroStoryNudge, mapHeroStoryNudge } from '@@/server/utils/hero-story-nudges'

const ROUTE_PATH = '/api/ai/experience/hero-nudge/:id/decline'

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
  const nudgeId = getRouterParam(event, 'id')

  logRequest('POST', ROUTE_PATH, { nudgeId })

  try {
    if (!nudgeId) {
      throw createValidationError('nudge id is required')
    }

    const supabase = await serverSupabaseClient(event)
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw createUnauthorizedError()
    }

    const declined = await declineHeroStoryNudge(supabase, nudgeId)
    const duration = getElapsed()

    logSuccess('POST', ROUTE_PATH, duration, {
      nudgeId,
      profileId: declined.profile_id
    })

    return {
      success: true,
      data: mapHeroStoryNudge(declined)
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
          message: 'Failed to decline hero nudge'
        }
      }
    })
  }
})
