/**
 * GET /api/career-id/profile/:profileId/moments
 * 
 * Fetches all moments for a profile.
 * Returns all moments including unconverted ones.
 * Ordered by created_at (newest first).
 */

import { serverSupabaseClient } from '#supabase/server'
import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { handleDatabaseError } from '@@/server/utils/error-handler'
import { isRequired } from '@@/server/utils/validation'

const ROUTE_PATH = '/api/career-id/profile/:profileId/moments'

export default eventHandler(async (event) => {
  const getElapsed = createTimer()
  const supabase = await serverSupabaseClient(event)
  
  // Get profile_id from URL path parameter
  const profileId = getRouterParam(event, 'profileId')
  
  logRequest('GET', ROUTE_PATH, { profileId })
  
  // Validate profileId
  if (!isRequired(profileId)) {
    const error = new Error('profileId is required')
    logError('GET', ROUTE_PATH, error, { field: 'profileId' })
    throw error
  }
  
  // Fetch all moments for profile (not deleted)
  const { data, error } = await supabase
    .schema('career_id')
    .from('hero_moments')
    .select(`
      id,
      profile_id,
      title,
      raw_notes,
      source_experience_id,
      discovery_session_id,
      created_at,
      updated_at,
      deleted_at,
      converted_at,
      converted_story_id
    `)
    .eq('profile_id', profileId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  
  if (error) {
    logError('GET', ROUTE_PATH, error, { profileId, dbCode: error.code })
    throw handleDatabaseError(error, { operation: 'fetch', resource: 'moments' })
  }
  
  const duration = getElapsed()
  logSuccess('GET', ROUTE_PATH, duration, { profileId, count: data?.length ?? 0 })
  
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
    data: transformedData
  }
})
