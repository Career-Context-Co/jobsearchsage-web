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

### 4.G Social Links Routes (`/api/career-id/profile/:profileId/social-links/`)
**Note:** Junction table pattern similar to skills. Links to reference.social_platforms catalog.

- [x] 4.33 Create `server/api/career-id/profile/[profileId]/social-links/index.get.ts` to fetch all social links for profile
- [x] 4.34 Create `server/api/career-id/profile/[profileId]/social-links/index.post.ts` for adding social links (accepts array, validates URL and platformId)
- [x] 4.35 In social links POST handler, validate URL format, prevent duplicate platforms, cache platform_name from reference.social_platforms
- [x] 4.36 Create `server/api/career-id/profile/[profileId]/social-links/[id].patch.ts` for updating social link URL/display order
- [x] 4.37 Create `server/api/career-id/profile/[profileId]/social-links/[id].delete.ts` for removing social links
- [x] 4.38 Create `server/api/reference/social-platforms/index.get.ts` to list available platforms for dropdown/selection

### 4.H Error Handling & Utilities

- [x] 4.39 Add proper error handling in all routes: catch database errors, return appropriate HTTP status codes (400, 404, 409, 500)
  - [x] 4.39.1 Create `server/utils/error-handler.ts` with database error mapping (23505→409, 23503→400) and standard error builders
  - [x] 4.39.2 Create `server/utils/logger.ts` with structured logging (logRequest, logSuccess, logError, createTimer)
  - [x] 4.39.3 Update profile routes (index.get.ts under [profileId], index.post.ts) with error handling and logging
  - [x] 4.39.4 Update all 4 experience endpoints (GET, POST, PATCH, DELETE) with standard patterns
  - [x] 4.39.5 Update all 4 education endpoints (GET, POST, PATCH, DELETE) with standard patterns
  - [x] 4.39.6 Update all 4 certification endpoints (GET, POST, PATCH, DELETE) with standard patterns
  - [x] 4.39.7 Update all 4 skills endpoints (GET, POST, PATCH, DELETE) with standard patterns
  - [x] 4.39.8 Update all 4 contact endpoints (GET, POST, PATCH, DELETE) with standard patterns
  - [x] 4.39.9 Update all 4 socials endpoints (GET, POST, PATCH, DELETE) with standard patterns
  - [x] 4.39.10 Update reference/skills/search.get.ts with standard patterns
- [x] 4.40 Create validation utilities in `server/utils/validation.ts` for common patterns (email, phone, URL, date ranges)
- [x] 4.41 Create migration script `deliverables/migrations/014_create_get_profile_function.sql` for the get_full_profile database function
- [x] 4.42 Test all endpoints manually with curl/Postman to verify database integration works correctly

## 5. Frontend: Real API Integration

### 5.A Pinia Store: Career ID Profile State Management (`app/stores/careerIDStore.ts`)
**Note:** Using Pinia for complex state management instead of a composable. The store holds the complete profile with all sections and manages CRUD operations.

- [x] 5.1 Define TypeScript interfaces in `app/types/careerID/` folder (nested structure matching API response, using camelCase):
  - [x] 5.1.1 `ProfileResponse` - complete API response with nested sections:
    - `profile`: core fields (id, userId, completionStatus, timestamps)
    - `experience[]`, `education[]`, `certifications[]`, `profileSkills[]`, `profileSocialLinks[]`, `contactInfo`
  - [x] 5.1.2 `Profile` - core profile fields only (id, userId, completionStatus, timestamps, internalId, deletedAt, isDeleted)
  - [x] 5.1.3 `Experience` - work history (id, employer, title, employmentType, locationType, dates, highlights[], displayOrder)
  - [x] 5.1.4 `Education` - education records (id, degreeType, areaOfStudy, institution, dates, coursework[], minors[], displayOrder)
  - [x] 5.1.5 `Certification` - certifications (id, name, issuer, date, url, displayOrder)
  - [x] 5.1.6 `ProfileSkill` - skills with metadata (id, skillId, name, proficiencyLevel, yearsExperience, displayOrder, skill)
  - [x] 5.1.7 `ProfileSocialLink` - social links (id, platformId, platformNameCache, url, displayOrder)
  - [x] 5.1.8 `ContactInfo` - contact details (id, firstName, lastName, jobTitle, email, phone, websites[], summary, location fields)

- [x] 5.2 Build out store state in `app/stores/careerIDStore.ts` (flat structure for ease of use):
  - [x] 5.2.1 Core state as separate top-level properties:
    - `profile: Profile | null` - core profile fields
    - `experience: Experience[]` - work history entries
    - `education: Education[]` - education records
    - `certifications: Certification[]` - certifications
    - `profileSkills: ProfileSkill[]` - skills with metadata
    - `profileSocialLinks: ProfileSocialLink[]` - social links
    - `contactInfo: ContactInfo | null` - contact details
  - [x] 5.2.2 UI state: `isLoading`, `isSaving`, `error`, `lastSaved` timestamp

- [x] 5.3 Create getters for computed profile data:
  - [x] 5.3.1 `isProfileLoaded` - check if profile exists
  - [x] 5.3.2 `completionPercentage` - calculate based on filled sections
  - [x] 5.3.5 `skillsByProficiency` - grouped by proficiency_level
  - [x] 5.3.6 `hasContactInfo` - check if contact exists
  - [x] 5.3.7 `sectionCounts` - object with counts for each section

- [x] 5.4 Create actions for profile lifecycle:
  - [x] 5.4.1 `fetchProfile(profileId)` - GET /api/career-id/profile/:profileId, populate all state sections
  - [x] 5.4.2 `createProfile(userId)` - POST /api/career-id/profile, returns new profile shell
  - [x] 5.4.3 `resetProfile()` - clear all state (for logout/switching profiles)
  - [x] 5.4.4 `setError(error)` / `clearError()` - error state management

- [ ] 5.5 Create actions for Experience CRUD:
  - [ ] 5.5.1 `addExperience(data)` - POST /api/career-id/profile/:profileId/experience, update local state
  - [ ] 5.5.2 `updateExperience(id, data)` - PATCH /api/career-id/profile/:profileId/experience/:id, update local state
  - [ ] 5.5.3 `deleteExperience(id)` - DELETE /api/career-id/profile/:profileId/experience/:id, remove from local state

- [ ] 5.6 Create actions for Education CRUD:
  - [ ] 5.6.1 `addEducation(data)` - POST /api/career-id/profile/:profileId/education
  - [ ] 5.6.2 `updateEducation(id, data)` - PATCH /api/career-id/profile/:profileId/education/:id
  - [ ] 5.6.3 `deleteEducation(id)` - DELETE /api/career-id/profile/:profileId/education/:id

- [ ] 5.7 Create actions for Certifications CRUD:
  - [ ] 5.7.1 `addCertification(data)` - POST /api/career-id/profile/:profileId/certifications
  - [ ] 5.7.2 `updateCertification(id, data)` - PATCH /api/career-id/profile/:profileId/certifications/:id
  - [ ] 5.7.3 `deleteCertification(id)` - DELETE /api/career-id/profile/:profileId/certifications/:id

- [ ] 5.8 Create actions for Skills (bulk operations):
  - [ ] 5.8.1 `addSkills(skills[])` - POST /api/career-id/profile/:profileId/skills (bulk add)
  - [ ] 5.8.2 `updateSkills(skills[])` - PATCH /api/career-id/profile/:profileId/skills (bulk update)
  - [ ] 5.8.3 `deleteSkills(ids[])` - DELETE /api/career-id/profile/:profileId/skills (bulk delete)
  - [ ] 5.8.4 `searchSkills(query)` - GET /api/reference/skills/search?q=query (for autocomplete, returns suggestions)

- [ ] 5.9 Create actions for Contact Info (one-to-one):
  - [ ] 5.9.1 `createContactInfo(data)` - POST /api/career-id/profile/:profileId/contact
  - [ ] 5.9.2 `updateContactInfo(id, data)` - PATCH /api/career-id/profile/:profileId/contact/:id
  - [ ] 5.9.3 `deleteContactInfo(id)` - DELETE /api/career-id/profile/:profileId/contact/:id

- [ ] 5.10 Create actions for Social Links:
  - [ ] 5.10.1 `addSocialLinks(links[])` - POST /api/career-id/profile/:profileId/socials (bulk add)
  - [ ] 5.10.2 `updateSocialLink(id, data)` - PATCH /api/career-id/profile/:profileId/socials/:id
  - [ ] 5.10.3 `deleteSocialLink(id)` - DELETE /api/career-id/profile/:profileId/socials/:id
  - [ ] 5.10.4 `fetchSocialPlatforms()` - GET /api/reference/social-platforms (for dropdown options)

### 5.B Frontend Integration with Pinia Store

- [ ] 5.11 Replace mock data in onboarding form with `careerIDStore.fetchProfile(profileId)` call on mount
- [ ] 5.12 Implement initial profile creation: call `careerIDStore.createProfile(userId)` to get profileId for new users
- [ ] 5.13 Implement autosave on step navigation using store actions (save current section before moving to next step)
- [ ] 5.14 Wire up ExperienceSection.vue to use store actions:
  - [ ] 5.14.1 Use `storeToRefs` to destructure `experience` reactively
  - [ ] 5.14.2 Call `careerIDStore.addExperience()` for new entries
  - [ ] 5.14.3 Call `careerIDStore.updateExperience()` for edits
  - [ ] 5.14.4 Call `careerIDStore.deleteExperience()` for removals
- [ ] 5.15 Wire up EducationSection.vue to use store actions (same pattern as experience)
- [ ] 5.16 Wire up CertificationsSection.vue to use store actions (same pattern as experience)
- [ ] 5.17 Wire up ContactSection.vue to use store actions:
  - [ ] 5.17.1 Use `careerIDStore.hasContactInfo` getter to determine create vs update
  - [ ] 5.17.2 Call `createContactInfo()` or `updateContactInfo()` accordingly
- [ ] 5.18 Wire up SkillsSection.vue to use store actions:
  - [ ] 5.18.1 Use `careerIDStore.searchSkills()` for autocomplete suggestions
  - [ ] 5.18.2 Use bulk operations for add/update/delete
- [ ] 5.19 Wire up SocialsSection.vue to use store actions:
  - [ ] 5.19.1 Call `careerIDStore.fetchSocialPlatforms()` on mount for dropdown
  - [ ] 5.19.2 Use store actions for CRUD operations

### 5.C UI/UX Enhancements

- [ ] 5.20 Add loading states using `careerIDStore.isLoading` and section-specific `loadingStates`
- [ ] 5.21 Add error handling with user-friendly toast notifications using `careerIDStore.error`
- [ ] 5.22 Handle validation errors from backend and display inline in form
- [ ] 5.23 Add visual feedback when autosave completes using `careerIDStore.lastSaved` (e.g., "Saved" indicator)
- [ ] 5.24 Add confirmation dialogs for destructive actions (delete entries)

### 5.D Testing & Validation

- [ ] 5.25 Test complete onboarding flow: create profile → add entries → autosave on step change → reload → edit → save
- [ ] 5.26 Test validation: required fields, format validation, error messages
- [ ] 5.27 Test skills autocomplete and junction table behavior (duplicate prevention, metadata updates)
- [ ] 5.28 Test responsive behavior on mobile and tablet devices
- [ ] 5.29 Run type checking: `pnpm typecheck`
- [ ] 5.30 Run linter: `pnpm lint` and fix any issues

