/**
 * POST /api/career-id/profile/:profileId/certifications
 * 
 * Creates a new certification entry for a profile.
 * Validates required fields and URL format.
 */

import { serverSupabaseClient } from '#supabase/server'

export default eventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const body = await readBody(event)
  
  // Get profile_id from URL path parameter
  const profileId = getRouterParam(event, 'profileId')
  
  // Validation: Required fields
  const validationErrors = []
  
  if (!body.name) {
    validationErrors.push({
      field: 'name',
      message: 'name is required',
      code: 'REQUIRED'
    })
  }
  
  if (!body.issuer) {
    validationErrors.push({
      field: 'issuer',
      message: 'issuer is required',
      code: 'REQUIRED'
    })
  }
  
  if (!body.dateObtained) {
    validationErrors.push({
      field: 'dateObtained',
      message: 'dateObtained is required',
      code: 'REQUIRED'
    })
  }
  
  // Validation: URL format (if provided)
  if (body.url) {
    try {
      new URL(body.url)
    } catch {
      validationErrors.push({
        field: 'url',
        message: 'url must be a valid URL',
        code: 'INVALID_FORMAT'
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
  
  // Insert new certification entry
  const { data, error } = await supabase
    .schema('career_id')
    .from('certifications')
    .insert({
      profile_id: profileId,
      name: body.name,
      issuer: body.issuer,
      date: body.dateObtained,
      url: body.url || null,
      display_order: body.displayOrder ?? 0
    })
    .select()
    .single()
  
  if (error) {
    console.error('Database error inserting certification:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      data: {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create certification'
        }
      }
    })
  }
  
  return {
    success: true,
    message: 'Certification added successfully',
    data
  }
})

