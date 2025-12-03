/**
 * PATCH /api/career-id/profile/:profileId/education/:id
 * 
 * Partially updates an existing education entry.
 * Only updates fields provided in the request body.
 * Validates fields and date ranges.
 */

import { serverSupabaseClient } from '#supabase/server'
import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { handleDatabaseError, createValidationError, createNotFoundError } from '@@/server/utils/error-handler'
import { isRequired, requiredFieldError, validateDateRange } from '@@/server/utils/validation'
import { transformEducation } from '@@/server/utils/career-id-transformer'

const ROUTE_PATH = '/api/career-id/profile/:profileId/education/:id'

export default eventHandler(async (event) => {
  const getElapsed = createTimer()
  const supabase = await serverSupabaseClient(event)
  const profileId = getRouterParam(event, 'profileId')
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  
  logRequest('PATCH', ROUTE_PATH, { profileId, educationId: id })
  
  if (!isRequired(id)) {
    const error = createValidationError(requiredFieldError('id'))
    logError('PATCH', ROUTE_PATH, error, { profileId, field: 'id' })
    throw error
  }
  
  // Check if resource exists first
  const { data: existing, error: fetchError } = await supabase
    .schema('career_id')
    .from('education')
    .select('id')
    .eq('id', id)
    .eq('profile_id', profileId)
    .maybeSingle()
  
  if (fetchError) {
    logError('PATCH', ROUTE_PATH, fetchError, { profileId, educationId: id, dbCode: fetchError.code })
    throw handleDatabaseError(fetchError, { operation: 'fetch', resource: 'education entry' })
  }
  
  if (!existing) {
    const notFoundError = createNotFoundError('Education entry')
    logError('PATCH', ROUTE_PATH, notFoundError, { profileId, educationId: id })
    throw notFoundError
  }
  
  // Validation: Date range (if both dates provided, end_date must be after start_date)
  const dateRangeError = validateDateRange(body.startDate, body.endDate)
  if (dateRangeError) {
    const error = createValidationError(dateRangeError)
    logError('PATCH', ROUTE_PATH, error, { profileId, educationId: id, field: 'endDate' })
    throw error
  }
  
  // Build update object with only provided fields
  const updateData: Record<string, any> = {}
  
  if (body.degreeType !== undefined) updateData.degree_type = body.degreeType
  if (body.areaOfStudy !== undefined) updateData.area_of_study = body.areaOfStudy
  if (body.institution !== undefined) updateData.institution = body.institution
  if (body.startDate !== undefined) updateData.start_date = body.startDate
  if (body.endDate !== undefined) updateData.end_date = body.endDate
  if (body.completed !== undefined) updateData.completed = body.completed
  if (body.url !== undefined) updateData.url = body.url
  if (body.creditHours !== undefined) updateData.credit_hours = body.creditHours
  if (body.coursework !== undefined) updateData.coursework = body.coursework
  if (body.minors !== undefined) updateData.minors = body.minors
  if (body.displayOrder !== undefined) updateData.display_order = body.displayOrder
  
  // Update education entry
  const { data, error } = await supabase
    .schema('career_id')
    .from('education')
    .update(updateData)
    .eq('id', id)
    .eq('profile_id', profileId)
    .select()
    .single()
  
  if (error) {
    logError('PATCH', ROUTE_PATH, error, { profileId, educationId: id, dbCode: error.code })
    throw handleDatabaseError(error, { operation: 'update', resource: 'education entry' })
  }
  
  const duration = getElapsed()
  logSuccess('PATCH', ROUTE_PATH, duration, { profileId, educationId: id })
  
  // Transform snake_case to camelCase before returning
  const transformedData = transformEducation(data)
  
  return {
    success: true,
    message: 'Education updated successfully',
    data: transformedData
  }
})
