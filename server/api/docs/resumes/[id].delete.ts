/**
 * DELETE /api/docs/resumes/:id
 *
 * Deletes a resume record.
 * Returns 404 when resume is missing or not owned by the user.
 */
import { serverSupabaseClient } from '#supabase/server'
import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { handleDatabaseError, ErrorCodes } from '@@/server/utils/error-handler'

const ROUTE_PATH = '/api/docs/resumes/:id'

export default eventHandler(async (event) => {
  const getElapsed = createTimer()
  const supabase = await serverSupabaseClient(event)
  const resumeId = getRouterParam(event, 'id')

  logRequest('DELETE', ROUTE_PATH, { resumeId })

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

  const { data: profileRow, error: profileError } = await (supabase as any)
    .schema('career_id')
    .from('profiles')
    .select('id')
    .eq('jss_user_id', user.id)
    .maybeSingle()

  if (profileError) {
    logError('DELETE', ROUTE_PATH, profileError, { userId: user.id })
    throw handleDatabaseError(profileError, { operation: 'fetch', resource: 'profile' })
  }

  if (!profileRow) {
    throw createError({
      statusCode: 404,
      data: { success: false, error: { code: 'NOT_FOUND', message: 'Profile not found' } }
    })
  }

  const { data, error } = await supabase
    .from('docs_resumes')
    .delete()
    .eq('id', resumeId)
    .eq('profile_id', profileRow.id)
    .select('id')

  if (error) {
    logError('DELETE', ROUTE_PATH, error, { resumeId })
    throw handleDatabaseError(error, { operation: 'delete', resource: 'resume' })
  }

  if (!data || data.length === 0) {
    throw createError({
      statusCode: 404,
      data: { success: false, error: { code: 'NOT_FOUND', message: 'Resume not found' } }
    })
  }

  const duration = getElapsed()
  logSuccess('DELETE', ROUTE_PATH, duration, { resumeId })

  return { success: true }
})
