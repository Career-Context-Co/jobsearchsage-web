/**
 * POST /api/career-id/profile/:profileId/experience
 * 
 * Creates a new experience entry for a profile.
 * Validates required fields and date ranges.
 */

import { serverSupabaseClient } from '#supabase/server'
import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { handleDatabaseError, createValidationError } from '@@/server/utils/error-handler'
import { isRequired, requiredFieldError, validateDateRange, convertMonthYearToDate } from '@@/server/utils/validation'
import { transformExperience } from '@@/server/utils/career-id-transformer'

const ROUTE_PATH = '/api/career-id/profile/:profileId/experience'

export default eventHandler(async (event) => {
  const getElapsed = createTimer()
  const supabase = await serverSupabaseClient(event)
  const body = await readBody(event)
  
  // Get profile_id from URL path parameter  
  const profileId = getRouterParam(event, 'profileId')
  
  logRequest('POST', ROUTE_PATH, { profileId })
  
  // Validation: Required fields
  const validationErrors = []
  
  if (!isRequired(body.employer)) {
    validationErrors.push(requiredFieldError('employer'))
  }
  
  if (!isRequired(body.title)) {
    validationErrors.push(requiredFieldError('title'))
  }
  
  if (!isRequired(body.startDate)) {
    validationErrors.push(requiredFieldError('startDate'))
  }
  
  if (!isRequired(body.employmentType)) {
    validationErrors.push(requiredFieldError('employmentType'))
  }
  
  // Validation: Date range (if end_date provided, must be after start_date)
  const dateRangeError = validateDateRange(body.startDate, body.endDate)
  if (dateRangeError) {
    validationErrors.push(dateRangeError)
  }
  
  if (validationErrors.length > 0) {
    const error = createValidationError(validationErrors)
    logError('POST', ROUTE_PATH, error, { profileId, fields: validationErrors.map(e => e.field) })
    throw error
  }
  
  // Insert new experience entry
  const { data, error } = await supabase
    .schema('career_id')
    .from('experience')
    .insert({
      profile_id: profileId,
      employment_type: body.employmentType,
      employer: body.employer,
      title: body.title,
      location: body.location || null,
      location_type: body.locationType || null,
      url: body.url || null,
      start_date: convertMonthYearToDate(body.startDate),
      end_date: convertMonthYearToDate(body.endDate),
      current_position: body.currentPosition || false,
      summary: body.summary || null,
      highlights: body.highlights || [],
      display_order: body.displayOrder ?? 0
    })
    .select()
    .single()
  
  if (error) {
    logError('POST', ROUTE_PATH, error, { profileId, dbCode: error.code })
    throw handleDatabaseError(error, { operation: 'create', resource: 'experience entry' })
  }
  
  // Set response status to 201 Created
  setResponseStatus(event, 201)
  
  const duration = getElapsed()
  logSuccess('POST', ROUTE_PATH, duration, { profileId, experienceId: data.id })
  
  // Transform snake_case to camelCase before returning
  const transformedData = transformExperience(data)
  
  return {
    success: true,
    message: 'Experience added successfully',
    data: transformedData
  }
})
