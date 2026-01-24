/**
 * POST /api/ai/hero-discovery/end
 * 
 * End hero discovery session, summarize captured moments, and guide user to Story Builder.
 * Generates one-line summaries for each moment and asks which to develop first.
 * SessionId is passed in request body (not RESTful URL structure).
 */

import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { ErrorCodes } from '@@/server/utils/error-handler'
import { generateDiscoveryEnd, DiscoveryError } from '@@/server/utils/hero-discovery-service'
import { serverSupabaseClient } from '#supabase/server'

const ROUTE_PATH = '/api/ai/hero-discovery/end'

export default eventHandler(async (event) => {
  const getElapsed = createTimer()
  const supabase = await serverSupabaseClient(event)

  logRequest('POST', ROUTE_PATH)

  try {
    const body = await readBody(event)
    const { session_id, captured_moments, user_context } = body

    // Validate required fields
    if (!session_id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        data: {
          success: false,
          error: {
            code: ErrorCodes.REQUIRED,
            message: 'session_id is required',
          },
        },
      })
    }

    if (!Array.isArray(captured_moments) || captured_moments.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        data: {
          success: false,
          error: {
            code: ErrorCodes.REQUIRED,
            message: 'captured_moments must be a non-empty array',
          },
        },
      })
    }

    logRequest('POST', ROUTE_PATH, {
      session_id,
      moments_count: captured_moments.length,
    })

    // Generate AI summary and guidance
    logRequest('POST', ROUTE_PATH, { status: 'generating_summary' })
    const { aiMessage } = await generateDiscoveryEnd(
      captured_moments,
      user_context
    )

    // Get current session to mark as complete
    const { data: sessionData, error: fetchError } = await supabase
      .from('hero_discovery_sessions')
      .select('session_data')
      .eq('id', session_id)
      .single()

    if (fetchError || !sessionData) {
      logError('POST', ROUTE_PATH, fetchError, {
        session_id,
        dbCode: fetchError?.code,
      })

      throw createError({
        statusCode: 404,
        statusMessage: 'Not Found',
        data: {
          success: false,
          error: {
            code: 'SESSION_NOT_FOUND',
            message: 'Discovery session not found',
          },
        },
      })
    }

    // Mark session as complete
    const { error: updateError } = await supabase
      .from('hero_discovery_sessions')
      .update({
        session_status: 'completed',
        session_data: {
          ...sessionData.session_data,
          completed_at: new Date().toISOString(),
        },
      })
      .eq('id', session_id)

    if (updateError) {
      logError('POST', ROUTE_PATH, updateError, {
        session_id,
        dbCode: updateError.code,
      })

      throw createError({
        statusCode: 500,
        statusMessage: 'Internal Server Error',
        data: {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to complete discovery session',
          },
        },
      })
    }

    const duration = getElapsed()

    logSuccess('POST', ROUTE_PATH, duration, {
      session_id,
      total_moments: captured_moments.length,
      session_complete: true,
    })

    return {
      success: true,
      ai_message: aiMessage,
      captured_moments,
      session_complete: true,
      next_endpoint: '/api/ai/hero/story-builder/start',
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
          message: 'Failed to end discovery session',
        },
      },
    })
  }
})
