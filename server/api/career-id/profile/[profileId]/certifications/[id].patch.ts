/**
 * PATCH /api/career-id/profile/:profileId/certifications/:id
 * 
 * Partially updates an existing certification entry.
 * Only updates fields provided in the request body.
 * Validates URL format if provided.
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
          message: 'Certification ID is required'
        }
      }
    })
  }
  
  // Validation: URL format (if provided)
  if (body.url) {
    try {
      new URL(body.url)
    } catch {
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
                field: 'url',
                message: 'url must be a valid URL',
                code: 'INVALID_FORMAT'
              }
            ]
          }
        }
      })
    }
  }
  
  // Build update object with only provided fields
  const updateData: any = {}
  
  if (body.name !== undefined) updateData.name = body.name
  if (body.issuer !== undefined) updateData.issuer = body.issuer
  if (body.dateObtained !== undefined) updateData.date = body.dateObtained
  if (body.url !== undefined) updateData.url = body.url
  if (body.displayOrder !== undefined) updateData.display_order = body.displayOrder
  
  // Update certification entry
  const { data, error } = await supabase
    .schema('career_id')
    .from('certifications')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Database error updating certification:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      data: {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update certification'
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
          message: 'Certification not found'
        }
      }
    })
  }
  
  return {
    success: true,
    message: 'Certification updated successfully',
    data
  }
})

