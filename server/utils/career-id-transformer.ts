/**
 * Career ID Type Transformers
 * 
 * Transforms snake_case database responses to camelCase for API responses.
 * Each type has its own transformer to handle special cases and maintain type safety.
 */

import type {
  Profile,
  Experience,
  Education,
  Certification,
  ProfileSocialLink,
  ContactInfo,
  ProfileResponse,
} from '@@/shared/types/careerId'

/**
 * Transform Profile from snake_case to camelCase
 */
export function transformProfile(data: any): Profile {
  return {
    id: data.id,
    userId: data.user_id,
    internalId: data.internal_id,
    completionStatus: data.completion_status,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    deletedAt: data.deleted_at,
    isDeleted: data.is_deleted,
  }
}

/**
 * Transform Experience from snake_case to camelCase
 */
export function transformExperience(data: any): Experience {
  return {
    id: data.id,
    profileId: data.profile_id,
    employmentType: data.employment_type,
    employer: data.employer,
    title: data.title,
    location: data.location,
    locationType: data.location_type,
    url: data.url,
    startDate: data.start_date,
    endDate: data.end_date,
    currentPosition: data.current_position,
    summary: data.summary,
    contextNotes: data.context_notes,
    highlights: data.highlights || [],
    displayOrder: data.display_order,
    lastEnhancedAt: data.last_enhanced_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

/**
 * Transform Education from snake_case to camelCase
 */
export function transformEducation(data: any): Education {
  return {
    id: data.id,
    profileId: data.profile_id,
    degreeType: data.degree_type,
    areaOfStudy: data.area_of_study,
    institution: data.institution,
    startDate: data.start_date,
    endDate: data.end_date,
    completed: data.completed,
    url: data.url,
    creditHours: data.credit_hours,
    coursework: data.coursework || [],
    minors: data.minors || [],
    displayOrder: data.display_order,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

/**
 * Transform Certification from snake_case to camelCase
 */
export function transformCertification(data: any): Certification {
  return {
    id: data.id,
    profileId: data.profile_id,
    name: data.name,
    issuer: data.issuer,
    issueDate: data.issue_date,
    url: data.url,
    displayOrder: data.display_order,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}   

/**
 * Transform ProfileSocialLink from snake_case to camelCase
 */
export function transformProfileSocialLink(data: any): ProfileSocialLink {
  return {
    id: data.id,
    profileId: data.profile_id,
    platformId: data.platform_id,
    platformNameCache: data.platform_name_cache,
    url: data.url,
    displayOrder: data.display_order,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

/**
 * Transform ContactInfo from snake_case to camelCase
 */
export function transformContactInfo(data: any): ContactInfo {
  return {
    id: data.id,
    internalId: data.internal_id,
    profileId: data.profile_id,
    firstName: data.first_name,
    lastName: data.last_name,
    jobTitle: data.job_title,
    email: data.email,
    phone: data.phone,
    websites: data.websites || [],
    summary: data.summary,
    city: data.city,
    stateRegion: data.state_region,
    country: data.country,
    postalCode: data.postal_code,
    willingToRelocate: data.willing_to_relocate,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

/**
 * Transform complete ProfileResponse from snake_case to camelCase
 */
export function transformProfileResponse(data: any): ProfileResponse {
  return {
    profile: transformProfile(data.profile),
    experience: (data.experience || []).map(transformExperience),
    education: (data.education || []).map(transformEducation),
    certifications: (data.certifications || []).map(transformCertification),
    profileSkills: data.profile_skills || [],
    profileSocialLinks: (data.profile_social_links || []).map(transformProfileSocialLink),
    contactInfo: data.contact_info ? transformContactInfo(data.contact_info) : null,
  }
}
