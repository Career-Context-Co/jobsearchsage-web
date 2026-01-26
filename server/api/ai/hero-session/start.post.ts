/**
 * POST /api/ai/hero-session/start
 * 
 * Starts a new hero story section enhancement session with AI-guided conversation.
 * Generates first coaching question based on section type and context.
 */

import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { ErrorCodes } from '@@/server/utils/error-handler'
import { startEnhancementConversation, HeroEnhancementError, type EnhancementInput } from '@@/server/utils/hero-story-enhancer'
import { serverSupabaseClient } from '#supabase/server'

const ROUTE_PATH = '/api/ai/hero-session/start'

const VALID_SECTION_TYPES = ['hurdle', 'expectation', 'response', 'outcome']

export default eventHandler(async (event) => {
  const getElapsed = createTimer()
  const supabase = await serverSupabaseClient(event)

  logRequest('POST', ROUTE_PATH)

  try {
    const body = await readBody(event)
    const {
      profile_id,
      story_id,
      section_type,
      moment_title,
      moment_description,
      moment_id,
      current_values,
      source_experience,
    } = body

    // Validate required fields
    if (!profile_id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        data: {
          success: false,
          error: {
            code: ErrorCodes.REQUIRED,
            message: 'profile_id is required',
          },
        },
      })
    }

    if (!story_id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        data: {
          success: false,
          error: {
            code: ErrorCodes.REQUIRED,
            message: 'story_id is required',
          },
        },
      })
    }

    if (!section_type) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        data: {
          success: false,
          error: {
            code: ErrorCodes.REQUIRED,
            message: 'section_type is required',
          },
        },
      })
    }

    // Validate section_type is one of the allowed values
    if (!VALID_SECTION_TYPES.includes(section_type)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        data: {
          success: false,
          error: {
            code: ErrorCodes.REQUIRED,
            message: `section_type must be one of: ${VALID_SECTION_TYPES.join(', ')}`,
          },
        },
      })
    }

    if (!current_values || typeof current_values !== 'object') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        data: {
          success: false,
          error: {
            code: ErrorCodes.REQUIRED,
            message: 'current_values is required and must be an object with field1, field2, field3',
          },
        },
      })
    }

    logRequest('POST', ROUTE_PATH, {
      profile_id,
      story_id,
      section_type,
      has_moment_title: !!moment_title,
      has_source_experience: !!source_experience,
      has_moment_id: !!moment_id,
    })

    // Build enhancement input
    const enhancementInput: EnhancementInput = {
      moment_title: moment_title || null,
      moment_description: moment_description || null,
      current_values: {
        field1: current_values.field1 || null,
        field2: current_values.field2 || null,
        field3: current_values.field3 || null,
      },
    }

    // Add source experience if provided
    if (source_experience) {
      enhancementInput.experience = {
        id: source_experience.id,
        title: source_experience.title,
        employer: source_experience.employer,
        employment_type: source_experience.employment_type || source_experience.employmentType,
        start_date: source_experience.start_date || source_experience.startDate,
        end_date: source_experience.end_date || source_experience.endDate || null,
        current_position: source_experience.current_position ?? source_experience.currentPosition ?? false,
        summary: source_experience.summary || null,
        highlights: source_experience.highlights || [],
        context_notes: source_experience.context_notes || source_experience.contextNotes || null,
        location: source_experience.location || null,
        location_type: source_experience.location_type || source_experience.locationType || null,
      }
    }

    // Generate AI first message
    logRequest('POST', ROUTE_PATH, { status: 'generating_first_message' })
    const aiMessage = await startEnhancementConversation(section_type, enhancementInput)

    // Build session data for database
    const sessionData: any = {
      conversation_history: [
        {
          role: 'assistant',
          content: aiMessage,
        },
      ],
      current_field_values: {
        field1: current_values.field1 || null,
        field2: current_values.field2 || null,
        field3: current_values.field3 || null,
      },
    }

    // Add moment context if provided
    if (moment_title) {
      sessionData.moment_context = {
        title: moment_title,
        description: moment_description || null,
      }
    }

    // Add source experience to session data if provided
    if (enhancementInput.experience) {
      sessionData.source_experience = enhancementInput.experience
    }

    // Create session record in database
    const { data: sessionRecord, error: dbError } = await supabase
      .from('hero_story_sessions')
      .insert({
        profile_id,
        story_id,
        section_type,
        session_status: 'active',
        moment_id: moment_id || null,
        session_data: sessionData,
      } as any)
      .select()

    if (dbError) {
      logError('POST', ROUTE_PATH, dbError, {
        profile_id,
        story_id,
        section_type,
        dbCode: dbError.code,
      })

      throw createError({
        statusCode: 500,
        statusMessage: 'Internal Server Error',
        data: {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to create enhancement session',
          },
        },
      })
    }

    setResponseStatus(event, 201)
    const duration = getElapsed()

    const sessionId = (sessionRecord as any)?.[0]?.id
    if (!sessionId) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Internal Server Error',
        data: {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to create enhancement session',
          },
        },
      })
    }

    logSuccess('POST', ROUTE_PATH, duration, {
      profile_id,
      story_id,
      section_type,
      session_id: sessionId,
    })

    return {
      success: true,
      ai_message: aiMessage,
      session_id: sessionId,
      is_complete: false,
    }
  } catch (error: any) {
    // If already a shaped error, rethrow
    if (error.statusCode) {
      throw error
    }

    // Handle HeroEnhancementError
    if (error instanceof HeroEnhancementError) {
      let statusCode = 500
      if (error.code === 'API_KEY_MISSING') {
        statusCode = 503
      } else if (error.code === 'TIMEOUT') {
        statusCode = 503
      }

      logError('POST', ROUTE_PATH, error.message, {
        code: error.code,
        details: error.details,
      })

      throw createError({
        statusCode,
        statusMessage: statusCode === 503 ? 'Service Unavailable' : 'Internal Server Error',
        data: {
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        },
      })
    }

    // Handle unexpected errors
    const duration = getElapsed()
    logError('POST', ROUTE_PATH, error, {
      duration,
      message: error?.message || 'Unknown error',
    })

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      data: {
        success: false,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'Failed to start enhancement session',
        },
      },
    })
  }
})
