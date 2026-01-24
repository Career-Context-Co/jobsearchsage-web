/**
 * GET /api/career-id/profile/:profileId/hero-stories
 * 
 * Fetches all HERO stories for a profile (non-deleted only).
 * Returns stories ordered by display_order, then created_at (newest first).
 */

import { serverSupabaseClient } from '#supabase/server'
import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { handleDatabaseError, createValidationError, ErrorCodes } from '@@/server/utils/error-handler'
import { isRequired } from '@@/server/utils/validation'

const ROUTE_PATH = '/api/career-id/profile/:profileId/hero-stories'

export default eventHandler(async (event) => {
  const getElapsed = createTimer()
  const supabase = await serverSupabaseClient(event)
  
  // Get profile_id from URL path parameter
  const profileId = getRouterParam(event, 'profileId')
  
  logRequest('GET', ROUTE_PATH, { profileId })
  
  // Validate profileId
  if (!isRequired(profileId)) {
    const error = createValidationError({
      field: 'profileId',
      message: 'profileId is required',
      code: ErrorCodes.REQUIRED
    })
    logError('GET', ROUTE_PATH, error, { field: 'profileId' })
    throw error
  }
  
  // Fetch all stories for profile (not deleted), ordered by display_order then created_at
  const { data, error } = await supabase
    .schema('career_id')
    .from('hero_stories')
    .select(`
      id,
      internal_id,
      profile_id,
      title,
      hurdle_problem,
      hurdle_scope,
      hurdle_stakes,
      expectation_role,
      expectation_goals,
      expectation_constraints,
      response_actions,
      response_tools,
      response_challenges,
      outcome_deliverable,
      outcome_metrics,
      outcome_impact,
      source_experience_id,
      display_order,
      deleted_at,
      is_deleted,
      created_at,
      updated_at
    `)
    .eq('profile_id', profileId)
    .eq('is_deleted', false)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })
  
  if (error) {
    logError('GET', ROUTE_PATH, error, { profileId, dbCode: error.code })
    throw handleDatabaseError(error, { operation: 'fetch', resource: 'hero stories' })
  }
  
  const duration = getElapsed()
  logSuccess('GET', ROUTE_PATH, duration, { profileId, count: data?.length ?? 0 })
  
  // Transform snake_case to camelCase for response
  const transformedData = (data || []).map(story => ({
    id: story.id,
    internalId: story.internal_id,
    profileId: story.profile_id,
    title: story.title,
    hurdleProblem: story.hurdle_problem,
    hurdleScope: story.hurdle_scope,
    hurdleStakes: story.hurdle_stakes,
    expectationRole: story.expectation_role,
    expectationGoals: story.expectation_goals,
    expectationConstraints: story.expectation_constraints,
    responseActions: story.response_actions,
    responseTools: story.response_tools,
    responseChallenges: story.response_challenges,
    outcomeDeliverable: story.outcome_deliverable,
    outcomeMetrics: story.outcome_metrics,
    outcomeImpact: story.outcome_impact,
    sourceExperienceId: story.source_experience_id,
    displayOrder: story.display_order,
    deletedAt: story.deleted_at,
    isDeleted: story.is_deleted,
    createdAt: story.created_at,
    updatedAt: story.updated_at
  }))
  
  return {
    success: true,
    data: transformedData
  }
})
