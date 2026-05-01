import { serverSupabaseClient } from '#supabase/server'
import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { ErrorCodes } from '@@/server/utils/error-handler'
import { upsertSageNote, SAGE_NOTES_NOTE_TYPE } from '@@/server/utils/sage-profile-notes'

const ROUTE_PATH = '/api/ai/sage/notes'

interface SageNotesPutBody {
  profileId?: string
  targetType?: string
  targetId?: string
  noteType?: string
  content?: string
  metadata?: Record<string, any>
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
  logRequest('PUT', ROUTE_PATH)

  try {
    const body = await readBody<SageNotesPutBody>(event)
    const profileId = body?.profileId
    const targetType = body?.targetType
    const targetId = body?.targetId
    const noteType = body?.noteType
    const content = body?.content
    const metadata = body?.metadata

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

    if (typeof content !== 'string' || content.trim().length === 0) {
      throw createValidationError('content is required')
    }

    if (metadata !== undefined && (typeof metadata !== 'object' || Array.isArray(metadata) || metadata === null)) {
      throw createValidationError('metadata must be an object when provided')
    }

    const supabase = await serverSupabaseClient(event)
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw createUnauthorizedError()
    }

    const saved = await upsertSageNote(supabase, {
      userId: user.id,
      profileId,
      targetType,
      targetId,
      noteType: noteType || SAGE_NOTES_NOTE_TYPE,
      content: content.trim(),
      metadata,
    })

    const duration = getElapsed()
    logSuccess('PUT', ROUTE_PATH, duration, {
      profileId,
      targetType,
      targetId,
      noteId: saved.id,
    })

    return {
      success: true,
      data: {
        id: saved.id,
        content: saved.content,
        metadata: saved.metadata,
        updatedAt: saved.updated_at,
      },
    }
  } catch (error: any) {
    if (error?.statusCode) {
      logError('PUT', ROUTE_PATH, error, { kind: 'request' })
      throw error
    }

    const duration = getElapsed()
    logError('PUT', ROUTE_PATH, error, {
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
          message: 'Failed to save sage notes',
        },
      },
    })
  }
})
