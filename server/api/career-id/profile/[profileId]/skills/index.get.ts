/**
 * GET /api/career-id/profile/:profileId/skills
 * 
 * Fetches all skills for a profile.
 * Returns name for display (what user typed).
 * skill_id may be null if not yet matched to reference catalog by background job.
 */

import { serverSupabaseClient } from '#supabase/server'
import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { handleDatabaseError } from '@@/server/utils/error-handler'

const ROUTE_PATH = '/api/career-id/profile/:profileId/skills'

export default eventHandler(async (event) => {
  const getElapsed = createTimer()
  const supabase = await serverSupabaseClient(event)
  
  // Get profile_id from URL path parameter
  const profileId = getRouterParam(event, 'profileId')
  
  logRequest('GET', ROUTE_PATH, { profileId })
  
  // Fetch profile skills
  // name is always populated (what user typed)
  // skill_id may be null if not yet matched by background job
  const { data, error } = await supabase
    .schema('career_id')
    .from('profile_skills')
    .select(`
      id,
      profile_id,
      skill_id,
      name,
      proficiency_level,
      years_experience,
      display_order,
      created_at,
      updated_at
    `)
    .eq('profile_id', profileId)
    .order('display_order', { ascending: true })
  
  if (error) {
    logError('GET', ROUTE_PATH, error, { profileId, dbCode: error.code })
    throw handleDatabaseError(error, { operation: 'fetch', resource: 'skills' })
  }
  
  const duration = getElapsed()
  logSuccess('GET', ROUTE_PATH, duration, { profileId, count: data?.length ?? 0 })
  
  return {
    success: true,
    data: data || []
  }
})
