/**
 * DELETE /api/career-id/profile/:profileId/experience/:id
 * 
 * Deletes a specific experience entry from the database.
 * Returns 404 if the experience entry doesn't exist.
 */

import { serverSupabaseClient } from '#supabase/server'
import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { handleDatabaseError, createValidationError, createNotFoundError } from '@@/server/utils/error-handler'
import { isRequired, requiredFieldError } from '@@/server/utils/validation'

const ROUTE_PATH = '/api/career-id/profile/:profileId/experience/:id'

export default eventHandler(async (event) => {
  const getElapsed = createTimer()
  const supabase = await serverSupabaseClient(event)
  const profileId = getRouterParam(event, 'profileId')
  const id = getRouterParam(event, 'id')
  
  logRequest('DELETE', ROUTE_PATH, { profileId, experienceId: id })
  
  if (!isRequired(id)) {
    const error = createValidationError(requiredFieldError('id'))
    logError('DELETE', ROUTE_PATH, error, { profileId, field: 'id' })
    throw error
  }
  
  // Check if resource exists first
  const { data: existing, error: fetchError } = await supabase
    .schema('career_id')
    .from('experience')
    .select('id')
    .eq('id', id)
    .eq('profile_id', profileId)
    .maybeSingle()
  
  if (fetchError) {
    logError('DELETE', ROUTE_PATH, fetchError, { profileId, experienceId: id, dbCode: fetchError.code })
    throw handleDatabaseError(fetchError, { operation: 'fetch', resource: 'experience entry' })
  }
  
  if (!existing) {
    const notFoundError = createNotFoundError('Experience entry')
    logError('DELETE', ROUTE_PATH, notFoundError, { profileId, experienceId: id })
    throw notFoundError
  }
  
  // Delete the experience entry
  const { error } = await supabase
    .schema('career_id')
    .from('experience')
    .delete()
    .eq('id', id)
    .eq('profile_id', profileId)
  
  if (error) {
    logError('DELETE', ROUTE_PATH, error, { profileId, experienceId: id, dbCode: error.code })
    throw handleDatabaseError(error, { operation: 'delete', resource: 'experience entry' })
  }
  
  const duration = getElapsed()
  logSuccess('DELETE', ROUTE_PATH, duration, { profileId, experienceId: id })
  
  return {
    success: true,
    message: 'Experience deleted successfully'
  }
})
