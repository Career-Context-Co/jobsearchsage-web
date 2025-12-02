/**
 * DELETE /api/career-id/profile/:profileId/socials/:id
 * 
 * Deletes a social link from a profile.
 * Returns 404 if the social link doesn't exist.
 */

import { serverSupabaseClient } from '#supabase/server'
import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { handleDatabaseError, createValidationError, createNotFoundError } from '@@/server/utils/error-handler'
import { isRequired, requiredFieldError } from '@@/server/utils/validation'

const ROUTE_PATH = '/api/career-id/profile/:profileId/socials/:id'

export default eventHandler(async (event) => {
  const getElapsed = createTimer()
  const supabase = await serverSupabaseClient(event)
  const profileId = getRouterParam(event, 'profileId')
  const id = getRouterParam(event, 'id')
  
  logRequest('DELETE', ROUTE_PATH, { profileId, socialLinkId: id })
  
  if (!isRequired(id)) {
    const error = createValidationError(requiredFieldError('id'))
    logError('DELETE', ROUTE_PATH, error, { profileId, field: 'id' })
    throw error
  }
  
  // Check if resource exists first
  const { data: existing, error: fetchError } = await supabase
    .schema('career_id')
    .from('profile_social_links')
    .select('id')
    .eq('id', id)
    .eq('profile_id', profileId)
    .maybeSingle()
  
  if (fetchError) {
    logError('DELETE', ROUTE_PATH, fetchError, { profileId, socialLinkId: id, dbCode: fetchError.code })
    throw handleDatabaseError(fetchError, { operation: 'fetch', resource: 'social link' })
  }
  
  if (!existing) {
    const notFoundError = createNotFoundError('Social link')
    logError('DELETE', ROUTE_PATH, notFoundError, { profileId, socialLinkId: id })
    throw notFoundError
  }
  
  const { error } = await supabase
    .schema('career_id')
    .from('profile_social_links')
    .delete()
    .eq('id', id)
    .eq('profile_id', profileId)
  
  if (error) {
    logError('DELETE', ROUTE_PATH, error, { profileId, socialLinkId: id, dbCode: error.code })
    throw handleDatabaseError(error, { operation: 'delete', resource: 'social link' })
  }
  
  const duration = getElapsed()
  logSuccess('DELETE', ROUTE_PATH, duration, { profileId, socialLinkId: id })
  
  return {
    success: true,
    message: 'Social link deleted successfully'
  }
})
