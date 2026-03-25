/**
 * GET /api/auth/session
 *
 * Returns the current user's session data including name fields and profileId.
 * Used for hydrating auth state on app init.
 * Always returns 200 — profileId is null if user has no career profile yet.
 */

import { serverSupabaseClient } from '#supabase/server'
import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'

const ROUTE_PATH = '/api/auth/session'

export default eventHandler(async (event) => {
  const getElapsed = createTimer()

  logRequest('GET', ROUTE_PATH)

  const supabase = await serverSupabaseClient(event)

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const duration = getElapsed()
    logSuccess('GET', ROUTE_PATH, duration, { authenticated: false })
    return { success: true, data: null }
  }

  // Look up user record in public.users for name fields and profileId
  const { data: publicUser, error: publicUserError } = await supabase
    .from('users')
    .select('first_name, last_name, preferred_name, career_id_profile_id, onboarding_step, onboarding_completed_at')
    .eq('id', user.id)
    .maybeSingle()

  if (publicUserError) {
    logError('GET', ROUTE_PATH, publicUserError, { userId: user.id })
  }

  // Lazy name sync: if no name yet, pull from OAuth provider metadata (Google etc.)
  // This handles the case where Google OAuth bypasses the server callback.
  if (!publicUser?.first_name) {
    const meta = user.user_metadata ?? {}
    let firstName: string | null = meta.given_name ?? meta.first_name ?? null
    let lastName: string | null = meta.family_name ?? meta.last_name ?? null
    const fullName = meta.full_name ?? meta.name ?? null
    if (!firstName && !lastName && fullName) {
      const parts = String(fullName).trim().split(/\s+/)
      firstName = parts[0] ?? null
      lastName = parts.length > 1 ? parts.slice(1).join(' ') : null
    }
    if (firstName || lastName) {
      await supabase.from('users').upsert({
        id: user.id,
        first_name: firstName,
        last_name: lastName,
        last_active_at: new Date().toISOString()
      }, { onConflict: 'id' })
    }
  }

  const duration = getElapsed()
  logSuccess('GET', ROUTE_PATH, duration, {
    userId: user.id,
    profileId: publicUser?.career_id_profile_id ?? null
  })

  // Use synced name values so first-time OAuth users see their name immediately
  const firstName = publicUser?.first_name ?? (() => {
    const meta = user.user_metadata ?? {}
    let fn: string | null = meta.given_name ?? meta.first_name ?? null
    if (!fn && (meta.full_name ?? meta.name)) {
      fn = String(meta.full_name ?? meta.name).trim().split(/\s+/)[0] ?? null
    }
    return fn
  })()
  const lastName = publicUser?.last_name ?? (() => {
    const meta = user.user_metadata ?? {}
    let ln: string | null = meta.family_name ?? meta.last_name ?? null
    if (!ln && (meta.full_name ?? meta.name)) {
      const parts = String(meta.full_name ?? meta.name).trim().split(/\s+/)
      ln = parts.length > 1 ? parts.slice(1).join(' ') : null
    }
    return ln
  })()

  return {
    success: true,
    data: {
      profileId: publicUser?.career_id_profile_id ?? null,
      firstName,
      lastName,
      preferredName: publicUser?.preferred_name ?? null,
      onboardingStep: publicUser?.onboarding_step ?? null,
      onboardingCompletedAt: publicUser?.onboarding_completed_at ?? null
    }
  }
})
