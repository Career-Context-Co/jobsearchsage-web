/**
 * POST /api/reference/skills/lookup
 * 
 * Finds or creates multiple skills in the reference catalog (bulk operation).
 * Accepts an array of skills, returns an array of results with IDs and status.
 */

import { serverSupabaseClient } from '#supabase/server'

export default eventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
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
  
  // Validate all skills
  const validationErrors = []
  skills.forEach((skill, index) => {
    if (!skill.name) {
      validationErrors.push({
        field: `skills[${index}].name`,
        message: 'name is required',
        code: 'REQUIRED'
      })
    }
    if (!skill.category) {
      validationErrors.push({
        field: `skills[${index}].category`,
        message: 'category is required',
        code: 'REQUIRED'
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
  
  // Process each skill
  const results = []
  
  for (const [index, skill] of skills.entries()) {
    try {
      // Step 1: Try to find existing skill
      const { data: existingSkill, error: findError } = await supabase
        .schema('reference')
        .from('skills')
        .select('id, skill_name, category, description')
        .eq('skill_name', skill.name)
        .eq('category', skill.category)
        .single()
      
      // If found, return it
      if (existingSkill) {
        results.push({
          success: true,
          index,
          name: skill.name,
          data: existingSkill,
          created: false
        })
        continue
      }
      
      // If error is NOT "not found", log and return error
      if (findError && findError.code !== 'PGRST116') {
        console.error('Database error finding skill:', findError)
        results.push({
          success: false,
          index,
          name: skill.name,
          error: `Failed to lookup skill: ${findError.message}`,
          details: findError
        })
        continue
      }
      
      // Step 2: Create new skill
      const { data: newSkill, error: insertError } = await supabase
        .from('reference.skills')
        .insert({
          skill_name: skill.name,
          category: skill.category,
          aliases: [],
          description: skill.description || null
        })
        .select('id, skill_name, category, description')
        .single()
      
      if (insertError) {
        console.error('Database error creating skill:', insertError)
        results.push({
          success: false,
          index,
          name: skill.name,
          error: `Failed to create skill: ${insertError.message}`,
          details: insertError
        })
        continue
      }
      
      results.push({
        success: true,
        index,
        name: skill.name,
        data: newSkill,
        created: true
      })
    } catch (err: any) {
      console.error('Unexpected error processing skill:', err)
      results.push({
        success: false,
        index,
        name: skill.name,
        error: `Unexpected error: ${err.message || 'Unknown error'}`
      })
    }
  }
  
  const successCount = results.filter(r => r.success).length
  
  return {
    success: successCount === results.length,
    message: `${successCount} of ${results.length} skill(s) processed successfully`,
    data: results
  }
})

