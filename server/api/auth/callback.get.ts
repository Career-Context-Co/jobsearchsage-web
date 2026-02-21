/**
 * GET /api/auth/callback
 *
 * OAuth callback handler. Supabase redirects here with ?code=...
 * Server exchanges the code for a session, then redirects to /confirm
 * with tokens in the URL fragment for the client to set the session.
 */

import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const code = query.code as string
  const next = (query.next as string) || '/'
  const config = useRuntimeConfig()
  const appUrl = config.public.appUrl

  if (!code) {
    throw createError({ statusCode: 400, statusMessage: 'Authorization code is required' })
  }

  const supabase = await serverSupabaseClient(event)

  try {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error || !data.session) {
      return sendRedirect(event, `${appUrl}/signin?error=oauth_failed`, 302)
    }

    // Sync name to public.users — Google uses full_name; some providers use given_name/family_name
    const meta = data.user?.user_metadata ?? {}
    let firstName: string | null = meta.given_name ?? meta.first_name ?? null
    let lastName: string | null = meta.family_name ?? meta.last_name ?? null
    const fullName = meta.full_name ?? meta.name ?? meta.display_name ?? null
    if (!firstName && !lastName && fullName) {
      const parts = String(fullName).trim().split(/\s+/)
      firstName = parts[0] ?? fullName
      lastName = parts.length > 1 ? parts.slice(1).join(' ') : null
    }
    if ((firstName || lastName) && data.user) {
      const payload: Record<string, string | null> = {
        id: data.user.id,
        email: data.user.email ?? '',
        last_active_at: new Date().toISOString()
      }
      if (firstName) payload.first_name = firstName
      if (lastName) payload.last_name = lastName
      await supabase.from('users').upsert(payload, { onConflict: 'id' })
    }

    const redirectUrl = `${appUrl}/confirm?next=${encodeURIComponent(next)}&from=oauth#access_token=${data.session.access_token}&refresh_token=${data.session.refresh_token}`
    return sendRedirect(event, redirectUrl, 302)
  } catch {
    return sendRedirect(event, `${appUrl}/signin?error=oauth_failed`, 302)
  }
})
