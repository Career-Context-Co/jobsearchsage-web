/**
 * DELETE /api/career-id/profile/:profileId/education/:id
 * 
 * Deletes a specific education entry from the database.
 * Returns 404 if the education entry doesn't exist.
 */

import { serverSupabaseClient } from '#supabase/server'
import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { handleDatabaseError, createValidationError, createNotFoundError } from '@@/server/utils/error-handler'
import { isRequired, requiredFieldError } from '@@/server/utils/validation'

const ROUTE_PATH = '/api/career-id/profile/:profileId/education/:id'

export default eventHandler(async (event) => {
  const getElapsed = createTimer()
  const supabase = await serverSupabaseClient(event)
  const profileId = getRouterParam(event, 'profileId')
  const id = getRouterParam(event, 'id')
  
  logRequest('DELETE', ROUTE_PATH, { profileId, educationId: id })
  
  if (!isRequired(id)) {
    const error = createValidationError(requiredFieldError('id'))
    logError('DELETE', ROUTE_PATH, error, { profileId, field: 'id' })
    throw error
  }
  
  // Check if resource exists first
  const { data: existing, error: fetchError } = await supabase
    .schema('career_id')
    .from('education')
    .select('id')
    .eq('id', id)
    .eq('profile_id', profileId)
    .maybeSingle()
  
  if (fetchError) {
    logError('DELETE', ROUTE_PATH, fetchError, { profileId, educationId: id, dbCode: fetchError.code })
    throw handleDatabaseError(fetchError, { operation: 'fetch', resource: 'education entry' })
  }
  
  if (!existing) {
    const notFoundError = createNotFoundError('Education entry')
    logError('DELETE', ROUTE_PATH, notFoundError, { profileId, educationId: id })
    throw notFoundError
  }
  
  // Delete the education entry
  const { error } = await supabase
    .schema('career_id')
    .from('education')
    .delete()
    .eq('id', id)
    .eq('profile_id', profileId)
  
  if (error) {
    logError('DELETE', ROUTE_PATH, error, { profileId, educationId: id, dbCode: error.code })
    throw handleDatabaseError(error, { operation: 'delete', resource: 'education entry' })
  }
  
  const duration = getElapsed()
  logSuccess('DELETE', ROUTE_PATH, duration, { profileId, educationId: id })
  
  return {
    success: true,
    message: 'Education deleted successfully'
  }
})
