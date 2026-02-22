/**
 * PUT /api/docs/resumes/:id
 *
 * Saves the current editor state to the resume record.
 * Accepts `content` (JSONB) and `designSettings` (JSONB).
 * Replaces both columns wholesale. Updates updated_at.
 */

import { serverSupabaseClient } from '#supabase/server'
import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { handleDatabaseError, createNotFoundError, ErrorCodes } from '@@/server/utils/error-handler'

const ROUTE_PATH = '/api/docs/resumes/:id'

export default eventHandler(async (event) => {
  const getElapsed = createTimer()
  const supabase = await serverSupabaseClient(event)
  const body = await readBody(event)
  const resumeId = getRouterParam(event, 'id')

  logRequest('PUT', ROUTE_PATH, { resumeId })

  if (!resumeId) {
    throw createError({
      statusCode: 400,
      data: {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Resume ID is required' }
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

  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString()
  }

  if (body.title !== undefined && typeof body.title === 'string' && body.title.trim()) {
    updatePayload.title = body.title.trim()
  }

  if (body.content !== undefined) {
    updatePayload.content = body.content
  }

  if (body.designSettings !== undefined) {
    updatePayload.design_settings = body.designSettings
  }

  const { data, error } = await supabase
    .from('docs_resumes')
    .update(updatePayload)
    .eq('id', resumeId)
    .select('id, title, updated_at')
    .maybeSingle()

  if (error) {
    logError('PUT', ROUTE_PATH, error, { resumeId })
    throw handleDatabaseError(error, { operation: 'update', resource: 'resume' })
  }

  if (!data) {
    throw createNotFoundError('Resume')
  }

  const duration = getElapsed()
  logSuccess('PUT', ROUTE_PATH, duration, { resumeId })

  return {
    success: true,
    data: {
      id: data.id,
      title: data.title,
      updatedAt: data.updated_at
    }
  }
})
