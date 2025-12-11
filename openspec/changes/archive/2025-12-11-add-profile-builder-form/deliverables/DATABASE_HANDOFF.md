# Database Team Handoff: Profile Builder

**Date:** 2025-11-18  
**Feature:** Career Sage Profile Builder  
**Status:** Ready for Phase 3 Implementation

---

## Overview

This document provides everything the database team needs to implement the Career Sage Profile Builder backend. The frontend and API mocks are complete and tested. Database implementation is the next phase.

---

## What's Been Completed

✅ **Frontend UI** - All profile form sections built and working  
✅ **TypeScript Types** - Complete type definitions in `app/types/index.d.ts`  
✅ **API Contract** - Full specification in `deliverables/schemas/api-spec.md`  
✅ **Domain Models** - Database schema types in `deliverables/schemas/domain-models.ts`  
✅ **DTOs** - Request/response types in `deliverables/schemas/api-dtos.ts`  
✅ **Mock Endpoints** - All API endpoints returning mock data  
✅ **Mock Data Samples** - Example responses in `deliverables/mocks/profile-responses.json`

---

## What Needs to Be Built

### Phase 3: Database Schema & Migrations (Your Task)

Implement the database schema in the `career_id` schema (NOT `jobsearchsage` schema).

**Why separate schemas?**
- `career_id` = Career Sage Core Platform (profile data) - shared across all Career Sage applications
- `jobsearchsage` = Application-specific data (job applications, resumes, etc.)
- This separation enables the platform vision: other Career Sage apps can access core profile data

#### 3.1 Database Tables Required

All tables go in the **`career_id`** schema:

1. **`career_id.profiles`**
   - Main profile metadata
   - One per user
   - Tracks completion status

2. **`career_id.work_experiences`**
   - Professional work history
   - Many per profile
   - Includes highlights as JSON array

3. **`career_id.education`**
   - Educational background
   - Many per profile
   - Includes coursework and minors as JSON arrays

4. **`career_id.certifications`**
   - Professional certifications
   - Many per profile

5. **`career_id.skill_categories`**
   - User-defined skill groupings
   - Many per profile
   - Skills stored as simple string array (simplified from original junction table design)

6. **`career_id.contact_info`**
   - Contact details and professional links
   - One per profile (one-to-one relationship)
   - Includes websites as JSON array

#### 3.2 Key Schema Details

**Field Name Conventions:**
- Database: `snake_case` (e.g., `first_name`, `start_date`, `current_position`)
- Frontend/API: `camelCase` (e.g., `firstName`, `startDate`, `currentPosition`)
- Backend maps between these automatically

**UUID Types:**
- All IDs should be UUIDs (not auto-incrementing integers)
- Enables distributed systems and prevents enumeration attacks

**Timestamps:**
- All tables need `created_at` and `updated_at` (timestamptz)
- Use database triggers or ORM hooks for automatic updates

**Display Order:**
- All array-type sections (work experience, education, etc.) have `display_order` INTEGER
- Allows users to reorder entries
- Default to 0 if not specified

**JSON Fields:**
- `work_experiences.highlights`: TEXT[] or JSONB array of strings
- `education.coursework`: TEXT[] or JSONB array of strings
- `education.minors`: TEXT[] or JSONB array of strings
- `skill_categories.skills`: TEXT[] or JSONB array of strings
- `contact_info.websites`: TEXT[] or JSONB array of strings

**Nullable Fields:**
- See `domain-models.ts` for complete nullable field list
- Many fields are optional (marked with `| null` in TypeScript)

---

## File References

### Essential Documentation

1. **`deliverables/schemas/domain-models.ts`**
   - Authoritative database schema in TypeScript
   - Every field documented with JSDoc comments
   - Shows exactly what needs to be in the database

2. **`deliverables/schemas/api-spec.md`**
   - Complete API contract
   - All endpoints, request/response formats
   - Validation rules for every field
   - HTTP status codes and error handling

3. **`deliverables/schemas/api-dtos.ts`**
   - Data transfer objects (API layer)
   - Shows camelCase → snake_case mapping

4. **`deliverables/mocks/profile-responses.json`**
   - Example API responses with realistic data
   - Useful for understanding data structure

5. **`design.md`**
   - Architecture decisions and rationale
   - Why we chose normalized schema
   - Why `career_id` vs `jobsearchsage` schemas

---

## Migration Scripts To Create

Create in `deliverables/migrations/`:

```
002_create_profiles.sql                - Profiles table
003_create_work_experiences.sql        - Work experience table
004_create_education.sql               - Education table
005_create_certifications.sql          - Certifications table
006_create_skill_categories.sql        - Skill categories table
007_create_contact_info.sql            - Contact info table
008_add_indexes.sql                    - Foreign key indexes, performance indexes
```

### Migration Script Template

```sql
-- Example: 002_create_profiles.sql

CREATE TABLE IF NOT EXISTS open_career.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completion_status TEXT NOT NULL DEFAULT 'incomplete' CHECK (completion_status IN ('incomplete', 'complete', 'verified')),
  
  -- Constraints
  UNIQUE(user_id) -- One profile per user
);

-- Indexes
CREATE INDEX idx_profiles_user_id ON open_career.profiles(user_id);

-- Updated timestamp trigger
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON open_career.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (if using Supabase/PostgreSQL RLS)
ALTER TABLE open_career.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON open_career.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own profile"
  ON open_career.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON open_career.profiles FOR UPDATE
  USING (auth.uid() = user_id);
```

---


## Implementation Checklist

### Before You Start
- [ ] Read `design.md` to understand architecture decisions
- [ ] Review `domain-models.ts` for complete schema
- [ ] Check `api-spec.md` for validation rules
- [ ] Confirm auth system integration (user_id foreign key)

### Database Implementation
- [ ] Create `open_career` schema if not exists
- [ ] Create all 6 tables with proper types
- [ ] Add foreign key constraints (user_id, profile_id)
- [ ] Add indexes on foreign keys and frequently queried fields
- [ ] Add check constraints (e.g., completion_status enum)
- [ ] Add unique constraints where needed (e.g., one profile per user)
- [ ] Set up updated_at triggers
- [ ] Configure Row Level Security policies (if using Supabase)
- [ ] Create seed data for testing (optional)

---

## Data Examples

See `deliverables/mocks/profile-responses.json` for complete examples.

### Minimal Profile (New User)
```json
{
  "profile": { "completion_status": "incomplete" },
  "work_experiences": [],
  "education": [],
  "certifications": [],
  "skill_categories": [],
  "contact_info": null
}
```

### Complete Profile
See `profile-responses.json` → `getCompleteProfile`

---

## Validation Rules Summary

**Email:** Valid email format (RFC 5322)  
**Phone:** E.164 format recommended (e.g., `+14155552671`)  
**URLs:** Valid URL format (https:// or http://)  
**Dates:** ISO 8601 format (YYYY-MM-DD)  
**End Date:** Must be >= start_date if both provided  
**Highlights:** Minimum 1 per work experience  
**Skills:** Minimum 1 per skill category  

Full validation rules in `api-spec.md`.

---

## Important Notes

⚠️ **Schema Placement:** All tables MUST go in `career_id` schema, NOT `jobsearchsage`

⚠️ **Transactions:** Profile creation (POST /api/profile) involves multiple tables - use database transactions

⚠️ **Authorization:** Users can only access their own profiles - enforce at database and API level

⚠️ **Field Mapping:** API uses camelCase, database uses snake_case - map in backend layer

⚠️ **Timestamps:** Use TIMESTAMPTZ (not TIMESTAMP) for proper timezone handling

⚠️ **JSON vs Arrays:** Use PostgreSQL arrays (TEXT[]) or JSONB for array fields (highlights, coursework, skills, websites)

---

## Questions?

- Review `design.md` for architecture rationale
- Check `api-spec.md` for detailed endpoint behavior
- See `domain-models.ts` for complete field documentation

