/**
 * POST /api/career-id/profile/:profileId/experience/:id/enhance-achievements
 *
 * Generates XYZ-format achievement bullets from story notes.
 * Uses the Bullet Writing Prompt to create compelling, quantified achievements
 * following the XYZ formula: "Accomplished [X] as measured by [Y] by doing [Z]"
 *
 * Request body:
 * {
 *   experience: { title, employer, employmentType },
 *   notes: [{ title?, text, type }, ...]
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     bullets: [
 *       { primary: "...", secondary: "..." },
 *       ...
 *     ]
 *   }
 * }
 */

import { serverSupabaseClient } from '#supabase/server'
import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { handleDatabaseError, createValidationError } from '@@/server/utils/error-handler'
import { isRequired, requiredFieldError } from '@@/server/utils/validation'
import { generateXYZBullets, XYZEnhancementError, type StoryNote } from '@@/server/utils/profile-experience-enhancer'

const ROUTE_PATH = '/api/career-id/profile/:profileId/experience/:id/enhance-achievements'

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

  if (!Array.isArray(body.notes)) {
    validationErrors.push(requiredFieldError('notes'))
  }

  if (body.notes && body.notes.length === 0) {
    validationErrors.push({
      field: 'notes',
      message: 'notes array must contain at least one story note - complete context gathering first'
    })
  }

  if (validationErrors.length > 0) {
    const error = createValidationError(validationErrors)
    logError('POST', ROUTE_PATH, error, { profileId, experienceId })
    throw error
  }

  try {
    // Generate XYZ-format achievement bullets from story notes
    const bulletPairs = await generateXYZBullets(body.experience, body.notes as StoryNote[])

    const duration = getElapsed()
    logSuccess('POST', ROUTE_PATH, duration, {
      profileId,
      experienceId,
      bulletPairCount: bulletPairs.length,
      notesCount: body.notes.length
    })

    return {
      success: true,
      data: {
        bullets: bulletPairs
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
