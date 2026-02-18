/**
 * PATCH /api/auth/user
 *
 * Updates the authenticated user's name fields in public.users.
 * Accepts: firstName, lastName, preferredName (all optional).
 */

import { serverSupabaseClient } from '#supabase/server'
import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { ErrorCodes } from '@@/server/utils/error-handler'

const ROUTE_PATH = '/api/auth/user'

export default eventHandler(async (event) => {
  const getElapsed = createTimer()

  logRequest('PATCH', ROUTE_PATH)

  const supabase = await serverSupabaseClient(event)

  // Verify authentication
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    logError('PATCH', ROUTE_PATH, userError || new Error('No user'))
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      data: {
        success: false,
        error: {
          code: ErrorCodes.UNAUTHORIZED,
          message: 'Not authenticated'
        }
      }
    })
  }

  const body = await readBody(event)

  // Build update payload from whitelisted fields only
  const updateData: Record<string, string> = {}
  if (typeof body.firstName === 'string') updateData.first_name = body.firstName.trim()
  if (typeof body.lastName === 'string') updateData.last_name = body.lastName.trim()
  if (typeof body.preferredName === 'string') updateData.preferred_name = body.preferredName.trim()

  if (Object.keys(updateData).length === 0) {
    setResponseStatus(event, 400)
    return {
      success: false,
      error: {
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'No valid fields provided to update'
      }
    }
  }

  // Upsert so users whose row predates the trigger are handled gracefully
  const { error: upsertError } = await supabase
    .from('users')
    .upsert({ id: user.id, ...updateData })

  if (upsertError) {
    logError('PATCH', ROUTE_PATH, upsertError, { userId: user.id })
    throw createError({
      statusCode: 500,
      data: {
        success: false,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'Failed to update user'
        }
      }
    })
  }

  const duration = getElapsed()
  logSuccess('PATCH', ROUTE_PATH, duration, { userId: user.id, updatedFields: Object.keys(updateData) })

  return {
    success: true,
    data: {
      firstName: updateData.first_name ?? null,
      lastName: updateData.last_name ?? null,
      preferredName: updateData.preferred_name ?? null
    }
  }
})
