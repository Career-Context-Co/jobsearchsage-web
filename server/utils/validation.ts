/**
 * Validation utilities for API routes
 * 
 * Provides reusable validation functions for common data types
 * to ensure consistent validation across all endpoints.
 */

import { ErrorCodes, type ValidationDetail } from './error-handler'

/**
 * Email validation regex (RFC 5322 simplified)
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Phone validation regex (E.164 format: +[country][number])
 * Supports 1-15 digits after the + sign
 * Total format: +[1-3 digit country code][4-14 digit number]
 */
const PHONE_REGEX = /^\+[1-9]\d{1,14}$/

/**
 * URL validation regex (http or https)
 */
const URL_REGEX = /^https?:\/\/.+\..+/

/**
 * Validate email format
 * 
 * @param email - Email address to validate
 * @returns true if valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email)
}

/**
 * Validate phone number format (E.164)
 * Cleans formatting before validation (removes spaces, dashes, parentheses)
 * 
 * @param phone - Phone number to validate
 * @returns true if valid, false otherwise
 */
export function isValidPhone(phone: string): boolean {
  // Remove any formatting (spaces, dashes, parentheses, dots)
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '')
  return PHONE_REGEX.test(cleaned)
}

/**
 * Validate URL format
 * 
 * @param url - URL to validate
 * @returns true if valid, false otherwise
 */
export function isValidUrl(url: string): boolean {
  try {
    // Use URL constructor for more robust validation
    const urlObj = new URL(url)
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
  } catch {
    // Fallback to regex if URL constructor fails
    return URL_REGEX.test(url)
  }
}

/**
 * Convert MM/YYYY format to YYYY-MM-DD format (first day of month)
 * 
 * @param dateString - Date in MM/YYYY format (e.g., "05/2025")
 * @returns Date in YYYY-MM-DD format (e.g., "2025-05-01"), or null if invalid
 */
export function convertMonthYearToDate(dateString: string | undefined | null): string | null {
  if (!dateString) return null
  
  // Check if it's already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString
  }
  
  // Parse MM/YYYY format
  const match = dateString.match(/^(\d{2})\/(\d{4})$/)
  if (!match) return null
  
  const [, month, year] = match
  const monthNum = parseInt(month, 10)
  const yearNum = parseInt(year, 10)
  
  // Validate month (1-12)
  if (monthNum < 1 || monthNum > 12) return null
  
  // Validate year (reasonable range)
  if (yearNum < 1900 || yearNum > 2100) return null
  
  // Return YYYY-MM-01 format (first day of the month)
  return `${year}-${month}-01`
}

/**
 * Validate that end date is after start date
 * Handles both MM/YYYY and YYYY-MM-DD formats
 * 
 * @param startDate - Start date (MM/YYYY or YYYY-MM-DD string)
 * @param endDate - End date (MM/YYYY or YYYY-MM-DD string)
 * @returns true if valid range, false otherwise
 */
export function isValidDateRange(startDate: string | Date, endDate: string | Date): boolean {
  // Convert dates if they're in MM/YYYY format
  let startStr = typeof startDate === 'string' ? startDate : startDate.toISOString()
  let endStr = typeof endDate === 'string' ? endDate : endDate.toISOString()
  
  // Convert MM/YYYY to YYYY-MM-DD for comparison
  const convertedStart = convertMonthYearToDate(startStr)
  const convertedEnd = convertMonthYearToDate(endStr)
  
  const start = new Date(convertedStart || startStr)
  const end = new Date(convertedEnd || endStr)
  
  // Check for invalid dates
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return false
  }
  
  return end >= start
}

/**
 * Validate required field
 * 
 * @param value - Value to check
 * @returns true if value exists and is not empty
 */
export function isRequired(value: any): boolean {
  if (value === null || value === undefined) {
    return false
  }
  
  if (typeof value === 'string' && value.trim() === '') {
    return false
  }
  
  return true
}

/**
 * Create a validation error detail for a required field
 */
export function requiredFieldError(fieldName: string): ValidationDetail {
  return {
    field: fieldName,
    message: `${fieldName} is required`,
    code: ErrorCodes.REQUIRED
  }
}

/**
 * Create a validation error detail for invalid email
 */
export function invalidEmailError(fieldName: string = 'email'): ValidationDetail {
  return {
    field: fieldName,
    message: 'Invalid email format',
    code: ErrorCodes.INVALID_FORMAT
  }
}

/**
 * Create a validation error detail for invalid phone
 */
export function invalidPhoneError(fieldName: string = 'phone'): ValidationDetail {
  return {
    field: fieldName,
    message: 'Invalid phone format. Use E.164 format (e.g., +14155552671)',
    code: ErrorCodes.INVALID_FORMAT
  }
}

/**
 * Create a validation error detail for invalid URL
 */
export function invalidUrlError(fieldName: string): ValidationDetail {
  return {
    field: fieldName,
    message: 'Invalid URL format',
    code: ErrorCodes.INVALID_FORMAT
  }
}

/**
 * Create a validation error detail for invalid date range
 */
export function invalidDateRangeError(
  startField: string = 'startDate',
  endField: string = 'endDate'
): ValidationDetail {
  return {
    field: endField,
    message: `${endField} must be after ${startField}`,
    code: ErrorCodes.INVALID_RANGE
  }
}

/**
 * Validate email field and return error if invalid
 */
export function validateEmail(
  email: string | undefined,
  fieldName: string = 'email',
  required: boolean = false
): ValidationDetail | null {
  if (!email) {
    return required ? requiredFieldError(fieldName) : null
  }
  
  return isValidEmail(email) ? null : invalidEmailError(fieldName)
}

/**
 * Validate phone field and return error if invalid
 */
export function validatePhone(
  phone: string | undefined,
  fieldName: string = 'phone',
  required: boolean = false
): ValidationDetail | null {
  if (!phone) {
    return required ? requiredFieldError(fieldName) : null
  }
  
  return isValidPhone(phone) ? null : invalidPhoneError(fieldName)
}

/**
 * Validate URL field and return error if invalid
 */
export function validateUrl(
  url: string | undefined,
  fieldName: string,
  required: boolean = false
): ValidationDetail | null {
  if (!url) {
    return required ? requiredFieldError(fieldName) : null
  }
  
  return isValidUrl(url) ? null : invalidUrlError(fieldName)
}

/**
 * Validate array of URLs and return errors if any invalid
 */
export function validateUrls(
  urls: string[] | undefined,
  fieldPrefix: string,
  required: boolean = false
): ValidationDetail[] {
  const errors: ValidationDetail[] = []
  
  if (!urls || urls.length === 0) {
    if (required) {
      errors.push(requiredFieldError(fieldPrefix))
    }
    return errors
  }
  
  urls.forEach((url, index) => {
    if (!isValidUrl(url)) {
      errors.push({
        field: `${fieldPrefix}[${index}]`,
        message: 'Invalid URL format',
        code: ErrorCodes.INVALID_FORMAT
      })
    }
  })
  
  return errors
}

/**
 * Validate date range and return error if invalid
 */
export function validateDateRange(
  startDate: string | undefined,
  endDate: string | undefined,
  startField: string = 'startDate',
  endField: string = 'endDate'
): ValidationDetail | null {
  if (!startDate || !endDate) {
    return null // Only validate range if both dates provided
  }
  
  return isValidDateRange(startDate, endDate) 
    ? null 
    : invalidDateRangeError(startField, endField)
}

/**
 * Validate string length
 */
export function validateLength(
  value: string | undefined,
  fieldName: string,
  min?: number,
  max?: number
): ValidationDetail | null {
  if (!value) return null
  
  const length = value.length
  
  if (min !== undefined && length < min) {
    return {
      field: fieldName,
      message: `${fieldName} must be at least ${min} characters`,
      code: ErrorCodes.TOO_SHORT
    }
  }
  
  if (max !== undefined && length > max) {
    return {
      field: fieldName,
      message: `${fieldName} must be at most ${max} characters`,
      code: ErrorCodes.TOO_LONG
    }
  }
  
  return null
}

/**
 * Validate enum value
 */
export function validateEnum<T extends string>(
  value: string | undefined,
  fieldName: string,
  validValues: readonly T[],
  required: boolean = false
): ValidationDetail | null {
  if (!value) {
    return required ? requiredFieldError(fieldName) : null
  }
  
  if (!validValues.includes(value as T)) {
    return {
      field: fieldName,
      message: `${fieldName} must be one of: ${validValues.join(', ')}`,
      code: ErrorCodes.INVALID_VALUE
    }
  }
  
  return null
}
