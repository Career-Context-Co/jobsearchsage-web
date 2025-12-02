/**
 * POST /api/career-id/profile/:profileId/experience
 * 
 * Creates a new experience entry for a profile.
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
  
  if (!body.employer) {
    validationErrors.push({
      field: 'employer',
      message: 'employer is required',
      code: 'REQUIRED'
    })
  }
  
  if (!body.title) {
    validationErrors.push({
      field: 'title',
      message: 'title is required',
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
  
  if (!body.employmentType) {
    validationErrors.push({
      field: 'employmentType',
      message: 'employmentType is required',
      code: 'REQUIRED'
    })
  }
  
  // Validation: Date range (if end_date provided, must be after start_date)
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
  
  // Insert new experience entry
  const { data, error } = await supabase
    .schema('career_id')
    .from('experience')
    .insert({
      profile_id: profileId,
      employment_type: body.employmentType,
      employer: body.employer,
      title: body.title,
      location: body.location || null,
      location_type: body.locationType || null,
      url: body.url || null,
      start_date: body.startDate,
      end_date: body.endDate || null,
      current_position: body.currentPosition || false,
      summary: body.summary || null,
      highlights: body.highlights || [],
      display_order: body.displayOrder ?? 0
    })
    .select()
    .single()
  
  if (error) {
    console.error('Database error inserting experience:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      data: {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create experience entry'
        }
      }
    })
  }
  
  return {
    success: true,
    message: 'Experience added successfully',
    data
  }
})

