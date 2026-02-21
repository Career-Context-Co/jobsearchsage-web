/**
 * Auth error mapping utilities
 * 
 * Maps Supabase auth errors to user-friendly messages
 */

import { ErrorCodes } from './error-handler'

interface AuthErrorMapping {
  code: string
  statusCode: number
  message: string
}

/**
 * Map Supabase auth error messages to user-friendly responses
 */
export function mapAuthError(authError: any): AuthErrorMapping {
  const errorMessage = authError?.message || ''
  
  // Invalid credentials (wrong email or password)
  if (
    errorMessage.includes('Invalid login credentials') ||
    errorMessage.includes('invalid_grant') ||
    errorMessage.includes('Invalid email or password')
  ) {
    return {
      code: ErrorCodes.UNAUTHORIZED,
      statusCode: 401,
      message: 'The email or password you entered is incorrect. Please try again.'
    }
  }
  
  // Email not confirmed
  if (
    errorMessage.includes('Email not confirmed') ||
    errorMessage.includes('email_not_confirmed')
  ) {
    return {
      code: ErrorCodes.UNAUTHORIZED,
      statusCode: 401,
      message: 'Please confirm your email address before signing in. Check your inbox for the confirmation link.'
    }
  }
  
  // User already exists (signup)
  if (
    errorMessage.includes('already registered') ||
    errorMessage.includes('User already registered') ||
    errorMessage.includes('duplicate')
  ) {
    return {
      code: ErrorCodes.ALREADY_EXISTS,
      statusCode: 409,
      message: 'An account with this email already exists. Please sign in instead.'
    }
  }
  
  // Invalid email format
  if (errorMessage.includes('Invalid email')) {
    return {
      code: ErrorCodes.VALIDATION_ERROR,
      statusCode: 400,
      message: 'Please enter a valid email address.'
    }
  }
  
  // Password too weak
  if (
    errorMessage.includes('Password should be') ||
    errorMessage.includes('weak password')
  ) {
    return {
      code: ErrorCodes.VALIDATION_ERROR,
      statusCode: 400,
      message: 'Your password is too weak. Please choose a stronger password with at least 6 characters.'
    }
  }
  
  // Rate limiting
  if (
    errorMessage.includes('rate limit') ||
    errorMessage.includes('too many requests')
  ) {
    return {
      code: ErrorCodes.INTERNAL_ERROR,
      statusCode: 429,
      message: 'Too many sign-in attempts. Please wait a few minutes and try again.'
    }
  }
  
  // Session expired
  if (
    errorMessage.includes('session') ||
    errorMessage.includes('token')
  ) {
    return {
      code: ErrorCodes.UNAUTHORIZED,
      statusCode: 401,
      message: 'Your session has expired. Please sign in again.'
    }
  }
  
  // Generic fallback
  return {
    code: ErrorCodes.INTERNAL_ERROR,
    statusCode: 500,
    message: 'An unexpected error occurred. Please try again later.'
  }
}

/**
 * Create a standardized auth error response
 */
export function createAuthError(authError: any) {
  const mapped = mapAuthError(authError)
  
  return createError({
    statusCode: mapped.statusCode,
    statusMessage: mapped.message, // This gets sent as the main message
    data: {
      success: false,
      error: {
        code: mapped.code,
        message: mapped.message
      }
    }
  })
}

/**
 * Throw an auth error with proper response structure
 * This ensures the error message is accessible to the client
 */
export function throwAuthError(event: any, authError: any) {
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
