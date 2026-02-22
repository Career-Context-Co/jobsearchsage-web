/**
 * PUT /api/career-id/profile/:profileId/skills
 *
 * Atomically replaces all skills for a profile in a single upsert.
 * Accepts the full skills array — one row per profile stored as JSONB.
 *
 * Returns:
 * - 200: Skills saved successfully
 */

import { serverSupabaseClient } from '#supabase/server'
import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { handleDatabaseError, createValidationError, ErrorCodes } from '@@/server/utils/error-handler'
import { validateEnum } from '@@/server/utils/validation'
import { generatePrefixedId } from '@@/server/utils/id-generator'

const ROUTE_PATH = '/api/career-id/profile/:profileId/skills'
const VALID_PROFICIENCY_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'] as const

export default eventHandler(async (event) => {
  const getElapsed = createTimer()
  const supabase = await serverSupabaseClient(event)
  const profileId = getRouterParam(event, 'profileId')
  const body = await readBody(event)

  logRequest('PUT', ROUTE_PATH, { profileId })

  const skills = Array.isArray(body) ? body : []

  const validationErrors: Array<{ field: string; message: string; code: string }> = []

  skills.forEach((skill, index) => {
    if (!skill.name?.trim()) {
      validationErrors.push({
        field: `skills[${index}].name`,
        message: 'name is required and cannot be empty',
        code: ErrorCodes.REQUIRED
      })
    }

    const levelError = validateEnum(
      skill.proficiencyLevel,
      `skills[${index}].proficiencyLevel`,
      VALID_PROFICIENCY_LEVELS,
      false
    )
    if (levelError) {
      validationErrors.push(levelError)
    }
  })

  if (validationErrors.length > 0) {
    const error = createValidationError(validationErrors)
    logError('PUT', ROUTE_PATH, error, { profileId, fields: validationErrors.map(e => e.field) })
    throw error
  }

  const { data, error } = await supabase
    .schema('career_id')
    .from('profile_skills')
    .upsert(
      { id: generatePrefixedId('psk'), profile_id: profileId, skills },
      { onConflict: 'profile_id' }
    )
    .select('skills')
    .single()

  if (error) {
    logError('PUT', ROUTE_PATH, error, { profileId, dbCode: error.code })
    throw handleDatabaseError(error, { operation: 'save', resource: 'skills' })
  }

  const duration = getElapsed()
  logSuccess('PUT', ROUTE_PATH, duration, { profileId, count: skills.length })

  return {
    success: true,
    message: `${skills.length} skill(s) saved successfully`,
    data: data.skills
  }
})
