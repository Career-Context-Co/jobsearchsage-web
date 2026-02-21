/**
 * POST /api/auth/sign-up
 *
 * Creates a new user account with email and password.
 * Accepts optional firstName, lastName, preferredName and stores them in
 * auth user_metadata so they are available on first sign-in.
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

    // Validate required fields
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

    // Check for duplicate email
    const { data: authCheckData, error: authCheckError } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: 'check-only-do-not-use'
    })

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

    // Build optional user_metadata from name fields — stored in auth.users.raw_user_meta_data
    // The trigger creates the public.users row; sign-in will sync these to public.users on first login
    const firstName = typeof body.firstName === 'string' ? body.firstName.trim() : undefined
    const lastName = typeof body.lastName === 'string' ? body.lastName.trim() : undefined
    const preferredName = typeof body.preferredName === 'string' ? body.preferredName.trim() : undefined

    const userData: Record<string, string> = {}
    if (firstName) userData.first_name = firstName
    if (lastName) userData.last_name = lastName
    if (preferredName) userData.preferred_name = preferredName

    const { data: signUpData, error: authError } = await supabase.auth.signUp({
      email: body.email,
      password: body.password,
      options: {
        data: Object.keys(userData).length > 0 ? userData : undefined
      }
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
