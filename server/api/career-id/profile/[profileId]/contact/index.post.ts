/**
 * POST /api/career-id/profile/:profileId/contact
 * 
 * Creates contact information for a profile.
 * One-to-one relationship: each profile can have only one contact_info record.
 * Returns 409 if contact info already exists.
 */

import { serverSupabaseClient } from '#supabase/server'
import { generatePrefixedId } from '@@/server/utils/id-generator'
import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { handleDatabaseError, createValidationError, createConflictError } from '@@/server/utils/error-handler'
import { isRequired, requiredFieldError, validateEmail, validatePhone, validateUrls } from '@@/server/utils/validation'
import { transformContactInfo } from '@@/server/utils/career-id-transformer'

const ROUTE_PATH = '/api/career-id/profile/:profileId/contact'

export default eventHandler(async (event) => {
  const getElapsed = createTimer()
  const supabase = await serverSupabaseClient(event)
  const body = await readBody(event)
  
  // Get profile_id from URL path parameter
  const profileId = getRouterParam(event, 'profileId')
  
  logRequest('POST', ROUTE_PATH, { profileId })
  
  // Validation
  const validationErrors: Array<{ field: string; message: string; code: string }> = []
  
  // Required fields
  if (!isRequired(body.firstName)) {
    validationErrors.push(requiredFieldError('firstName'))
  }
  if (!isRequired(body.lastName)) {
    validationErrors.push(requiredFieldError('lastName'))
  }
  if (!isRequired(body.email)) {
    validationErrors.push(requiredFieldError('email'))
  }
  
  // Email validation
  const emailError = validateEmail(body.email, 'email', false)
  if (emailError) {
    validationErrors.push(emailError)
  }
  
  // Phone validation (if provided) - E.164 format
  const phoneError = validatePhone(body.phone, 'phone', false)
  if (phoneError) {
    validationErrors.push(phoneError)
  }
  
  // Website URLs validation (if provided)
  if (body.websites) {
    const urlErrors = validateUrls(body.websites, 'websites', false)
    validationErrors.push(...urlErrors)
  }
  
  if (validationErrors.length > 0) {
    const error = createValidationError(validationErrors)
    logError('POST', ROUTE_PATH, error, { profileId, fields: validationErrors.map(e => e.field) })
    throw error
  }
  
  // Check if contact info already exists for this profile
  const { data: existing, error: fetchError } = await supabase
    .schema('career_id')
    .from('contact_info')
    .select('id')
    .eq('profile_id', profileId)
    .maybeSingle()
  
  if (fetchError) {
    logError('POST', ROUTE_PATH, fetchError, { profileId, dbCode: fetchError.code })
    throw handleDatabaseError(fetchError, { operation: 'check', resource: 'existing contact info' })
  }
  
  if (existing) {
    const conflictError = createConflictError('Contact information already exists for this profile. Use PATCH to update.')
    logError('POST', ROUTE_PATH, conflictError, { profileId, existingId: existing.id })
    throw conflictError
  }
  
  // Generate prefixed ID for new contact info
  const contactId = generatePrefixedId('cont')
  
  const { data, error } = await supabase
    .schema('career_id')
    .from('contact_info')
    .insert({
      id: contactId,
      profile_id: profileId,
      first_name: body.firstName,
      last_name: body.lastName,
      job_title: body.jobTitle || null,
      email: body.email,
      phone: body.phone || null,
      websites: body.websites || [],
      summary: body.summary || null,
      city: body.city || null,
      state_region: body.stateRegion || null,
      country: body.country || null,
      postal_code: body.postalCode || null,
      willing_to_relocate: body.willingToRelocate || false
    })
    .select()
    .single()
  
  if (error) {
    logError('POST', ROUTE_PATH, error, { profileId, contactId, dbCode: error.code })
    throw handleDatabaseError(error, { operation: 'create', resource: 'contact information' })
  }
  
  // Set response status to 201 Created
  setResponseStatus(event, 201)
  
  const duration = getElapsed()
  logSuccess('POST', ROUTE_PATH, duration, { profileId, contactId: data.id })
  
  // Transform snake_case to camelCase before returning
  const transformedData = transformContactInfo(data)
  
  return {
    success: true,
    message: 'Contact information created successfully',
    data: transformedData
  }
})
