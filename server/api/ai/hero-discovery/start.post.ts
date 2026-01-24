/**
 * POST /api/ai/hero-discovery/start
 * 
 * Starts a new hero discovery session with AI-guided conversation.
 * Generates opening greeting and first question to identify career achievements.
 */

import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { ErrorCodes } from '@@/server/utils/error-handler'
import { generateDiscoveryStart, DiscoveryError } from '@@/server/utils/hero-discovery-service'
import { serverSupabaseClient } from '#supabase/server'

const ROUTE_PATH = '/api/ai/hero-discovery/start'

export default eventHandler(async (event) => {
  const getElapsed = createTimer()
  const supabase = await serverSupabaseClient(event)

  logRequest('POST', ROUTE_PATH)

  try {
    const body = await readBody(event)
    const { profile_id, user_context } = body

    // Validate required field
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

    // Extract user context for personalization
    const userName = user_context?.name || 'there'
    const currentRole = user_context?.current_role || null
    const yearsExperience = user_context?.years_experience || null
    const sourceExperience = body.source_experience || null

    logRequest('POST', ROUTE_PATH, {
      profile_id,
      has_user_context: !!user_context,
      has_source_experience: !!sourceExperience,
    })

    // Generate AI greeting (passing source experience for context)
    logRequest('POST', ROUTE_PATH, { status: 'generating_greeting' })
    const aiMessage = await generateDiscoveryStart(
      userName,
      currentRole,
      yearsExperience,
      sourceExperience
    )

    // Create session record in database
    const { data: sessionData, error: dbError } = await supabase
      .from('hero_discovery_sessions')
      .insert({
        profile_id,
        session_status: 'active',
        session_data: {
          conversation_history: [
            {
              role: 'assistant',
              content: aiMessage,
            },
          ],
          user_context: {
            name: userName,
            current_role: currentRole,
            years_experience: yearsExperience,
            source_experience_id: sourceExperience?.id || null,
            source_experience: sourceExperience ? {
              employer: sourceExperience.employer,
              title: sourceExperience.title,
              employmentType: sourceExperience.employmentType,
              location: sourceExperience.location,
              locationType: sourceExperience.locationType,
              startDate: sourceExperience.startDate,
              endDate: sourceExperience.endDate,
              summary: sourceExperience.summary,
            } : null,
          },
        },
        moment_count: 0,
      })
      .select()

    if (dbError) {
      logError('POST', ROUTE_PATH, dbError, {
        profile_id,
        dbCode: dbError.code,
      })

      throw createError({
        statusCode: 500,
        statusMessage: 'Internal Server Error',
        data: {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to create discovery session',
          },
        },
      })
    }

    setResponseStatus(event, 201)
    const duration = getElapsed()

    const sessionId = sessionData?.[0]?.id
    if (!sessionId) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Internal Server Error',
        data: {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to create discovery session',
          },
        },
      })
    }

    logSuccess('POST', ROUTE_PATH, duration, {
      profile_id,
      session_id: sessionId,
    })

    return {
      success: true,
      ai_message: aiMessage,
      session_id: sessionId,
    }
  } catch (error: any) {
    // If already a shaped error, rethrow
    if (error.statusCode) {
      throw error
    }

    // Handle DiscoveryError
    if (error instanceof DiscoveryError) {
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
          message: 'Failed to start discovery session',
        },
      },
    })
  }
})
