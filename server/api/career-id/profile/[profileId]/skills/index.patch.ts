/**
 * PATCH /api/career-id/profile/:profileId/skills
 * 
 * Partially updates multiple existing skill associations (proficiency level, years experience, display order).
 * Accepts an array of objects with IDs to update (bulk operation for tag-like UI).
 * Only updates provided fields - true partial update semantics.
 * Cannot change the skill name itself - must delete and re-add for that.
 * 
 * Returns:
 * - 200: All items succeeded
 * - 207: Partial success (some succeeded, some failed)
 * - 422: All items failed
 */

import { serverSupabaseClient } from '#supabase/server'
import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { handleDatabaseError, createValidationError, ErrorCodes } from '@@/server/utils/error-handler'
import { isRequired, validateEnum } from '@@/server/utils/validation'
import { transformProfileSkill } from '@@/server/utils/career-id-transformer'

const ROUTE_PATH = '/api/career-id/profile/:profileId/skills'
const VALID_PROFICIENCY_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'] as const

export default eventHandler(async (event) => {
  const getElapsed = createTimer()
  const supabase = await serverSupabaseClient(event)
  const profileId = getRouterParam(event, 'profileId')
  const body = await readBody(event)
  
  logRequest('PATCH', ROUTE_PATH, { profileId })
  
  // Ensure body is an array
  const skills = Array.isArray(body) ? body : [body]
  
  if (skills.length === 0) {
    const error = createValidationError({
      field: 'skills',
      message: 'At least one skill is required',
      code: ErrorCodes.REQUIRED
    })
    logError('PATCH', ROUTE_PATH, error, { profileId })
    throw error
  }
  
  const validationErrors = []
  
  // Validate all skills
  skills.forEach((skill, index) => {
    if (!isRequired(skill.id)) {
      validationErrors.push({
        field: `skills[${index}].id`,
        message: 'id is required to update a skill',
        code: ErrorCodes.REQUIRED
      })
    }
    
    const levelError = validateEnum(
      skill.proficiencyLevel,
      `skills[${index}].proficiencyLevel`,
      VALID_PROFICIENCY_LEVELS,
      false
    )
    if (levelError) {
      validationErrors.push(levelError)
    }
  })
  
  if (validationErrors.length > 0) {
    const error = createValidationError(validationErrors)
    logError('PATCH', ROUTE_PATH, error, { profileId, fields: validationErrors.map(e => e.field) })
    throw error
  }
  
  // Process each skill update
  const results = []
  
  for (const [index, skill] of skills.entries()) {
    try {
      // Check if resource exists first
      const { data: existing, error: fetchError } = await supabase
        .schema('career_id')
        .from('profile_skills')
        .select('id')
        .eq('id', skill.id)
        .eq('profile_id', profileId)
        .maybeSingle()
      
      if (fetchError) {
        logError('PATCH', ROUTE_PATH, fetchError, { profileId, skillId: skill.id, dbCode: fetchError.code })
        results.push({
          index,
          id: skill.id,
          status: 500,
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Database error checking skill'
          }
        })
        continue
      }
      
      if (!existing) {
        results.push({
          index,
          id: skill.id,
          status: 404,
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Skill not found in profile'
          }
        })
        continue
      }
      
      // Build update object with only provided fields (partial update)
      const updateData: Record<string, any> = {}
      
      if (skill.proficiencyLevel !== undefined) updateData.proficiency_level = skill.proficiencyLevel
      if (skill.yearsExperience !== undefined) updateData.years_experience = skill.yearsExperience
      if (skill.displayOrder !== undefined) updateData.display_order = skill.displayOrder
      
      // Update profile skill entry
      const { data, error } = await supabase
        .schema('career_id')
        .from('profile_skills')
        .update(updateData)
        .eq('id', skill.id)
        .eq('profile_id', profileId)
        .select()
        .single()
      
      if (error) {
        logError('PATCH', ROUTE_PATH, error, { profileId, skillId: skill.id, dbCode: error.code })
        results.push({
          index,
          id: skill.id,
          status: 500,
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to update skill'
          }
        })
        continue
      }
      
      // Transform snake_case to camelCase before adding to results
      const transformedData = transformProfileSkill(data)
      
      results.push({
        index,
        id: skill.id,
        status: 200,
        success: true,
        data: transformedData
      })
    } catch (err: any) {
      logError('PATCH', ROUTE_PATH, err, { profileId, skillId: skill.id })
      results.push({
        index,
        id: skill.id,
        status: 500,
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Unexpected error updating skill'
        }
      })
    }
  }
  
  // Count successes and failures
  const successCount = results.filter(r => r.success).length
  const failureCount = results.filter(r => !r.success).length
  
  // Determine overall HTTP status code
  let httpStatus = 200
  if (failureCount > 0 && successCount > 0) {
    httpStatus = 207 // Multi-Status: partial success
  } else if (failureCount > 0) {
    // All failed - check if they all have the same status
    const failedResults = results.filter(r => !r.success)
    const uniqueStatuses = [...new Set(failedResults.map(r => r.status))]
    
    if (uniqueStatuses.length === 1) {
      // All failures have the same status - use that specific status
      httpStatus = uniqueStatuses[0]
    } else {
      // Mixed failure statuses - use 422
      httpStatus = 422
    }
  }
  
  setResponseStatus(event, httpStatus)
  
  const duration = getElapsed()
  logSuccess('PATCH', ROUTE_PATH, duration, { 
    profileId,
    httpStatus,
    succeeded: successCount, 
    failed: failureCount 
  })
  
  return {
    success: failureCount === 0,
    status: httpStatus,
    message: failureCount === 0 
      ? `All ${successCount} skill(s) updated successfully`
      : `${successCount} succeeded, ${failureCount} failed`,
    updated: successCount,
    failed: failureCount,
    results
  }
})
