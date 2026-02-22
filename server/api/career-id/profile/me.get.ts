/**
 * GET /api/career-id/profile/me
 *
 * Returns the full profile for the currently authenticated user by looking up
 * their jss_user_id in career_id.profiles — the authoritative source.
 * Returns 404 if no profile exists yet (caller should redirect to onboarding).
 */

import { serverSupabaseClient } from '#supabase/server'
import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { createNotFoundError, handleDatabaseError, ErrorCodes } from '@@/server/utils/error-handler'
import { transformProfileResponse } from '@@/server/utils/career-id-transformer'

const ROUTE_PATH = '/api/career-id/profile/me'

export default eventHandler(async (event) => {
  const getElapsed = createTimer()

  logRequest('GET', ROUTE_PATH)

  const supabase = await serverSupabaseClient(event)

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    logError('GET', ROUTE_PATH, userError || new Error('Not authenticated'))
    throw createError({
      statusCode: 401,
      data: {
        success: false,
        error: { code: ErrorCodes.UNAUTHORIZED, message: 'Not authenticated' }
      }
    })
  }

  // Find the user's profile by jss_user_id — never trust a client-supplied profileId here
  const { data: profileRow, error: lookupError } = await (supabase as any)
    .schema('career_id')
    .from('profiles')
    .select('id')
    .eq('jss_user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (lookupError) {
    logError('GET', ROUTE_PATH, lookupError, { userId: user.id, dbCode: lookupError.code })
    throw handleDatabaseError(lookupError, { operation: 'fetch', resource: 'profile' })
  }

  if (!profileRow) {
    throw createNotFoundError('Profile')
  }

  const profileId = profileRow.id

  // Fetch the full profile via the existing RPC
  const { data, error } = await (supabase as any)
    .schema('career_id')
    .rpc('get_full_profile', { p_profile_id: profileId })

  if (error) {
    logError('GET', ROUTE_PATH, error, { userId: user.id, profileId, dbCode: error.code })
    throw handleDatabaseError(error, { operation: 'fetch', resource: 'complete profile' })
  }

  if (!data) {
    throw createNotFoundError('Profile')
  }

  const duration = getElapsed()
  logSuccess('GET', ROUTE_PATH, duration, { userId: user.id, profileId })

  return {
    success: true,
    data: transformProfileResponse(data)
  }
})
