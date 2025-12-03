/**
 * GET /api/career-id/profile/:profileId/experience
 * 
 * Fetches all experience entries for a profile.
 */

import { serverSupabaseClient } from '#supabase/server'
import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { handleDatabaseError } from '@@/server/utils/error-handler'
import { transformExperience } from '@@/server/utils/career-id-transformer'

const ROUTE_PATH = '/api/career-id/profile/:profileId/experience'

export default eventHandler(async (event) => {
  const getElapsed = createTimer()
  const supabase = await serverSupabaseClient(event)
  
  // Get profile_id from URL path parameter
  const profileId = getRouterParam(event, 'profileId')
  
  logRequest('GET', ROUTE_PATH, { profileId })
  
  // Fetch all experience entries for the profile
  const { data, error } = await supabase
    .schema('career_id')
    .from('experience')
    .select('*')
    .eq('profile_id', profileId)
    .order('display_order', { ascending: true })
  
  if (error) {
    logError('GET', ROUTE_PATH, error, { profileId, dbCode: error.code })
    throw handleDatabaseError(error, { operation: 'fetch', resource: 'experience entries' })
  }
  
  const duration = getElapsed()
  logSuccess('GET', ROUTE_PATH, duration, { profileId, count: data?.length ?? 0 })
  
  // Transform snake_case to camelCase before returning
  const transformedData = (data || []).map(transformExperience)
  
  return {
    success: true,
    data: transformedData
  }
})
