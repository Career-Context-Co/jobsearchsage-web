/**
 * POST /api/career-id/profile/:profileId/hero-stories
 * 
 * Creates a new HERO story for a profile.
 * Accepts HERO story fields (title + 12 HERO tagged fields) and optional source_experience_id.
 * Generates prefixed ID (`story_*`) server-side.
 * Returns the created story with generated ID.
 */

import { serverSupabaseClient } from '#supabase/server'
import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { handleDatabaseError, createValidationError, ErrorCodes } from '@@/server/utils/error-handler'
import { isRequired } from '@@/server/utils/validation'
import { generatePrefixedId } from '@@/server/utils/id-generator'

const ROUTE_PATH = '/api/career-id/profile/:profileId/hero-stories'

export default eventHandler(async (event) => {
  const getElapsed = createTimer()
  const supabase = await serverSupabaseClient(event)
  const body = await readBody(event)
  
  // Get profile_id from URL path parameter
  const profileId = getRouterParam(event, 'profileId')
  
  logRequest('POST', ROUTE_PATH, { profileId })
  
  // Validate profileId
  if (!isRequired(profileId)) {
    const error = createValidationError({
      field: 'profileId',
      message: 'profileId is required',
      code: ErrorCodes.REQUIRED
    })
    logError('POST', ROUTE_PATH, error, { field: 'profileId' })
    throw error
  }
  
  // Validate title (required)
  if (!isRequired(body.title)) {
    const error = createValidationError({
      field: 'title',
      message: 'title is required and cannot be empty',
      code: ErrorCodes.REQUIRED
    })
    logError('POST', ROUTE_PATH, error, { profileId })
    throw error
  }
  
  // Optional: Validate source_experience_id if provided (must be an integer)
  if (body.sourceExperienceId !== undefined && body.sourceExperienceId !== null) {
    if (typeof body.sourceExperienceId !== 'number' || !Number.isInteger(body.sourceExperienceId)) {
      const error = createValidationError({
        field: 'sourceExperienceId',
        message: 'sourceExperienceId must be an integer',
        code: ErrorCodes.INVALID
      })
      logError('POST', ROUTE_PATH, error, { profileId })
      throw error
    }
  }
  
  // Generate prefixed ID for the story
  const storyId = generatePrefixedId('hero')
  
  // Build story data object with all fields
  const storyData = {
    id: storyId,
    profile_id: profileId,
    title: body.title.trim(),
    // Hurdle section
    hurdle_problem: body.hurdleProblem ? body.hurdleProblem.trim() : null,
    hurdle_scope: body.hurdleScope ? body.hurdleScope.trim() : null,
    hurdle_stakes: body.hurdleStakes ? body.hurdleStakes.trim() : null,
    // Expectation section
    expectation_role: body.expectationRole ? body.expectationRole.trim() : null,
    expectation_goals: body.expectationGoals ? body.expectationGoals.trim() : null,
    expectation_constraints: body.expectationConstraints ? body.expectationConstraints.trim() : null,
    // Response section
    response_actions: body.responseActions ? body.responseActions.trim() : null,
    response_tools: body.responseTools ? body.responseTools.trim() : null,
    response_challenges: body.responseChallenges ? body.responseChallenges.trim() : null,
    // Outcome section
    outcome_deliverable: body.outcomeDeliverable ? body.outcomeDeliverable.trim() : null,
    outcome_metrics: body.outcomeMetrics ? body.outcomeMetrics.trim() : null,
    outcome_impact: body.outcomeImpact ? body.outcomeImpact.trim() : null,
    // Relationships and metadata
    source_experience_id: body.sourceExperienceId || null,
    display_order: body.displayOrder || 0
  }
  
  // Insert the story
  const { data, error } = await supabase
    .schema('career_id')
    .from('hero_stories')
    .insert(storyData)
    .select()
  
  if (error) {
    logError('POST', ROUTE_PATH, error, { profileId, dbCode: error.code })
    throw handleDatabaseError(error, { operation: 'create', resource: 'hero story' })
  }
  
  // Set response status to 201 Created
  setResponseStatus(event, 201)
  
  const duration = getElapsed()
  logSuccess('POST', ROUTE_PATH, duration, { profileId, storyId })
  
  // Transform snake_case to camelCase for response
  const story = data[0]
  const transformedData = {
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
  }
  
  return {
    success: true,
    message: 'Hero story created successfully',
    data: transformedData
  }
})
