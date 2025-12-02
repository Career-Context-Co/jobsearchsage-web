/**
 * DELETE /api/career-id/profile/:profileId/contact/:id
 * 
 * Deletes contact information for a profile.
 * Returns 404 if the contact information doesn't exist.
 */

import { serverSupabaseClient } from '#supabase/server'
import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { handleDatabaseError, createValidationError, createNotFoundError } from '@@/server/utils/error-handler'
import { isRequired, requiredFieldError } from '@@/server/utils/validation'

const ROUTE_PATH = '/api/career-id/profile/:profileId/contact/:id'

export default eventHandler(async (event) => {
  const getElapsed = createTimer()
  const supabase = await serverSupabaseClient(event)
  
  // Get IDs from URL path parameters
  const profileId = getRouterParam(event, 'profileId')
  const id = getRouterParam(event, 'id')
  
  logRequest('DELETE', ROUTE_PATH, { profileId, contactId: id })
  
  if (!isRequired(id)) {
    const error = createValidationError(requiredFieldError('id'))
    logError('DELETE', ROUTE_PATH, error, { profileId, field: 'id' })
    throw error
  }
  
  // Check if resource exists first
  const { data: existing, error: fetchError } = await supabase
    .schema('career_id')
    .from('contact_info')
    .select('id')
    .eq('id', id)
    .eq('profile_id', profileId)
    .maybeSingle()
  
  if (fetchError) {
    logError('DELETE', ROUTE_PATH, fetchError, { profileId, contactId: id, dbCode: fetchError.code })
    throw handleDatabaseError(fetchError, { operation: 'fetch', resource: 'contact information' })
  }
  
  if (!existing) {
    const notFoundError = createNotFoundError('Contact information')
    logError('DELETE', ROUTE_PATH, notFoundError, { profileId, contactId: id })
    throw notFoundError
  }
  
  const { error } = await supabase
    .schema('career_id')
    .from('contact_info')
    .delete()
    .eq('id', id)
    .eq('profile_id', profileId)
  
  if (error) {
    logError('DELETE', ROUTE_PATH, error, { profileId, contactId: id, dbCode: error.code })
    throw handleDatabaseError(error, { operation: 'delete', resource: 'contact information' })
  }
  
  const duration = getElapsed()
  logSuccess('DELETE', ROUTE_PATH, duration, { profileId, contactId: id })
  
  return {
    success: true,
    message: 'Contact information deleted successfully'
  }
})
