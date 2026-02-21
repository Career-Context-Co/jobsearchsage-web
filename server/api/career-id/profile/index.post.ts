/**
 * POST /api/career-id/profile
 *
 * Creates a new career profile for the authenticated user.
 * After creation, updates public.users.career_id_profile_id to link the profile.
 */

import { serverSupabaseClient } from '#supabase/server'
import { generatePrefixedId } from '@@/server/utils/id-generator'
import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import {
  handleDatabaseError,
  ErrorCodes
} from '@@/server/utils/error-handler'
import { transformProfile } from '@@/server/utils/career-id-transformer'

const ROUTE_PATH = '/api/career-id/profile'

export default eventHandler(async (event) => {
  const getElapsed = createTimer()

  logRequest('POST', ROUTE_PATH)

  const supabase = await serverSupabaseClient(event)

  // Verify authentication
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    logError('POST', ROUTE_PATH, userError || new Error('Not authenticated'))
    throw createError({
      statusCode: 401,
      data: {
        success: false,
        error: { code: ErrorCodes.UNAUTHORIZED, message: 'Not authenticated' }
      }
    })
  }

  // Generate prefixed ID for the profile
  const profileId = generatePrefixedId('cid')

  logRequest('POST', ROUTE_PATH, { userId: user.id, profileId })

  // Insert profile into career_id schema - jss_user_id required for RLS
  const { data, error } = await supabase
    .schema('career_id')
    .from('profiles')
    .insert({
      id: profileId,
      jss_user_id: user.id,
      completion_status: 'incomplete'
    })
    .select()
    .single()

  if (error) {
    logError('POST', ROUTE_PATH, error, { userId: user.id, profileId, dbCode: error.code })
    throw handleDatabaseError(error, { operation: 'create', resource: 'profile' })
  }

  // Link the new profile back to public.users
  const { error: linkError } = await supabase
    .from('users')
    .update({ career_id_profile_id: profileId })
    .eq('id', user.id)

  if (linkError) {
    logError('POST', ROUTE_PATH, linkError, { userId: user.id, profileId })
    // Profile was created but link failed — log and continue (non-fatal for the response)
  }

  setResponseStatus(event, 201)

  const duration = getElapsed()
  logSuccess('POST', ROUTE_PATH, duration, { profileId: data.id, userId: user.id })

  return {
    success: true,
    message: 'Profile created successfully',
    data: {
      profile: transformProfile(data)
    }
  }
})
