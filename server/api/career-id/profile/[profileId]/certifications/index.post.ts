/**
 * POST /api/career-id/profile/:profileId/certifications
 * 
 * Creates a new certification entry for a profile.
 * Validates required fields and URL format.
 */

import { serverSupabaseClient } from '#supabase/server'
import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { handleDatabaseError, createValidationError } from '@@/server/utils/error-handler'
import { isRequired, requiredFieldError, validateUrl, convertMonthYearToDate } from '@@/server/utils/validation'
import { transformCertification } from '@@/server/utils/career-id-transformer'

const ROUTE_PATH = '/api/career-id/profile/:profileId/certifications'

export default eventHandler(async (event) => {
  const getElapsed = createTimer()
  const supabase = await serverSupabaseClient(event)
  const body = await readBody(event)
  
  // Get profile_id from URL path parameter
  const profileId = getRouterParam(event, 'profileId')
  
  logRequest('POST', ROUTE_PATH, { profileId })
  
  // Validation: Required fields
  const validationErrors = []
  
  if (!isRequired(body.name)) {
    validationErrors.push(requiredFieldError('name'))
  }
  
  if (!isRequired(body.issuer)) {
    validationErrors.push(requiredFieldError('issuer'))
  }
  
  if (!isRequired(body.issueDate)) {
    validationErrors.push(requiredFieldError('issueDate'))
  }
  
  // Validation: URL format (if provided)
  const urlError = validateUrl(body.url, 'url', false)
  if (urlError) {
    validationErrors.push(urlError)
  }
  
  if (validationErrors.length > 0) {
    const error = createValidationError(validationErrors)
    logError('POST', ROUTE_PATH, error, { profileId, fields: validationErrors.map(e => e.field) })
    throw error
  }
  
  // Insert new certification entry
  const { data, error } = await supabase
    .schema('career_id')
    .from('certifications')
    .insert({
      profile_id: profileId,
      name: body.name,
      issuer: body.issuer,
      issue_date: convertMonthYearToDate(body.issueDate),
      url: body.url || null,
      display_order: body.displayOrder ?? 0
    })
    .select()
    .single()
  
  if (error) {
    logError('POST', ROUTE_PATH, error, { profileId, dbCode: error.code })
    throw handleDatabaseError(error, { operation: 'create', resource: 'certification' })
  }
  
  // Set response status to 201 Created
  setResponseStatus(event, 201)
  
  const duration = getElapsed()
  logSuccess('POST', ROUTE_PATH, duration, { profileId, certificationId: data.id })
  
  // Transform snake_case to camelCase before returning
  const transformedData = transformCertification(data)
  
  return {
    success: true,
    message: 'Certification added successfully',
    data: transformedData
  }
})
