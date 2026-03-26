/**
 * POST /api/auth/sign-up-immediate
 *
 * No-confirmation variant of sign-up. Used when Supabase email confirmation
 * is disabled (NUXT_PUBLIC_SIGNUP_EMAIL_CONFIRMATION=false). Returns session
 * tokens directly so the client can sign in without an email confirmation step.
 *
 * The original POST /api/auth/sign-up is untouched — switching back to the
 * confirmation flow only requires re-enabling it in Supabase + setting the env var.
 */

import { serverSupabaseClient } from '#supabase/server'
import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { ErrorCodes } from '@@/server/utils/error-handler'
import { mapAuthError } from '@@/server/utils/auth-error-mapper'

const ROUTE_PATH = '/api/auth/sign-up-immediate'

export default eventHandler(async (event) => {
  const getElapsed = createTimer()

  logRequest('POST', ROUTE_PATH)

  try {
    const body = await readBody(event)

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

    // Graceful fallback: if Supabase confirmation is still on, no session is returned.
    // Surface a helpful message rather than crashing.
    if (!signUpData.session) {
      logSuccess('POST', ROUTE_PATH, getElapsed(), { email: body.email, mode: 'confirmation-fallback' })
      return {
        success: true,
        message: 'Please check your email to confirm your account'
      }
    }

    const duration = getElapsed()
    logSuccess('POST', ROUTE_PATH, duration, { email: body.email, userId: signUpData.user?.id })

    return {
      success: true,
      data: {
        session: {
          accessToken: signUpData.session.access_token,
          refreshToken: signUpData.session.refresh_token
        }
      }
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
