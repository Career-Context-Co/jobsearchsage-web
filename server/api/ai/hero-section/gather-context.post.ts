/**
 * POST /api/ai/hero-section/gather-context
 *
 * Stateless round-based context gathering for HERO section enhancement.
 * Mirrors the experience gather-context pattern: pass accumulated answers
 * on each call to get follow-up questions or signal completion.
 *
 * Request body:
 * {
 *   profile_id: string,
 *   story_id: string,
 *   section_type: 'hurdle' | 'expectation' | 'response' | 'outcome',
 *   source_experience?: { id, title, employer, summary?, highlights, context_notes? },
 *   moment_title?: string,
 *   context?: { answeredQuestions: [{ id, answer }] }
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: { questionGroups: QuestionGroup[], notes: [] }
 * }
 */

import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { createValidationError } from '@@/server/utils/error-handler'
import { isRequired, requiredFieldError } from '@@/server/utils/validation'
import {
  generateHeroSectionQuestions,
  HeroEnhancementError,
  type SectionType,
  type StructuredEnhancementInput
} from '@@/server/utils/hero-story-enhancer'

const ROUTE_PATH = '/api/ai/hero-section/gather-context'
const VALID_SECTIONS: SectionType[] = ['hurdle', 'expectation', 'response', 'outcome']

export default eventHandler(async (event) => {
  const getElapsed = createTimer()
  const body = await readBody(event)

  logRequest('POST', ROUTE_PATH, {
    profileId: body.profile_id,
    storyId: body.story_id,
    sectionType: body.section_type
  })

  const validationErrors = []

  if (!isRequired(body.profile_id)) {
    validationErrors.push(requiredFieldError('profile_id'))
  }
  if (!isRequired(body.story_id)) {
    validationErrors.push(requiredFieldError('story_id'))
  }
  if (!isRequired(body.section_type)) {
    validationErrors.push(requiredFieldError('section_type'))
  } else if (!VALID_SECTIONS.includes(body.section_type)) {
    validationErrors.push({ field: 'section_type', message: 'Must be hurdle, expectation, response, or outcome' })
  }

  if (validationErrors.length > 0) {
    const error = createValidationError(validationErrors)
    logError('POST', ROUTE_PATH, error, { profileId: body.profile_id })
    throw error
  }

  const sectionType = body.section_type as SectionType
  const previousAnswers = body.context?.answeredQuestions || []

  const context: StructuredEnhancementInput = {
    moment_title: body.moment_title || null,
    moment_description: null,
    experience: body.source_experience || undefined,
    previous_field_results: undefined
  }

  try {
    const questionGroups = await generateHeroSectionQuestions(
      sectionType,
      context,
      previousAnswers.length > 0 ? previousAnswers : undefined
    )

    const totalQuestions = questionGroups.reduce((sum, g) => sum + g.questions.length, 0)
    const duration = getElapsed()

    logSuccess('POST', ROUTE_PATH, duration, {
      profileId: body.profile_id,
      storyId: body.story_id,
      sectionType,
      questionGroupCount: questionGroups.length,
      totalQuestions,
      isFollowUp: previousAnswers.length > 0
    })

    return {
      success: true,
      data: {
        questionGroups,
        notes: []
      }
    }
  } catch (error: unknown) {
    if (error instanceof HeroEnhancementError) {
      const statusCode = error.code === 'TIMEOUT' ? 504 : 500
      setResponseStatus(event, statusCode)

      logError('POST', ROUTE_PATH, error, {
        profileId: body.profile_id,
        storyId: body.story_id,
        sectionType,
        enhancementCode: error.code
      })

      throw createError({
        statusCode,
        statusMessage: error.code === 'TIMEOUT' ? 'Request Timeout' : 'Enhancement Error',
        message: error.message,
        data: { code: error.code, details: error.details }
      })
    }

    logError('POST', ROUTE_PATH, error as Error, { profileId: body.profile_id })
    throw error
  }
})
