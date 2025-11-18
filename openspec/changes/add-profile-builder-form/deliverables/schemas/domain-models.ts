/**
 * Domain Models for Career Sage Profile
 * 
 * These models represent the database schema in the `open_career` schema.
 * All profile-related data lives in the Career Sage Core Platform layer,
 * separate from application-specific data (which lives in `jobsearchsage` schema).
 * 
 * Design Decision: Normalized schema with separate tables for each section
 * enables efficient querying, referential integrity, and future analytics features.
 */

/**
 * Profile - Main profile record (open_career.profiles)
 * 
 * The root entity for a user's career profile. Contains metadata about
 * the profile itself, with related data in separate tables.
 */
export interface Profile {
  /** Unique identifier for the profile */
  id: string;
  
  /** Reference to the user who owns this profile */
  user_id: string;
  
  /** Timestamp when the profile was created */
  created_at: string;
  
  /** Timestamp when the profile was last updated */
  updated_at: string;
  
  /** 
   * Profile completion status
   * Possible values: 'incomplete', 'complete', 'verified'
   * Used to track onboarding progress and profile quality
   */
  completion_status: 'incomplete' | 'complete' | 'verified';
}

/**
 * WorkExperience - Professional experience entry (open_career.work_experiences)
 * 
 * Represents a single job or professional role. Highlights are stored
 * as a JSON array for simplicity (tightly coupled to the job, no independent querying needed).
 */
export interface WorkExperience {
  /** Unique identifier for this work experience entry */
  id: string;
  
  /** Reference to the parent profile */
  profile_id: string;
  
  /** Company or organization name */
  company: string;
  
  /** Job title or role */
  title: string;
  
  /** Job location (e.g., "San Francisco, CA" or "Remote") */
  location: string | null;
  
  /** Company website URL */
  url: string | null;
  
  /** Start date (ISO 8601 format: YYYY-MM-DD) */
  start_date: string;
  
  /** 
   * End date (ISO 8601 format: YYYY-MM-DD)
   * Null indicates current position
   */
  end_date: string | null;
  
  /** 
   * Whether this is a current position
   * Derived from end_date being null, but stored for convenience
   */
  current_position: boolean;
  
  /** 
   * Brief summary or overview of the role
   * Optional free-text field
   */
  summary: string | null;
  
  /** 
   * Array of accomplishment/responsibility descriptions (called "highlights" in UI)
   * Each string is a bullet point for resume generation
   */
  highlights: string[];
  
  /** 
   * Display order within the profile (lower numbers appear first)
   * Default to chronological order (newest first)
   */
  display_order: number;
  
  /** Timestamp when this entry was created */
  created_at: string;
  
  /** Timestamp when this entry was last updated */
  updated_at: string;
}

/**
 * Education - Educational background entry (open_career.education)
 * 
 * Represents a degree, diploma, or certificate program from an educational institution.
 */
export interface Education {
  /** Unique identifier for this education entry */
  id: string;
  
  /** Reference to the parent profile */
  profile_id: string;
  
  /** Degree type (e.g., "Bachelor of Science", "Master of Arts", "PhD") */
  degree_type: string;
  
  /** Area of study/major (e.g., "Computer Science", "Business Administration") */
  area_of_study: string;
  
  /** Institution name (e.g., "Stanford University") */
  institution: string;
  
  /** Start date (ISO 8601 format: YYYY-MM-DD) */
  start_date: string;
  
  /** End date (ISO 8601 format: YYYY-MM-DD) */
  end_date: string;
  
  /** 
   * Whether the degree was completed
   * False indicates ongoing education or left without completing
   */
  completed: boolean;
  
  /** Institution website URL */
  url: string | null;
  
  /** Total credit hours (optional, mainly for US institutions) */
  credit_hours: number | null;
  
  /** 
   * Array of relevant coursework
   * Each string is a course name or description
   */
  coursework: string[];
  
  /** 
   * Array of minor fields of study
   * Each string is a minor area of study
   */
  minors: string[];
  
  /** 
   * Display order within the profile (lower numbers appear first)
   * Default to chronological order (newest first)
   */
  display_order: number;
  
  /** Timestamp when this entry was created */
  created_at: string;
  
  /** Timestamp when this entry was last updated */
  updated_at: string;
}

/**
 * Certification - Professional certification entry (open_career.certifications)
 * 
 * Represents a professional certification, license, or credential.
 */
export interface Certification {
  /** Unique identifier for this certification entry */
  id: string;
  
  /** Reference to the parent profile */
  profile_id: string;
  
  /** Certification name (e.g., "AWS Solutions Architect - Associate") */
  name: string;
  
  /** Issuing organization (e.g., "Amazon Web Services") */
  issuer: string;
  
  /** Date obtained (ISO 8601 format: YYYY-MM-DD) */
  date: string;
  
  /** Certification verification URL or credential URL */
  url: string | null;
  
  /** 
   * Display order within the profile (lower numbers appear first)
   * Default to chronological order (newest first)
   */
  display_order: number;
  
  /** Timestamp when this entry was created */
  created_at: string;
  
  /** Timestamp when this entry was last updated */
  updated_at: string;
}

/**
 * SkillCategory - Skill category entry (open_career.skill_categories)
 * 
 * Represents a category or grouping of related skills.
 * Frontend uses a category-based approach for organizing skills.
 * 
 * Examples:
 * - "Programming Languages" with skills: ["Python", "JavaScript", "Java"]
 * - "Frameworks & Libraries" with skills: ["React", "Vue.js", "Django"]
 * - "Soft Skills" with skills: ["Leadership", "Communication", "Problem Solving"]
 */
export interface SkillCategory {
  /** Unique identifier for this skill category */
  id: string;
  
  /** Reference to the parent profile */
  profile_id: string;
  
  /** 
   * Category name (e.g., "Programming Languages", "Tools & Technologies")
   * User-defined category for organizing skills
   */
  name: string;
  
  /** 
   * Optional description of the category
   * Provides context about the skill grouping
   */
  description: string | null;
  
  /** 
   * Array of skill names within this category
   * Simple string array for flexibility and ease of use
   */
  skills: string[];
  
  /** 
   * Display order within the profile (lower numbers appear first)
   * Allows users to prioritize skill categories
   */
  display_order: number;
  
  /** Timestamp when this category was created */
  created_at: string;
  
  /** Timestamp when this category was last updated */
  updated_at: string;
}

/**
 * ContactInfo - Contact information (open_career.contact_info)
 * 
 * User's contact details and professional links.
 * One-to-one relationship with Profile (one contact info record per profile).
 */
export interface ContactInfo {
  /** Unique identifier for this contact info entry */
  id: string;
  
  /** Reference to the parent profile */
  profile_id: string;
  
  /** First name */
  first_name: string;
  
  /** Last name */
  last_name: string;
  
  /** Current job title or desired job title */
  job_title: string;
  
  /** Email address */
  email: string;
  
  /** 
   * Phone number
   * Store in E.164 format for consistency (e.g., "+14155552671")
   */
  phone: string;
  
  /** LinkedIn profile URL */
  linkedin: string;
  
  /** 
   * Array of personal/professional website URLs
   * Portfolio, blog, GitHub, etc.
   */
  websites: string[];
  
  /** 
   * Professional summary or bio
   * Brief overview of career and goals
   */
  summary: string;
  
  /** City */
  city: string;
  
  /** State or region */
  state_region: string;
  
  /** Country */
  country: string;
  
  /** Postal/ZIP code */
  postal_code: string;
  
  /** Whether the user is willing to relocate */
  willing_to_relocate: boolean;
  
  /** Timestamp when this entry was created */
  created_at: string;
  
  /** Timestamp when this entry was last updated */
  updated_at: string;
}

/**
 * Complete profile view - aggregates all profile sections
 * 
 * This is not a database table, but a composite view of all profile data.
 * Used by the frontend to display the complete profile.
 */
export interface CompleteProfile {
  /** The main profile record */
  profile: Profile;
  
  /** All work experience entries, ordered by display_order */
  work_experiences: WorkExperience[];
  
  /** All education entries, ordered by display_order */
  education: Education[];
  
  /** All certifications, ordered by display_order */
  certifications: Certification[];
  
  /** 
   * All skill categories with their skills
   * Ordered by display_order
   */
  skill_categories: SkillCategory[];
  
  /** Contact information (one per profile) */
  contact_info: ContactInfo | null;
}

