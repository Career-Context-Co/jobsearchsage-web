/**
 * PATCH /api/career-id/profile/:profileId/moments/:momentId
 * 
 * Updates a specific moment for a profile.
 * Allows updating title, rawNotes, sourceExperienceId, discoverySessionId.
 */

import { serverSupabaseClient } from '#supabase/server'
import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { handleDatabaseError, createValidationError, createNotFoundError, ErrorCodes } from '@@/server/utils/error-handler'
import { isRequired } from '@@/server/utils/validation'

const ROUTE_PATH = '/api/career-id/profile/:profileId/moments/:momentId'

export default eventHandler(async (event) => {
  const getElapsed = createTimer()
  const supabase = await serverSupabaseClient(event)
  const body = await readBody(event)
  
  // Get parameters from URL path
  const profileId = getRouterParam(event, 'profileId')
  const momentId = getRouterParam(event, 'momentId')
  
  logRequest('PATCH', ROUTE_PATH, { profileId, momentId })
  
  // Validate parameters
  if (!isRequired(profileId)) {
    const error = createValidationError({
      field: 'profileId',
      message: 'profileId is required',
      code: ErrorCodes.REQUIRED
    })
    logError('PATCH', ROUTE_PATH, error, { field: 'profileId' })
    throw error
  }
  
  if (!isRequired(momentId)) {
    const error = createValidationError({
      field: 'momentId',
      message: 'momentId is required',
      code: ErrorCodes.REQUIRED
    })
    logError('PATCH', ROUTE_PATH, error, { field: 'momentId' })
    throw error
  }
  
  // Validate that moment has at least one updatable field
  const hasUpdateableField = body.title || body.rawNotes || body.sourceExperienceId || body.discoverySessionId
  if (!hasUpdateableField) {
    const error = createValidationError({
      field: 'body',
      message: 'At least one field to update is required (title, rawNotes, sourceExperienceId, discoverySessionId)',
      code: ErrorCodes.REQUIRED
    })
    logError('PATCH', ROUTE_PATH, error, { profileId, momentId })
    throw error
  }
  
  // Validate individual fields if provided
  const validationErrors: Array<{ field: string; message: string; code: string }> = []
  
  if (body.title !== undefined) {
    if (!isRequired(body.title)) {
      validationErrors.push({
        field: 'title',
        message: 'title cannot be empty',
        code: ErrorCodes.REQUIRED
      })
    } else if (body.title.length < 5 || body.title.length > 50) {
      validationErrors.push({
        field: 'title',
        message: 'title must be between 5 and 50 characters',
        code: ErrorCodes.INVALID
      })
    }
  }
  
  if (body.rawNotes !== undefined) {
    if (!isRequired(body.rawNotes)) {
      validationErrors.push({
        field: 'rawNotes',
        message: 'rawNotes cannot be empty',
        code: ErrorCodes.REQUIRED
      })
    } else if (body.rawNotes.length < 10 || body.rawNotes.length > 500) {
      validationErrors.push({
        field: 'rawNotes',
        message: 'rawNotes must be between 10 and 500 characters',
        code: ErrorCodes.INVALID
      })
    }
  }
  
  if (validationErrors.length > 0) {
    const error = createValidationError(validationErrors)
    logError('PATCH', ROUTE_PATH, error, { profileId, momentId, fields: validationErrors.map(e => e.field) })
    throw error
  }
  
  // Build update object
  const updateData: any = {}
  if (body.title !== undefined) {
    updateData.title = body.title.trim()
  }
  if (body.rawNotes !== undefined) {
    updateData.raw_notes = body.rawNotes.trim()
  }
  if (body.sourceExperienceId !== undefined) {
    updateData.source_experience_id = body.sourceExperienceId
  }
  if (body.discoverySessionId !== undefined) {
    updateData.discovery_session_id = body.discoverySessionId
  }
  
  // Update the moment
  const { data, error } = await supabase
    .schema('career_id')
    .from('hero_moments')
    .update(updateData)
    .eq('id', momentId)
    .eq('profile_id', profileId)
    .select()
  
  if (error) {
    logError('PATCH', ROUTE_PATH, error, { profileId, momentId, dbCode: error.code })
    throw handleDatabaseError(error, { operation: 'update', resource: 'moment' })
  }
  
  if (!data || data.length === 0) {
    const notFoundError = createNotFoundError('Moment')
    logError('PATCH', ROUTE_PATH, notFoundError, { profileId, momentId })
    throw notFoundError
  }
  
  const duration = getElapsed()
  logSuccess('PATCH', ROUTE_PATH, duration, { profileId, momentId })
  
  // Transform snake_case to camelCase
  const moment = data[0]
  const transformedData = {
    id: moment.id,
    profileId: moment.profile_id,
    title: moment.title,
    rawNotes: moment.raw_notes,
    sourceExperienceId: moment.source_experience_id,
    discoverySessionId: moment.discovery_session_id,
    createdAt: moment.created_at,
    updatedAt: moment.updated_at,
    deletedAt: moment.deleted_at,
    convertedAt: moment.converted_at,
    convertedStoryId: moment.converted_story_id
  }
  
  return {
    success: true,
    message: 'Moment updated successfully',
    data: transformedData
  }
})
