/**
 * POST /api/career-id/profile/:profileId/education
 * 
 * Creates a new education entry for a profile.
 * Validates required fields and date ranges.
 */

import { serverSupabaseClient } from '#supabase/server'
import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { handleDatabaseError, createValidationError } from '@@/server/utils/error-handler'
import { isRequired, requiredFieldError, validateDateRange } from '@@/server/utils/validation'
import { transformEducation } from '@@/server/utils/career-id-transformer'

const ROUTE_PATH = '/api/career-id/profile/:profileId/education'

export default eventHandler(async (event) => {
  const getElapsed = createTimer()
  const supabase = await serverSupabaseClient(event)
  const body = await readBody(event)
  
  // Get profile_id from URL path parameter
  const profileId = getRouterParam(event, 'profileId')
  
  logRequest('POST', ROUTE_PATH, { profileId })
  
  // Validation: Required fields
  const validationErrors = []
  
  if (!isRequired(body.degreeType)) {
    validationErrors.push(requiredFieldError('degreeType'))
  }
  
  if (!isRequired(body.areaOfStudy)) {
    validationErrors.push(requiredFieldError('areaOfStudy'))
  }
  
  if (!isRequired(body.institution)) {
    validationErrors.push(requiredFieldError('institution'))
  }
  
  if (!isRequired(body.startDate)) {
    validationErrors.push(requiredFieldError('startDate'))
  }
  
  if (!isRequired(body.endDate)) {
    validationErrors.push(requiredFieldError('endDate'))
  }
  
  // Validation: Date range (end_date must be after start_date)
  const dateRangeError = validateDateRange(body.startDate, body.endDate)
  if (dateRangeError) {
    validationErrors.push(dateRangeError)
  }
  
  if (validationErrors.length > 0) {
    const error = createValidationError(validationErrors)
    logError('POST', ROUTE_PATH, error, { profileId, fields: validationErrors.map(e => e.field) })
    throw error
  }
  
  // Insert new education entry
  const { data, error } = await supabase
    .schema('career_id')
    .from('education')
    .insert({
      profile_id: profileId,
      degree_type: body.degreeType,
      area_of_study: body.areaOfStudy,
      institution: body.institution,
      start_date: body.startDate,
      end_date: body.endDate,
      completed: body.completed ?? true,
      url: body.url || null,
      credit_hours: body.creditHours || null,
      coursework: body.coursework || [],
      minors: body.minors || [],
      display_order: body.displayOrder ?? 0
    })
    .select()
    .single()
  
  if (error) {
    logError('POST', ROUTE_PATH, error, { profileId, dbCode: error.code })
    throw handleDatabaseError(error, { operation: 'create', resource: 'education entry' })
  }
  
  // Set response status to 201 Created
  setResponseStatus(event, 201)
  
  const duration = getElapsed()
  logSuccess('POST', ROUTE_PATH, duration, { profileId, educationId: data.id })
  
  // Transform snake_case to camelCase before returning
  const transformedData = transformEducation(data)
  
  return {
    success: true,
    message: 'Education added successfully',
    data: transformedData
  }
})
