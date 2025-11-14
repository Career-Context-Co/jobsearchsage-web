# Task Grouping Guide for AI Agents

## Overview
When breaking down feature specifications into implementation tasks, group tasks by **team responsibility** and **workflow phase**. Our development process follows a 5-phase sequential handoff pipeline.

## ⚠️ Critical: Sequential Implementation Required

**Features using this guide CANNOT be implemented all at once.** This is a phased, collaborative workflow:

1. **Stop and wait between phases** - Complete the current phase, provide deliverables, and WAIT for approval before proceeding
2. **Database work is human-only** - AI agents can generate migration files and schema definitions but MUST wait for human review and execution before Phase 4
3. **Provide clear handoffs** - Each phase ends with specific deliverables for the next team
4. **Request approval explicitly** - After completing a phase, state what was delivered and ask "Ready to proceed to Phase X?"

**When to use this guide:**
- Full-stack features involving frontend, backend, AND database
- Features requiring new database tables or schema changes
- Features with complex API contracts

**When NOT to use this guide:**
- Simple frontend-only UI changes (see AGENTS.md for simplified structure)
- Backend-only endpoint additions using existing tables
- Configuration or styling updates

## Development Workflow (5 Phases)

Work flows in a **top-down and back-up pattern**:
```
Frontend → Backend → Database → Backend → Frontend
(Phase 1)  (Phase 2)  (Phase 3)   (Phase 4)  (Phase 5)
```

### Phase 1: Frontend - UI Mock + Initial Data Shapes
**Goal:** Establish user experience and identify required data

**Responsibilities:**
- Create UI mockups or working prototypes with placeholder data
- Define loose data shapes based on screen requirements
- List expected interactions (create/update, filters, buttons, navigation)
- Identify required API calls at high level

**Deliverables to Backend:**
- UI mock/prototype
- Draft data shapes (JS/TS interfaces)
- List of required API endpoints

---

### Phase 2: Backend - API Contract + Mock Endpoints
**Goal:** Formalize request/response models and provide mocked APIs

**Responsibilities:**
- Convert frontend's loose data shapes into typed domain models
- Define API contract (endpoints, request/response objects, errors, auth)
- Create mock endpoints returning static JSON or in-memory data
- Validate contract with frontend

**Deliverables to Database:**
Place in `openspec/changes/[change-id]/deliverables/`:
- **API contract/spec** → `deliverables/schemas/api-contract.yaml` (OpenAPI) or `deliverables/schemas/api-spec.md`
- **Mocked API endpoints** → Implemented in `server/api/` (actual code)
- **Agreed-upon domain + DTO models** → `deliverables/schemas/domain-models.ts` or documented in API spec

---

### Phase 3: Database - Schema + Data Layer Structures
**Goal:** Translate API contract into real database structures

**⚠️ HUMAN-ONLY PHASE - AI agents STOP here and wait**

**AI Agent Responsibilities:**
- Generate migration file scripts
- Design table schemas with columns, types, relationships
- Suggest indexes and constraints
- Provide sample seed data scripts
- Document ERD changes

**AI Agent Deliverables (for human review):**
All files should be placed in `openspec/changes/[change-id]/deliverables/`:
- **Migration files** → `deliverables/migrations/`
  - e.g., `001_create_profiles.sql`, `002_add_indexes.sql`
- **Schema documentation** → `deliverables/schemas/`
  - ERD diagrams, table definitions, relationship docs
- **Suggested indexes and constraints** → Include in schema docs
- **Sample seed data** (optional) → `deliverables/seeds/`

**Human Responsibilities:**
- Review and approve migration files
- Execute migrations against database
- Verify schema is correctly applied
- Confirm database is ready for Phase 4

**🛑 AI agents MUST wait for explicit approval and confirmation that database changes are applied before proceeding to Phase 4.**

---

### Phase 4: Backend - Integrate API With Real DB
**Goal:** Replace mock data with real database queries and business logic

**Responsibilities:**
- Connect repositories/services to real database tables
- Implement CRUD operations according to API contract
- Apply business rules, validation, authorization
- Ensure stable, production-ready API behavior

**Deliverables to Frontend:**
- Fully functional API endpoints backed by DB
- Updated documentation (if API changed)

---

### Phase 5: Frontend - Final Integration + QA
**Goal:** Consume real backend data and complete the feature

**Responsibilities:**
- Replace mock calls with real API calls
- Handle loading/error states
- Finalize UI logic and polish interactions
- End-to-end testing with backend + QA team
- Fix UX/data issues raised during testing

**Deliverables:**
- Production-ready UI integrated with backend
- Released feature

---

## Task Grouping Structure

Group all tasks into these 5 phases:
```markdown
## 1. Frontend: UI Mock + Data Shapes
- [UI components and mockups]
- [Draft data interfaces]
- [API endpoint requirements]
- [Interaction specifications]

## 2. Backend: API Contract + Mocks
- [Domain model definitions]
- [API contract/spec creation]
- [Mock endpoint implementation]
- [Contract validation with frontend]

## 3. Database: Schema + Migrations
- [Table design]
- [Migration scripts]
- [Stored procedures/functions]
- [Constraints and indexes]

## 4. Backend: Real DB Integration
- [Repository/service implementation]
- [CRUD operations]
- [Business logic and validation]
- [Authorization rules]

## 5. Frontend: Real API Integration
- [Replace mocks with real calls]
- [Error and loading states]
- [UI polish and finalization]
- [End-to-end testing]
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

### After (Correct Grouping):
```markdown
## 1. Frontend: UI Mock + Data Shapes
- Create profile.vue page component with navbar and content areas
- Define ProfileData interface (name, email, bio, avatar)
- Specify required endpoints: GET /api/profile, PUT /api/profile
- Document expected interactions: edit mode toggle, save button, cancel button

## 2. Backend: API Contract + Mocks
- Define Profile domain model and ProfileDTO (save to `deliverables/schemas/domain-models.ts`)
- Create API contract in `deliverables/schemas/api-spec.yaml`: GET /api/profile returns ProfileDTO, PUT /api/profile accepts ProfileUpdateRequest
- Implement mock GET endpoint in `server/api/profile.get.ts` returning sample profile JSON
- Implement mock PUT endpoint in `server/api/profile.put.ts` accepting updates and returning success
- Share API spec with frontend for validation

## 3. Database: Schema + Migrations
- Design user_profiles table (id, user_id, name, email, bio, avatar_url, updated_at)
- Create migration script in `deliverables/migrations/001_create_user_profiles.sql`
- Add indexes on user_id and email (in migration)
- Document schema in `deliverables/schemas/user_profiles_schema.md`
- Create sample seed data in `deliverables/seeds/user_profiles_seeds.sql` (optional)

## 4. Backend: Real DB Integration
- Connect ProfileRepository to user_profiles table
- Implement getProfile and updateProfile methods with real queries
- Add validation: email format, bio length limits
- Add authorization: users can only update their own profiles

## 5. Frontend: Real API Integration
- Replace mock profile data with real GET /api/profile call
- Connect save button to real PUT /api/profile call
- Add loading spinner during save operations
- Add error toast for failed updates
- Handle 401/403 authorization errors
```

---


## Key Principles

1. **Sequential phases** - Each phase must complete before the next begins. DO NOT proceed without approval.
2. **Clear handoffs** - Each phase produces specific deliverables for the next team. State what was delivered and request approval.
3. **Top-down then back-up** - Flow goes Frontend → Backend → Database, then back to Backend → Frontend
4. **One group per phase** - Don't mix responsibilities from different phases
5. **Complete deliverables** - Each phase produces everything needed for the next team to start
6. **Human database work** - Phase 3 requires human review and execution. AI agents generate files but MUST wait.
7. **Explicit approval gates** - After each phase, explicitly ask: "Phase X complete. Ready to proceed to Phase Y?"

---

## Quick Reference

| Phase | Team | Focus | Hands Off To | AI Agent Action |
|-------|------|-------|--------------|-----------------|
| 1 | Frontend | UI mock + data shapes | Backend | Complete & wait for approval |
| 2 | Backend | API contract + mocks | Database | Complete & wait for approval |
| 3 | Database | Schema + migrations | Backend | **Generate files, STOP, wait for human** |
| 4 | Backend | Real DB integration | Frontend | Complete & wait for approval |
| 5 | Frontend | Real API integration | Release | Complete & deliver |

## AI Agent Workflow Example

```
AI: "Phase 1 complete. Deliverables: profile.vue with mock data, ProfileData interface, 
     list of required endpoints. Ready to proceed to Phase 2?"
     
USER: "Yes, proceed"

AI: "Phase 2 complete. Deliverables: Profile domain model, API contract with GET/PUT endpoints,
     mock API returning sample JSON. Ready to proceed to Phase 3?"
     
USER: "Yes"

AI: "Phase 3 files generated. Deliverables in openspec/changes/[change-id]/deliverables/:
     - migrations/001_create_user_profiles.sql
     - schemas/user_profiles_schema.md
     - schemas/user_profiles_erd.png
     🛑 WAITING: Please review and execute database migrations. Confirm when ready for Phase 4."
     
USER: "Migrations applied successfully, proceed"

AI: "Phase 4 complete. Deliverables: ProfileRepository with real DB queries, validation rules,
     authorization checks. Ready to proceed to Phase 5?"
```

Follow this 5-phase grouping pattern for all full-stack features to ensure smooth team handoffs and clear ownership.