/**
 * POST /api/career-id/resume/achievementEnhancer
 *
 * Enhances professional achievement descriptions using AI-powered light polish
 * to improve grammar, clarity, and action verbs while preserving original meaning.
 *
 * This endpoint accepts an experience slice (job context + achievements) and returns
 * enhanced versions of the achievement texts using GPT-4o-mini via AI Gateway.
 */

import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { ErrorCodes } from '@@/server/utils/error-handler'
import { isRequired, validateLength, validateUrl } from '@@/server/utils/validation'
import { enhanceExperienceAchievements, EnhancementError } from '@@/server/utils/achievement-enhancer'

const ROUTE_PATH = '/api/career-id/resume/achievementEnhancer'

/**
 * Request body interface for achievement enhancement
 */
interface EnhancementRequest {
  employmentType: string
  employer: string
  title: string
  url?: string
  summary?: string
  highlights: string[]
}

/**
 * Response interface for successful enhancement
 */
interface EnhancementResponse {
  success: true
  enhanced: {
    highlights: string[]
  }
  duration: number
}

/**
 * Error response interface
 */
interface EnhancementErrorResponse {
  success: false
  error: {
    code: 'TIMEOUT' | 'INVALID_INPUT' | 'AI_PROVIDER_ERROR'
    message: string
  }
}

/**
 * Validate the enhancement request body
 */
function validateEnhancementRequest(body: any): { valid: true; data: EnhancementRequest } | { valid: false; error: string; code: string } {
  // Check if body exists
  if (!body) {
    return { valid: false, error: 'Request body is required', code: 'INVALID_INPUT' }
  }

  // Validate required fields
  if (!isRequired(body.employmentType)) {
    return { valid: false, error: 'employmentType is required', code: 'INVALID_INPUT' }
  }

  if (!isRequired(body.employer)) {
    return { valid: false, error: 'employer is required', code: 'INVALID_INPUT' }
  }

  if (!isRequired(body.title)) {
    return { valid: false, error: 'title is required', code: 'INVALID_INPUT' }
  }

  if (!body.highlights || !Array.isArray(body.highlights) || body.highlights.length === 0) {
    return { valid: false, error: 'highlights must be a non-empty array of strings', code: 'INVALID_INPUT' }
  }

  // Validate each highlight
  for (let i = 0; i < body.highlights.length; i++) {
    const highlight = body.highlights[i]

    if (typeof highlight !== 'string') {
      return { valid: false, error: `highlights[${i}] must be a string`, code: 'INVALID_INPUT' }
    }

    if (!isRequired(highlight)) {
      return { valid: false, error: `highlights[${i}] cannot be empty`, code: 'INVALID_INPUT' }
    }

    // Check length (max 500 characters per achievement)
    const lengthError = validateLength(highlight, `highlights[${i}]`, 1, 500)
    if (lengthError) {
      return { valid: false, error: lengthError.message, code: 'INVALID_INPUT' }
    }
  }

  return {
    valid: true,
    data: {
      employmentType: body.employmentType,
      employer: body.employer,
      title: body.title,
      url: body.url,
      summary: body.summary,
      highlights: body.highlights
    }
  }
}


export default eventHandler(async (event) => {
  const getElapsed = createTimer()

  logRequest('POST', ROUTE_PATH)

  try {
    // Parse and validate request body
    const body = await readBody(event)
    const validation = validateEnhancementRequest(body)

    if (!validation.valid) {
      logError('POST', ROUTE_PATH, validation.error, {
        code: validation.code,
        bodyFields: Object.keys(body || {})
      })

      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        data: {
          success: false,
          error: {
            code: validation.code as any,
            message: validation.error
          }
        }
      })
    }

    const { data } = validation

    logRequest('POST', ROUTE_PATH, {
      employmentType: data.employmentType,
      employer: data.employer,
      title: data.title,
      highlightCount: data.highlights.length,
      hasUrl: !!data.url,
      hasSummary: !!data.summary
    })

    // Enhance achievements using AI
    logRequest('POST', ROUTE_PATH, { status: 'starting_enhancement' })

    const enhancedHighlights = await enhanceExperienceAchievements(data)

    const duration = getElapsed()

      logSuccess('POST', ROUTE_PATH, duration, {
        employmentType: data.employmentType,
        employer: data.employer,
        title: data.title,
        originalCount: data.highlights.length,
        enhancedCount: enhancedHighlights.length,
        duration,
        status: 'enhancement_completed'
      })

      return {
        success: true,
        enhanced: {
          highlights: enhancedHighlights
        },
        duration
      } as EnhancementResponse

  } catch (error: any) {
    // If error was already thrown by us, re-throw it
    if (error.statusCode) {
      throw error
    }

    // Handle enhancement-specific errors
    if (error instanceof EnhancementError) {
      let statusCode = 500
      let errorCode: string = ErrorCodes.INTERNAL_ERROR

      // Map enhancement error codes to HTTP status codes
      if (error.code === 'TIMEOUT') {
        statusCode = 503 // Service Unavailable
        errorCode = 'ENHANCEMENT_TIMEOUT'
      } else if (error.code === 'INVALID_INPUT') {
        statusCode = 400 // Bad Request
        errorCode = ErrorCodes.VALIDATION_ERROR
      } else if (error.code === 'AI_PROVIDER_ERROR') {
        statusCode = 503 // Service Unavailable
        errorCode = 'ENHANCEMENT_SERVICE_ERROR'
      }

      const duration = getElapsed()
      logError('POST', ROUTE_PATH, error.message, {
        code: error.code,
        duration,
        details: error.details
      })

      throw createError({
        statusCode,
        statusMessage: statusCode === 503 ? 'Service Unavailable' : 'Bad Request',
        data: {
          success: false,
          error: {
            code: errorCode,
            message: error.message
          }
        }
      })
    }

    // Handle unexpected errors
    const duration = getElapsed()
    logError('POST', ROUTE_PATH, error, {
      duration,
      message: error?.message || 'Unknown error during achievement enhancement'
    })

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      data: {
        success: false,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'Failed to enhance achievements. Please try again.'
        }
      }
    })
  }
})
