import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { ErrorCodes } from '@@/server/utils/error-handler'
import {
  detectHeroSignal,
  SageExperienceEnhancementError,
  type SageHeroSignalExperience
} from '@@/server/utils/sage-experience-enhancer'

const ROUTE_PATH = '/api/ai/experience/hero-nudge'

interface HeroNudgeRequestBody {
  experience?: SageHeroSignalExperience
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

export default eventHandler(async (event) => {
  const getElapsed = createTimer()
  logRequest('POST', ROUTE_PATH)

  try {
    const body = await readBody<HeroNudgeRequestBody>(event)
    const experience = body?.experience

    if (!experience || typeof experience !== 'object') {
      throw createValidationError('experience is required')
    }

    const result = await detectHeroSignal(experience)
    const duration = getElapsed()

    logSuccess('POST', ROUTE_PATH, duration, {
      nudge: result.nudge
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
