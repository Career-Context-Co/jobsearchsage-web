/**
 * POST /api/ai/hero-discovery/continue
 * 
 * Continue hero discovery conversation, process user message, and identify moments.
 * Captures moments when sufficient detail is gathered from user responses.
 * SessionId is passed in request body (not RESTful URL structure).
 */

import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { ErrorCodes } from '@@/server/utils/error-handler'
import { generateDiscoveryContinue, DiscoveryError } from '@@/server/utils/hero-discovery-service'
import { serverSupabaseClient } from '#supabase/server'

const ROUTE_PATH = '/api/ai/hero-discovery/continue'

export default eventHandler(async (event) => {
  const getElapsed = createTimer()
  const supabase = await serverSupabaseClient(event)

  logRequest('POST', ROUTE_PATH)

  try {
    const body = await readBody(event)
    const { session_id, user_message, captured_moments } = body

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

    if (!user_message) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        data: {
          success: false,
          error: {
            code: ErrorCodes.REQUIRED,
            message: 'user_message is required',
          },
        },
      })
    }

    if (!Array.isArray(captured_moments)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        data: {
          success: false,
          error: {
            code: ErrorCodes.REQUIRED,
            message: 'captured_moments must be an array',
          },
        },
      })
    }

    logRequest('POST', ROUTE_PATH, {
      session_id,
      moments_count: captured_moments.length,
    })

    // Generate AI response and check for moment capture
    logRequest('POST', ROUTE_PATH, { status: 'processing_message' })
    
    // Get current session to retrieve conversation history
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

    // Retrieve conversation history from session
    const conversationHistory = sessionData.session_data?.conversation_history || []
    
    const { aiMessage, momentCaptured, shouldEndSession } = await generateDiscoveryContinue(
      user_message,
      captured_moments,
      conversationHistory
    )

    // Update conversation history in session
    const currentHistory = sessionData.session_data?.conversation_history || []
    const updatedHistory = [
      ...currentHistory,
      { role: 'user', content: user_message },
      { role: 'assistant', content: aiMessage },
    ]

    let updatedMoments = [...captured_moments]
    if (momentCaptured) {
      updatedMoments.push({
        title: momentCaptured.title,
        rawNotes: momentCaptured.rawNotes,
      })
    }

    const { error: updateError } = await supabase
      .from('hero_discovery_sessions')
      .update({
        session_data: {
          ...sessionData.session_data,
          conversation_history: updatedHistory,
          captured_moments: updatedMoments,
        },
        moment_count: updatedMoments.length,
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
            message: 'Failed to update discovery session',
          },
        },
      })
    }

    const duration = getElapsed()

    logSuccess('POST', ROUTE_PATH, duration, {
      session_id,
      moment_captured: !!momentCaptured,
      should_end_session: shouldEndSession,
      total_moments: updatedMoments.length,
    })

    return {
      success: true,
      ai_message: aiMessage,
      should_end_session: shouldEndSession,
      session_state: {
        captured_moments: updatedMoments,
        session_id,
      },
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
          message: 'Failed to continue discovery session',
        },
      },
    })
  }
})
