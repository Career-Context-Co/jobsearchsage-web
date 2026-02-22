/**
 * POST /api/docs/resumes
 *
 * Creates a new resume for the authenticated user's profile.
 * ID is a prefixed CUID2 (`doc_*`) generated server-side.
 * Auto-titles as "[FirstName] [LastName] Resume [short-id]".
 * Returns the created resume record.
 */

import { serverSupabaseClient } from '#supabase/server'
import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { handleDatabaseError, ErrorCodes } from '@@/server/utils/error-handler'
import { generatePrefixedId } from '@@/server/utils/id-generator'

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
  const resumeId = generatePrefixedId('doc')

  const firstName = (body.firstName || '').trim()
  const lastName = (body.lastName || '').trim()
  const namePart = [firstName, lastName].filter(Boolean).join('_')
  const title = namePart ? `${namePart}_Resume_${resumeId}` : `Resume_${resumeId}`

  const { data, error: insertError } = await supabase
    .from('docs_resumes')
    .insert({
      id: resumeId,
      profile_id: profileId,
      title,
      content: body.content || {},
      design_settings: body.designSettings || {}
    })
    .select('id, title, created_at, updated_at')
    .single()

  if (insertError) {
    logError('POST', ROUTE_PATH, insertError, { profileId })
    throw handleDatabaseError(insertError, { operation: 'create', resource: 'resume' })
  }

  setResponseStatus(event, 201)

  const duration = getElapsed()
  logSuccess('POST', ROUTE_PATH, duration, { profileId, resumeId: data.id })

  return {
    success: true,
    data: {
      id: data.id,
      title: data.title,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  }
})
