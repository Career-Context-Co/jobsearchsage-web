/**
 * PATCH /api/career-id/profile/:profileId/skills
 * 
 * Partially updates multiple existing skill associations (proficiency level, years experience, display order).
 * Accepts an array of objects with IDs to update (bulk operation for tag-like UI).
 * Only updates provided fields - true partial update semantics.
 * Cannot change the skill name itself - must delete and re-add for that.
 */

import { serverSupabaseClient } from '#supabase/server'

export default eventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const profileId = getRouterParam(event, 'profileId')
  const body = await readBody(event)
  
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
  const validationErrors = []
  
  // Validate all skills
  skills.forEach((skill, index) => {
    if (!skill.id) {
      validationErrors.push({
        field: `skills[${index}].id`,
        message: 'id is required to update a skill',
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
  
  // Process each skill update
  const results = []
  const errors = []
  
  for (const [index, skill] of skills.entries()) {
    try {
      // Build update object with only provided fields (partial update)
      const updateData: any = {}
      
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
        console.error('Database error updating profile skill:', error)
        errors.push({
          index,
          id: skill.id,
          error: 'Failed to update skill'
        })
        continue
      }
      
      if (!data) {
        errors.push({
          index,
          id: skill.id,
          error: 'Skill not found in profile'
        })
        continue
      }
      
      results.push(data)
    } catch (err: any) {
      errors.push({
        index,
        id: skill.id,
        error: 'Unexpected error updating skill'
      })
    }
  }
  
  return {
    success: errors.length === 0,
    message: `${results.length} skill(s) updated successfully`,
    data: results,
    errors: errors.length > 0 ? errors : undefined
  }
})

