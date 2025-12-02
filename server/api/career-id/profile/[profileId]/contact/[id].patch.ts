/**
 * PATCH /api/career-id/profile/:profileId/contact/:id
 * 
 * Partially updates existing contact information for a profile.
 * Only updates fields that are provided in the request body.
 * Returns 404 if contact info doesn't exist.
 */

import { serverSupabaseClient } from '#supabase/server'

export default eventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const body = await readBody(event)
  
  // Get IDs from URL path parameters
  const profileId = getRouterParam(event, 'profileId')
  const id = getRouterParam(event, 'id')
  
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      data: {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Contact ID is required in URL path'
        }
      }
    })
  }
  
  // Validation
  const validationErrors: Array<{ field: string; message: string; code: string }> = []
  
  // Email validation (if provided)
  if (body.email !== undefined) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      validationErrors.push({
        field: 'email',
        message: 'Invalid email format',
        code: 'INVALID_FORMAT'
      })
    }
  }
  
  // Phone validation (if provided) - E.164 format
  if (body.phone !== undefined && body.phone) {
    const phoneRegex = /^\+[1-9]\d{1,14}$/
    if (!phoneRegex.test(body.phone)) {
      validationErrors.push({
        field: 'phone',
        message: 'Invalid phone format. Use E.164 format (e.g., +14155552671)',
        code: 'INVALID_FORMAT'
      })
    }
  }
  
  // Website URLs validation (if provided)
  if (body.websites !== undefined && Array.isArray(body.websites)) {
    const urlRegex = /^https?:\/\/.+\..+/
    body.websites.forEach((url: string, index: number) => {
      if (!urlRegex.test(url)) {
        validationErrors.push({
          field: `websites[${index}]`,
          message: 'Invalid URL format',
          code: 'INVALID_FORMAT'
        })
      }
    })
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
  
  // Build update object (partial update - only provided fields)
  const updateData: any = {}
  
  if (body.firstName !== undefined) updateData.first_name = body.firstName
  if (body.lastName !== undefined) updateData.last_name = body.lastName
  if (body.jobTitle !== undefined) updateData.job_title = body.jobTitle
  if (body.email !== undefined) updateData.email = body.email
  if (body.phone !== undefined) updateData.phone = body.phone
  if (body.websites !== undefined) updateData.websites = body.websites
  if (body.summary !== undefined) updateData.summary = body.summary
  if (body.city !== undefined) updateData.city = body.city
  if (body.stateRegion !== undefined) updateData.state_region = body.stateRegion
  if (body.country !== undefined) updateData.country = body.country
  if (body.postalCode !== undefined) updateData.postal_code = body.postalCode
  if (body.willingToRelocate !== undefined) updateData.willing_to_relocate = body.willingToRelocate
  
  const { data, error } = await supabase
    .schema('career_id')
    .from('contact_info')
    .update(updateData)
    .eq('id', id)
    .eq('profile_id', profileId)
    .select()
    .single()
  
  if (error) {
    console.error('Database error updating contact info:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      data: {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update contact information'
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
          message: 'Contact information not found'
        }
      }
    })
  }
  
  return {
    success: true,
    message: 'Contact information updated successfully',
    data
  }
})

