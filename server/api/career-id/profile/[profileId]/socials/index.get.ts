/**
 * GET /api/career-id/profile/:profileId/socials
 * 
 * Fetches all social links for a profile.
 */

import { serverSupabaseClient } from '#supabase/server'
import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { handleDatabaseError } from '@@/server/utils/error-handler'

const ROUTE_PATH = '/api/career-id/profile/:profileId/socials'

export default eventHandler(async (event) => {
  const getElapsed = createTimer()
  const supabase = await serverSupabaseClient(event)
  
  // Get profile_id from URL path parameter
  const profileId = getRouterParam(event, 'profileId')
  
  logRequest('GET', ROUTE_PATH, { profileId })
  
  // Fetch social links for the profile
  const { data, error } = await supabase
    .schema('career_id')
    .from('profile_social_links')
    .select('*')
    .eq('profile_id', profileId)
    .order('display_order', { ascending: true })
  
  if (error) {
    logError('GET', ROUTE_PATH, error, { profileId, dbCode: error.code })
    throw handleDatabaseError(error, { operation: 'fetch', resource: 'social links' })
  }
  
  const duration = getElapsed()
  logSuccess('GET', ROUTE_PATH, duration, { profileId, count: data?.length ?? 0 })
  
  return {
    success: true,
    data: data || []
  }
})
