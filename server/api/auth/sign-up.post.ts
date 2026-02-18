/**
 * POST /api/auth/sign-up
 * 
 * Creates a new user account with email and password.
 * Profile is created separately by the user after signup.
 */

import { serverSupabaseClient } from '#supabase/server'
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
    
    // Check for duplicate email by looking up existing auth user via profile
    // We do this before calling signUp so we can return a clear error
    const { data: authCheckData, error: authCheckError } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: 'check-only-do-not-use'
    })

    // If we get "Email not confirmed" error, the user exists
    if (authCheckError?.message?.includes('Email not confirmed')) {
      setResponseStatus(event, 409)
      return {
        success: false,
        error: {
          code: ErrorCodes.ALREADY_EXISTS,
          message: 'An account with this email already exists. Please sign in instead.'
        }
      }
    }

    // If sign-in somehow succeeds (extremely unlikely), user definitely exists
    if (authCheckData?.user) {
      setResponseStatus(event, 409)
      return {
        success: false,
        error: {
          code: ErrorCodes.ALREADY_EXISTS,
          message: 'An account with this email already exists. Please sign in instead.'
        }
      }
    }
    
    // Attempt sign-up
    const { data: signUpData, error: authError } = await supabase.auth.signUp({
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

    // Supabase silently re-sends confirmation email for existing unconfirmed users
    // Detect this by checking if the user's created_at is older than a few seconds
    if (signUpData.user) {
      const createdAt = new Date(signUpData.user.created_at).getTime()
      const ageMs = Date.now() - createdAt
      if (ageMs > 5000) {
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
    
    const duration = getElapsed()
    logSuccess('POST', ROUTE_PATH, duration, { email: body.email })
    
    return {
      success: true,
      message: 'Please check your email to confirm your account'
    }
  } catch (error: any) {
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
