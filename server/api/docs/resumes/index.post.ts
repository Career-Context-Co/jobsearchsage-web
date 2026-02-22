/**
 * POST /api/docs/resumes
 *
 * Creates a new resume for the authenticated user's profile.
 * Takes a snapshot of the current profile data at creation time.
 * Auto-titles as "[FirstName] [LastName] Resume [id]".
 * Returns the created resume record.
 */

import { serverSupabaseClient } from '#supabase/server'
import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { handleDatabaseError, ErrorCodes } from '@@/server/utils/error-handler'

const ROUTE_PATH = '/api/docs/resumes'

export default eventHandler(async (event) => {
  const getElapsed = createTimer()
  const supabase = await serverSupabaseClient(event)
  const body = await readBody(event)

  logRequest('POST', ROUTE_PATH)

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    throw createError({
      statusCode: 401,
      data: {
        success: false,
        error: { code: ErrorCodes.UNAUTHORIZED, message: 'Not authenticated' }
      }
    })
  }

  const { data: profileRow, error: profileError } = await (supabase as any)
    .schema('career_id')
    .from('profiles')
    .select('id')
    .eq('jss_user_id', user.id)
    .maybeSingle()

  if (profileError) {
    logError('POST', ROUTE_PATH, profileError, { userId: user.id })
    throw handleDatabaseError(profileError, { operation: 'fetch', resource: 'profile' })
  }

  if (!profileRow) {
    throw createError({
      statusCode: 404,
      data: { success: false, error: { code: 'NOT_FOUND', message: 'Profile not found' } }
    })
  }

  const profileId = profileRow.id

  // Create the resume with an empty snapshot first (title uses placeholder)
  const placeholderTitle = [body.firstName, body.lastName].filter(Boolean).join(' ')

  const { data: inserted, error: insertError } = await supabase
    .from('docs_resumes')
    .insert({
      profile_id: profileId,
      title: placeholderTitle ? `${placeholderTitle} Resume` : 'Resume',
      content_snapshot: body.contentSnapshot || {},
      design_settings: body.designSettings || {}
    })
    .select('id, title, created_at, updated_at')
    .single()

  if (insertError) {
    logError('POST', ROUTE_PATH, insertError, { profileId })
    throw handleDatabaseError(insertError, { operation: 'create', resource: 'resume' })
  }

  // Update the title to include the integer ID
  const finalTitle = placeholderTitle
    ? `${placeholderTitle} Resume ${inserted.id}`
    : `Resume ${inserted.id}`

  const { data: updated, error: updateError } = await supabase
    .from('docs_resumes')
    .update({ title: finalTitle })
    .eq('id', inserted.id)
    .select('id, title, created_at, updated_at')
    .single()

  if (updateError) {
    logError('POST', ROUTE_PATH, updateError, { profileId, resumeId: inserted.id })
    throw handleDatabaseError(updateError, { operation: 'update', resource: 'resume' })
  }

  setResponseStatus(event, 201)

  const duration = getElapsed()
  logSuccess('POST', ROUTE_PATH, duration, { profileId, resumeId: updated.id })

  return {
    success: true,
    data: {
      id: updated.id,
      title: updated.title,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at
    }
  }
})
