# Task Grouping Guide for AI Agents

## Overview

Tasks are grouped by **parent Issue** (Database, Backend, or Frontend), then by **logical testable unit**, with unique IDs for easy reference. Each task is independently completable and testable.

---

## Core Principles

1. **Strict Phase Order:** Database → Backend → Frontend (never out of order)
2. **Logical Testable Units:** One entity/component/endpoint group per task (not everything at once)
3. **Task IDs:** DB-001, BE-001, FE-001 (semantic, easy to reference)
4. **Explicit Dependencies:** Know what must be done first
5. **Clear Scope:** Each task fits in one focused effort
6. **Minimal:** Don't add testing, documentation, or deployment tasks

---

## Before Starting

**ALWAYS check for user stories first:**
1. Look in `openspec/changes/[change-id]/context/` for user stories and issues
2. If none exist, ask the user explicitly before proceeding
3. Structure all tasks around the user stories

---

## Task ID System

```
DB-001, DB-002, DB-003...  = Database tasks
BE-001, BE-002, BE-003...  = Backend tasks
FE-001, FE-002, FE-003...  = Frontend tasks
```

Each phase starts at 001. IDs are sequential and semantic (DB-001 is foundational, BE-002 depends on DB-002, etc.)

---

## Task Structure Template

```markdown
### [ID]: [Task Name]
- [ ] [Specific deliverable 1]
- [ ] [Specific deliverable 2]
- [ ] [Specific deliverable 3]

**Dependencies:** [What must be done first, or "None"]
**Success criteria:** [What "done" looks like]
```

For completed tasks:
```markdown
### [ID]: [Task Name]
- [x] [Created specific file at exact path]
- [x] [Added specific thing with details]
- [x] [Documented in specific location]

**Status:** ✅ Complete
```

---

## Phase Breakdown

### Phase 1: Database
One task per **table/function group**. Each task includes design, migration script, and documentation.

**Example grouping:**
- DB-001: User Profiles Table
- DB-002: Work Experience Table
- DB-003: Education Table
- DB-004: Skills Master Catalog + Profile Skills Junction

### Phase 2: Backend
One task per **logical endpoint group**. Group related CRUD operations together.

**Example grouping:**
- BE-001: Profile Get/Create Endpoints
- BE-002: Experience CRUD Endpoints (GET, POST, PATCH, DELETE)
- BE-003: Education CRUD Endpoints
- BE-004: Skills Endpoints (bulk operations + search)

### Phase 3A: Frontend Mock UI
One task per **component type**. Built with placeholder data, no API calls.

**Example grouping:**
- FE-001: Onboarding Page (layout, navigation)
- FE-002: Contact Info Component (form with mock data)
- FE-003: Experience Component (list with mock data)

### Phase 3B: Frontend Integration
One task per **major integration point**. Connect to store and real APIs.

**Example grouping:**
- FE-004: Store Setup (state, getters, basic actions)
- FE-005: Experience Store Actions (add, update, delete)
- FE-006: Component Integration (contact component to store)

**Key:** Mock UI (3A) can start before backend is ready. Integration (3B) must wait for backend.

---

## Grouping Rules

### ✅ DO
- One table = one DB task
- One endpoint group (related CRUD) = one BE task
- One component type = one FE task (mock) or one integration point = one FE task (integration)
- Group by logical unit (all profile endpoints together)
- Use task IDs for everything
- List dependencies explicitly
- Show what was actually built (file paths, specific outputs)

### ❌ DON'T
- Don't put all database work in one task
- Don't mix multiple unrelated components in one FE task
- Don't describe completed work ("API is complete"); show deliverables with file paths
- Don't skip dependencies
- Don't mix Frontend mock UI with Integration in the same task
- Don't make tasks so broad they can't be completed in one focused effort

---

## Dependency Rules

- **DB tasks:** Usually no dependencies (except later DB tasks depend on earlier ones)
- **BE tasks:** Depend on their corresponding DB task (BE-001 depends on DB-001)
- **FE Mock (3A):** Depend on nothing (independent of DB/BE)
- **FE Integration (3B):** Depend on both their BE counterpart AND their FE Mock task

Example:
```
FE-006: Experience Component Integration
**Dependencies:** BE-002 (endpoints), FE-003 (mock component)
```

---

## How to Structure a Full Feature

### Step 1: Get User Story
```markdown
# USER STORY: Profile Builder Onboarding

**Context:** Career Sage - Users build complete profile with experience, education, skills, contact info
**Key Constraints:** Profile in career_id schema, skills bulk operations, store as single source of truth
```

### Step 2: Create Database Phase (3-4 tasks)
```markdown
### DB-001: Core Profile Table
- [ ] Design profiles table schema
- [ ] Create migration script
- [ ] Document schema

### DB-002: Experience Table
- [ ] Design experience table schema
- [ ] Create migration script
```

### Step 3: Create Backend Phase (3-5 tasks)
```markdown
### BE-001: Profile Endpoints
- [ ] Create GET /api/career-id/profile/:id
- [ ] Create POST /api/career-id/profile
- [ ] Add validation and error handling

### BE-002: Experience Endpoints
- [ ] Create GET /api/career-id/profile/:id/experience
- [ ] Create POST (create), PATCH (update), DELETE endpoints
```

### Step 4: Create Frontend Phase A - Mock UI (2-3 tasks)
```markdown
### FE-001: Onboarding Page
- [ ] Create pages/profile/onboarding.vue
- [ ] Add section navigation
- [ ] Use mock data

### FE-002: Experience Component
- [ ] Create components/profile/ExperienceSection.vue
- [ ] Add form with mock data
```

### Step 5: Create Frontend Phase B - Integration (3-4 tasks)
```markdown
### FE-003: Pinia Store Setup
- [ ] Create careerIDStore with state and getters
- [ ] Add profile lifecycle actions (fetch, create, reset)

### FE-004: Experience Store Actions
- [ ] Add experience CRUD actions to store

### FE-005: Experience Component Integration
- [ ] Connect component to store
- [ ] Add save handlers with API calls
**Dependencies:** BE-002, FE-002, FE-003, FE-004
```

---

## Validation Checklist

Before submitting a task list:

- [ ] User story exists in context/ folder and is documented
- [ ] Tasks use ID system (DB-001, BE-001, FE-001)
- [ ] Phases in correct order (Database → Backend → Frontend)
- [ ] Tasks grouped by logical unit (one testable unit per task)
- [ ] Frontend separated into Phase A (Mock) and Phase B (Integration)
- [ ] Dependencies listed for every task
- [ ] Completed tasks show actual deliverables (not descriptions)
- [ ] No task too broad (must be completable in one focused effort)

---

# EXAMPLE: Profile Builder Onboarding Feature

## USER STORY: Profile Builder Onboarding Form

**Context:** Career Sage Core Platform - Users capture complete profile during onboarding with experience, education, certifications, skills, and contact info. Section-by-section navigation with autosave.

**Key Constraints:**
- Profile tables in `career_id` schema (core platform)
- Skills use "accept anything, match later" bulk operations pattern
- Frontend components follow one-way data flow (props down, events up)
- All API calls through Pinia store (careerIDStore)

---

## PHASE 1: DATABASE

### DB-001: Core Profile Table
- [x] Design `career_id.profiles` table (id, user_id, created_at, updated_at, completion_status)
- [x] Create migration: `deliverables/migrations/002_create_profiles.sql`
- [x] Document in `deliverables/schemas/profile_schema.md`

**Dependencies:** None
**Testable by:** Database team (verify table structure, apply migration)
**Status:** ✅ Complete

---

### DB-002: Work Experience Table
- [x] Design `career_id.experience` table (id, profile_id, employer, title, employment_type, location_type, start_date, end_date, highlights JSONB, display_order)
- [x] Create migration: `deliverables/migrations/003_create_experience.sql`
- [x] Add indexes on profile_id

**Dependencies:** DB-001
**Testable by:** Database team
**Status:** ✅ Complete

---

### DB-003: Education Table
- [x] Design `career_id.education` table (id, profile_id, degree, institution, graduation_year, coursework, display_order)
- [x] Create migration: `deliverables/migrations/004_create_education.sql`
- [x] Add indexes on profile_id

**Dependencies:** DB-001
**Testable by:** Database team
**Status:** ✅ Complete

---

### DB-004: Certifications & Skills Tables
- [x] Design `career_id.certifications` table (id, profile_id, name, issuing_org, date_obtained, display_order)
- [x] Create migration: `deliverables/migrations/005_create_certifications.sql`
- [x] Design `reference.skills` master catalog table (id, skill_name, category, aliases)
- [x] Create migration: `deliverables/migrations/006_create_skills.sql`
- [x] Design `career_id.profile_skills` junction table (id, profile_id, skill_id, proficiency_level, years_experience, category, display_order)
- [x] Create migration: `deliverables/migrations/007_create_profile_skills.sql`
- [x] Seed with 424 common skills

**Dependencies:** DB-001
**Testable by:** Database team
**Status:** ✅ Complete

---

### DB-005: Contact & Social Tables
- [x] Design `career_id.contact_info` table (id, profile_id, email, phone, location, first_name, last_name)
- [x] Create migration: `deliverables/migrations/008_create_contact_info.sql`
- [x] Design `reference.social_platforms` master catalog
- [x] Create migration: `deliverables/migrations/009_create_social_platforms.sql`
- [x] Design `career_id.profile_social_links` junction table (id, profile_id, platform_id, url, display_order)
- [x] Create migration: `deliverables/migrations/010_create_profile_social_links.sql`

**Dependencies:** DB-001
**Testable by:** Database team
**Status:** ✅ Complete

---

### DB-006: Database Functions
- [x] Create `career_id.get_complete_profile(p_user_id TEXT)` function with all joins
- [x] Create migration: `deliverables/migrations/014_create_get_profile_function.sql`
- [x] Add all necessary indexes

**Dependencies:** DB-001 through DB-005
**Testable by:** Database team (test function with sample queries)
**Status:** ✅ Complete

---

## PHASE 2: BACKEND

### BE-001: Profile Endpoints
- [x] Create `server/api/career-id/profile/index.get.ts` - GET with complete data
- [x] Create `server/api/career-id/profile/index.post.ts` - POST to create profile shell
- [x] Generate prefixed IDs (`prof_*`)
- [x] Add validation and error handling
- [x] Document in `deliverables/schemas/api-spec.md`

**Dependencies:** DB-001, DB-006
**Testable by:** Backend team (curl/Postman tests)
**Status:** ✅ Complete

---

### BE-002: Experience Endpoints
- [x] Create GET, POST, PATCH, DELETE endpoints for `career_id.experience`
- [x] Add validation: employer, title, start_date required; end_date after start_date
- [x] Add error handling and logging
- [x] Document in api-spec.md

**Dependencies:** DB-002, BE-001
**Testable by:** Backend team
**Status:** ✅ Complete

---

### BE-003: Education Endpoints
- [x] Create GET, POST, PATCH, DELETE endpoints for `career_id.education`
- [x] Add validation: degree_type, area_of_study, institution required
- [x] Add error handling and logging

**Dependencies:** DB-003, BE-001
**Testable by:** Backend team
**Status:** ✅ Complete

---

### BE-004: Certifications & Skills Endpoints
- [x] Create certifications GET, POST, PATCH, DELETE endpoints
- [x] Create skills GET, POST (bulk add with free-form text), PATCH (bulk update), DELETE (bulk delete)
- [x] Create `server/api/reference/skills/search.get.ts` for autocomplete
- [x] Add validation and error handling

**Dependencies:** DB-004, BE-001
**Testable by:** Backend team
**Status:** ✅ Complete

---

### BE-005: Contact & Social Endpoints
- [x] Create contact info GET, POST, PATCH, DELETE endpoints
- [x] Create social links GET, POST (bulk), PATCH, DELETE endpoints
- [x] Create `server/api/reference/social-platforms/index.get.ts` for dropdown
- [x] Add validation: email, phone format; URL validation; prevent duplicate platforms
- [x] Add error handling

**Dependencies:** DB-005, BE-001
**Testable by:** Backend team
**Status:** ✅ Complete

---

### BE-006: Error Handling & Utilities
- [x] Create `server/utils/error-handler.ts` (database error mapping)
- [x] Create `server/utils/logger.ts` (structured logging)
- [x] Create `server/utils/validation.ts` (common patterns)
- [x] Apply patterns to all endpoints
- [x] Create `deliverables/schemas/api-spec.md` with all endpoints
- [x] Create `deliverables/schemas/api-dtos.ts` with DTOs

**Dependencies:** BE-001 through BE-005
**Testable by:** Backend team
**Status:** ✅ Complete

---

## PHASE 3A: FRONTEND - MOCK UI

### FE-001: Onboarding Page
- [x] Create `app/pages/profile/onboarding.vue`
- [x] Layout with section navigation (stepper)
- [x] Implement step navigation (Continue, Back buttons)
- [ ] Add visual feedback during navigation

**Dependencies:** None
**Testable by:** Frontend team (visual testing with mock data)
**Status:** ⚠️ Mostly Complete

---

### FE-002: Contact Info Component
- [x] Create `app/components/profile/ContactSection.vue`
- [x] Fields: firstName, lastName, email, phone, jobTitle, location
- [x] Use mock data
- [x] Implement single save emit pattern

**Dependencies:** None
**Testable by:** Frontend team
**Status:** ✅ Complete

---

### FE-003: Experience Component
- [x] Create `app/components/profile/ExperienceSection.vue`
- [x] Fields: employer, title, employmentType, locationType, dates, highlights
- [x] Use mock data
- [x] Implement save emit pattern

**Dependencies:** None
**Testable by:** Frontend team
**Status:** ✅ Complete

---

### FE-004: Education & Certifications Components
- [x] Create `app/components/profile/EducationSection.vue`
- [x] Create `app/components/profile/AdditionalSection.vue` (certifications + skills)
- [x] Use mock data
- [x] Implement save patterns

**Dependencies:** None
**Testable by:** Frontend team
**Status:** ✅ Complete

---

### FE-005: Type Definitions
- [x] Create `app/types/careerID/index.ts`
- [x] Define all types: Profile, Experience, Education, Certification, Skill, ContactInfo, SocialLink, etc.

**Dependencies:** None
**Testable by:** Frontend team (type checking)
**Status:** ✅ Complete

---

## PHASE 3B: FRONTEND - INTEGRATION

### FE-006: Pinia Store Setup
- [x] Create `app/stores/careerIDStore.ts`
- [x] Define state: profile, experience[], education[], certifications[], profileSkills[], profileSocialLinks[], contactInfo
- [x] Add UI state: isLoading, isSaving, error, lastSaved
- [x] Create getters: isProfileLoaded, completionPercentage, skillsByProficiency, hasContactInfo, sectionCounts

**Dependencies:** None
**Testable by:** Frontend team (unit tests)
**Status:** ✅ Complete

---

### FE-007: Store Actions - Profile & Lifecycle
- [x] Add `fetchProfile(profileId)` - GET /api/career-id/profile/:profileId
- [x] Add `createProfile(userId)` - POST /api/career-id/profile
- [x] Add `resetProfile()`, `setError()`, `clearError()`

**Dependencies:** BE-001, FE-006
**Testable by:** Frontend team
**Status:** ✅ Complete

---

### FE-008: Store Actions - Experience, Education, Certifications CRUD
- [x] Add `addExperience()`, `updateExperience()`, `deleteExperience()`
- [x] Add `addEducation()`, `updateEducation()`, `deleteEducation()`
- [x] Add `addCertification()`, `updateCertification()`, `deleteCertification()`
- [x] All update local state after operations

**Dependencies:** BE-002, BE-003, BE-004 (certs), FE-006, FE-007
**Testable by:** Frontend team
**Status:** ✅ Complete

---

### FE-009: Store Actions - Skills & Contact
- [x] Add `addSkills()`, `updateSkills()`, `deleteSkills()` (bulk operations)
- [x] Add `searchSkills()` for autocomplete
- [x] Add `createContactInfo()`, `updateContactInfo()`, `deleteContactInfo()`
- [x] Add `addSocialLinks()`, `updateSocialLink()`, `deleteSocialLink()`
- [x] Add `fetchSocialPlatforms()`

**Dependencies:** BE-004, BE-005, FE-006, FE-007
**Testable by:** Frontend team
**Status:** ✅ Complete

---

### FE-010: Contact Component Integration
- [x] Update ContactSection.vue to accept props: contactInfo, profileSocialLinks
- [x] Add change tracking with deep watchers
- [x] Expose `triggerSave()` method
- [x] Parent handler diffs and calls store CRUD actions

**Dependencies:** BE-005, FE-002, FE-006 through FE-009
**Testable by:** Frontend team (integration tests)
**Status:** ✅ Complete

---

### FE-011: Experience Component Integration
- [x] Update ExperienceSection.vue to accept experience prop
- [x] Add change tracking
- [x] Expose `triggerSave()` method
- [x] Parent handler diffs and calls store CRUD actions

**Dependencies:** BE-002, FE-003, FE-006 through FE-009
**Testable by:** Frontend team
**Status:** ✅ Complete

---

### FE-012: Education & Certifications Integration
- [x] Update EducationSection.vue and AdditionalSection.vue
- [x] Add change tracking and triggerSave() methods
- [x] Parent handlers diff and manage all CRUD operations

**Dependencies:** BE-003, BE-004, FE-004, FE-006 through FE-009
**Testable by:** Frontend team
**Status:** ✅ Complete

---

### FE-013: Onboarding Page Setup & Autosave
- [x] Add store instance and fetch profile on mount
- [x] Implement autosave on step navigation (call triggerSave() when Continue/Back clicked)
- [x] Add change tracking to prevent unnecessary API calls
- [x] Implement step validation before navigation
- [x] Disable buttons during save
- [x] Display errors from store
- [x] Show last saved timestamp

**Dependencies:** FE-010 through FE-012
**Testable by:** Frontend team (full E2E test)
**Status:** ✅ Complete

---

### FE-014: Error Handling & UX
- [x] Add toast notifications for errors (use store.error)
- [x] Display inline validation errors from backend
- [ ] Add "Saved" indicator
- [ ] Add confirmation dialogs for destructive actions

**Dependencies:** FE-013
**Testable by:** Frontend team (manual testing)
**Status:** ⚠️ Mostly Complete