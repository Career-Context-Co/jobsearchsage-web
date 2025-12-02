/**
 * GET /api/career-id/profile/:profileId
 * 
 * Fetches a complete profile with all related entities using the get_full_profile database function.
 * Returns: profile, experience, education, certifications, skills, social links, and contact info.
 */

import { serverSupabaseClient } from '#supabase/server'
import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { createValidationError, createNotFoundError, handleDatabaseError } from '@@/server/utils/error-handler'
import { isRequired, requiredFieldError } from '@@/server/utils/validation'

const ROUTE_PATH = '/api/career-id/profile/:profileId'

export default eventHandler(async (event) => {
  const getElapsed = createTimer()
  const supabase = await serverSupabaseClient(event)
  const profileId = getRouterParam(event, 'profileId')

  logRequest('GET', ROUTE_PATH, { profileId })

  // Validate profileId is provided
  if (!isRequired(profileId)) {
    const error = createValidationError(requiredFieldError('profileId'))
    logError('GET', ROUTE_PATH, error, { field: 'profileId' })
    throw error
  }

  // Call the database function to get complete profile
  const { data, error } = await (supabase as any)
  .schema('career_id')
  .rpc('get_full_profile', {
    p_profile_id: profileId
  })

  if (error) {
    logError('GET', ROUTE_PATH, error, { profileId, dbCode: error.code })
    throw handleDatabaseError(error, { operation: 'fetch', resource: 'complete profile' })
  }

  // The function returns null if profile doesn't exist
  if (!data) {
    const notFoundError = createNotFoundError('Profile')
    logError('GET', ROUTE_PATH, notFoundError, { profileId })
    throw notFoundError
  }

  const duration = getElapsed()
  logSuccess('GET', ROUTE_PATH, duration, { profileId })

  return {
    success: true,
    data
  }
})
