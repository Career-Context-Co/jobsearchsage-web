/**
 * POST /api/auth/sign-in
 *
 * Authenticates a user with email and password.
 * Returns session tokens, user data (including name fields from public.users), and profileId.
 * Also updates last_active_at and syncs any names from auth user_metadata on first login.
 */

import { serverSupabaseClient } from '#supabase/server'
import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { ErrorCodes } from '@@/server/utils/error-handler'
import { mapAuthError } from '@@/server/utils/auth-error-mapper'
import { useServerPostHog } from '@@/server/utils/posthog'

const ROUTE_PATH = '/api/auth/sign-in'

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

    // After signInWithPassword the supabase client is authenticated in this request context.
    // Fetch user record from public.users for name fields and profileId.
    const { data: publicUser } = await supabase
      .from('users')
      .select('first_name, last_name, preferred_name, career_id_profile_id')
      .eq('id', authData.user.id)
      .maybeSingle()

    // Build the update payload for public.users:
    // - Always stamp last_active_at
    // - Sync names from auth user_metadata if public.users doesn't have them yet
    const meta = authData.user.user_metadata ?? {}
    const updatePayload: Record<string, string | null> = {
      last_active_at: new Date().toISOString()
    }

    if (!publicUser?.first_name && meta.first_name) {
      updatePayload.first_name = meta.first_name
    }
    if (!publicUser?.last_name && meta.last_name) {
      updatePayload.last_name = meta.last_name
    }
    if (!publicUser?.preferred_name && meta.preferred_name) {
      updatePayload.preferred_name = meta.preferred_name
    }

    // Fire-and-forget — don't block the response on this
    supabase
      .from('users')
      .update(updatePayload)
      .eq('id', authData.user.id)
      .then(() => {})

    // Resolve final name values (merge public.users + any synced metadata)
    const firstName = publicUser?.first_name ?? meta.first_name ?? null
    const lastName = publicUser?.last_name ?? meta.last_name ?? null
    const preferredName = publicUser?.preferred_name ?? meta.preferred_name ?? null

    const duration = getElapsed()
    logSuccess('POST', ROUTE_PATH, duration, {
      userId: authData.user.id,
      profileId: publicUser?.career_id_profile_id ?? null
    })

    const sessionId = getHeader(event, 'x-posthog-session-id')
    const distinctId = getHeader(event, 'x-posthog-distinct-id')
    const posthog = useServerPostHog()
    posthog.capture({
      distinctId: distinctId ?? authData.user.id,
      event: 'server_user_signed_in',
      properties: {
        $session_id: sessionId,
        user_id: authData.user.id,
        has_profile: !!(publicUser?.career_id_profile_id),
        source: 'api'
      }
    })

    return {
      success: true,
      message: 'Signed in successfully',
      data: {
        user: {
          id: authData.user.id,
          email: authData.user.email,
          firstName,
          lastName,
          preferredName
        },
        session: {
          accessToken: authData.session.access_token,
          refreshToken: authData.session.refresh_token
        },
        profileId: publicUser?.career_id_profile_id ?? null
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
