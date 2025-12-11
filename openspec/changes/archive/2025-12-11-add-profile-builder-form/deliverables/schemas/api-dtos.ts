/**
 * API Data Transfer Objects (DTOs)
 * 
 * These types define the shape of data sent between client and server.
 * DTOs are aligned with frontend types in app/types/index.d.ts
 * 
 * DTOs differ from domain models:
 * - Request DTOs omit server-managed fields (id, timestamps, profile_id)
 * - Response DTOs may include computed or aggregated data
 * - DTOs are optimized for API transport, not database storage
 */

import type { 
  Profile, 
  WorkExperience, 
  Education, 
  Certification, 
  SkillCategory,
  ContactInfo,
  CompleteProfile 
} from './domain-models';

// ============================================================================
// Profile DTOs
// ============================================================================

/**
 * ProfileDTO - Complete profile data for GET responses
 * 
 * Returned by GET /api/profile
 * Includes all sections with populated relationships
 */
export interface ProfileDTO {
  /** Main profile metadata */
  profile: Profile;
  
  /** Work experience entries, ordered by display_order */
  work_experiences: WorkExperience[];
  
  /** Education entries, ordered by display_order */
  education: Education[];
  
  /** Certifications, ordered by display_order */
  certifications: Certification[];
  
  /** Skill categories with skills, ordered by display_order */
  skill_categories: SkillCategory[];
  
  /** Contact information */
  contact_info: ContactInfo | null;
}

/**
 * CreateProfileRequest - Request body for POST /api/profile
 * 
 * Creates a new profile with initial data.
 * All sections are optional - users can fill them in progressively.
 */
export interface CreateProfileRequest {
  /** Optional initial work experience entries */
  work_experiences?: CreateWorkExperienceDTO[];
  
  /** Optional initial education entries */
  education?: CreateEducationDTO[];
  
  /** Optional initial certifications */
  certifications?: CreateCertificationDTO[];
  
  /** Optional initial skill categories */
  skill_categories?: CreateSkillCategoryDTO[];
  
  /** Optional contact information */
  contact_info?: CreateContactInfoDTO;
}

/**
 * UpdateProfileRequest - Request body for PUT /api/profile
 * 
 * Updates an existing profile. Only provided fields are updated.
 * For section entries (work experience, education, etc.), use dedicated endpoints.
 */
export interface UpdateProfileRequest {
  /** Update completion status */
  completion_status?: 'incomplete' | 'complete' | 'verified';
}

/**
 * ProfileResponse - Response for profile creation/update operations
 * 
 * Returned by POST /api/profile and PUT /api/profile
 * Includes the complete updated profile data
 */
export interface ProfileResponse {
  /** Success indicator */
  success: boolean;
  
  /** Complete profile data */
  data: ProfileDTO;
  
  /** Optional message (e.g., "Profile created successfully") */
  message?: string;
}

// ============================================================================
// Work Experience DTOs
// ============================================================================

/**
 * CreateWorkExperienceDTO - Request body for adding work experience
 * 
 * Used in POST /api/profile/work-experience
 * Omits server-managed fields (id, timestamps, profile_id)
 */
export interface CreateWorkExperienceDTO {
  /** Company or organization name */
  company: string;
  
  /** Job title or role */
  title: string;
  
  /** Job location (e.g., "San Francisco, CA" or "Remote") */
  location?: string | null;
  
  /** Company website URL */
  url?: string | null;
  
  /** Start date (ISO 8601: YYYY-MM-DD) */
  startDate: string;
  
  /** End date (ISO 8601: YYYY-MM-DD) or null for current position */
  endDate?: string | null;
  
  /** Whether this is a current position */
  currentPosition: boolean;
  
  /** Brief summary or overview of the role */
  summary?: string | null;
  
  /** Array of accomplishment/highlight descriptions */
  highlights: string[];
  
  /** Optional display order (defaults to 0 if not provided) */
  display_order?: number;
}

/**
 * UpdateWorkExperienceDTO - Request body for updating work experience
 * 
 * Used in PUT /api/profile/work-experience/:id
 * All fields optional - only provided fields are updated
 */
export interface UpdateWorkExperienceDTO {
  company?: string;
  title?: string;
  location?: string | null;
  url?: string | null;
  startDate?: string;
  endDate?: string | null;
  currentPosition?: boolean;
  summary?: string | null;
  highlights?: string[];
  display_order?: number;
}

/**
 * WorkExperienceResponse - Response for work experience operations
 */
export interface WorkExperienceResponse {
  success: boolean;
  data: WorkExperience;
  message?: string;
}

// ============================================================================
// Education DTOs
// ============================================================================

/**
 * CreateEducationDTO - Request body for adding education
 * 
 * Used in POST /api/profile/education
 */
export interface CreateEducationDTO {
  /** Degree type (e.g., "Bachelor of Science") */
  degreeType: string;
  
  /** Area of study/major */
  areaOfStudy: string;
  
  /** Institution name */
  institution: string;
  
  /** Start date (ISO 8601: YYYY-MM-DD) */
  startDate: string;
  
  /** End date (ISO 8601: YYYY-MM-DD) */
  endDate: string;
  
  /** Whether the degree was completed */
  completed: boolean;
  
  /** Institution website URL */
  url?: string | null;
  
  /** Total credit hours */
  creditHours?: number | null;
  
  /** Array of relevant coursework */
  coursework?: string[];
  
  /** Array of minor fields of study */
  minors?: string[];
  
  /** Optional display order */
  display_order?: number;
}

/**
 * UpdateEducationDTO - Request body for updating education
 * 
 * Used in PUT /api/profile/education/:id
 */
export interface UpdateEducationDTO {
  degreeType?: string;
  areaOfStudy?: string;
  institution?: string;
  startDate?: string;
  endDate?: string;
  completed?: boolean;
  url?: string | null;
  creditHours?: number | null;
  coursework?: string[];
  minors?: string[];
  display_order?: number;
}

/**
 * EducationResponse - Response for education operations
 */
export interface EducationResponse {
  success: boolean;
  data: Education;
  message?: string;
}

// ============================================================================
// Certification DTOs
// ============================================================================

/**
 * CreateCertificationDTO - Request body for adding certification
 * 
 * Used in POST /api/profile/certifications
 */
export interface CreateCertificationDTO {
  /** Certification name */
  name: string;
  
  /** Issuing organization */
  issuer: string;
  
  /** Date obtained (ISO 8601: YYYY-MM-DD) */
  issue_date: string;
  
  /** Certification verification URL */
  url?: string | null;
  
  /** Optional display order */
  display_order?: number;
}

/**
 * UpdateCertificationDTO - Request body for updating certification
 * 
 * Used in PUT /api/profile/certifications/:id
 */
export interface UpdateCertificationDTO {
  name?: string;
  issuer?: string;
  date?: string;
  url?: string | null;
  display_order?: number;
}

/**
 * CertificationResponse - Response for certification operations
 */
export interface CertificationResponse {
  success: boolean;
  data: Certification;
  message?: string;
}

// ============================================================================
// Skill Category DTOs
// ============================================================================

/**
 * CreateSkillCategoryDTO - Request body for adding a skill category
 * 
 * Used in POST /api/profile/skill-categories
 */
export interface CreateSkillCategoryDTO {
  /** Category name (e.g., "Programming Languages") */
  name: string;
  
  /** Optional description of the category */
  description?: string | null;
  
  /** Array of skill names */
  skills: string[];
  
  /** Optional display order */
  display_order?: number;
}

/**
 * UpdateSkillCategoryDTO - Request body for updating skill category
 * 
 * Used in PUT /api/profile/skill-categories/:id
 */
export interface UpdateSkillCategoryDTO {
  name?: string;
  description?: string | null;
  skills?: string[];
  display_order?: number;
}

/**
 * SkillCategoryResponse - Response for skill category operations
 */
export interface SkillCategoryResponse {
  success: boolean;
  data: SkillCategory;
  message?: string;
}

// ============================================================================
// Contact Info DTOs
// ============================================================================

/**
 * CreateContactInfoDTO - Request body for creating/updating contact info
 * 
 * Used in POST /api/profile/contact-info and PUT /api/profile/contact-info
 * One-to-one relationship with profile (one contact info per profile)
 */
export interface CreateContactInfoDTO {
  /** First name */
  firstName: string;
  
  /** Last name */
  lastName: string;
  
  /** Current or desired job title */
  jobTitle: string;
  
  /** Email address */
  email: string;
  
  /** Phone number */
  phone: string;
  
  /** LinkedIn profile URL */
  linkedin: string;
  
  /** Array of personal/professional website URLs */
  websites?: string[];
  
  /** Professional summary or bio */
  summary: string;
  
  /** City */
  city: string;
  
  /** State or region */
  stateRegion: string;
  
  /** Country */
  country: string;
  
  /** Postal/ZIP code */
  postalCode: string;
  
  /** Whether willing to relocate */
  willingToRelocate: boolean;
}

/**
 * UpdateContactInfoDTO - Same as Create (PUT replaces all fields)
 */
export type UpdateContactInfoDTO = Partial<CreateContactInfoDTO>;

/**
 * ContactInfoResponse - Response for contact info operations
 */
export interface ContactInfoResponse {
  success: boolean;
  data: ContactInfo;
  message?: string;
}

// ============================================================================
// Delete DTOs
// ============================================================================

/**
 * DeleteResponse - Generic response for delete operations
 * 
 * Used by DELETE endpoints for all section entries
 */
export interface DeleteResponse {
  success: boolean;
  message?: string;
}

// ============================================================================
// Error DTOs
// ============================================================================

/**
 * ErrorResponse - Standard error response format
 * 
 * Returned by all endpoints when an error occurs
 */
export interface ErrorResponse {
  success: false;
  error: {
    /** Error code (e.g., "VALIDATION_ERROR", "NOT_FOUND", "UNAUTHORIZED") */
    code: string;
    
    /** Human-readable error message */
    message: string;
    
    /** Optional field-level validation errors */
    details?: FieldError[];
  };
}

/**
 * FieldError - Validation error for a specific field
 */
export interface FieldError {
  /** Field path (e.g., "email", "workExperiences[0].company") */
  field: string;
  
  /** Error message for this field */
  message: string;
  
  /** Error code (e.g., "REQUIRED", "INVALID_FORMAT", "TOO_LONG") */
  code: string;
}

// ============================================================================
// Validation Rules (for documentation purposes)
// ============================================================================

/**
 * Validation Rules Summary
 * 
 * These are enforced by the backend and should be reflected in frontend validation:
 * 
 * Profile:
 * - user_id: Required, must reference valid user
 * - completion_status: Must be one of: incomplete, complete, verified
 * 
 * Work Experience:
 * - company: Required, 1-200 characters
 * - title: Required, 1-200 characters
 * - location: Optional, max 200 characters
 * - url: Optional, valid URL format
 * - startDate: Required, ISO 8601 format (YYYY-MM-DD)
 * - endDate: Optional, ISO 8601 format (YYYY-MM-DD), must be >= startDate
 * - currentPosition: Required, boolean
 * - summary: Optional, max 2000 characters
 * - highlights: Required, at least 1 entry, each 1-500 characters
 * - display_order: Optional, integer >= 0
 * 
 * Education:
 * - degreeType: Required, 1-200 characters
 * - areaOfStudy: Required, 1-200 characters
 * - institution: Required, 1-200 characters
 * - startDate: Required, ISO 8601 format (YYYY-MM-DD)
 * - endDate: Required, ISO 8601 format (YYYY-MM-DD), must be >= startDate
 * - completed: Required, boolean
 * - url: Optional, valid URL format
 * - creditHours: Optional, 0-999
 * - coursework: Optional, array of strings, each max 200 characters
 * - minors: Optional, array of strings, each max 200 characters
 * - display_order: Optional, integer >= 0
 * 
 * Certification:
 * - name: Required, 1-200 characters
 * - issuer: Required, 1-200 characters
 * - date: Required, ISO 8601 format (YYYY-MM-DD)
 * - url: Optional, valid URL format
 * - display_order: Optional, integer >= 0
 * 
 * Skill Category:
 * - name: Required, 1-100 characters
 * - description: Optional, max 500 characters
 * - skills: Required, array of strings, at least 1 entry, each 1-100 characters
 * - display_order: Optional, integer >= 0
 * 
 * Contact Info:
 * - firstName: Required, 1-100 characters
 * - lastName: Required, 1-100 characters
 * - jobTitle: Required, 1-200 characters
 * - email: Required, valid email format
 * - phone: Required, valid phone format
 * - linkedin: Required, valid URL format
 * - websites: Optional, array of valid URLs
 * - summary: Required, 1-5000 characters
 * - city: Required, 1-100 characters
 * - stateRegion: Required, 1-100 characters
 * - country: Required, 1-100 characters
 * - postalCode: Required, 1-20 characters
 * - willingToRelocate: Required, boolean
 */
