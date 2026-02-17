/**
 * POST /api/auth/sign-up
 * 
 * Creates a new user account with email and password.
 * Auto-creates a profile shell for the new user.
 */

import { serverSupabaseClient } from '#supabase/server'
import { generatePrefixedId } from '@@/server/utils/id-generator'
import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { ErrorCodes } from '@@/server/utils/error-handler'
import { mapAuthError } from '@@/server/utils/auth-error-mapper'

const ROUTE_PATH = '/api/auth/sign-up'

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
    } else if (body.password.length < 6) {
      errors.push({
        field: 'password',
        message: 'Password must be at least 6 characters',
        code: ErrorCodes.TOO_SHORT
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
    
    // Attempt sign-up
    const { data: authData, error: authError } = await supabase.auth.signUp({
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
    
    // Check if profile already exists for this auth user (duplicate signup detection)
    if (authData.user) {
      const { data: existingProfile } = await supabase
        .schema('career_id')
        .from('profiles')
        .select('id, created_at')
        .eq('auth_user_id', authData.user.id)
        .maybeSingle()
      
      // If profile exists and was created more than 10 seconds ago, this is a duplicate signup attempt
      if (existingProfile) {
        const profileAge = Date.now() - new Date(existingProfile.created_at).getTime()
        if (profileAge > 10000) { // More than 10 seconds old
          logError('POST', ROUTE_PATH, new Error('Duplicate signup attempt'), { 
            email: body.email,
            authUserId: authData.user.id,
            profileCreated: existingProfile.created_at
          })
          setResponseStatus(event, 409)
          return {
            success: false,
            error: {
              code: ErrorCodes.ALREADY_EXISTS,
              message: 'An account with this email already exists. Please sign in instead.'
            }
          }
        }
      }
    }
    
    // Auto-create profile shell - this must succeed for signup to be considered successful
    if (authData.user) {
      const profileId = generatePrefixedId('prof')
      
      const { error: profileError } = await supabase
        .schema('career_id')
        .from('profiles')
        .insert({
          id: profileId,
          auth_user_id: authData.user.id,
          completion_status: 'incomplete'
        })
      
      if (profileError) {
        logError('POST', ROUTE_PATH, profileError, { 
          authUserId: authData.user.id, 
          profileId,
          dbCode: profileError.code,
          dbMessage: profileError.message,
          dbDetails: profileError.details,
          dbHint: profileError.hint
        })
        
        // Check if it's a duplicate key error (unique constraint violation)
        // This could be on auth_user_id, email, or other unique fields
        if (profileError.code === '23505') {
          setResponseStatus(event, 409)
          return {
            success: false,
            error: {
              code: ErrorCodes.ALREADY_EXISTS,
              message: 'An account with this email already exists. Please sign in instead.'
            }
          }
        }
        
        // Check if it's a foreign key violation (auth_user_id doesn't exist in auth.users)
        if (profileError.code === '23503') {
          setResponseStatus(event, 409)
          return {
            success: false,
            error: {
              code: ErrorCodes.ALREADY_EXISTS,
              message: 'An account with this email already exists. Please sign in instead.'
            }
          }
        }
        
        // Check if it's a NOT NULL constraint violation on user_id
        if (profileError.code === '23502' && profileError.message?.includes('user_id')) {
          setResponseStatus(event, 500)
          return {
            success: false,
            error: {
              code: ErrorCodes.INTERNAL_ERROR,
              message: 'Database configuration error. Please contact support. (Missing user_id)'
            }
          }
        }
        
        // Check if error message contains duplicate/already exists indicators
        const errorMsg = (profileError.message || '').toLowerCase()
        if (errorMsg.includes('duplicate') || errorMsg.includes('already exists') || errorMsg.includes('unique')) {
          setResponseStatus(event, 409)
          return {
            success: false,
            error: {
              code: ErrorCodes.ALREADY_EXISTS,
              message: 'An account with this email already exists. Please sign in instead.'
            }
          }
        }
        
        // For other errors, return internal error
        setResponseStatus(event, 500)
        return {
          success: false,
          error: {
            code: ErrorCodes.INTERNAL_ERROR,
            message: 'Failed to create user account. Please try again or contact support.'
          }
        }
      }
      
      logSuccess('POST', ROUTE_PATH, getElapsed(), { 
        authUserId: authData.user.id,
        profileId
      })
    }
    
    const duration = getElapsed()
    logSuccess('POST', ROUTE_PATH, duration, { email: body.email })
    
    return {
      success: true,
      message: 'Please check your email to confirm your account'
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
