/**
 * GET /api/career-id/profile/:profileId/contact
 * 
 * Fetches contact information for a profile.
 * Returns 404 if no contact info exists yet (one-to-one relationship).
 */

import { serverSupabaseClient } from '#supabase/server'
import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { handleDatabaseError, createNotFoundError } from '@@/server/utils/error-handler'

const ROUTE_PATH = '/api/career-id/profile/:profileId/contact'

export default eventHandler(async (event) => {
  const getElapsed = createTimer()
  const supabase = await serverSupabaseClient(event)
  
  // Get profile_id from URL path parameter
  const profileId = getRouterParam(event, 'profileId')
  
  logRequest('GET', ROUTE_PATH, { profileId })
  
  // Fetch contact info (one-to-one relationship with profile)
  const { data, error } = await supabase
    .schema('career_id')
    .from('contact_info')
    .select('*')
    .eq('profile_id', profileId)
    .maybeSingle()
  
  if (error) {
    logError('GET', ROUTE_PATH, error, { profileId, dbCode: error.code })
    throw handleDatabaseError(error, { operation: 'fetch', resource: 'contact information' })
  }
  
  // Return 404 if no contact info exists
  if (!data) {
    const notFoundError = createNotFoundError('Contact information')
    logError('GET', ROUTE_PATH, notFoundError, { profileId })
    throw notFoundError
  }
  
  const duration = getElapsed()
  logSuccess('GET', ROUTE_PATH, duration, { profileId, contactId: data.id })
  
  return {
    success: true,
    data
  }
})
