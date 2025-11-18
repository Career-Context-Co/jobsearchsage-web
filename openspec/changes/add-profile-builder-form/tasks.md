# Implementation Tasks: Profile Builder Onboarding Form

## 1. Frontend: UI Mock + Data Shapes

- [x] 1.1 Create profile builder onboarding form layout in `app/pages/profile/onboarding.vue` with section navigation
- [x] 1.2 Implement section navigation UI (stepper for each section) appropriate for onboarding flow
- [x] 1.3 Create `app/components/profile/ExperienceSection.vue` component with fields for company, title, dates, accomplishments
- [x] 1.4 Create `app/components/profile/EducationSection.vue` component with fields for degree, institution, year, coursework
- [x] 1.5 Create `app/components/profile/CertificationsSection.vue` component with fields for name, organization, date
- [x] 1.6 Create `app/components/profile/SkillsSection.vue` component with tag/list interface and autocomplete from skills catalog
- [x] 1.7 Create `app/components/profile/ContactSection.vue` component with fields for email, phone, location, LinkedIn
- [x] 1.8 Define TypeScript interfaces for all data shapes (ProfileData, WorkExperience, Education, Certification, Skill, ContactInfo)
- [ ] 1.9 Add placeholder data to demonstrate form behavior and validation
- [ ] 1.10 Add visual indicators for required fields and validation states

## 2. Backend: API Contract + Mocks

- [x] 2.1 Define Profile domain models in `deliverables/schemas/domain-models.ts` (Profile, WorkExperience, Education, Certification, Skill, ContactInfo)
- [x] 2.2 Define DTOs for API requests/responses (ProfileDTO, CreateProfileRequest, UpdateProfileRequest, etc.)
- [x] 2.3 Create API contract specification in `deliverables/schemas/api-spec.md` documenting all endpoints, request/response formats, and error codes
- [x] 2.4 Implement mock GET endpoint `server/api/profile.get.ts` returning sample profile JSON with all sections
- [x] 2.5 Implement mock POST endpoint `server/api/profile.post.ts` accepting new profile data and returning success
- [x] 2.6 Implement mock PUT endpoint `server/api/profile.put.ts` accepting profile updates and returning updated profile
- [x] 2.7 Implement mock DELETE endpoints for removing individual entries from sections
- [x] 2.8 Add validation logic in mock endpoints (email format, required fields, date formats)
- [x] 2.9 Share API contract with frontend for validation and feedback
- [x] 2.10 Create mock data samples in `deliverables/mocks/profile-responses.json`

## 3. Database: Schema + Migrations

**Note:** Profile tables go in `open_career` schema (Career Sage Core Platform), not `jobsearchsage` schema. Application-specific workflow data (job applications, resumes, etc.) goes in `jobsearchsage` schema (or public).

- [ ] 3.1 Design `open_career.profiles` table schema (id, user_id, created_at, updated_at, completion_status)
- [ ] 3.2 Design `open_career.work_experiences` table schema (id, profile_id, company, title, start_date, end_date, accomplishments JSON array, display_order)
- [ ] 3.3 Design `open_career.education` table schema (id, profile_id, degree, institution, graduation_year, coursework, display_order)
- [ ] 3.4 Design `open_career.certifications` table schema (id, profile_id, name, issuing_org, date_obtained, display_order)
- [ ] 3.5 Design `open_career.skills` table schema (master catalog: id, skill_name, category, aliases, created_at)
- [ ] 3.6 Design `open_career.profile_skills` junction table schema (id, profile_id, skill_id, proficiency_level, years_experience, display_order)
- [ ] 3.7 Design `open_career.contact_info` table schema (id, profile_id, email, phone, location, linkedin_url)
- [ ] 3.8 Create migration script `deliverables/migrations/001_create_open_career_schema.sql` to create schema if not exists
- [ ] 3.9 Create migration script `deliverables/migrations/002_create_profiles.sql` for open_career.profiles table
- [ ] 3.10 Create migration script `deliverables/migrations/003_create_work_experiences.sql` for open_career.work_experiences table
- [ ] 3.11 Create migration script `deliverables/migrations/004_create_education.sql` for open_career.education table
- [ ] 3.12 Create migration script `deliverables/migrations/005_create_certifications.sql` for open_career.certifications table
- [ ] 3.13 Create migration script `deliverables/migrations/006_create_skills.sql` for open_career.skills master catalog table
- [ ] 3.14 Create migration script `deliverables/migrations/007_create_profile_skills.sql` for open_career.profile_skills junction table
- [ ] 3.15 Create migration script `deliverables/migrations/008_create_contact_info.sql` for open_career.contact_info table
- [ ] 3.16 Add indexes on foreign keys (profile_id, user_id, skill_id) in all migration scripts
- [ ] 3.17 Document schema relationships in `deliverables/schemas/profile_schema.md` with ERD showing open_career schema separation
- [ ] 3.18 Create sample seed data in `deliverables/seeds/profile_seeds.sql` including ~500-1000 common skills for master catalog
- [ ] 3.19 **WAIT FOR HUMAN REVIEW AND EXECUTION** - Do not proceed to Phase 4 until migrations are applied

## 4. Backend: Real DB Integration

**Note:** All queries target `open_career` schema tables. Skills use junction table pattern (profile_skills linking to skills master catalog).

- [ ] 4.1 Create `server/utils/db/ProfileRepository.ts` with methods for profile CRUD operations on open_career schema
- [ ] 4.2 Implement `getProfile(userId)` method to fetch complete profile with all sections from open_career schema
- [ ] 4.3 Implement `createProfile(userId, profileData)` method to create new profile in open_career.profiles
- [ ] 4.4 Implement `updateProfile(profileId, profileData)` method to update existing profile
- [ ] 4.5 Implement `addWorkExperience(profileId, experience)` method for open_career.work_experiences
- [ ] 4.6 Implement `updateWorkExperience(experienceId, experience)` method
- [ ] 4.7 Implement `deleteWorkExperience(experienceId)` method
- [ ] 4.8 Implement similar CRUD methods for education, certifications, and contact info (open_career schema)
- [ ] 4.9 Implement `addSkill(profileId, skillName, metadata)` method that finds/creates skill in open_career.skills and creates junction entry in open_career.profile_skills
- [ ] 4.10 Implement `updateProfileSkill(profileSkillId, metadata)` method to update proficiency/years in open_career.profile_skills
- [ ] 4.11 Implement `deleteProfileSkill(profileSkillId)` method to remove junction entry from open_career.profile_skills
- [ ] 4.12 Implement `searchSkills(query)` method for autocomplete from open_career.skills master catalog
- [ ] 4.13 Replace mock data in `server/api/profile.get.ts` with real database queries joining profile_skills to skills
- [ ] 4.14 Replace mock logic in `server/api/profile.post.ts` with real database inserts using transactions
- [ ] 4.15 Replace mock logic in `server/api/profile.put.ts` with real database updates
- [ ] 4.16 Add validation rules: email format, phone format, URL format, date ranges
- [ ] 4.17 Add business logic: ensure at least one accomplishment per work experience
- [ ] 4.18 Add authorization: users can only access/modify their own profiles in open_career schema
- [ ] 4.19 Add transaction handling for multi-table operations (especially profile + profile_skills creation)
- [ ] 4.20 Add error handling and proper HTTP status codes

## 5. Frontend: Real API Integration

- [ ] 5.1 Create `app/composables/useProfile.ts` composable for profile data management
- [ ] 5.2 Replace mock data in onboarding form with real GET /api/profile call
- [ ] 5.3 Implement save functionality calling POST /api/profile for new profiles during onboarding
- [ ] 5.4 Implement update functionality calling PUT /api/profile for existing profiles
- [ ] 5.5 Implement delete functionality for individual section entries
- [ ] 5.6 Implement skills autocomplete in SkillsSection component calling GET /api/skills/search
- [ ] 5.7 Handle skill selection by calling POST /api/profile/skills with skill_name and metadata (proficiency, years)
- [ ] 5.8 Add loading states for all API operations (spinners, skeleton loaders)
- [ ] 5.9 Add error handling with user-friendly toast notifications
- [ ] 5.10 Handle validation errors from backend and display inline in form
- [ ] 5.11 Handle 401/403 authorization errors with appropriate redirects
- [ ] 5.12 Add optimistic UI updates for better perceived performance
- [ ] 5.13 Implement explicit save buttons per section (not auto-save) with clear feedback
- [ ] 5.14 Add confirmation dialogs for destructive actions (delete entries)
- [ ] 5.15 Test complete onboarding flow: create profile → add entries → save → reload → edit → save
- [ ] 5.16 Test validation: required fields, format validation, error messages
- [ ] 5.17 Test skills autocomplete and junction table behavior (duplicate prevention, metadata updates)
- [ ] 5.18 Test responsive behavior on mobile and tablet devices
- [ ] 5.19 Run type checking: `pnpm typecheck`
- [ ] 5.20 Run linter: `pnpm lint` and fix any issues

