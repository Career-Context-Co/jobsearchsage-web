/**
 * POST /api/career-id/profile/:profileId/skills
 * 
 * Creates multiple skill associations for a profile (bulk operation).
 * Accepts an array of skills to add (like tags).
 * Free-form input: accepts whatever text user types, no validation against reference catalog.
 * Skills will be matched to reference catalog later by background job.
 */

import { serverSupabaseClient } from '#supabase/server'

export default eventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const body = await readBody(event)
  
  // Get profile_id from URL path parameter
  const profileId = getRouterParam(event, 'profileId')
  
  // Ensure body is an array
  const skills = Array.isArray(body) ? body : [body]
  
  if (skills.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      data: {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'At least one skill is required'
        }
      }
    })
  }
  
  const validLevels = ['beginner', 'intermediate', 'advanced', 'expert']
  const validationErrors: Array<{ field: string; message: string; code: string }> = []
  
  // Validate all skills
  skills.forEach((skill, index) => {
    if (!skill.name || skill.name.trim() === '') {
      validationErrors.push({
        field: `skills[${index}].name`,
        message: 'name is required and cannot be empty',
        code: 'REQUIRED'
      })
    }
    
    if (skill.proficiencyLevel && !validLevels.includes(skill.proficiencyLevel)) {
      validationErrors.push({
        field: `skills[${index}].proficiencyLevel`,
        message: `proficiencyLevel must be one of: ${validLevels.join(', ')}`,
        code: 'INVALID_VALUE'
      })
    }
  })
  
  if (validationErrors.length > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      data: {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: validationErrors
        }
      }
    })
  }
  
  // Check for duplicate skill names within this request
  const skillNames = skills.map(s => s.name.toLowerCase().trim())
  const duplicates = skillNames.filter((name, index) => skillNames.indexOf(name) !== index)
  
  if (duplicates.length > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      data: {
        success: false,
        error: {
          code: 'DUPLICATE_SKILLS',
          message: 'Duplicate skills detected in request',
          duplicates: [...new Set(duplicates)]
        }
      }
    })
  }
  
  // Check for existing skills in profile
  const { data: existingSkills } = await supabase
    .schema('career_id')
    .from('profile_skills')
    .select('name')
    .eq('profile_id', profileId)
  
  const existingNames = new Set(
    (existingSkills || []).map(s => s.name.toLowerCase().trim())
  )
  
  const alreadyExists = skillNames.filter(name => existingNames.has(name))
  
  if (alreadyExists.length > 0) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Conflict',
      data: {
        success: false,
        error: {
          code: 'SKILLS_ALREADY_EXIST',
          message: 'Some skills already exist in profile',
          existing: alreadyExists
        }
      }
    })
  }
  
  // Insert skills directly into profile_skills
  // skill_id is NULL - will be matched later by background job
  const skillsToInsert = skills.map((skill, index) => ({
    profile_id: profileId,
    skill_id: null, // Will be matched later
    name: skill.name.trim(),
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
    console.error('Database error inserting profile skills:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      data: {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: `Failed to add skills to profile: ${error.message}`
        }
      }
    })
  }
  
  return {
    success: true,
    message: `${data.length} skill(s) added successfully`,
    data
  }
})

