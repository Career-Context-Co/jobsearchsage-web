import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { ErrorCodes } from '@@/server/utils/error-handler'
import {
  conductInterview,
  SageExperienceEnhancementError,
  type SageInterviewMode,
  type SageInterviewExperience,
  type SageInterviewMessage,
} from '@@/server/utils/sage-experience-enhancer'

const ROUTE_PATH = '/api/ai/experience/interview'

interface InterviewRequestBody {
  mode?: SageInterviewMode
  experience?: SageInterviewExperience
  conversationHistory?: SageInterviewMessage[]
}

function createValidationError(message: string) {
  return createError({
    statusCode: 400,
    statusMessage: 'Bad Request',
    data: {
      success: false,
      error: {
        code: ErrorCodes.VALIDATION_ERROR,
        message,
      },
    },
  })
}

export default eventHandler(async (event) => {
  const getElapsed = createTimer()
  logRequest('POST', ROUTE_PATH)

  try {
    const body = await readBody<InterviewRequestBody>(event)
    const mode = body?.mode
    const experience = body?.experience
    const conversationHistory = body?.conversationHistory

    if (!mode || (mode !== 'notes_help' && mode !== 'role_summary')) {
      throw createValidationError('mode must be one of: notes_help, role_summary')
    }

    if (!experience || typeof experience !== 'object') {
      throw createValidationError('experience is required')
    }

    if (!Array.isArray(conversationHistory)) {
      throw createValidationError('conversationHistory is required and must be an array')
    }

    const result = await conductInterview(mode, experience, conversationHistory)
    const duration = getElapsed()

    logSuccess('POST', ROUTE_PATH, duration, {
      mode,
      done: result.done,
      userTurns: conversationHistory.filter((entry) => entry.role === 'user').length,
    })

    return {
      success: true,
      data: result,
    }
  } catch (error: any) {
    if (error?.statusCode) {
      logError('POST', ROUTE_PATH, error, { kind: 'validation' })
      throw error
    }

    if (error instanceof SageExperienceEnhancementError) {
      const statusCode = error.code === 'TIMEOUT' ? 504 : error.code === 'INVALID_INPUT' ? 400 : 503
      const errorCode = error.code === 'INVALID_INPUT' ? ErrorCodes.VALIDATION_ERROR : error.code

      logError('POST', ROUTE_PATH, error.message, {
        enhancementCode: error.code,
        details: error.details,
      })

      throw createError({
        statusCode,
        statusMessage: statusCode === 504 ? 'Request Timeout' : statusCode === 400 ? 'Bad Request' : 'Service Unavailable',
        data: {
          success: false,
          error: {
            code: errorCode,
            message: error.message,
          },
        },
      })
    }

    const duration = getElapsed()
    logError('POST', ROUTE_PATH, error, {
      duration,
      message: error?.message || 'Unknown error',
    })

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      data: {
        success: false,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'Failed to conduct interview',
        },
      },
    })
  }
})
