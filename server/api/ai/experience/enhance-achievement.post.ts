import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { ErrorCodes } from '@@/server/utils/error-handler'
import {
  generateAchievementQuestions,
  generateImprovedBullet,
  SageExperienceEnhancementError,
  type SageAchievementExperience,
  type SageAchievementAnswer,
} from '@@/server/utils/sage-experience-enhancer'

const ROUTE_PATH = '/api/ai/experience/enhance-achievement'

interface EnhanceAchievementBody {
  experience?: SageAchievementExperience
  bullet?: string
  answers?: SageAchievementAnswer[]
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
    const body = await readBody<EnhanceAchievementBody>(event)
    const experience = body?.experience
    const bullet = body?.bullet
    const answers = body?.answers

    if (!experience || typeof experience !== 'object') {
      throw createValidationError('experience is required')
    }

    if (!bullet || typeof bullet !== 'string' || bullet.trim().length === 0) {
      throw createValidationError('bullet is required')
    }

    const isQuestionsPhase = !Array.isArray(answers) || answers.length === 0

    if (isQuestionsPhase) {
      const questions = await generateAchievementQuestions(experience, bullet)
      const duration = getElapsed()

      logSuccess('POST', ROUTE_PATH, duration, {
        phase: 'questions',
        questionCount: questions.length,
      })

      return {
        success: true,
        data: {
          phase: 'questions',
          questions,
        },
      }
    }

    const improvedBullet = await generateImprovedBullet(experience, bullet, answers)
    const duration = getElapsed()

    logSuccess('POST', ROUTE_PATH, duration, {
      phase: 'result',
    })

    return {
      success: true,
      data: {
        phase: 'result',
        improvedBullet,
      },
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
          message: 'Failed to enhance achievement',
        },
      },
    })
  }
})
