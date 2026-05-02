import { serverSupabaseClient } from '#supabase/server'
import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { ErrorCodes } from '@@/server/utils/error-handler'
import {
  detectHeroSignal,
  SageExperienceEnhancementError,
  type SageHeroSignalExperience
} from '@@/server/utils/sage-experience-enhancer'
import { getOrCreateHeroNudgeResult } from '@@/server/utils/hero-story-nudges'

const ROUTE_PATH = '/api/ai/experience/hero-nudge'

interface HeroNudgeRequestBody {
  profileId?: string
  experienceId?: number
  experience?: SageHeroSignalExperience & {
    id?: number | string
  }
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

function normalizeExperienceId(body: HeroNudgeRequestBody) {
  const rawId = body.experienceId ?? body.experience?.id
  const parsed = typeof rawId === 'string' ? Number(rawId) : rawId

  return Number.isInteger(parsed) ? parsed as number : null
}

export default eventHandler(async (event) => {
  const getElapsed = createTimer()
  logRequest('POST', ROUTE_PATH)

  try {
    const body = await readBody<HeroNudgeRequestBody>(event)
    const profileId = body?.profileId
    const experience = body?.experience
    const experienceId = normalizeExperienceId(body)

    if (!profileId || typeof profileId !== 'string') {
      throw createValidationError('profileId is required')
    }

    if (!experience || typeof experience !== 'object') {
      throw createValidationError('experience is required')
    }

    if (experienceId === null) {
      throw createValidationError('experienceId is required')
    }

    const supabase = await serverSupabaseClient(event)
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw createUnauthorizedError()
    }

    const result = await getOrCreateHeroNudgeResult(
      supabase,
      {
        profileId,
        experienceId,
        experience
      },
      () => detectHeroSignal(experience)
    )
    const duration = getElapsed()

    logSuccess('POST', ROUTE_PATH, duration, {
      profileId,
      experienceId,
      nudge: result.nudge,
      nudgeId: result.nudge ? result.id : null
    })

    return {
      success: true,
      data: result
    }
  } catch (error: unknown) {
    const apiError = error as { statusCode?: number, message?: string }
    if (apiError?.statusCode) {
      logError('POST', ROUTE_PATH, error, { kind: 'validation' })
      throw error
    }

    if (error instanceof SageExperienceEnhancementError) {
      const statusCode = error.code === 'TIMEOUT' ? 504 : error.code === 'INVALID_INPUT' ? 400 : 503
      const errorCode = error.code === 'INVALID_INPUT' ? ErrorCodes.VALIDATION_ERROR : error.code

      logError('POST', ROUTE_PATH, error.message, {
        enhancementCode: error.code,
        details: error.details
      })

      throw createError({
        statusCode,
        statusMessage: statusCode === 504 ? 'Request Timeout' : statusCode === 400 ? 'Bad Request' : 'Service Unavailable',
        data: {
          success: false,
          error: {
            code: errorCode,
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
          message: 'Failed to run hero nudge check'
        }
      }
    })
  }
})
