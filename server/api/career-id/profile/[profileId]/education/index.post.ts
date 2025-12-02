/**
 * POST /api/career-id/profile/education
 * 
 * Creates a new education entry for a profile.
 * Validates required fields and date ranges.
 */

import { serverSupabaseClient } from '#supabase/server'

export default eventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const body = await readBody(event)
  
  // Get profile_id from URL path parameter
  const profileId = getRouterParam(event, 'profileId')
  
  // Validation: Required fields
  const validationErrors = []
  
  if (!body.degreeType) {
    validationErrors.push({
      field: 'degreeType',
      message: 'degreeType is required',
      code: 'REQUIRED'
    })
  }
  
  if (!body.areaOfStudy) {
    validationErrors.push({
      field: 'areaOfStudy',
      message: 'areaOfStudy is required',
      code: 'REQUIRED'
    })
  }
  
  if (!body.institution) {
    validationErrors.push({
      field: 'institution',
      message: 'institution is required',
      code: 'REQUIRED'
    })
  }
  
  if (!body.startDate) {
    validationErrors.push({
      field: 'startDate',
      message: 'startDate is required',
      code: 'REQUIRED'
    })
  }
  
  if (!body.endDate) {
    validationErrors.push({
      field: 'endDate',
      message: 'endDate is required',
      code: 'REQUIRED'
    })
  }
  
  // Validation: Date range (end_date must be after start_date)
  if (body.endDate && body.startDate) {
    const startDate = new Date(body.startDate)
    const endDate = new Date(body.endDate)
    
    if (endDate < startDate) {
      validationErrors.push({
        field: 'endDate',
        message: 'endDate must be after startDate',
        code: 'INVALID_RANGE'
      })
    }
  }
  
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
  
  // Insert new education entry
  const { data, error } = await supabase
    .schema('career_id')
    .from('education')
    .insert({
      profile_id: profileId,
      degree_type: body.degreeType,
      area_of_study: body.areaOfStudy,
      institution: body.institution,
      start_date: body.startDate,
      end_date: body.endDate,
      completed: body.completed ?? true,
      url: body.url || null,
      credit_hours: body.creditHours || null,
      coursework: body.coursework || [],
      minors: body.minors || [],
      display_order: body.displayOrder ?? 0
    })
    .select()
    .single()
  
  if (error) {
    console.error('Database error inserting education:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      data: {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create education entry'
        }
      }
    })
  }
  
  return {
    success: true,
    message: 'Education added successfully',
    data
  }
})

