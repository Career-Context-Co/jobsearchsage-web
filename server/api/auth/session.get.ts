/**
 * GET /api/auth/session
 * 
 * Returns the current user's session data including profileId.
 * Used for hydrating auth state on app init.
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
  
  // Look up user's profileId using the auth_user_id foreign key
  const { data: profile, error: profileError } = await supabase
    .schema('career_id')
    .from('profiles')
    .select('id')
    .eq('auth_user_id', user.id)
    .maybeSingle()
  
  if (profileError || !profile) {
    logError('GET', ROUTE_PATH, profileError || new Error('No profile found'))
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found',
      data: {
        success: false,
        error: {
          code: ErrorCodes.NOT_FOUND,
          message: 'Profile not found for user'
        }
      }
    })
  }
  
  const duration = getElapsed()
  logSuccess('GET', ROUTE_PATH, duration, { 
    userId: user.id,
    profileId: profile.id
  })
  
  return {
    success: true,
    data: {
      profileId: profile.id
    }
  }
})
