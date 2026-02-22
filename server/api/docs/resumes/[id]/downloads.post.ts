/**
 * POST /api/docs/resumes/:id/downloads
 *
 * Logs a resume download event to public.docs_generated_resume_log.
 * Called client-side after each successful PDF or DOCX export.
 * Accepts: { downloadFormat: 'pdf' | 'docx' }
 */

import { serverSupabaseClient } from '#supabase/server'
import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { handleDatabaseError, ErrorCodes } from '@@/server/utils/error-handler'

const ROUTE_PATH = '/api/docs/resumes/:id/downloads'

export default eventHandler(async (event) => {
  const getElapsed = createTimer()
  const supabase = await serverSupabaseClient(event)
  const body = await readBody(event)
  const resumeId = getRouterParam(event, 'id')

  logRequest('POST', ROUTE_PATH, { resumeId })

  if (!resumeId) {
    throw createError({
      statusCode: 400,
      data: {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Resume ID is required' }
      }
    })
  }

  if (!body.downloadFormat || !['pdf', 'docx'].includes(body.downloadFormat)) {
    throw createError({
      statusCode: 400,
      data: {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'downloadFormat must be "pdf" or "docx"' }
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

  // Look up profile_id — also verifies the resume belongs to this user via RLS
  const { data: resume, error: resumeError } = await supabase
    .from('docs_resumes')
    .select('id, profile_id')
    .eq('id', resumeId)
    .maybeSingle()

  if (resumeError) {
    logError('POST', ROUTE_PATH, resumeError, { resumeId })
    throw handleDatabaseError(resumeError, { operation: 'fetch', resource: 'resume' })
  }

  if (!resume) {
    throw createError({
      statusCode: 404,
      data: { success: false, error: { code: 'NOT_FOUND', message: 'Resume not found' } }
    })
  }

  const { error: insertError } = await supabase
    .from('docs_generated_resume_log')
    .insert({
      resume_id: resumeId,
      profile_id: resume.profile_id,
      download_format: body.downloadFormat
    })

  if (insertError) {
    logError('POST', ROUTE_PATH, insertError, { resumeId, downloadFormat: body.downloadFormat })
    throw handleDatabaseError(insertError, { operation: 'create', resource: 'download log' })
  }

  setResponseStatus(event, 201)

  const duration = getElapsed()
  logSuccess('POST', ROUTE_PATH, duration, { resumeId, downloadFormat: body.downloadFormat })

  return { success: true }
})
