/**
 * DELETE /api/career-id/profile/:profileId/education/:id
 * 
 * Deletes a specific education entry from the database.
 */

import { serverSupabaseClient } from '#supabase/server'

export default eventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const profileId = getRouterParam(event, 'profileId')
  const id = getRouterParam(event, 'id')
  
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      data: {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Education ID is required'
        }
      }
    })
  }
  
  // Delete the education entry
  const { error } = await supabase
    .schema('career_id')
    .from('education')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Database error deleting education:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      data: {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete education entry'
        }
      }
    })
  }
  
  return {
    success: true,
    message: 'Education deleted successfully'
  }
})

