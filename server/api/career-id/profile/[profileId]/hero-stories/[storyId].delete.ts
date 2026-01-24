/**
 * DELETE /api/career-id/profile/:profileId/hero-stories/:storyId
 * 
 * Soft deletes a specific HERO story by setting deleted_at timestamp and is_deleted flag.
 * The story record remains in the database for audit trail and is_deleted filtering.
 * Validates ownership (story must belong to the specified profile).
 */

import { serverSupabaseClient } from '#supabase/server'
import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { handleDatabaseError, createValidationError, createNotFoundError, ErrorCodes } from '@@/server/utils/error-handler'
import { isRequired } from '@@/server/utils/validation'

const ROUTE_PATH = '/api/career-id/profile/:profileId/hero-stories/:storyId'

export default eventHandler(async (event) => {
  const getElapsed = createTimer()
  const supabase = await serverSupabaseClient(event)
  
  // Get parameters from URL path
  const profileId = getRouterParam(event, 'profileId')
  const storyId = getRouterParam(event, 'storyId')
  
  logRequest('DELETE', ROUTE_PATH, { profileId, storyId })
  
  // Validate parameters
  if (!isRequired(profileId)) {
    const error = createValidationError({
      field: 'profileId',
      message: 'profileId is required',
      code: ErrorCodes.REQUIRED
    })
    logError('DELETE', ROUTE_PATH, error, { field: 'profileId' })
    throw error
  }
  
  if (!isRequired(storyId)) {
    const error = createValidationError({
      field: 'storyId',
      message: 'storyId is required',
      code: ErrorCodes.REQUIRED
    })
    logError('DELETE', ROUTE_PATH, error, { field: 'storyId' })
    throw error
  }
  
  // Soft delete the story by setting deleted_at and is_deleted
  const { data, error } = await supabase
    .schema('career_id')
    .from('hero_stories')
    .update({
      deleted_at: new Date().toISOString(),
      is_deleted: true
    })
    .eq('id', storyId)
    .eq('profile_id', profileId)
    .select()
  
  if (error) {
    logError('DELETE', ROUTE_PATH, error, { profileId, storyId, dbCode: error.code })
    throw handleDatabaseError(error, { operation: 'delete', resource: 'hero story' })
  }
  
  if (!data || data.length === 0) {
    const notFoundError = createNotFoundError('Hero story')
    logError('DELETE', ROUTE_PATH, notFoundError, { profileId, storyId })
    throw notFoundError
  }
  
  const duration = getElapsed()
  logSuccess('DELETE', ROUTE_PATH, duration, { profileId, storyId })
  
  return {
    success: true,
    message: 'Hero story deleted successfully'
  }
})
