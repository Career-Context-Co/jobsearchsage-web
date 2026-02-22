/**
 * GET /api/career-id/profile/:profileId/skills
 *
 * Fetches all skills for a profile from the JSONB skills column.
 * Returns the skills array directly — items are already in camelCase.
 */

import { serverSupabaseClient } from '#supabase/server'
import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { handleDatabaseError } from '@@/server/utils/error-handler'

const ROUTE_PATH = '/api/career-id/profile/:profileId/skills'

export default eventHandler(async (event) => {
  const getElapsed = createTimer()
  const supabase = await serverSupabaseClient(event)

  const profileId = getRouterParam(event, 'profileId')

  logRequest('GET', ROUTE_PATH, { profileId })

  const { data, error } = await supabase
    .schema('career_id')
    .from('profile_skills')
    .select('skills')
    .eq('profile_id', profileId)
    .maybeSingle()

  if (error) {
    logError('GET', ROUTE_PATH, error, { profileId, dbCode: error.code })
    throw handleDatabaseError(error, { operation: 'fetch', resource: 'skills' })
  }

  const skills = data?.skills || []

  const duration = getElapsed()
  logSuccess('GET', ROUTE_PATH, duration, { profileId, count: skills.length })

  return {
    success: true,
    data: skills
  }
})
