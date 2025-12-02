/**
 * PATCH /api/career-id/profile/:profileId/education/:id
 * 
 * Partially updates an existing education entry.
 * Only updates fields provided in the request body.
 * Validates fields and date ranges.
 */

import { serverSupabaseClient } from '#supabase/server'

export default eventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const profileId = getRouterParam(event, 'profileId')
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      data: {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Education ID is required'
        }
      }
    })
  }
  
  // Validation: Date range (if both dates provided, end_date must be after start_date)
  if (body.endDate && body.startDate) {
    const startDate = new Date(body.startDate)
    const endDate = new Date(body.endDate)
    
    if (endDate < startDate) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        data: {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: [
              {
                field: 'endDate',
                message: 'endDate must be after startDate',
                code: 'INVALID_RANGE'
              }
            ]
          }
        }
      })
    }
  }
  
  // Build update object with only provided fields
  const updateData: any = {}
  
  if (body.degreeType !== undefined) updateData.degree_type = body.degreeType
  if (body.areaOfStudy !== undefined) updateData.area_of_study = body.areaOfStudy
  if (body.institution !== undefined) updateData.institution = body.institution
  if (body.startDate !== undefined) updateData.start_date = body.startDate
  if (body.endDate !== undefined) updateData.end_date = body.endDate
  if (body.completed !== undefined) updateData.completed = body.completed
  if (body.url !== undefined) updateData.url = body.url
  if (body.creditHours !== undefined) updateData.credit_hours = body.creditHours
  if (body.coursework !== undefined) updateData.coursework = body.coursework
  if (body.minors !== undefined) updateData.minors = body.minors
  if (body.displayOrder !== undefined) updateData.display_order = body.displayOrder
  
  // Update education entry
  const { data, error } = await supabase
    .schema('career_id')
    .from('education')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Database error updating education:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      data: {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update education entry'
        }
      }
    })
  }
  
  if (!data) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found',
      data: {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Education entry not found'
        }
      }
    })
  }
  
  return {
    success: true,
    message: 'Education updated successfully',
    data
  }
})

