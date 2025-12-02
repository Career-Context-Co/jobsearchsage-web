/**
 * PATCH /api/career-id/profile/:profileId/socials/:id
 * 
 * Partially updates an existing social link (URL, display order).
 * Only updates fields provided in the request body.
 */

import { serverSupabaseClient } from '#supabase/server'
import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { handleDatabaseError, createValidationError, createNotFoundError } from '@@/server/utils/error-handler'
import { isRequired, requiredFieldError, validateUrl } from '@@/server/utils/validation'

const ROUTE_PATH = '/api/career-id/profile/:profileId/socials/:id'

export default eventHandler(async (event) => {
  const getElapsed = createTimer()
  const supabase = await serverSupabaseClient(event)
  const profileId = getRouterParam(event, 'profileId')
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  
  logRequest('PATCH', ROUTE_PATH, { profileId, socialLinkId: id })
  
  if (!isRequired(id)) {
    const error = createValidationError(requiredFieldError('id'))
    logError('PATCH', ROUTE_PATH, error, { profileId, field: 'id' })
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
    logError('PATCH', ROUTE_PATH, fetchError, { profileId, socialLinkId: id, dbCode: fetchError.code })
    throw handleDatabaseError(fetchError, { operation: 'fetch', resource: 'social link' })
  }
  
  if (!existing) {
    const notFoundError = createNotFoundError('Social link')
    logError('PATCH', ROUTE_PATH, notFoundError, { profileId, socialLinkId: id })
    throw notFoundError
  }
  
  // URL validation (if provided)
  if (body.url !== undefined) {
    const urlError = validateUrl(body.url, 'url', false)
    if (urlError) {
      const error = createValidationError(urlError)
      logError('PATCH', ROUTE_PATH, error, { profileId, socialLinkId: id, field: 'url' })
      throw error
    }
  }
  
  // Build update object with only provided fields
  const updateData: Record<string, any> = {}
  
  if (body.url !== undefined) updateData.url = body.url
  if (body.displayOrder !== undefined) updateData.display_order = body.displayOrder
  
  // Update social link entry
  const { data, error } = await supabase
    .schema('career_id')
    .from('profile_social_links')
    .update(updateData)
    .eq('id', id)
    .eq('profile_id', profileId)
    .select()
    .single()
  
  if (error) {
    logError('PATCH', ROUTE_PATH, error, { profileId, socialLinkId: id, dbCode: error.code })
    throw handleDatabaseError(error, { operation: 'update', resource: 'social link' })
  }
  
  const duration = getElapsed()
  logSuccess('PATCH', ROUTE_PATH, duration, { profileId, socialLinkId: id })
  
  return {
    success: true,
    message: 'Social link updated successfully',
    data
  }
})
