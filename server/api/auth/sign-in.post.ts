/**
 * POST /api/auth/sign-in
 * 
 * Authenticates a user with email and password.
 * Returns session tokens and user data with profileId.
 * Defensively creates a profile if one doesn't exist.
 */

import { serverSupabaseClient } from '#supabase/server'
import { generatePrefixedId } from '@@/server/utils/id-generator'
import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { 
  createValidationError,
  ErrorCodes 
} from '@@/server/utils/error-handler'

const ROUTE_PATH = '/api/auth/sign-in'

export default eventHandler(async (event) => {
  const getElapsed = createTimer()
  
  logRequest('POST', ROUTE_PATH)
  
  const body = await readBody(event)
  
  // Validate input
  const errors = []
  
  if (!body.email || typeof body.email !== 'string' || body.email.trim() === '') {
    errors.push({
      field: 'email',
      message: 'Email is required',
      code: ErrorCodes.REQUIRED
    })
  }
  
  if (!body.password || typeof body.password !== 'string') {
    errors.push({
      field: 'password',
      message: 'Password is required',
      code: ErrorCodes.REQUIRED
    })
  }
  
  if (errors.length > 0) {
    const error = createValidationError(errors)
    logError('POST', ROUTE_PATH, error, { validationErrors: errors.length })
    throw error
  }
  
  const supabase = await serverSupabaseClient(event)
  
  // Authenticate user
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: body.email,
    password: body.password
  })
  
  if (authError) {
    logError('POST', ROUTE_PATH, authError, { email: body.email })
    
    // Handle invalid credentials
    if (authError.message.includes('Invalid login credentials')) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
        data: {
          success: false,
          error: {
            code: ErrorCodes.UNAUTHORIZED,
            message: 'Invalid login credentials'
          }
        }
      })
    }
    
    // Handle unconfirmed email
    if (authError.message.includes('Email not confirmed')) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
        data: {
          success: false,
          error: {
            code: ErrorCodes.UNAUTHORIZED,
            message: 'Please confirm your email before signing in'
          }
        }
      })
    }
    
    // Generic auth error
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      data: {
        success: false,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: authError.message
        }
      }
    })
  }
  
  if (!authData.user || !authData.session) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      data: {
        success: false,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'Authentication succeeded but no session was created'
        }
      }
    })
  }
  
  // Look up user's profileId
  const { data: profiles, error: profileError } = await supabase
    .schema('career_id')
    .from('profiles')
    .select('id')
    .eq('user_id', authData.user.id)
    .limit(1)
  
  let profileId: string
  
  if (profileError || !profiles || profiles.length === 0) {
    // Defensively create profile if it doesn't exist
    profileId = generatePrefixedId('prof')
    
    const { error: createError } = await supabase
      .schema('career_id')
      .from('profiles')
      .insert({
        id: profileId,
        user_id: authData.user.id,
        completion_status: 'incomplete'
      })
    
    if (createError) {
      logError('POST', ROUTE_PATH, createError, { 
        userId: authData.user.id, 
        profileId 
      })
      throw createError({
        statusCode: 500,
        statusMessage: 'Internal Server Error',
        data: {
          success: false,
          error: {
            code: ErrorCodes.INTERNAL_ERROR,
            message: 'Failed to create user profile'
          }
        }
      })
    }
    
    console.log('Defensively created profile for user:', authData.user.id)
  } else {
    profileId = profiles[0].id
  }
  
  const duration = getElapsed()
  logSuccess('POST', ROUTE_PATH, duration, { 
    userId: authData.user.id,
    profileId
  })
  
  return {
    success: true,
    message: 'Signed in successfully',
    data: {
      user: {
        id: authData.user.id,
        email: authData.user.email
      },
      session: {
        accessToken: authData.session.access_token,
        refreshToken: authData.session.refresh_token
      },
      profileId
    }
  }
})
