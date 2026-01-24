/**
 * PATCH /api/career-id/profile/:profileId/hero-stories/:storyId
 * 
 * Updates a specific HERO story for a profile.
 * Allows updating all HERO story fields (title + 12 HERO tagged fields + source_experience_id).
 * Validates ownership (story must belong to the specified profile).
 */

import { serverSupabaseClient } from '#supabase/server'
import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { handleDatabaseError, createValidationError, createNotFoundError, ErrorCodes } from '@@/server/utils/error-handler'
import { isRequired } from '@@/server/utils/validation'

const ROUTE_PATH = '/api/career-id/profile/:profileId/hero-stories/:storyId'

export default eventHandler(async (event) => {
  const getElapsed = createTimer()
  const supabase = await serverSupabaseClient(event)
  const body = await readBody(event)
  
  // Get parameters from URL path
  const profileId = getRouterParam(event, 'profileId')
  const storyId = getRouterParam(event, 'storyId')
  
  logRequest('PATCH', ROUTE_PATH, { profileId, storyId })
  
  // Validate parameters
  if (!isRequired(profileId)) {
    const error = createValidationError({
      field: 'profileId',
      message: 'profileId is required',
      code: ErrorCodes.REQUIRED
    })
    logError('PATCH', ROUTE_PATH, error, { field: 'profileId' })
    throw error
  }
  
  if (!isRequired(storyId)) {
    const error = createValidationError({
      field: 'storyId',
      message: 'storyId is required',
      code: ErrorCodes.REQUIRED
    })
    logError('PATCH', ROUTE_PATH, error, { field: 'storyId' })
    throw error
  }
  
  // Validate that at least one field to update is provided
  const hasUpdateableField = 
    body.title !== undefined ||
    body.hurdleProblem !== undefined ||
    body.hurdleScope !== undefined ||
    body.hurdleStakes !== undefined ||
    body.expectationRole !== undefined ||
    body.expectationGoals !== undefined ||
    body.expectationConstraints !== undefined ||
    body.responseActions !== undefined ||
    body.responseTools !== undefined ||
    body.responseChallenges !== undefined ||
    body.outcomeDeliverable !== undefined ||
    body.outcomeMetrics !== undefined ||
    body.outcomeImpact !== undefined ||
    body.sourceExperienceId !== undefined ||
    body.displayOrder !== undefined
  
  if (!hasUpdateableField) {
    const error = createValidationError({
      field: 'body',
      message: 'At least one field to update is required',
      code: ErrorCodes.REQUIRED
    })
    logError('PATCH', ROUTE_PATH, error, { profileId, storyId })
    throw error
  }
  
  // Validate individual fields if provided
  const validationErrors: Array<{ field: string; message: string; code: string }> = []
  
  if (body.title !== undefined) {
    if (!isRequired(body.title)) {
      validationErrors.push({
        field: 'title',
        message: 'title cannot be empty',
        code: ErrorCodes.REQUIRED
      })
    }
  }
  
  if (body.sourceExperienceId !== undefined && body.sourceExperienceId !== null) {
    if (typeof body.sourceExperienceId !== 'number' || !Number.isInteger(body.sourceExperienceId)) {
      validationErrors.push({
        field: 'sourceExperienceId',
        message: 'sourceExperienceId must be an integer',
        code: ErrorCodes.INVALID
      })
    }
  }
  
  if (validationErrors.length > 0) {
    const error = createValidationError(validationErrors)
    logError('PATCH', ROUTE_PATH, error, { profileId, storyId, fields: validationErrors.map(e => e.field) })
    throw error
  }
  
  // Build update object - only include fields that were provided
  const updateData: any = {}
  
  if (body.title !== undefined) {
    updateData.title = body.title.trim()
  }
  
  // Hurdle section
  if (body.hurdleProblem !== undefined) {
    updateData.hurdle_problem = body.hurdleProblem ? body.hurdleProblem.trim() : null
  }
  if (body.hurdleScope !== undefined) {
    updateData.hurdle_scope = body.hurdleScope ? body.hurdleScope.trim() : null
  }
  if (body.hurdleStakes !== undefined) {
    updateData.hurdle_stakes = body.hurdleStakes ? body.hurdleStakes.trim() : null
  }
  
  // Expectation section
  if (body.expectationRole !== undefined) {
    updateData.expectation_role = body.expectationRole ? body.expectationRole.trim() : null
  }
  if (body.expectationGoals !== undefined) {
    updateData.expectation_goals = body.expectationGoals ? body.expectationGoals.trim() : null
  }
  if (body.expectationConstraints !== undefined) {
    updateData.expectation_constraints = body.expectationConstraints ? body.expectationConstraints.trim() : null
  }
  
  // Response section
  if (body.responseActions !== undefined) {
    updateData.response_actions = body.responseActions ? body.responseActions.trim() : null
  }
  if (body.responseTools !== undefined) {
    updateData.response_tools = body.responseTools ? body.responseTools.trim() : null
  }
  if (body.responseChallenges !== undefined) {
    updateData.response_challenges = body.responseChallenges ? body.responseChallenges.trim() : null
  }
  
  // Outcome section
  if (body.outcomeDeliverable !== undefined) {
    updateData.outcome_deliverable = body.outcomeDeliverable ? body.outcomeDeliverable.trim() : null
  }
  if (body.outcomeMetrics !== undefined) {
    updateData.outcome_metrics = body.outcomeMetrics ? body.outcomeMetrics.trim() : null
  }
  if (body.outcomeImpact !== undefined) {
    updateData.outcome_impact = body.outcomeImpact ? body.outcomeImpact.trim() : null
  }
  
  // Relationships and metadata
  if (body.sourceExperienceId !== undefined) {
    updateData.source_experience_id = body.sourceExperienceId || null
  }
  if (body.displayOrder !== undefined) {
    updateData.display_order = body.displayOrder
  }
  
  // Update the story
  const { data, error } = await supabase
    .schema('career_id')
    .from('hero_stories')
    .update(updateData)
    .eq('id', storyId)
    .eq('profile_id', profileId)
    .select()
  
  if (error) {
    logError('PATCH', ROUTE_PATH, error, { profileId, storyId, dbCode: error.code })
    throw handleDatabaseError(error, { operation: 'update', resource: 'hero story' })
  }
  
  if (!data || data.length === 0) {
    const notFoundError = createNotFoundError('Hero story')
    logError('PATCH', ROUTE_PATH, notFoundError, { profileId, storyId })
    throw notFoundError
  }
  
  const duration = getElapsed()
  logSuccess('PATCH', ROUTE_PATH, duration, { profileId, storyId })
  
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
    message: 'Hero story updated successfully',
    data: transformedData
  }
})
