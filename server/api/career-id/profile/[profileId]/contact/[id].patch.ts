/**
 * PATCH /api/career-id/profile/:profileId/contact/:id
 * 
 * Partially updates existing contact information for a profile.
 * Only updates fields that are provided in the request body.
 * Returns 404 if contact info doesn't exist.
 */

import { serverSupabaseClient } from '#supabase/server'
import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { handleDatabaseError, createValidationError, createNotFoundError } from '@@/server/utils/error-handler'
import { isRequired, requiredFieldError, validateEmail, validatePhone, validateUrls } from '@@/server/utils/validation'
import { transformContactInfo } from '@@/server/utils/career-id-transformer'

const ROUTE_PATH = '/api/career-id/profile/:profileId/contact/:id'

export default eventHandler(async (event) => {
  const getElapsed = createTimer()
  const supabase = await serverSupabaseClient(event)
  const body = await readBody(event)
  
  // Get IDs from URL path parameters
  const profileId = getRouterParam(event, 'profileId')
  const id = getRouterParam(event, 'id')
  
  logRequest('PATCH', ROUTE_PATH, { profileId, contactId: id })
  
  if (!isRequired(id)) {
    const error = createValidationError(requiredFieldError('id'))
    logError('PATCH', ROUTE_PATH, error, { profileId, field: 'id' })
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
    logError('PATCH', ROUTE_PATH, fetchError, { profileId, contactId: id, dbCode: fetchError.code })
    throw handleDatabaseError(fetchError, { operation: 'fetch', resource: 'contact information' })
  }
  
  if (!existing) {
    const notFoundError = createNotFoundError('Contact information')
    logError('PATCH', ROUTE_PATH, notFoundError, { profileId, contactId: id })
    throw notFoundError
  }
  
  // Validation
  const validationErrors: Array<{ field: string; message: string; code: string }> = []
  
  // Email validation (if provided)
  if (body.email !== undefined) {
    const emailError = validateEmail(body.email, 'email', false)
    if (emailError) {
      validationErrors.push(emailError)
    }
  }
  
  // Phone validation (if provided) - E.164 format
  if (body.phone !== undefined && body.phone) {
    const phoneError = validatePhone(body.phone, 'phone', false)
    if (phoneError) {
      validationErrors.push(phoneError)
    }
  }
  
  // Website URLs validation (if provided)
  if (body.websites !== undefined) {
    const urlErrors = validateUrls(body.websites, 'websites', false)
    validationErrors.push(...urlErrors)
  }
  
  if (validationErrors.length > 0) {
    const error = createValidationError(validationErrors)
    logError('PATCH', ROUTE_PATH, error, { profileId, contactId: id, fields: validationErrors.map(e => e.field) })
    throw error
  }
  
  // Build update object (partial update - only provided fields)
  const updateData: Record<string, any> = {}
  
  if (body.firstName !== undefined) updateData.first_name = body.firstName
  if (body.lastName !== undefined) updateData.last_name = body.lastName
  if (body.jobTitle !== undefined) updateData.job_title = body.jobTitle
  if (body.email !== undefined) updateData.email = body.email
  if (body.phone !== undefined) updateData.phone = body.phone
  if (body.websites !== undefined) updateData.websites = body.websites
  if (body.summary !== undefined) updateData.summary = body.summary
  if (body.city !== undefined) updateData.city = body.city
  if (body.stateRegion !== undefined) updateData.state_region = body.stateRegion
  if (body.country !== undefined) updateData.country = body.country
  if (body.postalCode !== undefined) updateData.postal_code = body.postalCode
  if (body.willingToRelocate !== undefined) updateData.willing_to_relocate = body.willingToRelocate
  
  const { data, error } = await supabase
    .schema('career_id')
    .from('contact_info')
    .update(updateData)
    .eq('id', id)
    .eq('profile_id', profileId)
    .select()
    .single()
  
  if (error) {
    logError('PATCH', ROUTE_PATH, error, { profileId, contactId: id, dbCode: error.code })
    throw handleDatabaseError(error, { operation: 'update', resource: 'contact information' })
  }
  
  const duration = getElapsed()
  logSuccess('PATCH', ROUTE_PATH, duration, { profileId, contactId: id })
  
  // Transform snake_case to camelCase before returning
  const transformedData = transformContactInfo(data)
  
  return {
    success: true,
    message: 'Contact information updated successfully',
    data: transformedData
  }
})
