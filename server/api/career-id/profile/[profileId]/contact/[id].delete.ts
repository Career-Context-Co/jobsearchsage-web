/**
 * DELETE /api/career-id/profile/:profileId/contact/:id
 * 
 * Deletes contact information for a profile.
 */

import { serverSupabaseClient } from '#supabase/server'

export default eventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  
  // Get IDs from URL path parameters
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
          message: 'Contact ID is required in URL path'
        }
      }
    })
  }
  
  const { error } = await supabase
    .schema('career_id')
    .from('contact_info')
    .delete()
    .eq('id', id)
    .eq('profile_id', profileId)
  
  if (error) {
    console.error('Database error deleting contact info:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      data: {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete contact information'
        }
      }
    })
  }
  
  return {
    success: true,
    message: 'Contact information deleted successfully'
  }
})

