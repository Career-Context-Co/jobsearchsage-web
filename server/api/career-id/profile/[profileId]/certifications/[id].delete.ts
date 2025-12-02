/**
 * DELETE /api/career-id/profile/:profileId/certifications/:id
 * 
 * Deletes a specific certification from the database.
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
          message: 'Certification ID is required'
        }
      }
    })
  }
  
  // Delete the certification
  const { error } = await supabase
    .schema('career_id')
    .from('certifications')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Database error deleting certification:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      data: {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete certification'
        }
      }
    })
  }
  
  return {
    success: true,
    message: 'Certification deleted successfully'
  }
})

