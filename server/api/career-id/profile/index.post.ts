/**
 * POST /api/career-id/profile
 * 
 * Creates a new profile for a user.
 * Only creates the profile shell - entities (experience, education, etc.)
 * are saved separately via their own endpoints.
 */

import { serverSupabaseClient } from '#supabase/server'
import { generatePrefixedId } from '@@/server/utils/id-generator'
import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { 
  handleDatabaseError, 
  createValidationError,
  ErrorCodes 
} from '@@/server/utils/error-handler'
import { isRequired, requiredFieldError } from '@@/server/utils/validation'

const ROUTE_PATH = '/api/career-id/profile'

export default eventHandler(async (event) => {
  const getElapsed = createTimer()
  
  logRequest('POST', ROUTE_PATH)
  
  // Get Supabase client
  const supabase = await serverSupabaseClient(event)
  
  // Read request body
  const body = await readBody(event)
  
  // Validate required fields
  if (!isRequired(body.userId)) {
    const error = createValidationError(requiredFieldError('userId'))
    logError('POST', ROUTE_PATH, error, { field: 'userId' })
    throw error
  }
  
  // Generate prefixed ID for the profile
  const profileId = generatePrefixedId('prof')
  
  logRequest('POST', ROUTE_PATH, { userId: body.userId, profileId })

  // Insert profile into database
  const { data, error } = await supabase
    .schema('career_id')
    .from('profiles')
    .insert({
      id: profileId,
      user_id: body.userId,
      completion_status: 'incomplete'
    })
    .select()
    .single()
  
  // Handle database errors
  if (error) {
    logError('POST', ROUTE_PATH, error, { 
      userId: body.userId, 
      profileId,
      dbCode: error.code 
    })
    throw handleDatabaseError(error, { 
      operation: 'create', 
      resource: 'profile' 
    })
  }
  
  // Set response status to 201 Created
  setResponseStatus(event, 201)
  
  const duration = getElapsed()
  logSuccess('POST', ROUTE_PATH, duration, { 
    profileId: data.id,
    userId: data.user_id 
  })
  
  // Return created profile with structure matching API spec
  return {
    success: true,
    message: 'Profile created successfully',
    data: {
      profile: {
        id: data.id,
        user_id: data.user_id,
        completion_status: data.completion_status,
        created_at: data.created_at,
        updated_at: data.updated_at
      }
    }
  }
})
