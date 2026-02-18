/**
 * GET /api/auth/session
 *
 * Returns the current user's session data including name fields and profileId.
 * Used for hydrating auth state on app init.
 * Always returns 200 — profileId is null if user has no career profile yet.
 */

import { serverSupabaseClient } from '#supabase/server'
import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { ErrorCodes } from '@@/server/utils/error-handler'

const ROUTE_PATH = '/api/auth/session'

export default eventHandler(async (event) => {
  const getElapsed = createTimer()

  logRequest('GET', ROUTE_PATH)

  const supabase = await serverSupabaseClient(event)

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    logError('GET', ROUTE_PATH, userError || new Error('No user'))
    throw createError({
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

  // Look up user record in public.users for name fields and profileId
  const { data: publicUser, error: publicUserError } = await supabase
    .from('users')
    .select('first_name, last_name, preferred_name, career_id_profile_id')
    .eq('id', user.id)
    .maybeSingle()

  if (publicUserError) {
    logError('GET', ROUTE_PATH, publicUserError, { userId: user.id })
  }

  const duration = getElapsed()
  logSuccess('GET', ROUTE_PATH, duration, {
    userId: user.id,
    profileId: publicUser?.career_id_profile_id ?? null
  })

  return {
    success: true,
    data: {
      profileId: publicUser?.career_id_profile_id ?? null,
      firstName: publicUser?.first_name ?? null,
      lastName: publicUser?.last_name ?? null,
      preferredName: publicUser?.preferred_name ?? null
    }
  }
})
