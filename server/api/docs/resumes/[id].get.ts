/**
 * GET /api/docs/resumes/:id
 *
 * Loads a single resume record by integer ID for the authenticated user.
 * Returns id, title, content_snapshot, design_settings, created_at, updated_at.
 */

import { serverSupabaseClient } from '#supabase/server'
import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { handleDatabaseError, createNotFoundError, ErrorCodes } from '@@/server/utils/error-handler'

const ROUTE_PATH = '/api/docs/resumes/:id'

export default eventHandler(async (event) => {
  const getElapsed = createTimer()
  const supabase = await serverSupabaseClient(event)
  const idParam = getRouterParam(event, 'id')
  const resumeId = Number(idParam)

  logRequest('GET', ROUTE_PATH, { resumeId })

  if (!resumeId || isNaN(resumeId)) {
    throw createError({
      statusCode: 400,
      data: {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid resume ID' }
      }
    })
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    throw createError({
      statusCode: 401,
      data: {
        success: false,
        error: { code: ErrorCodes.UNAUTHORIZED, message: 'Not authenticated' }
      }
    })
  }

  const { data, error } = await supabase
    .from('docs_resumes')
    .select('id, title, content_snapshot, design_settings, created_at, updated_at')
    .eq('id', resumeId)
    .maybeSingle()

  if (error) {
    logError('GET', ROUTE_PATH, error, { resumeId })
    throw handleDatabaseError(error, { operation: 'fetch', resource: 'resume' })
  }

  if (!data) {
    throw createNotFoundError('Resume')
  }

  const duration = getElapsed()
  logSuccess('GET', ROUTE_PATH, duration, { resumeId })

  return {
    success: true,
    data: {
      id: data.id,
      title: data.title,
      contentSnapshot: data.content_snapshot,
      designSettings: data.design_settings,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  }
})
