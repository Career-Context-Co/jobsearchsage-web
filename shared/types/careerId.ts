/**
 * Career ID Profile TypeScript Interfaces
 * Uses camelCase convention for frontend TypeScript (API returns snake_case, transform on fetch)
 */

// Core Profile Interface
export interface Profile {
  id: string;
  userId: string;
  internalId: number;
  completionStatus: 'incomplete' | 'partial' | 'complete';
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  isDeleted: boolean;
}

// Experience Interface
export interface Experience {
  id: number;
  profileId: string;
  employmentType: 'full_time' | 'part_time' | 'contract' | 'freelance' | 'internship';
  employer: string;
  title: string;
  location?: string;
  locationType: 'on_site' | 'remote' | 'hybrid';
  url?: string | null;
  startDate: string;
  endDate?: string | null;
  currentPosition: boolean;
  summary?: string | null;
  highlights: string[];
  displayOrder: number;
  isExtracted?: boolean;
  lastEnhancedAt?: string | null;
  contextNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Education Interface
export interface Education {
  id: number;
  profileId: string;
  degreeType: string;
  areaOfStudy: string;
  institution: string;
  startDate: string;
  endDate: string;
  completed: boolean;
  url?: string | null;
  creditHours?: number | null;
  coursework: string[];
  minors: string[];
  displayOrder: number;
  isExtracted?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Certification Interface
export interface Certification {
  id: number;
  profileId: string;
  name: string;
  issuer: string;
  issueDate: string;
  url?: string | null;
  displayOrder: number;
  isExtracted?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Skill from reference catalog
export interface Skill {
  id: number;
  name: string;
  category: string;
}

// Profile Skill Interface (with metadata and nested skill)
export interface ProfileSkill {
  id: number;
  profileId: string;
  skillId: number | null;
  name: string;
  group?: string | null;
  proficiencyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsExperience?: number | null;
  displayOrder: number;
  isExtracted?: boolean;
  skill: Skill;
  createdAt: string;
  updatedAt: string;
}

// Profile Social Link Interface
export interface ProfileSocialLink {
  id: number;
  profileId: string;
  platformId: number;
  platformNameCache: string;
  url: string;
  displayOrder: number;
  isExtracted?: boolean;
  createdAt: string;
  updatedAt: string;
}

// HERO Story Interface
export interface HeroStory {
  id: string;
  profileId: string;
  title: string;
  hurdleProblem?: string | null;
  hurdleScope?: string | null;
  hurdleStakes?: string | null;
  expectationRole?: string | null;
  expectationGoals?: string | null;
  expectationConstraints?: string | null;
  responseActions?: string | null;
  responseTools?: string | null;
  responseChallenges?: string | null;
  outcomeDeliverable?: string | null;
  outcomeMetrics?: string | null;
  outcomeImpact?: string | null;
  sourceExperienceId?: number | null;
  displayOrder: number;
  deletedAt?: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// Contact Info Interface
export interface ContactInfo {
  id: string;
  internalId: number;
  profileId: string;
  firstName: string;
  lastName: string;
  jobTitle?: string | null;
  email: string;
  phone?: string | null;
  websites: string[];
  summary?: string | null;
  city?: string | null;
  stateRegion?: string | null;
  country?: string | null;
  postalCode?: string | null;
  willingToRelocate: boolean;
  isExtracted?: boolean;
  // Per-field extraction flags (set when extracted value differs from existing)
  extractedFields?: {
    firstName?: boolean;
    lastName?: boolean;
    jobTitle?: boolean;
    email?: boolean;
    phone?: boolean;
    websites?: boolean;
    summary?: boolean;
    city?: boolean;
    stateRegion?: boolean;
    country?: boolean;
    postalCode?: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

// Complete Profile Response Interface (camelCase for frontend use)
export interface ProfileResponse {
  profile: Profile;
  experience: Experience[];
  education: Education[];
  certifications: Certification[];
  profileSkills: ProfileSkill[];
  profileSocialLinks: ProfileSocialLink[];
  contactInfo: ContactInfo | null;
}