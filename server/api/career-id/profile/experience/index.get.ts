/**
 * GET /api/career-id/profile/experience
 * 
 * Fetches all experience entries for a profile.
 * Query parameter: profileId (required)
 */

import { serverSupabaseClient } from '#supabase/server'

export default eventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  
  // Get profile_id from query parameter
  const query = getQuery(event)
  const profileId = query.profileId as string
  
  if (!profileId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      data: {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'profileId query parameter is required'
        }
      }
    })
  }
  
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

