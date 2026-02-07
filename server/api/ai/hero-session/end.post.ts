/**
 * POST /api/ai/hero-session/end
 * 
 * Ends a hero story section enhancement session and saves the final output to the hero_stories table.
 * Uses the existing PATCH endpoint to update the story, then marks the session as complete.
 */

import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { ErrorCodes } from '@@/server/utils/error-handler'
import { serverSupabaseClient } from '#supabase/server'

const ROUTE_PATH = '/api/ai/hero-session/end'

export default eventHandler(async (event) => {
  const getElapsed = createTimer()
  const supabase = await serverSupabaseClient(event)

  logRequest('POST', ROUTE_PATH)

  try {
    const body = await readBody(event)
    const { session_id } = body

    // Validate required field
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

    logRequest('POST', ROUTE_PATH, { session_id })

    // Get session to retrieve final output and story details
    const { data: sessionData, error: fetchError } = await supabase
      .from('hero_story_sessions')
      .select('profile_id, story_id, section_type, session_status, session_data')
      .eq('id', session_id)
      .single() as any

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

    // Check if session is already completed or needs forced completion
    let finalOutput = sessionData.session_data?.final_output
    
    if (sessionData.session_status !== 'completed') {
      // Session is still active - force completion by asking AI for final summary
      logRequest('POST', ROUTE_PATH, {
        status: 'forcing_early_completion',
        session_id,
        section_type: sessionData.section_type,
      })

      const conversationHistory = sessionData.session_data?.conversation_history || []
      const forceCompletionMessage = "I'd like to wrap up now. Please provide the final structured output based on what we've discussed so far."

      // Import and call the enhancer
      const { continueEnhancementConversation } = await import('@@/server/utils/hero-story-enhancer')
      
      const { aiMessage, isComplete, finalOutput: generatedOutput } = await continueEnhancementConversation(
        sessionData.section_type,
        conversationHistory,
        forceCompletionMessage
      )

      if (!isComplete || !generatedOutput) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Internal Server Error',
          data: {
            success: false,
            error: {
              code: 'COMPLETION_FAILED',
              message: 'Failed to generate final output when ending session early',
            },
          },
        })
      }

      // Update conversation history and session status
      const updatedHistory = [
        ...conversationHistory,
        { role: 'user', content: forceCompletionMessage },
        { role: 'assistant', content: aiMessage },
      ]

      const { error: updateError } = await supabase
        .from('hero_story_sessions')
        // @ts-ignore - Supabase types don't match runtime schema
        .update({
          session_status: 'completed',
          ended_at: new Date().toISOString(),
          session_data: {
            ...sessionData.session_data,
            conversation_history: updatedHistory,
            final_output: generatedOutput,
          },
        } as any)
        .eq('id', session_id)

      if (updateError) {
        logError('POST', ROUTE_PATH, updateError, {
          session_id,
          status: 'session_update_failed',
          dbCode: updateError.code,
        })

        throw createError({
          statusCode: 500,
          statusMessage: 'Internal Server Error',
          data: {
            success: false,
            error: {
              code: 'DB_ERROR',
              message: 'Failed to update session after forced completion',
            },
          },
        })
      }

      finalOutput = generatedOutput
      
      logRequest('POST', ROUTE_PATH, {
        status: 'early_completion_success',
        session_id,
        has_final_output: !!finalOutput,
      })
    }
    
    // Debug logging
    logRequest('POST', ROUTE_PATH, {
      status: 'extracting_final_output',
      session_id,
      has_session_data: !!sessionData.session_data,
      has_final_output: !!finalOutput,
      final_output_keys: finalOutput ? Object.keys(finalOutput) : [],
      final_output_preview: finalOutput,
    })

    if (!finalOutput || Object.keys(finalOutput).length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        data: {
          success: false,
          error: {
            code: 'NO_FINAL_OUTPUT',
            message: 'Session has no final output to save',
          },
        },
      })
    }

    // The final_output already has the correct camelCase field names from the enhancer
    // (e.g., hurdleProblem, hurdleScope, hurdleStakes)
    const updateData = finalOutput

    logRequest('POST', ROUTE_PATH, {
      status: 'saving_to_story',
      story_id: sessionData.story_id,
      section_type: sessionData.section_type,
      field_count: Object.keys(updateData).length,
      update_data_keys: Object.keys(updateData),
    })

    // Use existing PATCH endpoint to update hero story
    let patchResponse
    try {
      const baseUrl = process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3000'
      patchResponse = await $fetch<{
        success: boolean
        message: string
        data: any
      }>(`${baseUrl}/api/career-id/profile/${sessionData.profile_id}/hero-stories/${sessionData.story_id}`, {
        method: 'PATCH',
        body: updateData,
      })

      if (!patchResponse.success) {
        throw new Error('PATCH returned success: false')
      }
    } catch (patchError: any) {
      logError('POST', ROUTE_PATH, patchError, {
        session_id,
        story_id: sessionData.story_id,
        status: 'patch_failed',
        error_message: patchError?.message,
        error_data: patchError?.data,
      })

      throw createError({
        statusCode: patchError.statusCode || 500,
        statusMessage: patchError.statusMessage || 'Internal Server Error',
        data: {
          success: false,
          error: {
            code: 'STORY_UPDATE_FAILED',
            message: patchError?.data?.error?.message || patchError?.message || 'Failed to update hero story',
          },
        },
      })
    }

    // Mark session as ended (though it's already completed from the final continue call)
    const { error: sessionUpdateError } = await supabase
      .from('hero_story_sessions')
      // @ts-ignore - Supabase types don't match runtime schema
      .update({
        session_data: {
          ...sessionData.session_data,
          applied_at: new Date().toISOString(),
        },
      } as any)
      .eq('id', session_id)

    if (sessionUpdateError) {
      // Log but don't fail the request - the story was already updated successfully
      logError('POST', ROUTE_PATH, sessionUpdateError, {
        session_id,
        status: 'session_update_failed_after_story_save',
        dbCode: sessionUpdateError.code,
      })
    }

    const duration = getElapsed()

    logSuccess('POST', ROUTE_PATH, duration, {
      session_id,
      story_id: sessionData.story_id,
      section_type: sessionData.section_type,
      fields_updated: Object.keys(updateData),
    })

    return {
      success: true,
      story_id: sessionData.story_id,
      section_type: sessionData.section_type,
      fields_updated: Object.keys(updateData),
      updated_story: patchResponse.data,
    }
  } catch (error: any) {
    // If already a shaped error, rethrow
    if (error.statusCode) {
      throw error
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
          message: 'Failed to end enhancement session',
        },
      },
    })
  }
})
