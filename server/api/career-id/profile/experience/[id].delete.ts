/**
 * DELETE /api/career-id/profile/experience/:id
 * 
 * Deletes a specific experience entry from the database.
 */

import { serverSupabaseClient } from '#supabase/server'

export default eventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const id = getRouterParam(event, 'id')
  
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      data: {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Experience ID is required'
        }
      }
    })
  }
  
  // Delete the experience entry
  const { error } = await supabase
    .schema('career_id')
    .from('experience')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Database error deleting experience:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      data: {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete experience entry'
        }
      }
    })
  }
  
  return {
    success: true,
    message: 'Experience deleted successfully'
  }
})

