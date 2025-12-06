/**
 * PATCH /api/career-id/profile/:profileId/experience/:id
 * 
 * Partially updates an existing experience entry.
 * Only updates fields provided in the request body.
 * Validates fields and date ranges.
 */

import { serverSupabaseClient } from '#supabase/server'
import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { handleDatabaseError, createValidationError, createNotFoundError } from '@@/server/utils/error-handler'
import { isRequired, requiredFieldError, validateDateRange, convertMonthYearToDate } from '@@/server/utils/validation'
import { transformExperience } from '@@/server/utils/career-id-transformer'

const ROUTE_PATH = '/api/career-id/profile/:profileId/experience/:id'

export default eventHandler(async (event) => {
  const getElapsed = createTimer()
  const supabase = await serverSupabaseClient(event)
  const profileId = getRouterParam(event, 'profileId')
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  
  logRequest('PATCH', ROUTE_PATH, { profileId, experienceId: id })
  
  if (!isRequired(id)) {
    const error = createValidationError(requiredFieldError('id'))
    logError('PATCH', ROUTE_PATH, error, { profileId, field: 'id' })
    throw error
  }
  
  // Check if resource exists first
  const { data: existing, error: fetchError } = await supabase
    .schema('career_id')
    .from('experience')
    .select('id')
    .eq('id', id)
    .eq('profile_id', profileId)
    .maybeSingle()
  
  if (fetchError) {
    logError('PATCH', ROUTE_PATH, fetchError, { profileId, experienceId: id, dbCode: fetchError.code })
    throw handleDatabaseError(fetchError, { operation: 'fetch', resource: 'experience entry' })
  }
  
  if (!existing) {
    const notFoundError = createNotFoundError('Experience entry')
    logError('PATCH', ROUTE_PATH, notFoundError, { profileId, experienceId: id })
    throw notFoundError
  }
  
  // Validation: Date range (if both dates provided, end_date must be after start_date)
  const dateRangeError = validateDateRange(body.startDate, body.endDate)
  if (dateRangeError) {
    const error = createValidationError(dateRangeError)
    logError('PATCH', ROUTE_PATH, error, { profileId, experienceId: id, field: 'endDate' })
    throw error
  }
  
  // Build update object with only provided fields
  const updateData: Record<string, any> = {}
  
  if (body.employmentType !== undefined) updateData.employment_type = body.employmentType
  if (body.employer !== undefined) updateData.employer = body.employer
  if (body.title !== undefined) updateData.title = body.title
  if (body.location !== undefined) updateData.location = body.location
  if (body.locationType !== undefined) updateData.location_type = body.locationType
  if (body.url !== undefined) updateData.url = body.url
  if (body.startDate !== undefined) updateData.start_date = convertMonthYearToDate(body.startDate)
  if (body.endDate !== undefined) updateData.end_date = convertMonthYearToDate(body.endDate)
  if (body.currentPosition !== undefined) updateData.current_position = body.currentPosition
  if (body.summary !== undefined) updateData.summary = body.summary
  if (body.highlights !== undefined) updateData.highlights = body.highlights
  if (body.displayOrder !== undefined) updateData.display_order = body.displayOrder
  
  // Update experience entry
  const { data, error } = await supabase
    .schema('career_id')
    .from('experience')
    .update(updateData)
    .eq('id', id)
    .eq('profile_id', profileId)
    .select()
    .single()
  
  if (error) {
    logError('PATCH', ROUTE_PATH, error, { profileId, experienceId: id, dbCode: error.code })
    throw handleDatabaseError(error, { operation: 'update', resource: 'experience entry' })
  }
  
  const duration = getElapsed()
  logSuccess('PATCH', ROUTE_PATH, duration, { profileId, experienceId: id })
  
  // Transform snake_case to camelCase before returning
  const transformedData = transformExperience(data)
  
  return {
    success: true,
    message: 'Experience updated successfully',
    data: transformedData
  }
})
