/**
 * DELETE /api/career-id/profile/:profileId/skills
 * 
 * Removes multiple skills from the profile (bulk delete operation).
 * Accepts an array of skill IDs to delete (deletes from profile_skills junction table).
 * Does NOT delete from reference.skills catalog.
 */

import { serverSupabaseClient } from '#supabase/server'

export default eventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const profileId = getRouterParam(event, 'profileId')
  const body = await readBody(event)
  
  // Ensure body.ids is an array
  const ids = Array.isArray(body?.ids) ? body.ids : (body?.ids ? [body.ids] : [])
  
  if (ids.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      data: {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'At least one skill ID is required'
        }
      }
    })
  }
  
  // Delete multiple skills from profile_skills junction table
  const { error, count } = await supabase
    .schema('career_id')
    .from('profile_skills')
    .delete({ count: 'exact' })
    .eq('profile_id', profileId)
    .in('id', ids)
  
  if (error) {
    console.error('Database error deleting profile skills:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      data: {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to remove skills from profile'
        }
      }
    })
  }
  
  return {
    success: true,
    message: `${count || 0} skill(s) removed from profile successfully`
  }
})

