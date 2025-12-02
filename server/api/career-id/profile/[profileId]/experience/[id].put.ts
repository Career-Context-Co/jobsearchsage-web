/**
 * PUT /api/career-id/profile/:profileId/experience/:id
 * 
 * Updates an existing experience entry.
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
          message: 'Experience ID is required'
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
  
  if (body.employmentType !== undefined) updateData.employment_type = body.employmentType
  if (body.employer !== undefined) updateData.employer = body.employer
  if (body.title !== undefined) updateData.title = body.title
  if (body.location !== undefined) updateData.location = body.location
  if (body.locationType !== undefined) updateData.location_type = body.locationType
  if (body.url !== undefined) updateData.url = body.url
  if (body.startDate !== undefined) updateData.start_date = body.startDate
  if (body.endDate !== undefined) updateData.end_date = body.endDate
  if (body.currentPosition !== undefined) updateData.current_position = body.currentPosition
  if (body.summary !== undefined) updateData.summary = body.summary
  if (body.highlights !== undefined) updateData.highlights = body.highlights
  if (body.displayOrder !== undefined) updateData.display_order = body.displayOrder
  
  // Update experience entry
  const { data, error } = await supabase
    .schema('career_id')
    .from('experience')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Database error updating experience:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      data: {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update experience entry'
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
          message: 'Experience entry not found'
        }
      }
    })
  }
  
  return {
    success: true,
    message: 'Experience updated successfully',
    data
  }
})

