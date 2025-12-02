/**
 * DELETE /api/career-id/profile/:profileId/certifications/:id
 * 
 * Deletes a specific certification from the database.
 * Returns 404 if the certification doesn't exist.
 */

import { serverSupabaseClient } from '#supabase/server'
import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { handleDatabaseError, createValidationError, createNotFoundError } from '@@/server/utils/error-handler'
import { isRequired, requiredFieldError } from '@@/server/utils/validation'

const ROUTE_PATH = '/api/career-id/profile/:profileId/certifications/:id'

export default eventHandler(async (event) => {
  const getElapsed = createTimer()
  const supabase = await serverSupabaseClient(event)
  const profileId = getRouterParam(event, 'profileId')
  const id = getRouterParam(event, 'id')
  
  logRequest('DELETE', ROUTE_PATH, { profileId, certificationId: id })
  
  if (!isRequired(id)) {
    const error = createValidationError(requiredFieldError('id'))
    logError('DELETE', ROUTE_PATH, error, { profileId, field: 'id' })
    throw error
  }
  
  // Check if resource exists first
  const { data: existing, error: fetchError } = await supabase
    .schema('career_id')
    .from('certifications')
    .select('id')
    .eq('id', id)
    .eq('profile_id', profileId)
    .maybeSingle()
  
  if (fetchError) {
    logError('DELETE', ROUTE_PATH, fetchError, { profileId, certificationId: id, dbCode: fetchError.code })
    throw handleDatabaseError(fetchError, { operation: 'fetch', resource: 'certification' })
  }
  
  if (!existing) {
    const notFoundError = createNotFoundError('Certification')
    logError('DELETE', ROUTE_PATH, notFoundError, { profileId, certificationId: id })
    throw notFoundError
  }
  
  // Delete the certification
  const { error } = await supabase
    .schema('career_id')
    .from('certifications')
    .delete()
    .eq('id', id)
    .eq('profile_id', profileId)
  
  if (error) {
    logError('DELETE', ROUTE_PATH, error, { profileId, certificationId: id, dbCode: error.code })
    throw handleDatabaseError(error, { operation: 'delete', resource: 'certification' })
  }
  
  const duration = getElapsed()
  logSuccess('DELETE', ROUTE_PATH, duration, { profileId, certificationId: id })
  
  return {
    success: true,
    message: 'Certification deleted successfully'
  }
})
