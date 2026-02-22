/**
 * GET /api/docs/resumes
 *
 * Lists all resumes for the currently authenticated user's profile.
 * Returns id, title, created_at, updated_at for each resume.
 */

import { serverSupabaseClient } from '#supabase/server'
import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { handleDatabaseError, ErrorCodes } from '@@/server/utils/error-handler'

const ROUTE_PATH = '/api/docs/resumes'

export default eventHandler(async (event) => {
  const getElapsed = createTimer()

  logRequest('GET', ROUTE_PATH)

  const supabase = await serverSupabaseClient(event)

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
    logError('GET', ROUTE_PATH, profileError, { userId: user.id })
    throw handleDatabaseError(profileError, { operation: 'fetch', resource: 'profile' })
  }

  if (!profileRow) {
    return { success: true, data: [] }
  }

  const profileId = profileRow.id

  const { data, error } = await supabase
    .from('docs_resumes')
    .select('id, title, created_at, updated_at')
    .eq('profile_id', profileId)
    .order('updated_at', { ascending: false })

  if (error) {
    logError('GET', ROUTE_PATH, error, { profileId })
    throw handleDatabaseError(error, { operation: 'fetch', resource: 'resumes' })
  }

  const duration = getElapsed()
  logSuccess('GET', ROUTE_PATH, duration, { profileId, count: data.length })

  return {
    success: true,
    data: (data || []).map(row => ({
      id: row.id,
      title: row.title,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }))
  }
})
