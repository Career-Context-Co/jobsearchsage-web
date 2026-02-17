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
import { ErrorCodes } from '@@/server/utils/error-handler'
import { mapAuthError } from '@@/server/utils/auth-error-mapper'

const ROUTE_PATH = '/api/auth/sign-in'

export default eventHandler(async (event) => {
  const getElapsed = createTimer()
  
  logRequest('POST', ROUTE_PATH)
  
  try {
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
      setResponseStatus(event, 400)
      return {
        success: false,
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'Validation failed',
          details: errors
        }
      }
    }
    
    const supabase = await serverSupabaseClient(event)
    
    // Authenticate user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password
    })
    
    if (authError) {
      logError('POST', ROUTE_PATH, authError, { email: body.email })
      const mapped = mapAuthError(authError)
      setResponseStatus(event, mapped.statusCode)
      return {
        success: false,
        error: {
          code: mapped.code,
          message: mapped.message
        }
      }
    }
    
    if (!authData.user || !authData.session) {
      setResponseStatus(event, 500)
      return {
        success: false,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'Authentication succeeded but no session was created'
        }
      }
    }
  
    // Look up user's profileId using the auth_user_id foreign key
    const { data: profile, error: profileError } = await supabase
      .schema('career_id')
      .from('profiles')
      .select('id')
      .eq('auth_user_id', authData.user.id)
      .maybeSingle()
    
    let profileId: string
    
    if (profileError || !profile) {
      // Defensively create profile if it doesn't exist
      profileId = generatePrefixedId('prof')
      
      const { error: createProfileError } = await supabase
        .schema('career_id')
        .from('profiles')
        .insert({
          id: profileId,
          auth_user_id: authData.user.id,
          completion_status: 'incomplete'
        })
      
      if (createProfileError) {
        logError('POST', ROUTE_PATH, createProfileError, { 
          userId: authData.user.id, 
          profileId 
        })
        setResponseStatus(event, 500)
        return {
          success: false,
          error: {
            code: ErrorCodes.INTERNAL_ERROR,
            message: 'Failed to create user profile'
          }
        }
      }
      
      console.log('Defensively created profile for user:', authData.user.id)
    } else {
      profileId = profile.id
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
  } catch (error: any) {
    // Catch any unexpected errors
    logError('POST', ROUTE_PATH, error)
    setResponseStatus(event, 500)
    return {
      success: false,
      error: {
        code: ErrorCodes.INTERNAL_ERROR,
        message: 'An unexpected error occurred. Please try again later.'
      }
    }
  }
})
