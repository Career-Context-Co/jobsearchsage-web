/**
 * File validation utilities for resume upload
 * 
 * Provides validation for file type, size, and MIME type
 * to ensure only valid resume files are processed.
 */

/**
 * Supported resume file extensions
 */
export const SUPPORTED_EXTENSIONS = ['.pdf', '.txt', '.md'] as const

/**
 * Supported MIME types mapped to their extensions
 */
export const MIME_TYPE_MAP: Record<string, string[]> = {
  'application/pdf': ['.pdf'],
  'text/plain': ['.txt'],
  'text/markdown': ['.md'],
}

/**
 * Maximum file size in bytes (10MB)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024

/**
 * Validation result
 */
export interface FileValidationResult {
  valid: boolean
  error?: {
    code: 'INVALID_EXTENSION' | 'FILE_TOO_LARGE' | 'INVALID_MIME_TYPE' | 'MISSING_FILE'
    message: string
  }
}

/**
 * Validate resume file
 * 
 * Checks:
 * - File is present
 * - File extension is supported
 * - File size is within limit
 * - MIME type matches extension
 * 
 * @param file - File object from multipart form data
 * @returns Validation result with error details if invalid
 */
export function validateResumeFile(file: {
  filename?: string
  type?: string
  data?: Buffer | Uint8Array
}): FileValidationResult {
  // Check if file exists
  if (!file || !file.filename || !file.data) {
    return {
      valid: false,
      error: {
        code: 'MISSING_FILE',
        message: 'No file provided'
      }
    }
  }

  // Check file extension
  const filename = file.filename.toLowerCase()
  const hasValidExtension = SUPPORTED_EXTENSIONS.some(ext => filename.endsWith(ext))
  
  if (!hasValidExtension) {
    return {
      valid: false,
      error: {
        code: 'INVALID_EXTENSION',
        message: `File format not supported. Please upload PDF, TXT, or MD files. Got: ${filename}`
      }
    }
  }

  // Check file size
  const fileSize = file.data.length || file.data.byteLength
  if (fileSize > MAX_FILE_SIZE) {
    const sizeMB = (fileSize / 1024 / 1024).toFixed(2)
    return {
      valid: false,
      error: {
        code: 'FILE_TOO_LARGE',
        message: `File is too large (${sizeMB}MB). Maximum size is 10MB.`
      }
    }
  }

  // Check MIME type matches extension
  if (file.type) {
    const validExtensions = MIME_TYPE_MAP[file.type]
    if (!validExtensions) {
      return {
        valid: false,
        error: {
          code: 'INVALID_MIME_TYPE',
          message: `Invalid file type. MIME type "${file.type}" is not supported.`
        }
      }
    }

    const hasMatchingExtension = validExtensions.some(ext => filename.endsWith(ext))
    if (!hasMatchingExtension) {
      return {
        valid: false,
        error: {
          code: 'INVALID_MIME_TYPE',
          message: `File extension does not match MIME type. Expected ${validExtensions.join(', ')} for MIME type "${file.type}".`
        }
      }
    }
  }

  return { valid: true }
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const match = filename.toLowerCase().match(/\.([a-z0-9]+)$/)
  return match ? `.${match[1]}` : ''
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} bytes`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}
