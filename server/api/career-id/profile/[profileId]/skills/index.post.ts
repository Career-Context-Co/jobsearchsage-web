/**
 * POST /api/career-id/profile/:profileId/skills
 * 
 * Creates multiple skill associations for a profile (bulk operation).
 * Accepts an array of skills to add (like tags).
 * Free-form input: accepts whatever text user types, no validation against reference catalog.
 * Skills will be matched to reference catalog later by background job.
 */

import { serverSupabaseClient } from '#supabase/server'
import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { handleDatabaseError, createValidationError, createConflictError, ErrorCodes } from '@@/server/utils/error-handler'
import { isRequired, validateEnum } from '@@/server/utils/validation'
import { transformProfileSkill } from '@@/server/utils/career-id-transformer'

const ROUTE_PATH = '/api/career-id/profile/:profileId/skills'
const VALID_PROFICIENCY_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'] as const

export default eventHandler(async (event) => {
  const getElapsed = createTimer()
  const supabase = await serverSupabaseClient(event)
  const body = await readBody(event)
  
  // Get profile_id from URL path parameter
  const profileId = getRouterParam(event, 'profileId')
  
  logRequest('POST', ROUTE_PATH, { profileId })
  
  // Ensure body is an array
  const skills = Array.isArray(body) ? body : [body]
  
  if (skills.length === 0) {
    const error = createValidationError({
      field: 'skills',
      message: 'At least one skill is required',
      code: ErrorCodes.REQUIRED
    })
    logError('POST', ROUTE_PATH, error, { profileId })
    throw error
  }
  
  const validationErrors: Array<{ field: string; message: string; code: string }> = []
  
  // Validate all skills
  skills.forEach((skill, index) => {
    if (!isRequired(skill.name)) {
      validationErrors.push({
        field: `skills[${index}].name`,
        message: 'name is required and cannot be empty',
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
    logError('POST', ROUTE_PATH, error, { profileId, fields: validationErrors.map(e => e.field) })
    throw error
  }
  
  // Check for duplicate skill names within this request
  const skillNames = skills.map(s => s.name.toLowerCase().trim())
  const duplicates = skillNames.filter((name, index) => skillNames.indexOf(name) !== index)
  
  if (duplicates.length > 0) {
    const error = createConflictError('Duplicate skills detected in request', {
      duplicates: [...new Set(duplicates)]
    })
    error.data.error.code = ErrorCodes.DUPLICATE_SKILLS
    logError('POST', ROUTE_PATH, error, { profileId, duplicates })
    throw error
  }
  
  // Check for existing skills in profile
  const { data: existingSkills, error: fetchError } = await supabase
    .schema('career_id')
    .from('profile_skills')
    .select('name')
    .eq('profile_id', profileId)
  
  if (fetchError) {
    logError('POST', ROUTE_PATH, fetchError, { profileId, dbCode: fetchError.code })
    throw handleDatabaseError(fetchError, { operation: 'check', resource: 'existing skills' })
  }
  
  const existingNames = new Set(
    (existingSkills || []).map(s => s.name.toLowerCase().trim())
  )
  
  const alreadyExists = skillNames.filter(name => existingNames.has(name))
  
  if (alreadyExists.length > 0) {
    const error = createConflictError('Some skills already exist in profile', {
      existing: alreadyExists
    })
    error.data.error.code = ErrorCodes.SKILLS_ALREADY_EXIST
    logError('POST', ROUTE_PATH, error, { profileId, existing: alreadyExists })
    throw error
  }
  
  // Insert skills directly into profile_skills
  // skill_id is NULL - will be matched later by background job
  const skillsToInsert = skills.map((skill, index) => ({
    profile_id: profileId,
    skill_id: null, // Will be matched later
    name: skill.name.trim(),
    category: skill.category || null,
    proficiency_level: skill.proficiencyLevel || null,
    years_experience: skill.yearsExperience || null,
    display_order: skill.displayOrder ?? index
  }))
  
  const { data, error } = await supabase
    .schema('career_id')
    .from('profile_skills')
    .insert(skillsToInsert)
    .select()
  
  if (error) {
    logError('POST', ROUTE_PATH, error, { profileId, dbCode: error.code })
    throw handleDatabaseError(error, { operation: 'add', resource: 'skills' })
  }
  
  // Set response status to 201 Created
  setResponseStatus(event, 201)
  
  const duration = getElapsed()
  logSuccess('POST', ROUTE_PATH, duration, { profileId, count: data.length })
  
  // Transform snake_case to camelCase before returning
  const transformedData = data.map(transformProfileSkill)
  
  return {
    success: true,
    message: `${data.length} skill(s) added successfully`,
    data: transformedData
  }
})
