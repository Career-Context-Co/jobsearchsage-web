/**
 * DELETE /api/career-id/profile/:profileId/moments/:momentId
 * 
 * Soft deletes a specific moment by setting deleted_at timestamp.
 * The moment record remains in the database for audit trail.
 */

import { serverSupabaseClient } from '#supabase/server'
import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { handleDatabaseError, createValidationError, createNotFoundError, ErrorCodes } from '@@/server/utils/error-handler'
import { isRequired } from '@@/server/utils/validation'

const ROUTE_PATH = '/api/career-id/profile/:profileId/moments/:momentId'

export default eventHandler(async (event) => {
  const getElapsed = createTimer()
  const supabase = await serverSupabaseClient(event)
  
  // Get parameters from URL path
  const profileId = getRouterParam(event, 'profileId')
  const momentId = getRouterParam(event, 'momentId')
  
  logRequest('DELETE', ROUTE_PATH, { profileId, momentId })
  
  // Validate parameters
  if (!isRequired(profileId)) {
    const error = createValidationError({
      field: 'profileId',
      message: 'profileId is required',
      code: ErrorCodes.REQUIRED
    })
    logError('DELETE', ROUTE_PATH, error, { field: 'profileId' })
    throw error
  }
  
  if (!isRequired(momentId)) {
    const error = createValidationError({
      field: 'momentId',
      message: 'momentId is required',
      code: ErrorCodes.REQUIRED
    })
    logError('DELETE', ROUTE_PATH, error, { field: 'momentId' })
    throw error
  }
  
  // Soft delete the moment by setting deleted_at
  const { data, error } = await supabase
    .schema('career_id')
    .from('hero_moments')
    .update({
      deleted_at: new Date().toISOString()
    })
    .eq('id', momentId)
    .eq('profile_id', profileId)
    .select()
  
  if (error) {
    logError('DELETE', ROUTE_PATH, error, { profileId, momentId, dbCode: error.code })
    throw handleDatabaseError(error, { operation: 'delete', resource: 'moment' })
  }
  
  if (!data || data.length === 0) {
    const notFoundError = createNotFoundError('Moment')
    logError('DELETE', ROUTE_PATH, notFoundError, { profileId, momentId })
    throw notFoundError
  }
  
  const duration = getElapsed()
  logSuccess('DELETE', ROUTE_PATH, duration, { profileId, momentId })
  
  return {
    success: true,
    message: 'Moment deleted successfully'
  }
})
