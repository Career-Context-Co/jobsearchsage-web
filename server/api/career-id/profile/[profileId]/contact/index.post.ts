/**
 * POST /api/career-id/profile/:profileId/contact
 * 
 * Creates contact information for a profile.
 * One-to-one relationship: each profile can have only one contact_info record.
 * Returns 409 if contact info already exists.
 */

import { serverSupabaseClient } from '#supabase/server'
import { generatePrefixedId } from '../../../../../utils/id-generator'


export default eventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const body = await readBody(event)
  
  // Get profile_id from URL path parameter
  const profileId = getRouterParam(event, 'profileId')
  
  // Validation
  const validationErrors: Array<{ field: string; message: string; code: string }> = []
  
  // Required fields
  if (!body.firstName) {
    validationErrors.push({
      field: 'firstName',
      message: 'firstName is required',
      code: 'REQUIRED'
    })
  }
  if (!body.lastName) {
    validationErrors.push({
      field: 'lastName',
      message: 'lastName is required',
      code: 'REQUIRED'
    })
  }
  if (!body.email) {
    validationErrors.push({
      field: 'email',
      message: 'email is required',
      code: 'REQUIRED'
    })
  }
  
  // Email validation
  if (body.email) {
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
  if (body.phone) {
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
  if (body.websites && Array.isArray(body.websites)) {
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
  
  // Check if contact info already exists for this profile
  const { data: existing } = await supabase
    .schema('career_id')
    .from('contact_info')
    .select('id')
    .eq('profile_id', profileId)
    .maybeSingle()
  
  if (existing) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Conflict',
      data: {
        success: false,
        error: {
          code: 'ALREADY_EXISTS',
          message: 'Contact information already exists for this profile. Use PATCH to update.'
        }
      }
    })
  }
  
  // Generate prefixed ID for new contact info
  const contactId = generatePrefixedId('cont')
  
  const { data, error } = await supabase
    .schema('career_id')
    .from('contact_info')
    .insert({
      id: contactId,
      profile_id: profileId,
      first_name: body.firstName,
      last_name: body.lastName,
      job_title: body.jobTitle || null,
      email: body.email,
      phone: body.phone || null,
      websites: body.websites || [],
      summary: body.summary || null,
      city: body.city || null,
      state_region: body.stateRegion || null,
      country: body.country || null,
      postal_code: body.postalCode || null,
      willing_to_relocate: body.willingToRelocate || false
    })
    .select()
    .single()
  
  if (error) {
    console.error('Database error creating contact info:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      data: {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create contact information'
        }
      }
    })
  }
  
  return {
    success: true,
    message: 'Contact information created successfully',
    data
  }
})

