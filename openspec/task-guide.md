# Task Grouping Guide for AI Agents

## Overview

Tasks are grouped by **parent Issue** (Frontend, Backend, or Database), then by **logical testable unit**, with unique IDs for easy reference. Each task is independently completable and testable.

---

## Core Principles

1. **Strict Phase Order:** Frontend → Backend → Database (never out of order)
2. **Frontend-First Rationale:** Prototype the UI first to discover the right data shapes, interactions, and edge cases. Changes cascade backward — it's far cheaper to change a mock component than to rework a database schema.
3. **Logical Testable Units:** One entity/component/endpoint group per task (not everything at once)
4. **Task IDs:** FE-001, BE-001, DB-001 (semantic, easy to reference)
5. **Explicit Dependencies:** Know what must be done first
6. **Clear Scope:** Each task fits in one focused effort
7. **Minimal:** Don't add testing, documentation, or deployment tasks

---

## Before Starting

**ALWAYS check for user stories first:**
1. Look in `openspec/changes/[change-id]/context/` for user stories and issues (stories.md or issues.md)
2. If none exist, ask the user explicitly before proceeding
3. Structure all tasks around the user stories

---

## Task ID System

```
FE-001, FE-002, FE-003...  = Frontend tasks
BE-001, BE-002, BE-003...  = Backend tasks
DB-001, DB-002, DB-003...  = Database tasks
```

Each phase starts at 001. IDs are sequential and semantic.

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

### Phase 1A: Frontend Prototype
One task per **component type**. Built with mock/placeholder data, no API calls. The goal is to nail down the UI, data shapes, and user interactions before writing any backend code.

**Example grouping:**
- FE-001: Onboarding Page (layout, navigation)
- FE-002: Contact Info Component (form with mock data)
- FE-003: Experience Component (list with mock data)

### Phase 1B: Frontend Store & Types
Define the Pinia store shape and shared types based on what the prototype revealed. Still uses mock data — no API calls yet.

**Example grouping:**
- FE-004: Type Definitions (shared types based on prototype)
- FE-005: Store Setup (state, getters, basic actions with mock data)

**Key:** Prototyping (1A) discovers the data shapes. Store setup (1B) formalizes them into types and state. Both happen before any backend work.

### Phase 2: Backend
One task per **logical endpoint group**. API shape is driven by what the frontend needs — the prototype and store types from Phase 1 define the contract.

**Example grouping:**
- BE-001: Profile Get/Create Endpoints
- BE-002: Experience CRUD Endpoints (GET, POST, PATCH, DELETE)
- BE-003: Education CRUD Endpoints
- BE-004: Skills Endpoints (bulk operations + search)

**Backend Testing Best Practice:**
After completing all backend endpoint tasks in a phase, create a **Postman Collection** for integration testing:
- Group all endpoints from the phase into one collection
- Include test assertions for each endpoint (status codes, response structure)
- Add error scenario tests (validation, not found, forbidden, etc.)
- Pre-configure variables and auto-capture response IDs for dependent requests
- Store in `openspec/changes/[change-id]/deliverables/` with complete setup documentation

### Phase 3: Database
One task per **table/function group**. Schema is designed to serve the backend's needs, which were driven by the frontend's needs. Designed last so you only build what's actually required.

**Example grouping:**
- DB-001: User Profiles Table
- DB-002: Work Experience Table
- DB-003: Education Table
- DB-004: Skills Master Catalog + Profile Skills Junction

### Phase 4: Integration
Connect everything end-to-end. Replace mock data with real API calls, wire store actions to backend endpoints.

**Example grouping:**
- FE-006: Store Actions (CRUD actions with real API calls)
- FE-007: Component Integration (connect components to store)
- FE-008: Error Handling & UX (toasts, validation, loading states)

**Key:** Integration only starts after backend and database are ready.

---

## Backend Testing Best Practices

### Creating Postman Collections for Backend Endpoints

After completing all backend endpoint tasks for a phase, **always create a Postman Collection** for testing:

**Why:**
- Validates all endpoints work before frontend integration begins
- Enables QA/frontend teams to test APIs independently
- Provides executable documentation for the API contract
- Captures test assumptions and error scenarios

**What to Include:**

**Happy Path:** One test per endpoint
- POST endpoint: Perfect request creating valid resource (should return 201 Created)
- GET endpoint: Perfect request fetching existing resource (should return 200 OK)
- PATCH endpoint: Perfect request updating valid resource (should return 200 OK)
- DELETE endpoint: Perfect request deleting resource (should return 200 OK)

**Error Tests:** One test per error scenario
- `404 Not Found`: Resource doesn't exist (non-existent ID)
- `400 Bad Request`: Validation errors (missing required field, invalid type)
- `409 Conflict`: Business logic violation (if applicable - duplicate, constraint violation)
- Ownership check failures (if applicable - user trying to access another user's resource)

**Auto-capture:** Use Postman tests to extract IDs from POST response for use in GET/PATCH/DELETE requests

**Structure:**
```
deliverables/
├── [COLLECTION_NAME].postman_collection.json  (main file)
```

**Collection Format:**
```json
{
  "info": {
    "name": "[Feature Name] CRUD - Phase [N] Backend",
    "description": "Complete test collection with happy path + error scenarios"
  },
  "variable": [
    { "key": "baseUrl", "value": "http://localhost:3000" },
    { "key": "profileId", "value": "prof_xxx" }
  ],
  "item": [
    {
      "name": "1. POST - Create [Resource]",
      "event": [
        {
          "listen": "test",
          "script": {
            "exec": [
              "pm.test('Status code is 201', function () { ... });",
              "pm.collectionVariables.set('resourceId', pm.response.json().data.id);"
            ]
          }
        }
      ]
    }
  ]
}
```

**Setup Documentation Should Include:**
- 3-step import process
- Variable configuration table
- Test execution order
- Troubleshooting guide
- Success criteria checklist

---

### ✅ DO
- One component type = one FE task (prototype) or one integration point = one FE task (integration)
- One endpoint group (related CRUD) = one BE task
- One table = one DB task
- Group by logical unit (all profile endpoints together)
- Use task IDs for everything
- List dependencies explicitly
- Show what was actually built (file paths, specific outputs)
- Let the frontend prototype drive the data shapes for backend and database

### ❌ DON'T
- Don't start backend before the frontend prototype validates the data shapes
- Don't design database tables before knowing what the backend needs to persist
- Don't mix multiple unrelated components in one FE task
- Don't put all database work in one task
- Don't describe completed work ("API is complete"); show deliverables with file paths
- Don't skip dependencies
- Don't mix Frontend prototype with Integration in the same task
- Don't make tasks so broad they can't be completed in one focused effort

---

## Dependency Rules

- **FE Prototype (1A):** No dependencies (independent, uses mock data)
- **FE Store/Types (1B):** Depend on their corresponding FE Prototype task
- **BE tasks:** Depend on FE Store/Types (the types define the API contract)
- **DB tasks:** Depend on their corresponding BE task (schema serves the API)
- **FE Integration (4):** Depend on both their BE counterpart AND their FE Prototype task

Example:
```
FE-007: Experience Component Integration
**Dependencies:** BE-002 (endpoints), FE-003 (prototype component), FE-006 (store actions)
```

---

## How to Structure a Full Feature

### Step 1: Get User Story
```markdown
# USER STORY: Profile Builder Onboarding

**Context:** Career Sage - Users build complete profile with experience, education, skills, contact info
**Key Constraints:** Profile in career_id schema, skills bulk operations, store as single source of truth
```

### Step 2: Create Frontend Prototype Phase (2-4 tasks)
```markdown
### FE-001: Onboarding Page
- [ ] Create pages/profile/onboarding.vue
- [ ] Add section navigation
- [ ] Use mock data

### FE-002: Experience Component
- [ ] Create components/profile/ExperienceSection.vue
- [ ] Add form with mock data
- [ ] Discover required fields and interactions
```

### Step 3: Create Frontend Store & Types Phase (1-2 tasks)
```markdown
### FE-003: Type Definitions
- [ ] Define types based on prototype: Profile, Experience, Education, etc.
- [ ] Create shared types in shared/types/

### FE-004: Pinia Store Setup
- [ ] Create careerIDStore with state and getters
- [ ] Add mock CRUD actions (no API calls yet)
```

### Step 4: Create Backend Phase (3-5 tasks)
```markdown
### BE-001: Profile Endpoints
- [ ] Create GET /api/career-id/profile/:id
- [ ] Create POST /api/career-id/profile
- [ ] Add validation and error handling
- [ ] Match response shape to frontend types

### BE-002: Experience Endpoints
- [ ] Create GET /api/career-id/profile/:id/experience
- [ ] Create POST (create), PATCH (update), DELETE endpoints
```

### Step 5: Create Database Phase (3-4 tasks)
```markdown
### DB-001: Core Profile Table
- [ ] Design profiles table schema (based on BE-001 needs)
- [ ] Create migration script

### DB-002: Experience Table
- [ ] Design experience table schema (based on BE-002 needs)
- [ ] Create migration script
```

### Step 6: Create Integration Phase (3-4 tasks)
```markdown
### FE-005: Store Actions - Real API Calls
- [ ] Replace mock actions with real $fetch calls
- [ ] Add error handling
**Dependencies:** BE-001, BE-002, FE-004

### FE-006: Component Integration
- [ ] Connect components to store
- [ ] Add save handlers with API calls
**Dependencies:** FE-005, FE-002
```

---

## Validation Checklist

Before submitting a task list:

- [ ] User story exists in context/ folder and is documented
- [ ] Tasks use ID system (FE-001, BE-001, DB-001)
- [ ] Phases in correct order (Frontend → Backend → Database → Integration)
- [ ] Tasks grouped by logical unit (one testable unit per task)
- [ ] Frontend separated into Prototype (mock) and Integration (real APIs)
- [ ] Dependencies listed for every task
- [ ] Completed tasks show actual deliverables (not descriptions)
- [ ] No task too broad (must be completable in one focused effort)
- [ ] **Backend Phase:** All endpoint tasks completed? Plan Postman Collection (happy path + error tests)

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

## PHASE 1A: FRONTEND PROTOTYPE

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

## PHASE 1B: FRONTEND STORE & TYPES

### FE-005: Type Definitions
- [x] Create `app/types/careerID/index.ts`
- [x] Define all types: Profile, Experience, Education, Certification, Skill, ContactInfo, SocialLink, etc.

**Dependencies:** FE-001 through FE-004 (types derived from prototype)
**Testable by:** Frontend team (type checking)
**Status:** ✅ Complete

---

### FE-006: Pinia Store Setup
- [x] Create `app/stores/careerIDStore.ts`
- [x] Define state: profile, experience[], education[], certifications[], profileSkills[], profileSocialLinks[], contactInfo
- [x] Add UI state: isLoading, isSaving, error, lastSaved
- [x] Create getters: isProfileLoaded, completionPercentage, skillsByProficiency, hasContactInfo, sectionCounts

**Dependencies:** FE-005
**Testable by:** Frontend team (unit tests)
**Status:** ✅ Complete

---

## PHASE 2: BACKEND

### BE-001: Profile Endpoints
- [x] Create `server/api/career-id/profile/index.get.ts` - GET with complete data
- [x] Create `server/api/career-id/profile/index.post.ts` - POST to create profile shell
- [x] Generate prefixed IDs (`prof_*`)
- [x] Add validation and error handling
- [x] Document in `deliverables/schemas/api-spec.md`

**Dependencies:** FE-005, FE-006 (types define the API contract)
**Testable by:** Backend team (curl/Postman tests)
**Status:** ✅ Complete

---

### BE-002: Experience Endpoints
- [x] Create GET, POST, PATCH, DELETE endpoints for `career_id.experience`
- [x] Add validation: employer, title, start_date required; end_date after start_date
- [x] Add error handling and logging
- [x] Document in api-spec.md

**Dependencies:** FE-005, BE-001
**Testable by:** Backend team
**Status:** ✅ Complete

---

### BE-003: Education Endpoints
- [x] Create GET, POST, PATCH, DELETE endpoints for `career_id.education`
- [x] Add validation: degree_type, area_of_study, institution required
- [x] Add error handling and logging

**Dependencies:** FE-005, BE-001
**Testable by:** Backend team
**Status:** ✅ Complete

---

### BE-004: Certifications & Skills Endpoints
- [x] Create certifications GET, POST, PATCH, DELETE endpoints
- [x] Create skills GET, POST (bulk add with free-form text), PATCH (bulk update), DELETE (bulk delete)
- [x] Create `server/api/reference/skills/search.get.ts` for autocomplete
- [x] Add validation and error handling

**Dependencies:** FE-005, BE-001
**Testable by:** Backend team
**Status:** ✅ Complete

---

### BE-005: Contact & Social Endpoints
- [x] Create contact info GET, POST, PATCH, DELETE endpoints
- [x] Create social links GET, POST (bulk), PATCH, DELETE endpoints
- [x] Create `server/api/reference/social-platforms/index.get.ts` for dropdown
- [x] Add validation: email, phone format; URL validation; prevent duplicate platforms
- [x] Add error handling

**Dependencies:** FE-005, BE-001
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

## PHASE 3: DATABASE

### DB-001: Core Profile Table
- [x] Design `career_id.profiles` table (id, user_id, created_at, updated_at, completion_status)
- [x] Create migration: `deliverables/migrations/002_create_profiles.sql`
- [x] Document in `deliverables/schemas/profile_schema.md`

**Dependencies:** BE-001 (schema serves the API)
**Testable by:** Database team (verify table structure, apply migration)
**Status:** ✅ Complete

---

### DB-002: Work Experience Table
- [x] Design `career_id.experience` table (id, profile_id, employer, title, employment_type, location_type, start_date, end_date, highlights JSONB, display_order)
- [x] Create migration: `deliverables/migrations/003_create_experience.sql`
- [x] Add indexes on profile_id

**Dependencies:** DB-001, BE-002
**Testable by:** Database team
**Status:** ✅ Complete

---

### DB-003: Education Table
- [x] Design `career_id.education` table (id, profile_id, degree, institution, graduation_year, coursework, display_order)
- [x] Create migration: `deliverables/migrations/004_create_education.sql`
- [x] Add indexes on profile_id

**Dependencies:** DB-001, BE-003
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

**Dependencies:** DB-001, BE-004
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

**Dependencies:** DB-001, BE-005
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

## PHASE 4: FRONTEND INTEGRATION

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
