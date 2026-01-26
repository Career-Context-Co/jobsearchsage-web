/**
 * POST /api/ai/hero-session/continue
 * 
 * Continue hero story section enhancement conversation with user response.
 * Processes user message, appends to conversation history, and returns next AI question.
 * When conversation completes, extracts final structured output and updates session.
 */

import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { ErrorCodes } from '@@/server/utils/error-handler'
import { continueEnhancementConversation, HeroEnhancementError } from '@@/server/utils/hero-story-enhancer'
import { serverSupabaseClient } from '#supabase/server'

const ROUTE_PATH = '/api/ai/hero-session/continue'

export default eventHandler(async (event) => {
  const getElapsed = createTimer()
  const supabase = await serverSupabaseClient(event)

  logRequest('POST', ROUTE_PATH)

  try {
    const body = await readBody(event)
    const { session_id, user_message } = body

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

    logRequest('POST', ROUTE_PATH, {
      session_id,
    })

    // Get current session to retrieve conversation history and section type
    const { data: sessionData, error: fetchError } = await supabase
      .from('hero_story_sessions')
      .select('section_type, session_data, session_status')
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
            message: 'Enhancement session not found',
          },
        },
      })
    }

    // Check if session is still active
    if (sessionData.session_status !== 'active') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        data: {
          success: false,
          error: {
            code: 'SESSION_INACTIVE',
            message: `Cannot continue session with status: ${sessionData.session_status}`,
          },
        },
      })
    }

    // Retrieve conversation history and section type from session
    const conversationHistory = sessionData.session_data?.conversation_history || []
    const sectionType = sessionData.section_type

    logRequest('POST', ROUTE_PATH, { status: 'processing_message', section_type: sectionType })

    // Continue conversation with AI
    const { aiMessage, isComplete, finalOutput } = await continueEnhancementConversation(
      sectionType,
      conversationHistory,
      user_message
    )

    // Update conversation history in session
    const updatedHistory = [
      ...conversationHistory,
      { role: 'user', content: user_message },
      { role: 'assistant', content: aiMessage },
    ]

    // Prepare update object
    const updateData: any = {
      session_data: {
        ...sessionData.session_data,
        conversation_history: updatedHistory,
      },
    }

    // If conversation is complete, add final output and update status
    if (isComplete && finalOutput) {
      updateData.session_data.final_output = finalOutput
      updateData.session_status = 'completed'
      updateData.ended_at = new Date().toISOString()
    }

    const { error: updateError } = await supabase
      .from('hero_story_sessions')
      .update(updateData)
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
            message: 'Failed to update enhancement session',
          },
        },
      })
    }

    const duration = getElapsed()

    logSuccess('POST', ROUTE_PATH, duration, {
      session_id,
      is_complete: isComplete,
      has_final_output: !!finalOutput,
    })

    return {
      success: true,
      ai_message: aiMessage,
      is_complete: isComplete,
      final_output: finalOutput || null,
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
          message: 'Failed to continue enhancement session',
        },
      },
    })
  }
})
