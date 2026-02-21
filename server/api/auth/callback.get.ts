/**
 * GET /api/auth/callback
 *
 * OAuth callback handler. Supabase redirects here with ?code=...
 * Server exchanges the code for a session (avoids PKCE verifier issues in client),
 * then redirects to /confirm with tokens in hash for the client to set the session.
 */

import { serverSupabaseClient } from '#supabase/server'
import { getRequestURL, getQuery, sendRedirect } from 'h3'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const code = query.code as string
  const next = (query.next as string) || '/'

  if (!code) {
    const origin = new URL(getRequestURL(event)).origin
    return sendRedirect(event, `${origin}/signin?error=no_code`, 302)
  }

  const supabase = await serverSupabaseClient(event)

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    const origin = new URL(getRequestURL(event)).origin
    return sendRedirect(event, `${origin}/signin?error=oauth_failed`, 302)
  }

  if (!data?.session) {
    const origin = new URL(getRequestURL(event)).origin
    return sendRedirect(event, `${origin}/signin?error=oauth_failed`, 302)
  }

  // Sync name to public.users — Google uses full_name; some providers use given_name/family_name
  const meta = data.user?.user_metadata ?? {}
  let firstName: string | null = meta.given_name ?? meta.first_name ?? null
  let lastName: string | null = meta.family_name ?? meta.last_name ?? null
  const fullName = meta.full_name ?? meta.name ?? meta.display_name ?? null
  if ((!firstName && !lastName) && fullName) {
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

  const origin = new URL(getRequestURL(event)).origin
  const redirectUrl = `${origin}/confirm?next=${encodeURIComponent(next)}&from=oauth#access_token=${data.session.access_token}&refresh_token=${data.session.refresh_token}`

  return sendRedirect(event, redirectUrl, 302)
})
