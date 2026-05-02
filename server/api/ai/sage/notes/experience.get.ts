import { serverSupabaseClient } from '#supabase/server'
import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { ErrorCodes } from '@@/server/utils/error-handler'
import { getSageNotesForProfileTarget, SAGE_NOTES_NOTE_TYPE, SAGE_NOTES_TARGET_TYPE } from '@@/server/utils/sage-profile-notes'

const ROUTE_PATH = '/api/ai/sage/notes/experience'

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

    const notes = await getSageNotesForProfileTarget(supabase, {
      userId: user.id,
      profileId,
      targetType: SAGE_NOTES_TARGET_TYPE,
      noteType: SAGE_NOTES_NOTE_TYPE
    })

    const duration = getElapsed()
    logSuccess('GET', ROUTE_PATH, duration, {
      profileId,
      noteCount: notes.length
    })

    return {
      success: true,
      data: notes.map(note => ({
        targetId: note.target_id,
        content: note.content,
        updatedAt: note.updated_at
      }))
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
          message: 'Failed to fetch experience sage notes'
        }
      }
    })
  }
})
