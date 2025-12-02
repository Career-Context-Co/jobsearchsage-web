/**
 * GET /api/career-id/profile/:profileId/skills
 * 
 * Fetches all skills for a profile.
 * Returns name for display (what user typed).
 * skill_id may be null if not yet matched to reference catalog by background job.
 */

import { serverSupabaseClient } from '#supabase/server'

export default eventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  
  // Get profile_id from URL path parameter
  const profileId = getRouterParam(event, 'profileId')
  
  // Fetch profile skills
  // name is always populated (what user typed)
  // skill_id may be null if not yet matched by background job
  const { data, error } = await supabase
    .schema('career_id')
    .from('profile_skills')
    .select(`
      id,
      profile_id,
      skill_id,
      name,
      proficiency_level,
      years_experience,
      display_order,
      created_at,
      updated_at
    `)
    .eq('profile_id', profileId)
    .order('display_order', { ascending: true })
  
  if (error) {
    console.error('Database error fetching skills:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      data: {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch skills'
        }
      }
    })
  }
  
  return {
    success: true,
    data: data || []
  }
})

