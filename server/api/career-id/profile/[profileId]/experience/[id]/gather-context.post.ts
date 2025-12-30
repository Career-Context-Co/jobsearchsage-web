/**
 * POST /api/career-id/profile/:profileId/experience/:id/gather-context
 *
 * Multi-round context gathering for XYZ achievement enhancement.
 * Initial call generates comprehensive questions, follow-up calls build story notes.
 *
 * Request body:
 * {
 *   experience: { title, employer, employmentType, highlights, summary },
 *   context?: { notes: StoryNote[], answeredQuestions: [{ id, answer }, ...] }
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     questionGroups: [
 *       {
 *         category: "General Role Context",
 *         questions: [{ id: "q1", text: "..." }, ...]
 *       },
 *       ...
 *     ],
 *     notes: [{ title?, text, type }, ...]
 *   }
 * }
 */

import { serverSupabaseClient } from '#supabase/server'
import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { handleDatabaseError, createValidationError } from '@@/server/utils/error-handler'
import { isRequired, requiredFieldError } from '@@/server/utils/validation'
import { generateXYZQuestions, XYZEnhancementError } from '@@/server/utils/profile-experience-enhancer'

const ROUTE_PATH = '/api/career-id/profile/:profileId/experience/:id/gather-context'

export default eventHandler(async (event) => {
  const getElapsed = createTimer()
  const body = await readBody(event)

  const profileId = getRouterParam(event, 'profileId')
  const experienceId = getRouterParam(event, 'id')

  logRequest('POST', ROUTE_PATH, { profileId, experienceId })

  // Validate path parameters
  const validationErrors = []

  if (!isRequired(profileId)) {
    validationErrors.push(requiredFieldError('profileId'))
  }

  if (!isRequired(experienceId)) {
    validationErrors.push(requiredFieldError('experienceId'))
  }

  // Validate request body
  if (!body.experience) {
    validationErrors.push(requiredFieldError('experience'))
  }

  if (validationErrors.length > 0) {
    const error = createValidationError(validationErrors)
    logError('POST', ROUTE_PATH, error, { profileId, experienceId })
    throw error
  }

  try {
    // Generate XYZ context-gathering questions (with optional context for multi-round flow)
    const result = await generateXYZQuestions(body.experience, body.context || null)

    // Count total questions across all groups
    const totalQuestions = result.questionGroups.reduce((sum, group) => sum + group.questions.length, 0)

    const duration = getElapsed()
    logSuccess('POST', ROUTE_PATH, duration, {
      profileId,
      experienceId,
      questionGroupCount: result.questionGroups.length,
      totalQuestions,
      notesCount: result.notes.length,
      isFollowUp: !!(body.context && body.context.answeredQuestions?.length > 0)
    })

    return {
      success: true,
      data: {
        questionGroups: result.questionGroups,
        notes: result.notes
      }
    }
  } catch (error: any) {
    if (error instanceof XYZEnhancementError) {
      const statusCode = error.code === 'TIMEOUT' ? 504 : error.code === 'INVALID_INPUT' ? 400 : 500
      setResponseStatus(event, statusCode)

      logError('POST', ROUTE_PATH, error, {
        profileId,
        experienceId,
        enhancementCode: error.code,
        details: error.details
      })

      throw createError({
        statusCode,
        statusMessage: error.code === 'TIMEOUT' ? 'Request Timeout' : 'Enhancement Error',
        message: error.message,
        data: {
          code: error.code,
          details: error.details
        }
      })
    }

    // Handle unexpected errors
    logError('POST', ROUTE_PATH, error, { profileId, experienceId })
    throw error
  }
})
