/**
 * Resume Extraction API Types
 * 
 * Type definitions for the resume upload and AI extraction feature.
 * These types define the request/response contracts for the extraction API.
 */

/**
 * Resume Extraction Request
 * 
 * Multipart form data with a single file upload.
 * Content-Type: multipart/form-data
 */
export interface ResumeExtractionRequest {
  /**
   * Resume file to extract data from
   * Supported formats: PDF, DOCX, DOC, JPG, PNG
   * Max size: 10MB
   */
  file: File
}

/**
 * Resume Extraction Response
 * 
 * Successful extraction returns structured career data
 * that matches the existing profile schema format.
 */
export interface ResumeExtractionResponse {
  /**
   * Indicates successful extraction
   */
  success: true
  
  /**
   * Human-readable success message
   */
  message: string
  
  /**
   * Extracted and transformed career data
   */
  data: ExtractedProfileData
  
  /**
   * Metadata about the extraction process
   */
  metadata: ExtractionMetadata
}

/**
 * Extracted Profile Data
 * 
 * Structured career data extracted from resume,
 * transformed to match existing profile schema.
 */
export interface ExtractedProfileData {
  /**
   * Contact information
   */
  contactInfo: ExtractedContactInfo
  
  /**
   * Work experience entries (ordered newest to oldest)
   */
  experience: ExtractedExperience[]
  
  /**
   * Education entries (ordered newest to oldest)
   */
  education: ExtractedEducation[]
  
  /**
   * Skills and competencies
   */
  profileSkills: ExtractedSkill[]
  
  /**
   * Professional certifications
   */
  certifications: ExtractedCertification[]
}

/**
 * Extracted Contact Information
 */
export interface ExtractedContactInfo {
  firstName: string
  lastName: string
  email: string
  phone: string | null
  jobTitle: string | null
  city: string | null
  stateRegion: string | null
  country: string | null
  postalCode: string | null
  summary: string | null
  websites: string[]
  willingToRelocate: boolean
}

/**
 * Extracted Experience Entry
 */
export interface ExtractedExperience {
  employmentType: 'full_time' | 'part_time' | 'contract' | 'freelance' | 'internship'
  employer: string
  title: string
  location?: string
  locationType: 'on_site' | 'remote' | 'hybrid'
  url: string | null
  startDate: string
  endDate: string | null
  currentPosition: boolean
  summary: string | null
  highlights: string[]
  displayOrder: number
}

/**
 * Extracted Education Entry
 */
export interface ExtractedEducation {
  degreeType: string
  areaOfStudy: string
  institution: string
  startDate: string
  endDate: string
  completed: boolean
  url: string | null
  creditHours: number | null
  coursework: string[]
  minors: string[]
  displayOrder: number
}

/**
 * Extracted Skill
 */
export interface ExtractedSkill {
  name: string
  group: string | null
  proficiencyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  yearsExperience: number | null
  displayOrder: number
}

/**
 * Extracted Certification
 */
export interface ExtractedCertification {
  name: string
  issuer: string
  issueDate: string
  url: string | null
  displayOrder: number
}

/**
 * Extraction Metadata
 * 
 * Information about the extraction process
 */
export interface ExtractionMetadata {
  /**
   * Original filename
   */
  filename: string
  
  /**
   * File size in bytes
   */
  fileSize: number
  
  /**
   * Time taken to extract data (milliseconds)
   */
  extractionTimeMs: number
  
  /**
   * Counts of extracted items
   */
  extractedCounts: {
    experience: number
    education: number
    skills: number
    certifications: number
  }
}

/**
 * Extraction Error Response
 * 
 * Returned when extraction fails for any reason
 */
export interface ExtractionErrorResponse {
  /**
   * Indicates extraction failure
   */
  success: false
  
  /**
   * Error details
   */
  error: ExtractionError
}

/**
 * Extraction Error
 * 
 * Detailed error information for failed extractions
 */
export interface ExtractionError {
  /**
   * Error code for programmatic handling
   */
  code: ExtractionErrorCode
  
  /**
   * Human-readable error message
   */
  message: string
}

/**
 * Extraction Error Codes
 * 
 * Standard error codes returned by the extraction API
 */
export type ExtractionErrorCode =
  | 'VALIDATION_ERROR'           // File validation failed (invalid format, too large, etc.)
  | 'FILE_TOO_LARGE'             // File exceeds 10MB limit
  | 'INVALID_EXTENSION'          // File extension not supported
  | 'INVALID_MIME_TYPE'          // MIME type doesn't match extension
  | 'MISSING_FILE'               // No file provided in request
  | 'EXTRACTION_TIMEOUT'         // AI extraction timed out (>30 seconds)
  | 'EXTRACTION_SERVICE_ERROR'   // OpenAI API error
  | 'EXTRACTION_PARSE_ERROR'     // Failed to parse AI response
  | 'SERVICE_UNAVAILABLE'        // OpenAI API key missing or service down
  | 'INTERNAL_ERROR'             // Unexpected server error

/**
 * OpenAI Structured Output Schema
 * 
 * This is the Zod schema structure used for AI extraction.
 * It defines what fields the AI should extract from resumes.
 */
export interface OpenAIExtractionSchema {
  contactInfo: {
    firstName: string
    lastName: string
    email: string
    phone?: string
    jobTitle?: string
    city?: string
    stateRegion?: string
    country?: string
    postalCode?: string
    summary?: string
    websites?: string[]
    willingToRelocate?: boolean
  }
  
  experience: Array<{
    employer: string
    title: string
    location?: string
    locationType?: 'on_site' | 'remote' | 'hybrid'
    employmentType?: 'full_time' | 'part_time' | 'contract' | 'freelance' | 'internship'
    startDate: string
    endDate?: string
    currentPosition: boolean
    summary?: string
    highlights: string[]
    url?: string
  }>
  
  education: Array<{
    degreeType: string
    areaOfStudy: string
    institution: string
    startDate: string
    endDate: string
    completed: boolean
    coursework?: string[]
    minors?: string[]
    creditHours?: number
    url?: string
  }>
  
  skills: Array<{
    name: string
    group?: string
    proficiencyLevel?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
    yearsExperience?: number
  }>
  
  certifications: Array<{
    name: string
    issuer: string
    issueDate: string
    url?: string
  }>
}
