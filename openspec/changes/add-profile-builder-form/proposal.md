# Change: Add Profile Builder Form

## Why
Users need a structured way to manually enter their career information to build their Career Sage Profile. This profile serves as the single source of truth for generating job-specific resumes and powering other JobSearchSage features. Currently, the profile page exists but only displays placeholder content.

## What Changes
- Create a guided multi-section form for entering career data (Professional Experience, Education, Certifications, Skills, Contact Information)
- Implement progressive disclosure UI with section navigation
- Add form validation for required fields and data formats
- Support adding multiple entries for experience, education, certifications, and skills
- Store profile data in database with proper schema
- Provide clear instructions, placeholder text, and inline help throughout the form

## Impact
- Affected specs: `profile-builder` (new capability)
- Affected code:
  - `app/pages/profile.vue` - Replace placeholder with profile builder form
  - `app/components/profile/` - New components for form sections
  - `server/api/profile/` - New API endpoints for CRUD operations
  - Database - New tables for profile data (user_profiles, work_experience, education, certifications, skills, contact_info)

