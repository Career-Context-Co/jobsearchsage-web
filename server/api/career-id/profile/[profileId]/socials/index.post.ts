/**
 * POST /api/career-id/profile/:profileId/socials
 * 
 * Creates social link(s) for a profile.
 * Accepts single object or array for bulk operations.
 * Links to reference.social_platforms if platform_id provided.
 */

import { serverSupabaseClient } from '#supabase/server'
import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { handleDatabaseError, createValidationError, createConflictError, ErrorCodes } from '@@/server/utils/error-handler'
import { isRequired, validateUrl } from '@@/server/utils/validation'

const ROUTE_PATH = '/api/career-id/profile/:profileId/socials'

export default eventHandler(async (event) => {
  const getElapsed = createTimer()
  const supabase = await serverSupabaseClient(event)
  const body = await readBody(event)
  
  // Get profile_id from URL path parameter
  const profileId = getRouterParam(event, 'profileId')
  
  logRequest('POST', ROUTE_PATH, { profileId })
  
  // Ensure body is an array
  const links = Array.isArray(body) ? body : [body]
  
  if (links.length === 0) {
    const error = createValidationError({
      field: 'links',
      message: 'At least one social link is required',
      code: ErrorCodes.REQUIRED
    })
    logError('POST', ROUTE_PATH, error, { profileId })
    throw error
  }
  
  const validationErrors: Array<{ field: string; message: string; code: string }> = []
  
  // Validate all links
  links.forEach((link, index) => {
    if (!isRequired(link.url)) {
      validationErrors.push({
        field: `links[${index}].url`,
        message: 'url is required',
        code: ErrorCodes.REQUIRED
      })
    } else {
      const urlError = validateUrl(link.url, `links[${index}].url`, false)
      if (urlError) {
        validationErrors.push(urlError)
      }
    }
    
    if (!isRequired(link.platformId)) {
      validationErrors.push({
        field: `links[${index}].platformId`,
        message: 'platformId is required',
        code: ErrorCodes.REQUIRED
      })
    }
  })
  
  if (validationErrors.length > 0) {
    const error = createValidationError(validationErrors)
    logError('POST', ROUTE_PATH, error, { profileId, fields: validationErrors.map(e => e.field) })
    throw error
  }
  
  // Check for duplicate platforms within this request
  const platformIds = links.map(l => l.platformId)
  const duplicates = platformIds.filter((id, index) => platformIds.indexOf(id) !== index)
  
  if (duplicates.length > 0) {
    const error = createConflictError('Duplicate platforms detected in request', {
      duplicates: [...new Set(duplicates)]
    })
    error.data.error.code = 'DUPLICATE_PLATFORMS'
    logError('POST', ROUTE_PATH, error, { profileId, duplicates })
    throw error
  }
  
  // Check for existing platforms in profile
  const { data: existingLinks, error: fetchError } = await supabase
    .schema('career_id')
    .from('profile_social_links')
    .select('platform_id')
    .eq('profile_id', profileId)
    .not('platform_id', 'is', null)
  
  if (fetchError) {
    logError('POST', ROUTE_PATH, fetchError, { profileId, dbCode: fetchError.code })
    throw handleDatabaseError(fetchError, { operation: 'check', resource: 'existing social links' })
  }
  
  const existingPlatformIds = new Set(
    (existingLinks || []).map(l => l.platform_id)
  )
  
  const alreadyExists = platformIds.filter(id => existingPlatformIds.has(id))
  
  if (alreadyExists.length > 0) {
    const error = createConflictError('Some platforms already have links in this profile', {
      existing: alreadyExists
    })
    error.data.error.code = 'PLATFORMS_ALREADY_EXIST'
    logError('POST', ROUTE_PATH, error, { profileId, existing: alreadyExists })
    throw error
  }
  
  // Get platform names for caching
  const { data: platforms, error: platformError } = await supabase
    .schema('reference')
    .from('social_platforms')
    .select('id, platform_name')
    .in('id', platformIds)
  
  if (platformError) {
    logError('POST', ROUTE_PATH, platformError, { profileId, dbCode: platformError.code })
    throw handleDatabaseError(platformError, { operation: 'fetch', resource: 'social platforms' })
  }
  
  const platformMap = new Map(
    (platforms || []).map(p => [p.id, p.platform_name])
  )
  
  // Insert social links
  const linksToInsert = links.map((link, index) => ({
    profile_id: profileId,
    platform_id: link.platformId,
    platform_name_cache: platformMap.get(link.platformId) || null,
    url: link.url.trim(),
    display_order: link.displayOrder ?? index
  }))
  
  const { data, error } = await supabase
    .schema('career_id')
    .from('profile_social_links')
    .insert(linksToInsert)
    .select()
  
  if (error) {
    logError('POST', ROUTE_PATH, error, { profileId, dbCode: error.code })
    throw handleDatabaseError(error, { operation: 'add', resource: 'social links' })
  }
  
  // Set response status to 201 Created
  setResponseStatus(event, 201)
  
  const duration = getElapsed()
  logSuccess('POST', ROUTE_PATH, duration, { profileId, count: data.length })
  
  return {
    success: true,
    message: `${data.length} social link(s) added successfully`,
    data
  }
})
