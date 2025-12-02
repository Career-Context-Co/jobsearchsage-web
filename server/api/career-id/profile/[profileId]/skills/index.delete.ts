/**
 * DELETE /api/career-id/profile/:profileId/skills
 * 
 * Removes multiple skills from the profile (bulk delete operation).
 * Accepts an array of skill IDs to delete (deletes from profile_skills junction table).
 * Does NOT delete from reference.skills catalog.
 */

import { serverSupabaseClient } from '#supabase/server'
import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { handleDatabaseError, createValidationError, ErrorCodes } from '@@/server/utils/error-handler'

const ROUTE_PATH = '/api/career-id/profile/:profileId/skills'

export default eventHandler(async (event) => {
  const getElapsed = createTimer()
  const supabase = await serverSupabaseClient(event)
  const profileId = getRouterParam(event, 'profileId')
  const body = await readBody(event)
  
  logRequest('DELETE', ROUTE_PATH, { profileId })
  
  // Ensure body.ids is an array
  const ids = Array.isArray(body?.ids) ? body.ids : (body?.ids ? [body.ids] : [])
  
  if (ids.length === 0) {
    const error = createValidationError({
      field: 'ids',
      message: 'At least one skill ID is required',
      code: ErrorCodes.REQUIRED
    })
    logError('DELETE', ROUTE_PATH, error, { profileId })
    throw error
  }
  
  // Delete multiple skills from profile_skills junction table
  const { error, count } = await supabase
    .schema('career_id')
    .from('profile_skills')
    .delete({ count: 'exact' })
    .eq('profile_id', profileId)
    .in('id', ids)
  
  if (error) {
    logError('DELETE', ROUTE_PATH, error, { profileId, dbCode: error.code, requestedIds: ids.length })
    throw handleDatabaseError(error, { operation: 'delete', resource: 'skills' })
  }
  
  const duration = getElapsed()
  logSuccess('DELETE', ROUTE_PATH, duration, { 
    profileId, 
    deleted: count ?? 0, 
    requested: ids.length 
  })
  
  return {
    success: true,
    message: `${count || 0} skill(s) removed from profile successfully`
  }
})
