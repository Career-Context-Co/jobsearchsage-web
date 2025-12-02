/**
 * GET /api/reference/social-platforms
 * 
 * Fetches all available social platforms from the reference catalog.
 * Used for dropdowns/selection UI.
 */

import { serverSupabaseClient } from '#supabase/server'
import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { handleDatabaseError } from '@@/server/utils/error-handler'

const ROUTE_PATH = '/api/reference/social-platforms'

export default eventHandler(async (event) => {
  const getElapsed = createTimer()
  const supabase = await serverSupabaseClient(event)
  
  logRequest('GET', ROUTE_PATH)
  
  // Fetch all social platforms from reference catalog
  const { data, error } = await supabase
    .schema('reference')
    .from('social_platforms')
    .select('*')
    .order('display_name', { ascending: true })
  
  if (error) {
    logError('GET', ROUTE_PATH, error, { dbCode: error.code })
    throw handleDatabaseError(error, { operation: 'fetch', resource: 'social platforms' })
  }
  
  const duration = getElapsed()
  logSuccess('GET', ROUTE_PATH, duration, { count: data?.length ?? 0 })
  
  return {
    success: true,
    data: data || []
  }
})
