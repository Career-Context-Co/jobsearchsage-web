/**
 * PATCH /api/career-id/profile/:profileId/certifications/:id
 * 
 * Partially updates an existing certification entry.
 * Only updates fields provided in the request body.
 * Validates URL format if provided.
 */

import { serverSupabaseClient } from '#supabase/server'
import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { handleDatabaseError, createValidationError, createNotFoundError } from '@@/server/utils/error-handler'
import { isRequired, requiredFieldError, validateUrl } from '@@/server/utils/validation'
import { transformCertification } from '@@/server/utils/career-id-transformer'

const ROUTE_PATH = '/api/career-id/profile/:profileId/certifications/:id'

export default eventHandler(async (event) => {
  const getElapsed = createTimer()
  const supabase = await serverSupabaseClient(event)
  const profileId = getRouterParam(event, 'profileId')
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  
  logRequest('PATCH', ROUTE_PATH, { profileId, certificationId: id })
  
  if (!isRequired(id)) {
    const error = createValidationError(requiredFieldError('id'))
    logError('PATCH', ROUTE_PATH, error, { profileId, field: 'id' })
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
    logError('PATCH', ROUTE_PATH, fetchError, { profileId, certificationId: id, dbCode: fetchError.code })
    throw handleDatabaseError(fetchError, { operation: 'fetch', resource: 'certification' })
  }
  
  if (!existing) {
    const notFoundError = createNotFoundError('Certification')
    logError('PATCH', ROUTE_PATH, notFoundError, { profileId, certificationId: id })
    throw notFoundError
  }
  
  // Validation: URL format (if provided)
  const urlError = validateUrl(body.url, 'url', false)
  if (urlError) {
    const error = createValidationError(urlError)
    logError('PATCH', ROUTE_PATH, error, { profileId, certificationId: id, field: 'url' })
    throw error
  }
  
  // Build update object with only provided fields
  const updateData: Record<string, any> = {}
  
  if (body.name !== undefined) updateData.name = body.name
  if (body.issuer !== undefined) updateData.issuer = body.issuer
  if (body.issueDate !== undefined) updateData.issue_date = body.issueDate
  if (body.url !== undefined) updateData.url = body.url
  if (body.displayOrder !== undefined) updateData.display_order = body.displayOrder
  
  // Update certification entry
  const { data, error } = await supabase
    .schema('career_id')
    .from('certifications')
    .update(updateData)
    .eq('id', id)
    .eq('profile_id', profileId)
    .select()
    .single()
  
  if (error) {
    logError('PATCH', ROUTE_PATH, error, { profileId, certificationId: id, dbCode: error.code })
    throw handleDatabaseError(error, { operation: 'update', resource: 'certification' })
  }
  
  const duration = getElapsed()
  logSuccess('PATCH', ROUTE_PATH, duration, { profileId, certificationId: id })
  
  // Transform snake_case to camelCase before returning
  const transformedData = transformCertification(data)
  
  return {
    success: true,
    message: 'Certification updated successfully',
    data: transformedData
  }
})
