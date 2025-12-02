/**
 * GET /api/reference/skills/search
 * 
 * Searches the skills catalog for autocomplete.
 * Query parameters: q (search query), limit (max results, default 20)
 */

import { serverSupabaseClient } from '#supabase/server'

export default eventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  
  // Get query parameters
  const query = getQuery(event)
  const searchQuery = (query.q as string) || ''
  const limit = parseInt((query.limit as string) || '20')
  
  if (!searchQuery || searchQuery.length < 2) {
    return {
      success: true,
      data: []
    }
  }
  
  // Search skills by name using ILIKE for case-insensitive partial match
  const { data, error } = await supabase
    .schema('reference')
    .from('skills')
    .select('id, skill_name, category, description')
    .or(`skill_name.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`)
    .order('skill_name', { ascending: true })
    .limit(limit)
  
  if (error) {
    console.error('Database error searching skills:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      data: {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to search skills catalog'
        }
      }
    })
  }
  
  return {
    success: true,
    data: data || []
  }
})

