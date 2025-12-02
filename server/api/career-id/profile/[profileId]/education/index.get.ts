/**
 * GET /api/career-id/profile/:profileId/education
 * 
 * Fetches all education entries for a profile.
 */

import { serverSupabaseClient } from '#supabase/server'

export default eventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  
  // Get profile_id from URL path parameter
  const profileId = getRouterParam(event, 'profileId')
  
  // Fetch all education entries for the profile
  const { data, error } = await supabase
    .schema('career_id')
    .from('education')
    .select('*')
    .eq('profile_id', profileId)
    .order('display_order', { ascending: true })
  
  if (error) {
    console.error('Database error fetching education:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      data: {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch education entries'
        }
      }
    })
  }
  
  return {
    success: true,
    data: data || []
  }
})

