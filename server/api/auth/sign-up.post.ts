/**
 * POST /api/auth/sign-up
 * 
 * Creates a new user account with email and password.
 * Auto-creates a profile shell for the new user.
 */

import { serverSupabaseClient } from '#supabase/server'
import { generatePrefixedId } from '@@/server/utils/id-generator'
import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { 
  handleDatabaseError, 
  createValidationError,
  ErrorCodes 
} from '@@/server/utils/error-handler'

const ROUTE_PATH = '/api/auth/sign-up'

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
  } else if (body.password.length < 6) {
    errors.push({
      field: 'password',
      message: 'Password must be at least 6 characters',
      code: ErrorCodes.TOO_SHORT
    })
  }
  
  if (errors.length > 0) {
    const error = createValidationError(errors)
    logError('POST', ROUTE_PATH, error, { validationErrors: errors.length })
    throw error
  }
  
  const supabase = await serverSupabaseClient(event)
  
  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: body.email,
    password: body.password
  })
  
  if (authError) {
    logError('POST', ROUTE_PATH, authError, { email: body.email })
    
    // Handle duplicate email
    if (authError.message.includes('already registered')) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Conflict',
        data: {
          success: false,
          error: {
            code: ErrorCodes.ALREADY_EXISTS,
            message: 'An account with this email already exists'
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
  
  // Auto-create profile shell
  if (authData.user) {
    const profileId = generatePrefixedId('prof')
    
    const { error: profileError } = await supabase
      .schema('career_id')
      .from('profiles')
      .insert({
        id: profileId,
        user_id: authData.user.id,
        completion_status: 'incomplete'
      })
    
    if (profileError) {
      logError('POST', ROUTE_PATH, profileError, { 
        userId: authData.user.id, 
        profileId,
        dbCode: profileError.code 
      })
      // Log the error but don't fail the sign-up
      // The sign-in endpoint will handle missing profiles defensively
      console.warn('Failed to create profile during sign-up, will be created on first sign-in')
    } else {
      logSuccess('POST', ROUTE_PATH, getElapsed(), { 
        userId: authData.user.id,
        profileId
      })
    }
  }
  
  const duration = getElapsed()
  logSuccess('POST', ROUTE_PATH, duration, { email: body.email })
  
  return {
    success: true,
    message: 'Please check your email to confirm your account'
  }
})
