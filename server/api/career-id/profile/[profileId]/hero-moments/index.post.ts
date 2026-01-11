/**
 * POST /api/career-id/profile/:profileId/moments
 * 
 * Creates multiple moments for a profile (bulk operation).
 * Accepts an array of moments to add.
 * Generates prefixed IDs (`moment_*`) for each moment.
 */

import { serverSupabaseClient } from '#supabase/server'
import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { handleDatabaseError, createValidationError, createConflictError, ErrorCodes } from '@@/server/utils/error-handler'
import { isRequired } from '@@/server/utils/validation'
import { generatePrefixedId } from '@@/server/utils/id-generator'

const ROUTE_PATH = '/api/career-id/profile/:profileId/moments'

export default eventHandler(async (event) => {
  const getElapsed = createTimer()
  const supabase = await serverSupabaseClient(event)
  const body = await readBody(event)
  
  // Get profile_id from URL path parameter
  const profileId = getRouterParam(event, 'profileId')
  
  logRequest('POST', ROUTE_PATH, { profileId })
  
  // Validate profileId
  if (!isRequired(profileId)) {
    const error = createValidationError({
      field: 'profileId',
      message: 'profileId is required',
      code: ErrorCodes.REQUIRED
    })
    logError('POST', ROUTE_PATH, error, { field: 'profileId' })
    throw error
  }
  
  // Ensure body is an array
  const moments = Array.isArray(body) ? body : [body]
  
  if (moments.length === 0) {
    const error = createValidationError({
      field: 'moments',
      message: 'At least one moment is required',
      code: ErrorCodes.REQUIRED
    })
    logError('POST', ROUTE_PATH, error, { profileId })
    throw error
  }
  
  const validationErrors: Array<{ field: string; message: string; code: string }> = []
  
  // Validate all moments
  moments.forEach((moment, index) => {
    if (!isRequired(moment.title)) {
      validationErrors.push({
        field: `moments[${index}].title`,
        message: 'title is required and cannot be empty',
        code: ErrorCodes.REQUIRED
      })
    } else if (moment.title.length < 5 || moment.title.length > 50) {
      validationErrors.push({
        field: `moments[${index}].title`,
        message: 'title must be between 5 and 50 characters',
        code: ErrorCodes.INVALID
      })
    }
    
    if (!isRequired(moment.rawNotes)) {
      validationErrors.push({
        field: `moments[${index}].rawNotes`,
        message: 'rawNotes is required and cannot be empty',
        code: ErrorCodes.REQUIRED
      })
    } else if (moment.rawNotes.length < 10 || moment.rawNotes.length > 500) {
      validationErrors.push({
        field: `moments[${index}].rawNotes`,
        message: 'rawNotes must be between 10 and 500 characters',
        code: ErrorCodes.INVALID
      })
    }
  })
  
  if (validationErrors.length > 0) {
    const error = createValidationError(validationErrors)
    logError('POST', ROUTE_PATH, error, { profileId, fields: validationErrors.map(e => e.field) })
    throw error
  }
  
  // Create moments with generated IDs
  const momentsToInsert = moments.map((moment) => ({
    profile_id: profileId,
    title: moment.title.trim(),
    raw_notes: moment.rawNotes.trim(),
    source_experience_id: moment.sourceExperienceId || null,
    discovery_session_id: moment.discoverySessionId || null
  }))
  
  const { data, error } = await supabase
    .schema('career_id')
    .from('hero_moments')
    .insert(momentsToInsert)
    .select()
  
  if (error) {
    logError('POST', ROUTE_PATH, error, { profileId, dbCode: error.code })
    throw handleDatabaseError(error, { operation: 'add', resource: 'moments' })
  }
  
  // Set response status to 201 Created
  setResponseStatus(event, 201)
  
  const duration = getElapsed()
  logSuccess('POST', ROUTE_PATH, duration, { profileId, count: data.length })
  
  // Transform snake_case to camelCase
  const transformedData = (data || []).map(moment => ({
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
  }))
  
  return {
    success: true,
    message: `${data.length} moment(s) created successfully`,
    data: transformedData
  }
})
