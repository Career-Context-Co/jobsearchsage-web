/**
 * Error handling utilities for API routes
 * 
 * Provides standardized error responses and database error mapping
 * to ensure consistent error handling across all endpoints.
 */

import type { H3Error } from 'h3'

/**
 * Standard error codes matching API specification
 */
export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_FORMAT: 'INVALID_FORMAT',
  REQUIRED: 'REQUIRED',
  TOO_LONG: 'TOO_LONG',
  TOO_SHORT: 'TOO_SHORT',
  INVALID_RANGE: 'INVALID_RANGE',
  INVALID_VALUE: 'INVALID_VALUE',
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  DUPLICATE_SKILLS: 'DUPLICATE_SKILLS',
  SKILLS_ALREADY_EXIST: 'SKILLS_ALREADY_EXIST',
  INVALID_REFERENCE: 'INVALID_REFERENCE',
  INVALID_INPUT: 'INVALID_INPUT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
} as const

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes]

/**
 * Database error codes (PostgreSQL)
 */
export const DatabaseErrorCodes = {
  UNIQUE_VIOLATION: '23505',
  FOREIGN_KEY_VIOLATION: '23503',
  INVALID_TEXT_REPRESENTATION: '22P02',
  NOT_NULL_VIOLATION: '23502',
} as const

/**
 * Validation error detail
 */
export interface ValidationDetail {
  field: string
  message: string
  code: ErrorCode
}

/**
 * Standard error response structure
 */
export interface ErrorResponse {
  success: false
  error: {
    code: ErrorCode
    message: string
    details?: ValidationDetail[]
    [key: string]: any
  }
}

/**
 * Check if error is a database error (from Supabase)
 */
export function isDatabaseError(error: any): boolean {
  return error && (
    error.code || 
    error.hint || 
    error.details ||
    (error.message && typeof error.message === 'string')
  )
}

/**
 * Map database error to appropriate HTTP error
 */
export function handleDatabaseError(
  error: any,
  context: { operation?: string; resource?: string; [key: string]: any } = {}
): H3Error {
  const { operation = 'operation', resource = 'resource' } = context
  
  // PostgreSQL error codes
  if (error.code === DatabaseErrorCodes.UNIQUE_VIOLATION) {
    return createError({
      statusCode: 409,
      statusMessage: 'Conflict',
      data: {
        success: false,
        error: {
          code: ErrorCodes.DUPLICATE_ENTRY,
          message: `A ${resource} with these details already exists`,
          details: error.details || error.hint,
        }
      }
    })
  }
  
  if (error.code === DatabaseErrorCodes.FOREIGN_KEY_VIOLATION) {
    return createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      data: {
        success: false,
        error: {
          code: ErrorCodes.INVALID_REFERENCE,
          message: `Invalid reference: The specified ${resource} does not exist`,
          details: error.details || error.hint,
        }
      }
    })
  }
  
  if (error.code === DatabaseErrorCodes.INVALID_TEXT_REPRESENTATION) {
    return createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      data: {
        success: false,
        error: {
          code: ErrorCodes.INVALID_INPUT,
          message: 'Invalid input format (e.g., invalid UUID)',
          details: error.message,
        }
      }
    })
  }
  
  if (error.code === DatabaseErrorCodes.NOT_NULL_VIOLATION) {
    // PostgreSQL message: 'null value in column "start_date" of relation "education" ...'
    const columnMatch = error.message?.match(/column "([^"]+)"/)
    const columnName = columnMatch?.[1]?.replace(/_/g, ' ')
    return createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      data: {
        success: false,
        error: {
          code: ErrorCodes.REQUIRED,
          message: columnName
            ? `${columnName.charAt(0).toUpperCase() + columnName.slice(1)} is required`
            : 'A required field is missing',
          details: error.message,
        }
      }
    })
  }
  
  // PostgREST errors (Supabase)
  if (error.code === 'PGRST116' || error.message?.includes('No rows found')) {
    return createError({
      statusCode: 404,
      statusMessage: 'Not Found',
      data: {
        success: false,
        error: {
          code: ErrorCodes.NOT_FOUND,
          message: `${resource} not found`,
        }
      }
    })
  }
  
  // Generic database error
  console.error(`[Database Error] ${operation} failed:`, error)
  return createError({
    statusCode: 500,
    statusMessage: 'Internal Server Error',
    data: {
      success: false,
      error: {
        code: ErrorCodes.INTERNAL_ERROR,
        message: `Failed to ${operation} ${resource}`,
      }
    }
  })
}

/**
 * Create a validation error response
 */
export function createValidationError(
  details: ValidationDetail | ValidationDetail[]
): H3Error {
  const detailsArray = Array.isArray(details) ? details : [details]
  
  return createError({
    statusCode: 400,
    statusMessage: 'Bad Request',
    data: {
      success: false,
      error: {
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Validation failed',
        details: detailsArray
      }
    }
  })
}

/**
 * Create a not found error response
 */
export function createNotFoundError(resource: string): H3Error {
  return createError({
    statusCode: 404,
    statusMessage: 'Not Found',
    data: {
      success: false,
      error: {
        code: ErrorCodes.NOT_FOUND,
        message: `${resource} not found`
      }
    }
  })
}

/**
 * Create a conflict error response
 */
export function createConflictError(message: string, details?: any): H3Error {
  return createError({
    statusCode: 409,
    statusMessage: 'Conflict',
    data: {
      success: false,
      error: {
        code: ErrorCodes.ALREADY_EXISTS,
        message,
        ...(details && { details })
      }
    }
  })
}

/**
 * Create an internal error response
 */
export function createInternalError(message: string): H3Error {
  return createError({
    statusCode: 500,
    statusMessage: 'Internal Server Error',
    data: {
      success: false,
      error: {
        code: ErrorCodes.INTERNAL_ERROR,
        message
      }
    }
  })
}
