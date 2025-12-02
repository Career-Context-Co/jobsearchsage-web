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

**Note:** Profile tables go in `career_id` schema (Career Sage Core Platform), not `jobsearchsage` schema. Application-specific workflow data (job applications, resumes, etc.) goes in `jobsearchsage` schema (or public).

- [x] 3.1 Design `career_id.profiles` table schema (id, user_id, created_at, updated_at, completion_status)
- [x] 3.2 Design `career_id.experience` table schema (id, profile_id, employer, title, employment_type, location_type, start_date, end_date, highlights JSONB, display_order)
- [x] 3.3 Design `career_id.education` table schema (id, profile_id, degree, institution, graduation_year, coursework, display_order)
- [x] 3.4 Design `career_id.certifications` table schema (id, profile_id, name, issuing_org, date_obtained, display_order)
- [x] 3.5 Design `reference.skills` table schema (master catalog: id, skill_name, category, aliases, created_at)
- [x] 3.6 Design `career_id.profile_skills` junction table schema (id, profile_id, skill_id, proficiency_level, years_experience, display_order)
- [x] 3.7 Design `career_id.contact_info` table schema (id, profile_id, email, phone, location, linkedin_url)
- [x] 3.9 Create migration script `deliverables/migrations/002_create_profiles.sql` for career_id.profiles table
- [x] 3.10 Create migration script `deliverables/migrations/003_create_experience.sql` for career_id.experience table
- [x] 3.11 Create migration script `deliverables/migrations/004_create_education.sql` for career_id.education table
- [x] 3.12 Create migration script `deliverables/migrations/005_create_certifications.sql` for career_id.certifications table
- [x] 3.13 Create migration script `deliverables/migrations/006_create_skills.sql` for reference.skills master catalog table
- [x] 3.14 Create migration script `deliverables/migrations/007_create_profile_skills.sql` for career_id.profile_skills junction table
- [x] 3.15 Create migration script `deliverables/migrations/008_create_contact_info.sql` for career_id.contact_info table
- [x] 3.16 Add indexes on foreign keys (profile_id, user_id, skill_id) in all migration scripts
- [x] 3.17 Document schema relationships in `deliverables/schemas/profile_schema.md` with ERD showing career_id schema separation (covered by SCHEMA_DESIGN.md)
- [x] 3.18 Create sample seed data in `deliverables/seeds/profile_seeds.sql` including 424 common skills for master catalog (tech, business, marketing, management, sales, general professional)
- [x] 3.19 **WAIT FOR HUMAN REVIEW AND EXECUTION** - Do not proceed to Phase 4 until migrations are applied

## 4. Backend: Real DB Integration

**Note:** All queries target `career_id` schema tables (profiles, experience, education, certifications, contact_info, profile_skills) and `reference` schema tables (skills, social_platforms). Business logic handled directly in API route handlers. Auth/authorization skipped for this phase.

### 4.A Main Profile Routes (`/api/career-id/profile/`)

**GET Profile (uses database function for complex joins):**
- [ ] 4.1 Create database function `career_id.get_complete_profile(p_user_id TEXT)` that returns JSON with all profile sections
- [ ] 4.2 In database function, join career_id.profiles with experience, education, certifications, contact_info tables
- [ ] 4.3 In database function, join career_id.profile_skills with reference.skills to include skills with metadata (proficiency_level, years_experience)
- [ ] 4.4 In database function, join career_id.profile_social_links with reference.social_platforms to include social links
- [ ] 4.5 Replace mock in `server/api/career-id/profile/index.get.ts` with call to `career_id.get_complete_profile()` function

**POST Profile (simple INSERT for initial profile shell - entities saved separately via autosave):**
- [x] 4.6 Replace mock in `server/api/career-id/profile/index.post.ts` with simple INSERT into career_id.profiles only
- [x] 4.7 In POST handler, generate prefixed ID (`prof_*`) before insert
- [x] 4.8 Add validation in POST handler: required fields (user_id only)
- [x] 4.9 Return created profile with id for frontend to use in subsequent autosave calls to entity endpoints

### 4.B Experience Routes (`/api/career-id/profile/:profileId/experience/`)

- [x] 4.10 Replace mock in `server/api/career-id/profile/[profileId]/experience/index.get.ts` with query to fetch all experience entries for profile
- [x] 4.11 Replace mock in `server/api/career-id/profile/[profileId]/experience/index.post.ts` with real INSERT for new experience entries (REST: POST for create, profileId from URL path)
- [x] 4.12 Add validation in POST handler: employer, title, start_date required; end_date validation (if provided, must be after start_date)
- [x] 4.13 Replace mock in `server/api/career-id/profile/[profileId]/experience/[id].delete.ts` with real DELETE from career_id.experience
- [x] 4.14 Create `server/api/career-id/profile/[profileId]/experience/[id].patch.ts` for updating existing experience entries (REST: PATCH for partial update)

### 4.C Education Routes (`/api/career-id/profile/:profileId/education/`)

- [x] 4.14 Replace mock in `server/api/career-id/profile/[profileId]/education/index.get.ts` with query to fetch all education entries for profile
- [x] 4.15 Replace mock in `server/api/career-id/profile/[profileId]/education/index.post.ts` with real INSERT for new education entries (REST: POST for create, profileId from URL path)
- [x] 4.16 Add validation in POST handler: degree_type, area_of_study, institution required; date validation
- [x] 4.17 Replace mock in `server/api/career-id/profile/[profileId]/education/[id].delete.ts` with real DELETE from career_id.education
- [x] 4.18 Create `server/api/career-id/profile/[profileId]/education/[id].patch.ts` for updating existing education entries (REST: PATCH for partial update)

### 4.D Certifications Routes (`/api/career-id/profile/:profileId/certifications/`)

- [x] 4.18 Replace mock in `server/api/career-id/profile/[profileId]/certifications/index.get.ts` with query to fetch all certifications for profile
- [x] 4.19 Replace mock in `server/api/career-id/profile/[profileId]/certifications/index.post.ts` with real INSERT for new certification entries (REST: POST for create, profileId from URL path)
- [x] 4.20 Add validation in POST handler: name, issuer, date_obtained required; URL format if provided
- [x] 4.21 Replace mock in `server/api/career-id/profile/[profileId]/certifications/[id].delete.ts` with real DELETE from career_id.certifications
- [x] 4.22 Create `server/api/career-id/profile/[profileId]/certifications/[id].patch.ts` for updating existing certifications (REST: PATCH for partial update)

### 4.E Skills Routes (`/api/career-id/profile/:profileId/skills/`)
**Note:** Skills use "accept anything, match later" approach with array-based bulk operations (tag-like UI pattern)

- [x] 4.22 Replace mock in `server/api/career-id/profile/[profileId]/skills/index.get.ts` - fetch from profile_skills, display name field
- [x] 4.23 Replace mock in `server/api/career-id/profile/[profileId]/skills/index.post.ts` - free-form text input, inserts with skill_id=NULL, background job matches later
- [x] 4.24 In skills POST handler, validate duplicate checking (case-insensitive) within request and against existing profile skills
- [x] 4.25 Add validation in skills POST handler: skill_name required (non-empty), proficiency_level must be valid enum if provided
- [x] 4.26 Replace mock in `server/api/career-id/profile/[profileId]/skills/index.delete.ts` with bulk DELETE (accepts array of IDs)
- [x] 4.27 Create `server/api/reference/skills/search.get.ts` for autocomplete suggestions (optional UX enhancement, user not required to select)
- [x] 4.28 Create `server/api/career-id/profile/[profileId]/skills/index.patch.ts` for bulk partial updates of skill metadata (PATCH for partial update semantics)
- [x] 4.29 Create `server/api/reference/skills/lookup.post.ts` for background matching job (not used by profile endpoints directly)

### 4.F Contact Info Routes (`/api/career-id/profile/:profileId/contact/`)
**Note:** One-to-one relationship with profile. POST for create, PATCH/DELETE use ID in path like other resources.

- [x] 4.28 Replace mock in `server/api/career-id/profile/[profileId]/contact/index.get.ts` with query to fetch contact_info for profile (returns 404 if not found)
- [x] 4.29 Create `server/api/career-id/profile/[profileId]/contact/index.post.ts` for creating contact_info (returns 409 if already exists)
- [x] 4.30 In contact POST handler, generate prefixed ID (`cont_*`) and validate required fields (firstName, lastName, email)
- [x] 4.31 Create `server/api/career-id/profile/[profileId]/contact/[id].patch.ts` for partial updates with validation: email format, phone format (E.164), URL format for websites
- [x] 4.32 Create `server/api/career-id/profile/[profileId]/contact/[id].delete.ts` with DELETE from career_id.contact_info (uses contact ID in URL path)

### 4.G Error Handling & Utilities

- [ ] 4.33 Add proper error handling in all routes: catch database errors, return appropriate HTTP status codes (400, 404, 409, 500)
- [ ] 4.34 Create validation utilities in `server/utils/validation.ts` for common patterns (email, phone, URL, date ranges)
- [ ] 4.35 Create migration script `deliverables/migrations/012_create_get_profile_function.sql` for the get_complete_profile database function
- [ ] 4.36 Test all endpoints manually with curl/Postman to verify database integration works correctly

## 5. Frontend: Real API Integration

- [ ] 5.1 Create `app/composables/useProfile.ts` composable for profile data management
- [ ] 5.2 Replace mock data in onboarding form with real GET /api/career-id/profile call
- [ ] 5.3 Implement initial profile creation calling POST /api/career-id/profile (creates profile shell, returns id for subsequent saves)
- [ ] 5.4 Implement autosave on step navigation: save current section before moving to next step
- [ ] 5.5 Implement add experience calling PUT /api/career-id/profile/experience (autosaves on step change)
- [ ] 5.6 Implement delete experience calling DELETE /api/career-id/profile/experience/[id]
- [ ] 5.7 Implement add/delete for education, certifications using PUT/DELETE endpoints (autosaves on step change)
- [ ] 5.8 Implement contact info save calling PUT /api/career-id/profile/contact (upsert behavior, autosaves on step change)
- [ ] 5.9 Implement skills autocomplete in SkillsSection component calling GET /api/career-id/skills/search
- [ ] 5.10 Handle skill selection by calling PUT /api/career-id/profile/skills with skill_name, category, proficiency_level, years_experience
- [ ] 5.11 Handle skill deletion by calling DELETE /api/career-id/profile/skills/[id]
- [ ] 5.12 Add loading states for all API operations (spinners, skeleton loaders)
- [ ] 5.13 Add error handling with user-friendly toast notifications
- [ ] 5.14 Handle validation errors from backend and display inline in form
- [ ] 5.15 Add visual feedback when autosave completes (e.g., "Saved" indicator)
- [ ] 5.16 Add confirmation dialogs for destructive actions (delete entries)
- [ ] 5.17 Test complete onboarding flow: create profile → add entries → autosave on step change → reload → edit → save
- [ ] 5.18 Test validation: required fields, format validation, error messages
- [ ] 5.19 Test skills autocomplete and junction table behavior (duplicate prevention, metadata updates)
- [ ] 5.20 Test responsive behavior on mobile and tablet devices
- [ ] 5.21 Run type checking: `pnpm typecheck`
- [ ] 5.22 Run linter: `pnpm lint` and fix any issues

