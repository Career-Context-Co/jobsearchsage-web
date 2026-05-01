import { serverSupabaseClient } from '#supabase/server'
import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { ErrorCodes } from '@@/server/utils/error-handler'
import { getSageNote, SAGE_NOTES_NOTE_TYPE } from '@@/server/utils/sage-profile-notes'

const ROUTE_PATH = '/api/ai/sage/notes'

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

function createUnauthorizedError() {
  return createError({
    statusCode: 401,
    statusMessage: 'Unauthorized',
    data: {
      success: false,
      error: {
        code: ErrorCodes.UNAUTHORIZED,
        message: 'Not authenticated',
      },
    },
  })
}

export default eventHandler(async (event) => {
  const getElapsed = createTimer()
  logRequest('GET', ROUTE_PATH)

  try {
    const query = getQuery(event)
    const profileId = query.profileId
    const targetType = query.targetType
    const targetId = query.targetId
    const noteType = query.noteType

    if (!profileId || typeof profileId !== 'string') {
      throw createValidationError('profileId is required')
    }

    if (!targetType || typeof targetType !== 'string') {
      throw createValidationError('targetType is required')
    }

    if (!targetId || typeof targetId !== 'string') {
      throw createValidationError('targetId is required')
    }

    if (noteType !== undefined && typeof noteType !== 'string') {
      throw createValidationError('noteType must be a string when provided')
    }

    const supabase = await serverSupabaseClient(event)
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw createUnauthorizedError()
    }

    const note = await getSageNote(supabase, {
      userId: user.id,
      profileId,
      targetType,
      targetId,
      noteType: noteType || SAGE_NOTES_NOTE_TYPE,
    })

    const duration = getElapsed()
    logSuccess('GET', ROUTE_PATH, duration, {
      profileId,
      targetType,
      targetId,
      hasContent: !!note?.content,
    })

    return {
      success: true,
      data: {
        content: note?.content ?? null,
        updatedAt: note?.updated_at ?? null,
      },
    }
  } catch (error: any) {
    if (error?.statusCode) {
      logError('GET', ROUTE_PATH, error, { kind: 'request' })
      throw error
    }

    const duration = getElapsed()
    logError('GET', ROUTE_PATH, error, {
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
          message: 'Failed to fetch sage notes',
        },
      },
    })
  }
})
