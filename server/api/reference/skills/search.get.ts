/**
 * GET /api/reference/skills/search
 * 
 * Searches the skills catalog for autocomplete.
 * Query parameters: q (search query), limit (max results, default 20)
 */

import { serverSupabaseClient } from '#supabase/server'
import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { handleDatabaseError } from '@@/server/utils/error-handler'

const ROUTE_PATH = '/api/reference/skills/search'

export default eventHandler(async (event) => {
  const getElapsed = createTimer()
  const supabase = await serverSupabaseClient(event)
  
  // Get query parameters
  const query = getQuery(event)
  const searchQuery = (query.q as string) || ''
  const limit = parseInt((query.limit as string) || '20')
  
  logRequest('GET', ROUTE_PATH, { query: searchQuery, limit })
  
  if (!searchQuery || searchQuery.length < 2) {
    const duration = getElapsed()
    logSuccess('GET', ROUTE_PATH, duration, { query: searchQuery, count: 0, reason: 'query too short' })
    return {
      success: true,
      data: []
    }
  }
  
  // Search skills by name using ILIKE for case-insensitive partial match
  const { data, error } = await supabase
    .schema('reference')
    .from('skills')
    .select('id, name, category, description')
    .or(`name.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`)
    .order('name', { ascending: true })
    .limit(limit)
  
  if (error) {
    logError('GET', ROUTE_PATH, error, { query: searchQuery, dbCode: error.code })
    throw handleDatabaseError(error, { operation: 'search', resource: 'skills catalog' })
  }
  
  const duration = getElapsed()
  logSuccess('GET', ROUTE_PATH, duration, { query: searchQuery, count: data?.length ?? 0 })
  
  return {
    success: true,
    data: data || []
  }
})
