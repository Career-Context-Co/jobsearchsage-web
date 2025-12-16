/**
 * POST /api/career-id/resume/extract
 * 
 * Uploads, validates, and extracts structured career data from resume files
 * using OpenAI GPT-4 Vision AI extraction.
 * 
 * Supports: PDF, DOCX, DOC, JPG, PNG (max 10MB)
 */

import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { ErrorCodes } from '@@/server/utils/error-handler'
import { validateResumeFile, formatFileSize } from '@@/server/utils/file-validator'
import { extractResumeData, transformExtractionToProfile, ExtractionError } from '@@/server/utils/resume-extractor'

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
    
    // File is valid - now perform AI extraction
    logRequest('POST', ROUTE_PATH, { status: 'starting_extraction' })
    
    let extractionResult
    let transformedData
    
    try {
      // Extract structured data using OpenAI GPT-4 Vision
      extractionResult = await extractResumeData(fileData.data!, fileData.filename || 'resume')
      
      // Transform AI extraction to profile schema format
      transformedData = transformExtractionToProfile(extractionResult)
      
      // Clear file data from memory after processing
      ;(fileData as any).data = null
      
      const duration = getElapsed()
      
      // Log success with extraction metrics
      logSuccess('POST', ROUTE_PATH, duration, {
        filename: fileData.filename,
        size: formatFileSize(fileSize),
        status: 'extraction_completed',
        extractedSections: {
          experience: transformedData.experience.length,
          education: transformedData.education.length,
          skills: transformedData.profileSkills.length,
          certifications: transformedData.certifications.length,
          hasContactInfo: !!transformedData.contactInfo
        },
        extractionTimeMs: duration
      })
      
      return {
        success: true,
        message: 'Resume data extracted successfully',
        data: transformedData,
        metadata: {
          filename: fileData.filename,
          fileSize: fileSize,
          extractionTimeMs: duration,
          extractedCounts: {
            experience: transformedData.experience.length,
            education: transformedData.education.length,
            skills: transformedData.profileSkills?.length || 0,
            certifications: transformedData.certifications.length
          }
        }
      }
      
    } catch (extractionError: any) {
      // Clear file data from memory even on error
      ;(fileData as any).data = null
      
      const duration = getElapsed()
      
      // Handle extraction-specific errors
      if (extractionError instanceof ExtractionError) {
        let statusCode = 500
        let errorCode = ErrorCodes.INTERNAL_ERROR
        
        // Map extraction error codes to HTTP status codes and use string literals
        if (extractionError.code === 'TIMEOUT') {
          statusCode = 503 // Service Unavailable
          errorCode = 'EXTRACTION_TIMEOUT' as any
        } else if (extractionError.code === 'API_KEY_MISSING') {
          statusCode = 503
          errorCode = 'SERVICE_UNAVAILABLE' as any
        } else if (extractionError.code === 'OPENAI_ERROR') {
          statusCode = 503
          errorCode = 'EXTRACTION_SERVICE_ERROR' as any
        } else if (extractionError.code === 'INVALID_RESPONSE') {
          statusCode = 500
          errorCode = 'EXTRACTION_PARSE_ERROR' as any
        }
        
        logError('POST', ROUTE_PATH, extractionError.message, {
          code: extractionError.code,
          filename: fileData.filename,
          size: formatFileSize(fileSize),
          duration,
          details: extractionError.details
        })
        
        throw createError({
          statusCode,
          statusMessage: statusCode === 503 ? 'Service Unavailable' : 'Internal Server Error',
          data: {
            success: false,
            error: {
              code: errorCode,
              message: extractionError.message
            }
          }
        })
      }
      
      // Re-throw unexpected errors to be handled by outer catch block
      throw extractionError
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
