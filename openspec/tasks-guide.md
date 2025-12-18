# Task Grouping Guide for AI Agents

## Overview
When breaking down feature specifications into implementation tasks, group tasks by **team responsibility** and **workflow phase**. Our development process follows a 3-phase sequential pipeline: Database → Backend → Frontend. 

## Before Starting: Check for User Stories

**ALWAYS check for existing user stories or epics first:**

1. Look in `openspec/changes/[change-id]/context/` for user story files
2. Common filenames: `stories.txt`, `epics.md`, `user-stories.md`, `acceptance-criteria.md`
3. If user stories exist, structure tasks around them (one task group per user story)
4. Each user story group should follow the Database → Backend → Frontend pattern
5. If stories do not exist, ask the user for them explicicty before proceeding.

**Example:**
```markdown
## USER STORY 1: View Profile Dashboard
### Database
- [x] ✅ Already complete (mark what's done)
### Backend (API)
- [x] ✅ Already complete (mark what's done)
### Frontend
- [ ] Task 1
- [ ] Task 2

## USER STORY 2: Edit Work Experience
### Database
- [ ] Create experience table
### Backend (API)
- [ ] Create CRUD endpoints
### Frontend
- [ ] Build UI components
- [ ] Integrate with API via store
```

## ⚠️ Critical: Sequential Implementation Required

**Features using this guide follow a strict order:** Database → Backend → Frontend

1. **Database first** - Create tables, functions, migrations before API work
2. **Backend second** - Build API endpoints that consume database structures
3. **Frontend last** - Mock UI first, then integrate with API via store
4. **Mark completed work** - Use `[x] ✅` for work already done (especially database/backend in existing features)

**When to use this guide:**
- Full-stack features involving frontend, backend, AND database
- Features requiring new database tables or schema changes
- Features with complex API contracts

**When NOT to use this guide:**
- Simple frontend-only UI changes (see AGENTS.md for simplified structure)
- Backend-only endpoint additions using existing tables
- Configuration or styling updates

## Development Workflow (3 Phases)

Work flows in a **bottom-up pattern**:
```
Database → Backend → Frontend
(Phase 1)  (Phase 2)  (Phase 3)
```

### Phase 1: Database - Schema, Tables, Functions, Migrations
**Goal:** Create all database structures needed for the feature

**Responsibilities:**
- Design table schemas with columns, types, relationships
- Create database functions or stored procedures if needed
- Generate migration file scripts
- Suggest indexes and constraints
- Provide sample seed data scripts (optional)
- Document ERD changes

**Deliverables:**
All files should be placed in `openspec/changes/[change-id]/deliverables/`:
- **Migration files** → `deliverables/migrations/`
  - e.g., `001_create_profiles.sql`, `002_create_experience.sql`, `003_add_indexes.sql`
- **Schema documentation** → `deliverables/schemas/`
  - ERD diagrams (if complex), table definitions, relationship docs
  - File: `SCHEMA_DESIGN.md` or `schema-overview.md`
- **Domain models** → `deliverables/schemas/domain-models.ts`
  - TypeScript types matching database tables
- **Sample seed data** (optional) → `deliverables/seeds/`
  - e.g., `profile_seeds.sql`

**Important Notes:**
- ✅ If database work is already complete, mark tasks as `[x] ✅ Already complete`
- Document which migrations have been applied
- Ensure domain models are exported for backend use

---

### Phase 2: Backend (API) - Create Endpoints
**Goal:** Build REST API endpoints that interact with database

**Responsibilities:**
- Create API endpoints in `server/api/` following Nuxt conventions
- Implement CRUD operations (GET, POST, PATCH, DELETE)
- Connect to database tables/functions
- Add validation using Zod schemas
- Add error handling and proper HTTP status codes
- Create DTOs (Data Transfer Objects) for API requests/responses

**Deliverables:**
All files should be placed in `openspec/changes/[change-id]/deliverables/schemas/`:
- **API specification** → `deliverables/schemas/api-spec.md`
  - Document all endpoints, request/response formats, error codes
  - Include example requests and responses
- **API DTOs** → `deliverables/schemas/api-dtos.ts`
  - Request and response type definitions
- **Functional endpoints** → Implemented in `server/api/`
  - All CRUD endpoints working with real database

**Important Notes:**
- ✅ If API endpoints are already complete, mark tasks as `[x] ✅ Already complete`
- List which endpoints exist and their paths
- Ensure all endpoints are tested and return proper responses

---

### Phase 3: Frontend - Mock UI, Then Integrate via Store
**Goal:** Build user interface and connect to backend APIs

**Sub-Phase 3A: Mock UI**
**Responsibilities:**
- Create page components (`pages/`)
- Create reusable components (`components/`)
- Build forms with validation schemas
- Use placeholder/mock data initially
- Ensure UI matches design requirements
- Test UX flow without backend calls

**Sub-Phase 3B: Integration via Store**
**Responsibilities:**
- Connect UI to Pinia store (e.g., `careerIDStore`)
- Update store actions to call real API endpoints
- Replace mock data with store state
- Handle loading states (use store's `isLoading`, `isSaving`)
- Handle error states and display user feedback
- Add toast notifications for success/error
- Test complete flow with real API calls

**Deliverables:**
- Fully functional UI components
- Store integrated with API endpoints
- Working end-to-end feature
- Error handling and loading states
- User feedback (toasts, validation messages)

**Important Notes:**
- Always use the Pinia store as the data layer (don't call APIs directly from components)
- Store updates automatically propagate to other features
- Follow existing patterns in the codebase (check `pages/settings/` for examples)

---

## Task Grouping Structure

**If user stories exist in `context/` folder, use this structure:**
```markdown
## USER STORY 1: [Story Title]

### Database
- [x] ✅ [Completed work]
- [ ] [Pending work, if any]

### Backend (API)
- [x] ✅ [Completed endpoints]
- [ ] [Pending endpoints, if any]

### Frontend
- [ ] [UI components]
- [ ] [Store integration]
- [ ] [Error handling]

## USER STORY 2: [Story Title]
[Repeat structure]
```

**If no user stories, use standard 3-phase structure:**
```markdown
## 1. Database: Schema + Tables + Functions

- [ ] Design table schemas
- [ ] Create migration scripts
- [ ] Create database functions/procedures (if needed)
- [ ] Document schema in deliverables/schemas/
- [ ] Create domain models (TypeScript types)

## 2. Backend (API): Create Endpoints

- [ ] Define API specification
- [ ] Create DTOs for requests/responses
- [ ] Implement GET endpoints
- [ ] Implement POST endpoints
- [ ] Implement PATCH/PUT endpoints
- [ ] Implement DELETE endpoints
- [ ] Add validation and error handling

## 3. Frontend: Mock UI + Store Integration

### 3A. Mock UI
- [ ] Create page components
- [ ] Create reusable components
- [ ] Build forms with validation
- [ ] Use placeholder data
- [ ] Test UX flow

### 3B. Store Integration
- [ ] Connect UI to Pinia store
- [ ] Update store actions to call APIs
- [ ] Replace mock data with store state
- [ ] Add loading and error states
- [ ] Add toast notifications
- [ ] Test end-to-end with real API
```

---

## Example: Profile Management Feature

### Before (Incorrect Grouping):
```markdown
## 1. Create Profile Page Component
- Create profile.vue file
- Add navbar
- Add content areas

## 2. Create Profile API
- Add GET endpoint
- Add UPDATE endpoint

## 3. Create Database Tables
- Create profile table
- Add migrations
```

### After (Correct Grouping with User Stories):
```markdown
## USER STORY 1: View Profile Dashboard

### Database
- [x] ✅ user_profiles table already exists
- [x] ✅ Migration 001_create_user_profiles.sql applied
- [x] ✅ Indexes on user_id and email exist

### Backend (API)
- [x] ✅ GET /api/career-id/profile/:profileId exists
- [x] ✅ Returns complete profile with all sections

### Frontend
- [ ] Create pages/profile/index.vue with navigation
- [ ] Fetch profile using careerIDStore.fetchProfile()
- [ ] Display contact info, summary, social links
- [ ] Handle loading state with skeleton
- [ ] Handle error state (redirect to onboarding if no profile)

## USER STORY 2: Edit Contact Information

### Database
- [x] ✅ contact_info table already exists
- [x] ✅ All fields present (email, phone, linkedin, etc.)

### Backend (API)
- [x] ✅ GET /api/career-id/profile/:profileId/contact exists
- [x] ✅ PATCH /api/career-id/profile/:profileId/contact/:id exists
- [x] ✅ careerIDStore.updateContactInfo() method exists

### Frontend
- [ ] Add contact info form to pages/profile/index.vue
- [ ] Use UForm with Zod validation schema
- [ ] Pre-populate form with careerIDStore.contactInfo
- [ ] Validate email, phone, URL formats
- [ ] Call careerIDStore.updateContactInfo() on submit
- [ ] Show toast notification on success/error
- [ ] Display loading state during save
```

### Alternative: Without User Stories (Standard 3-Phase)
```markdown
## 1. Database: Schema + Tables + Functions

- [ ] Design user_profiles table (id, user_id, name, email, bio, avatar_url, updated_at)
- [ ] Create migration script: deliverables/migrations/001_create_user_profiles.sql
- [ ] Add indexes on user_id and email
- [ ] Document schema in deliverables/schemas/SCHEMA_DESIGN.md
- [ ] Create domain model: deliverables/schemas/domain-models.ts (Profile type)

## 2. Backend (API): Create Endpoints

- [ ] Document API spec in deliverables/schemas/api-spec.md
- [ ] Create DTOs in deliverables/schemas/api-dtos.ts (ProfileDTO, ProfileUpdateRequest)
- [ ] Implement GET /api/career-id/profile/:profileId in server/api/
- [ ] Implement PATCH /api/career-id/profile/:profileId in server/api/
- [ ] Add Zod validation for email format, bio length
- [ ] Add error handling (404 if not found, 401 if unauthorized)

## 3. Frontend: Mock UI + Store Integration

### 3A. Mock UI
- [ ] Create pages/profile/index.vue with basic layout
- [ ] Add form fields (name, email, bio, avatar)
- [ ] Use placeholder data for initial testing
- [ ] Test edit mode toggle, save/cancel buttons

### 3B. Store Integration
- [ ] Add profile state to careerIDStore
- [ ] Create fetchProfile() action
- [ ] Create updateProfile() action
- [ ] Connect form to store state
- [ ] Call careerIDStore.fetchProfile() on mount
- [ ] Call careerIDStore.updateProfile() on submit
- [ ] Add loading spinner (use store.isSaving)
- [ ] Add success/error toasts
- [ ] Handle validation errors from backend
```

---


## Key Principles

1. **Check for user stories first** - Always look in `context/` folder for existing user stories before creating tasks
2. **Structure by user story** - If stories exist, create one task group per story with Database → Backend → Frontend sections
3. **Mark completed work** - Use `[x] ✅` to indicate work already done (especially database/backend)
4. **Bottom-up flow** - Always go Database → Backend → Frontend
5. **Database first** - Tables and functions must exist before API work
6. **Backend second** - API endpoints must exist before frontend integration
7. **Frontend last** - Mock UI first with placeholder data, then integrate via store
8. **Use the store** - Always integrate with Pinia store (e.g., careerIDStore), never call APIs directly from components
9. **Complete deliverables** - Each phase produces files in `deliverables/` folder (migrations, schemas, API specs)
10. **One feature at a time** - Don't mix responsibilities or jump between phases

---

## Quick Reference

| Phase | Team | Focus | Key Deliverables |
|-------|------|-------|------------------|
| 1 | Database | Tables, functions, migrations | Migration files, schema docs, domain models |
| 2 | Backend | API endpoints | API spec, DTOs, functional endpoints |
| 3A | Frontend | Mock UI | Page components, forms, placeholder data |
| 3B | Frontend | Store integration | Connected store, API calls, error handling |

## Checklist for Starting a New Feature

- [ ] 1. Check `openspec/changes/[change-id]/context/` for user stories
- [ ] 2. If stories exist, create one task group per user story
- [ ] 3. For each group, add Database, Backend, Frontend sections
- [ ] 4. Mark any completed work with `[x] ✅`
- [ ] 5. List what's already done (tables, endpoints, etc.)
- [ ] 6. Focus tasks on what remains (usually frontend work)

## Example Task Flow

```markdown
## USER STORY 1: View Dashboard

### Database
- [x] ✅ Tables exist (profiles, experience, education)
- [x] ✅ Function get_full_profile() exists

### Backend (API)  
- [x] ✅ GET /api/career-id/profile/:profileId exists
- [x] ✅ careerIDStore.fetchProfile() method exists

### Frontend
- [ ] Create pages/profile/index.vue
- [ ] Call careerIDStore.fetchProfile() on mount
- [ ] Display data from store
- [ ] Add loading/error states
```

## Common Patterns

**For new features (nothing exists yet):**
1. Database: Create all tables/functions/migrations first
2. Backend: Build all API endpoints
3. Frontend: Mock UI, then integrate via store

**For existing features (database/API done):**
1. Database: Mark as `[x] ✅ Complete`
2. Backend: Mark as `[x] ✅ Complete`  
3. Frontend: Focus all tasks here

**For partial features (database done, API partial):**
1. Database: Mark as `[x] ✅ Complete`
2. Backend: List remaining endpoints to build
3. Frontend: Wait until backend complete, then proceed

Follow this bottom-up (Database → Backend → Frontend) pattern for all features to ensure proper dependencies and smooth implementation.