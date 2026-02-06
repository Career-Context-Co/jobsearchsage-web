/**
 * POST /api/ai/hero-session/continue
 *
 * Continue hero story section enhancement conversation with user response.
 * Processes user message, appends to conversation history, and returns next AI question.
 * When conversation completes, extracts final structured output and updates session.
 */

import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { ErrorCodes } from '@@/server/utils/error-handler'
import {
  continueEnhancementConversation,
  continueStructuredEnhancement,
  generateFieldTextFromAnswers,
  generateTransitionMessage,
  HeroEnhancementError,
  type StructuredEnhancementInput
} from '@@/server/utils/hero-story-enhancer'
import type { HurdleField, QuestionAnswer } from '@@/server/utils/hero-structured-questions'
import { serverSupabaseClient } from '#supabase/server'

const ROUTE_PATH = '/api/ai/hero-session/continue'

export default eventHandler(async (event) => {
  const getElapsed = createTimer()
  const supabase = await serverSupabaseClient(event)

  logRequest('POST', ROUTE_PATH)

  try {
    const body = await readBody(event)
    const { session_id, user_message, selected_option, custom_text } = body

    // Validate required fields
    if (!session_id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        data: {
          success: false,
          error: {
            code: ErrorCodes.REQUIRED,
            message: 'session_id is required'
          }
        }
      })
    }

    // Either user_message (conversational) or selected_option (structured) must be provided
    if (!user_message && !selected_option) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        data: {
          success: false,
          error: {
            code: ErrorCodes.REQUIRED,
            message: 'Either user_message or selected_option is required'
          }
        }
      })
    }

    logRequest('POST', ROUTE_PATH, {
      session_id,
      has_user_message: !!user_message,
      has_selected_option: !!selected_option
    })

    // Get current session to retrieve conversation history and section type

    const { data: sessionData, error: fetchError } = await supabase
      .from('hero_story_sessions')
      .select('section_type, session_data, session_status')
      .eq('id', session_id)
      .single() as { data: any, error: any }

    if (fetchError || !sessionData) {
      logError('POST', ROUTE_PATH, fetchError, {
        session_id,
        dbCode: fetchError?.code
      })

      throw createError({
        statusCode: 404,
        statusMessage: 'Not Found',
        data: {
          success: false,
          error: {
            code: 'SESSION_NOT_FOUND',
            message: 'Enhancement session not found'
          }
        }
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
            message: `Cannot continue session with status: ${sessionData.session_status}`
          }
        }
      })
    }

    // Determine mode from session data
    const mode = sessionData.session_data?.mode || 'conversational'
    const isStructuredMode = mode === 'structured'
    const sectionType = sessionData.section_type

    let aiMessage: string | undefined
    let isComplete = false
    let finalOutput: any = null
    let nextQuestion: any = null
    let updateData: any

    if (isStructuredMode) {
      // STRUCTURED MODE
      const field = sessionData.session_data.field as HurdleField
      const currentQuestion = sessionData.session_data.current_question
      const answers: QuestionAnswer[] = sessionData.session_data.answers || []
      const previousFieldResults = sessionData.session_data.previous_field_results || {}

      logRequest('POST', ROUTE_PATH, { status: 'processing_selection', field, question: currentQuestion?.id })

      // Record the answer
      const answer: QuestionAnswer = {
        questionId: currentQuestion.id,
        selectedOption: selected_option!,
        customText: custom_text,
        timestamp: new Date().toISOString()
      }
      answers.push(answer)

      // Build context for question generation
      const context: StructuredEnhancementInput = {
        moment_title: sessionData.session_data.moment_context?.title,
        moment_description: sessionData.session_data.moment_context?.description,
        experience: sessionData.session_data.source_experience,
        previous_field_results: previousFieldResults
      }

      // Get next question
      nextQuestion = await continueStructuredEnhancement(
        field,
        currentQuestion,
        selected_option!,
        custom_text,
        context,
        answers
      )

      if (nextQuestion) {
        // More questions remain
        // Calculate progress (typical field has 3-4 questions)
        const questionNumber = answers.length
        const estimatedTotalQuestions = 4

        aiMessage = await generateTransitionMessage(field, answer, nextQuestion, context, questionNumber, estimatedTotalQuestions)
        isComplete = false

        updateData = {
          session_data: {
            ...sessionData.session_data,
            current_question: nextQuestion,
            answers
          }
        }
      } else {
        // Field conversation complete - generate final text
        const context: StructuredEnhancementInput = {
          moment_title: sessionData.session_data.moment_context?.title,
          moment_description: sessionData.session_data.moment_context?.description,
          experience: sessionData.session_data.source_experience,
          previous_field_results: previousFieldResults
        }

        const fieldText = await generateFieldTextFromAnswers(field, answers, context)

        // Determine the database field name
        const fieldMapping: Record<string, string> = {
          problem: 'hurdleProblem',
          scope: 'hurdleScope',
          stakes: 'hurdleStakes'
        }
        const dbFieldName = fieldMapping[field]
        if (!dbFieldName) {
          throw new Error(`Invalid field: ${field}`)
        }

        aiMessage = `Great! I have everything I need for ${field}.`
        isComplete = true
        finalOutput = { [dbFieldName]: fieldText }

        updateData = {
          session_data: {
            ...sessionData.session_data,
            answers,
            final_output: finalOutput
          },
          session_status: 'completed',
          ended_at: new Date().toISOString()
        }
      }
    } else {
      // CONVERSATIONAL MODE (legacy)
      const conversationHistory = sessionData.session_data?.conversation_history || []

      logRequest('POST', ROUTE_PATH, { status: 'processing_message', section_type: sectionType })

      // Continue conversation with AI
      const result = await continueEnhancementConversation(
        sectionType,
        conversationHistory,
        user_message!
      )

      aiMessage = result.aiMessage
      isComplete = result.isComplete
      finalOutput = result.finalOutput

      // Update conversation history in session
      const updatedHistory = [
        ...conversationHistory,
        { role: 'user', content: user_message },
        { role: 'assistant', content: aiMessage }
      ]

      // Prepare update object
      updateData = {
        session_data: {
          ...sessionData.session_data,
          conversation_history: updatedHistory
        }
      }

      // If conversation is complete, add final output and update status
      if (isComplete && finalOutput) {
        updateData.session_data.final_output = finalOutput
        updateData.session_status = 'completed'
        updateData.ended_at = new Date().toISOString()
      }
    }

    const { error: updateError } = await supabase
      .from('hero_story_sessions')
      .update(updateData)
      .eq('id', session_id)

    if (updateError) {
      logError('POST', ROUTE_PATH, updateError, {
        session_id,
        dbCode: updateError.code
      })

      throw createError({
        statusCode: 500,
        statusMessage: 'Internal Server Error',
        data: {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to update enhancement session'
          }
        }
      })
    }

    const duration = getElapsed()

    logSuccess('POST', ROUTE_PATH, duration, {
      session_id,
      mode: isStructuredMode ? 'structured' : 'conversational',
      is_complete: isComplete,
      has_final_output: !!finalOutput,
      has_next_question: !!nextQuestion
    })

    if (isStructuredMode) {
      // Return structured response
      return {
        success: true,
        ai_message: aiMessage,
        is_complete: isComplete,
        current_question: nextQuestion,
        final_output: finalOutput || null
      }
    } else {
      // Return conversational response (legacy)
      return {
        success: true,
        ai_message: aiMessage,
        is_complete: isComplete,
        final_output: finalOutput || null
      }
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
        details: error.details
      })

      throw createError({
        statusCode,
        statusMessage: statusCode === 503 ? 'Service Unavailable' : 'Internal Server Error',
        data: {
          success: false,
          error: {
            code: error.code,
            message: error.message
          }
        }
      })
    }

    // Handle unexpected errors
    const duration = getElapsed()
    logError('POST', ROUTE_PATH, error, {
      duration,
      message: error?.message || 'Unknown error'
    })

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      data: {
        success: false,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'Failed to continue enhancement session'
        }
      }
    })
  }
})
