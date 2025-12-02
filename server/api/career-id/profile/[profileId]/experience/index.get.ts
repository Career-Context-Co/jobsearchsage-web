/**
 * GET /api/career-id/profile/:profileId/experience
 * 
 * Fetches all experience entries for a profile.
 */

import { serverSupabaseClient } from '#supabase/server'

export default eventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  
  // Get profile_id from URL path parameter
  const profileId = getRouterParam(event, 'profileId')
  
  // Fetch all experience entries for the profile
  const { data, error } = await supabase
    .schema('career_id')
    .from('experience')
    .select('*')
    .eq('profile_id', profileId)
    .order('display_order', { ascending: true })
  
  if (error) {
    console.error('Database error fetching experience:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      data: {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch experience entries'
        }
      }
    })
  }
  
  return {
    success: true,
    data: data || []
  }
})

