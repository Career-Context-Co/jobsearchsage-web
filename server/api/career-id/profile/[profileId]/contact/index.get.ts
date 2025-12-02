/**
 * GET /api/career-id/profile/:profileId/contact
 * 
 * Fetches contact information for a profile.
 * Returns 404 if no contact info exists yet (one-to-one relationship).
 */

import { serverSupabaseClient } from '#supabase/server'

export default eventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  
  // Get profile_id from URL path parameter
  const profileId = getRouterParam(event, 'profileId')
  
  // Fetch contact info (one-to-one relationship with profile)
  const { data, error } = await supabase
    .schema('career_id')
    .from('contact_info')
    .select('*')
    .eq('profile_id', profileId)
    .maybeSingle()
  
  if (error) {
    console.error('Database error fetching contact info:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      data: {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch contact information'
        }
      }
    })
  }
  
  // Return 404 if no contact info exists
  if (!data) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found',
      data: {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Contact information not found for this profile'
        }
      }
    })
  }
  
  return {
    success: true,
    data
  }
})

