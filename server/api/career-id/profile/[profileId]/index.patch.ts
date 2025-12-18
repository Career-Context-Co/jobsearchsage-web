/**
 * PATCH /api/career-id/profile/:profileId
 * 
 * Updates profile metadata (e.g., completion status)
 */

import { serverSupabaseClient } from '#supabase/server'
import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { createValidationError, createNotFoundError, handleDatabaseError } from '@@/server/utils/error-handler'
import { isRequired, requiredFieldError } from '@@/server/utils/validation'

const ROUTE_PATH = '/api/career-id/profile/:profileId'

export default eventHandler(async (event) => {
  const getElapsed = createTimer()
  const supabase = await serverSupabaseClient(event)
  const profileId = getRouterParam(event, 'profileId')
  const body = await readBody(event)

  logRequest('PATCH', ROUTE_PATH, { profileId, body })

  // Validate profileId is provided
  if (!isRequired(profileId)) {
    const error = createValidationError(requiredFieldError('profileId'))
    logError('PATCH', ROUTE_PATH, error, { field: 'profileId' })
    throw error
  }

  // Build update object with only provided fields
  const updateData: any = {}

  if (body.completionStatus !== undefined) {
    // Validate completion status is one of the allowed values
    const allowedStatuses = ['incomplete', 'verified', 'complete']
    if (!allowedStatuses.includes(body.completionStatus)) {
      const error = createValidationError({
        field: 'completionStatus',
        message: `Completion status must be one of: ${allowedStatuses.join(', ')}`,
        code: 'VALIDATION_ERROR'
      })
      logError('PATCH', ROUTE_PATH, error)
      throw error
    }
    updateData.completion_status = body.completionStatus
  }

  // Ensure there's something to update
  if (Object.keys(updateData).length === 0) {
    const error = createValidationError({
      field: 'body',
      message: 'No valid fields provided for update',
      code: 'VALIDATION_ERROR'
    })
    logError('PATCH', ROUTE_PATH, error)
    throw error
  }

  // Update the profile
  const { data, error } = await (supabase as any)
    .schema('career_id')
    .from('profiles')
    .update(updateData)
    .eq('id', profileId)
    .select()
    .single()

  if (error) {
    // Check for not found error
    if (error.code === 'PGRST116') {
      const notFoundError = createNotFoundError('Profile')
      logError('PATCH', ROUTE_PATH, notFoundError, { profileId })
      throw notFoundError
    }

    logError('PATCH', ROUTE_PATH, error, { profileId, dbCode: error.code })
    throw handleDatabaseError(error, { operation: 'update', resource: 'profile' })
  }

  const duration = getElapsed()
  logSuccess('PATCH', ROUTE_PATH, duration, { profileId, updatedFields: Object.keys(updateData) })

  // Transform snake_case to camelCase
  const transformedData = {
    id: data.id,
    userId: data.user_id,
    internalId: data.internal_id,
    completionStatus: data.completion_status,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    deletedAt: data.deleted_at,
    isDeleted: data.is_deleted
  }

  return {
    success: true,
    data: transformedData
  }
})
