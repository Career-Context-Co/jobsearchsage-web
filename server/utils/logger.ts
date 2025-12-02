/**
 * Structured logging utilities for API routes
 * 
 * Provides consistent logging format across all endpoints for better
 * operational visibility and debugging.
 */

/**
 * Log context that can include any relevant metadata
 */
export interface LogContext {
  [key: string]: any
}

/**
 * Format log message with timestamp and context
 */
function formatLog(level: string, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString()
  const contextStr = context ? ` ${JSON.stringify(context)}` : ''
  return `[${timestamp}] [${level}] ${message}${contextStr}`
}

/**
 * Log the start of an API request
 * 
 * @param method - HTTP method (GET, POST, PATCH, DELETE)
 * @param path - API path (e.g., /api/career-id/profile/:profileId/experience)
 * @param context - Additional context (profileId, resourceId, etc.)
 */
export function logRequest(method: string, path: string, context?: LogContext): void {
  const message = `[${method} ${path}] Started`
  console.log(formatLog('INFO', message, context))
}

/**
 * Log successful completion of an API request
 * 
 * @param method - HTTP method
 * @param path - API path
 * @param durationMs - Request duration in milliseconds
 * @param context - Additional context (resourceId, count, etc.)
 */
export function logSuccess(
  method: string,
  path: string,
  durationMs: number,
  context?: LogContext
): void {
  const message = `[${method} ${path}] Success (${durationMs}ms)`
  console.log(formatLog('INFO', message, context))
}

/**
 * Log an error during API request processing
 * 
 * @param method - HTTP method
 * @param path - API path
 * @param error - Error object or message
 * @param context - Additional context
 */
export function logError(
  method: string,
  path: string,
  error: any,
  context?: LogContext
): void {
  const errorCode = error?.code || error?.statusCode || 'UNKNOWN'
  const errorMsg = error?.message || String(error)
  
  const message = `[${method} ${path}] Error`
  const fullContext = {
    ...context,
    errorCode,
    errorMessage: errorMsg,
  }
  
  console.error(formatLog('ERROR', message, fullContext))
}

/**
 * Log a database operation
 * 
 * @param operation - Operation type (SELECT, INSERT, UPDATE, DELETE)
 * @param table - Table name
 * @param context - Additional context
 */
export function logDatabaseOperation(
  operation: string,
  table: string,
  context?: LogContext
): void {
  const message = `[DB] ${operation} on ${table}`
  console.log(formatLog('DEBUG', message, context))
}

/**
 * Log a validation failure
 * 
 * @param path - API path where validation failed
 * @param fields - Fields that failed validation
 */
export function logValidationFailure(path: string, fields: string[]): void {
  const message = `[${path}] Validation failed`
  console.warn(formatLog('WARN', message, { fields }))
}

/**
 * Create a timer for measuring operation duration
 * Returns a function that returns elapsed time in ms when called
 */
export function createTimer(): () => number {
  const startTime = Date.now()
  return () => Date.now() - startTime
}

/**
 * Utility to extract relevant IDs from route params for logging
 */
export function extractLogContext(event: any): LogContext {
  const context: LogContext = {}
  
  // Extract common route parameters
  const profileId = getRouterParam(event, 'profileId')
  const id = getRouterParam(event, 'id')
  
  if (profileId) context.profileId = profileId
  if (id) context.resourceId = id
  
  return context
}
