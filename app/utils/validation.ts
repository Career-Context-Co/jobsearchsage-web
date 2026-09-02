/**
 * Client-side validation utilities for form fields
 * 
 * Provides reusable validation functions that return error messages
 * suitable for inline display in forms.
 */

import {
  monthYearSortKey,
  parseMonthYear
} from '#shared/utils/monthYearDate'

/**
 * Email validation regex (RFC 5322 simplified)
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Phone validation regex (E.164 format)
 * Requires + followed by 1-3 digit country code, then 4-14 digits for number
 * Examples: +1234567890, +441234567890, +351123456789
 */
const PHONE_REGEX = /^\+[1-9]\d{0,2}\d{4,14}$/

/**
 * URL validation regex (http or https)
 */
const URL_REGEX = /^https?:\/\/.+\..+/

/**
 * Validate email format
 * 
 * @param email - Email address to validate
 * @param required - Whether the field is required
 * @returns Error message string or null if valid
 */
export function validateEmail(email: string | undefined, required = false): string | null {
  if (!email || email.trim() === '') {
    return required ? 'Email is required' : null
  }
  
  return EMAIL_REGEX.test(email.trim()) ? null : 'Invalid email format'
}

/**
 * Validate phone number format (E.164)
 * Expects format: +[country code 1-3 digits][number 4-14 digits]
 * Example: +12025551234 (US), +442071234567 (UK)
 * 
 * @param phone - Phone number to validate (should be combined country code + number)
 * @param required - Whether the field is required
 * @returns Error message string or null if valid
 */
export function validatePhone(phone: string | undefined, required = false): string | null {
  if (!phone || phone.trim() === '') {
    return required ? 'Phone is required' : null
  }
  
  // Remove any whitespace or formatting
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '')
  
  // Check if phone starts with + (required for E.164)
  if (!cleaned.startsWith('+')) {
    return 'Phone must include country code starting with +'
  }
  
  // Check overall format
  if (!PHONE_REGEX.test(cleaned)) {
    return 'Phone must be in format: +[country code][number] (e.g., +12025551234)'
  }
  
  return null
}

/**
 * Validate URL format
 * 
 * @param url - URL to validate
 * @param required - Whether the field is required
 * @returns Error message string or null if valid
 */
export function validateUrl(url: string | undefined, required = false): string | null {
  if (!url || url.trim() === '') {
    return required ? 'URL is required' : null
  }
  
  try {
    // Use URL constructor for more robust validation
    const urlObj = new URL(url.trim())
    return (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') 
      ? null 
      : 'Invalid URL format'
  } catch {
    // Fallback to regex if URL constructor fails
    return URL_REGEX.test(url.trim()) ? null : 'Invalid URL format'
  }
}

/**
 * Validate array of URLs
 * 
 * @param urls - Array of URLs to validate
 * @returns Object with index keys and error messages, or null if all valid
 */
export function validateUrls(urls: string[] | undefined): Record<number, string> | null {
  if (!urls || urls.length === 0) {
    return null
  }
  
  const errors: Record<number, string> = {}
  let hasErrors = false
  
  urls.forEach((url, index) => {
    if (url && url.trim()) {
      const error = validateUrl(url, false)
      if (error) {
        errors[index] = error
        hasErrors = true
      }
    }
  })
  
  return hasErrors ? errors : null
}

/**
 * Validate required field
 * 
 * @param value - Value to check
 * @param fieldName - Name of the field for error message
 * @returns Error message string or null if valid
 */
export function validateRequired(value: any, fieldName: string): string | null {
  if (value === null || value === undefined) {
    return `${fieldName} is required`
  }
  
  if (typeof value === 'string' && value.trim() === '') {
    return `${fieldName} is required`
  }
  
  return null
}

/**
 * Validate date range (end date must be after start date)
 * Handles MM/YYYY format
 * 
 * @param startDate - Start date string (MM/YYYY or YYYY-MM-DD)
 * @param endDate - End date string (MM/YYYY or YYYY-MM-DD)
 * @param endFieldName - Name of end date field for error message
 * @returns Error message string or null if valid
 */
export function validateDateRange(
  startDate: string | undefined,
  endDate: string | undefined,
  endFieldName: string = 'End date'
): string | null {
  if (!startDate || !endDate) {
    return null // Only validate range if both dates provided
  }
  
  if (!parseMonthYear(startDate) || !parseMonthYear(endDate)) {
    return null // Invalid dates will be caught by other validators
  }
  
  return monthYearSortKey(endDate) >= monthYearSortKey(startDate)
    ? null
    : `${endFieldName} must be after start date`
}

/**
 * Validate string length
 * 
 * @param value - String to validate
 * @param fieldName - Name of the field for error message
 * @param min - Minimum length (optional)
 * @param max - Maximum length (optional)
 * @returns Error message string or null if valid
 */
export function validateLength(
  value: string | undefined,
  fieldName: string,
  min?: number,
  max?: number
): string | null {
  if (!value) return null
  
  const length = value.length
  
  if (min !== undefined && length < min) {
    return `${fieldName} must be at least ${min} characters`
  }
  
  if (max !== undefined && length > max) {
    return `${fieldName} must be at most ${max} characters`
  }
  
  return null
}

/**
 * Validate MM/YYYY date format
 * 
 * @param dateString - Date string to validate
 * @param required - Whether the field is required
 * @returns Error message string or null if valid
 */
export function validateMonthYear(dateString: string | undefined, required = false): string | null {
  if (!dateString || dateString.trim() === '') {
    return required ? 'Date is required' : null
  }
  
  const match = dateString.trim().match(/^(\d{2})\/(\d{4})$/)
  if (!match) {
    return 'Date must be in MM/YYYY format'
  }
  
  const [, month, year] = match
  const monthNum = parseInt(month, 10)
  const yearNum = parseInt(year, 10)
  
  if (monthNum < 1 || monthNum > 12) {
    return 'Month must be between 01 and 12'
  }
  
  if (yearNum < 1900 || yearNum > 2100) {
    return 'Year must be between 1900 and 2100'
  }
  
  return null
}
