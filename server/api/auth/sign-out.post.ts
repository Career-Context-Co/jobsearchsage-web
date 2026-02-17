/**
 * POST /api/auth/sign-out
 * 
 * Signs out the current user by invalidating their session.
 */

import { serverSupabaseClient } from '#supabase/server'
import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { ErrorCodes } from '@@/server/utils/error-handler'

const ROUTE_PATH = '/api/auth/sign-out'

export default eventHandler(async (event) => {
  const getElapsed = createTimer()
  
  logRequest('POST', ROUTE_PATH)
  
  const supabase = await serverSupabaseClient(event)
  
  // Sign out the user
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    logError('POST', ROUTE_PATH, error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      data: {
        success: false,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'Failed to sign out'
        }
      }
    })
  }
  
  const duration = getElapsed()
  logSuccess('POST', ROUTE_PATH, duration)
  
  return {
    success: true,
    message: 'Signed out successfully'
  }
})
