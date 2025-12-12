/**
 * POST /api/career-id/resume/extract
 * 
 * Uploads and validates a resume file for AI extraction.
 * 
 * USER STORY 2: Validation only (no AI extraction yet)
 * USER STORY 3 will enhance this to add AI extraction logic
 */

import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { ErrorCodes } from '@@/server/utils/error-handler'
import { validateResumeFile, formatFileSize } from '@@/server/utils/file-validator'

const ROUTE_PATH = '/api/career-id/resume/extract'

export default eventHandler(async (event) => {
  const getElapsed = createTimer()
  
  logRequest('POST', ROUTE_PATH)
  
  try {
    // Read multipart form data
    const formData = await readMultipartFormData(event)
    
    if (!formData || formData.length === 0) {
      logError('POST', ROUTE_PATH, 'No file provided', { code: 'MISSING_FILE' })
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        data: {
          success: false,
          error: {
            code: ErrorCodes.VALIDATION_ERROR,
            message: 'No file provided. Please upload a resume file.'
          }
        }
      })
    }
    
    // Get the first file from form data
    const fileData = formData[0]
    
    // Log file details
    const fileSize = fileData.data?.length || 0
    logRequest('POST', ROUTE_PATH, {
      filename: fileData.filename,
      type: fileData.type,
      size: formatFileSize(fileSize)
    })
    
    // Validate the file
    const validationResult = validateResumeFile({
      filename: fileData.filename,
      type: fileData.type,
      data: fileData.data
    })
    
    if (!validationResult.valid) {
      const error = validationResult.error!
      
      // Determine appropriate status code
      let statusCode = 400
      if (error.code === 'FILE_TOO_LARGE') {
        statusCode = 413 // Payload Too Large
      }
      
      logError('POST', ROUTE_PATH, error.message, {
        code: error.code,
        filename: fileData.filename,
        size: formatFileSize(fileSize)
      })
      
      throw createError({
        statusCode,
        statusMessage: statusCode === 413 ? 'Payload Too Large' : 'Bad Request',
        data: {
          success: false,
          error: {
            code: error.code,
            message: error.message
          }
        }
      })
    }
    
    // File is valid - for now, just return success
    // USER STORY 3 will add AI extraction logic here
    const duration = getElapsed()
    logSuccess('POST', ROUTE_PATH, duration, {
      filename: fileData.filename,
      size: formatFileSize(fileSize),
      status: 'validation_passed'
    })
    
    return {
      success: true,
      message: 'File validated successfully. AI extraction will be added in USER STORY 3.',
      data: {
        filename: fileData.filename,
        size: fileSize,
        type: fileData.type
      }
    }
    
  } catch (error: any) {
    // If error was already thrown by us, re-throw it
    if (error.statusCode) {
      throw error
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
          message: 'Failed to process resume upload. Please try again.'
        }
      }
    })
  }
})
