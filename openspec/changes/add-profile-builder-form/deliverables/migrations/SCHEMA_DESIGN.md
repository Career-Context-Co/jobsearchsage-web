# Career Sage Profile Database Schema Design

**Schemas:** `career_id` (profile data), `reference` (lookup/catalog data)
**Database:** PostgreSQL  
**Date:** 2025-11-24  
**Status:** Design Review - Updated

---

## Quick Summary

**7 Tables in `career_id` schema (profile/user data):**
1. `profiles` - Main profile metadata (Prefixed ID: `prof_`)
2. `experience` - Professional experience including work, internships, volunteer, freelance (INTEGER)
3. `education` - Educational background (INTEGER)
4. `certifications` - Professional certifications (INTEGER)
5. `profile_skills` - Profile-skill junction with metadata (INTEGER)
6. `contact_info` - Contact information (Prefixed ID: `cont_`)
7. `profile_social_links` - Profile-platform junction with URLs (INTEGER)

**2 Tables in `reference` schema (lookup/catalog data):**
8. `skills` - Master skills catalog (INTEGER)
9. `social_platforms` - Master social platforms catalog (INTEGER)

**Key Design Choices:**
- **Schema separation:** `career_id` for profile data, `reference` for lookup/catalog data - clear separation of concerns
- **Prefixed IDs** for primary entities (profiles, contact_info) - self-documenting, type-safe, industry standard
- **Dual-ID strategy** for primary entities: `id` (TEXT, public API) + `internal_id` (BIGSERIAL, internal operations)
- **INTEGER auto-increment** for child/dependent tables and catalog tables (experience, education, skills, social_platforms, etc.)
- PostgreSQL ENUMs for constrained choices (completion_status, employment_type, location_type, skill_level)
- JSONB for array fields (highlights, coursework, aliases, websites)
- Minimal database constraints - validation at application layer
- ON DELETE SET NULL for skills/platforms with cached fallback display

| Table | ID Strategy | Prefix | Schema | Rationale |
|-------|-------------|--------|--------|-----------|
| profiles | Prefixed ID + internal_id | `prof_` | career_id | Primary entity, public API surface |
| experience | INTEGER | n/a | career_id | Child data, accessed via profile |
| education | INTEGER | n/a | career_id | Child data, accessed via profile |
| certifications | INTEGER | n/a | career_id | Child data, accessed via profile |
| skills | INTEGER | n/a | reference | Catalog data, always accessed via profile |
| profile_skills | INTEGER | n/a | career_id | Junction table, child data |
| contact_info | Prefixed ID + internal_id | `cont_` | career_id | Primary entity, one-to-one with profile |
| social_platforms | INTEGER | n/a | reference | Catalog data, standardizes platform names |
| profile_social_links | INTEGER | n/a | career_id | Junction table, child data |

---

## PostgreSQL ENUMs

These ENUMs must be created before tables:

```sql
-- Profile completion status
CREATE TYPE career_id.completion_status_enum AS ENUM (
  'incomplete',
  'complete', 
  'verified'
);

-- Employment type
CREATE TYPE career_id.employment_type_enum AS ENUM (
  'full_time',
  'part_time',
  'self_employed',
  'freelance',
  'contract',
  'internship',
  'apprenticeship',
  'seasonal',
  'volunteer'
);

-- Location type
CREATE TYPE career_id.location_type_enum AS ENUM (
  'on_site',
  'hybrid',
  'remote'
);

-- Skill proficiency levels
CREATE TYPE career_id.skill_level_enum AS ENUM (
  'beginner',
  'intermediate',
  'advanced',
  'expert'
);
```

---

## Schema Separation: `career_id` vs `reference`

We use two separate PostgreSQL schemas to organize data by purpose:

**`career_id` schema** - Profile and user data
- Transactional data that changes frequently
- User-specific information
- Tables: profiles, experience, education, certifications, profile_skills, contact_info, profile_social_links

**`reference` schema** - Lookup/catalog data
- Reference data shared across all users
- Changes infrequently (new skills/platforms added occasionally)
- Tables: skills, social_platforms

**Benefits of Schema Separation:**

1. **Clear Separation of Concerns** - Instantly know what's reference data vs transactional data
2. **No Naming Pollution** - Main schema stays clean, no need for `cat_` prefixes
3. **Easier Permissions** - Can set different access controls (e.g., `reference` read-only for most users)
4. **Better Organization** - As more lookup tables are added (industries, job titles, locations), they all go in one place
5. **Easier to Reason About** - `reference.skills` is clearer than `cat_skills` or `skills_category`
6. **Future-Proof** - Easy to add more lookup tables (companies, schools, certifications) without cluttering main schema

**Usage in Code:**

```typescript
// Explicitly reference the schema
const skills = await db.query('SELECT * FROM reference.skills');

// Or set search_path if you want
await db.query('SET search_path TO career_id, reference');
const skills = await db.query('SELECT * FROM skills'); // Now finds reference.skills
```

---

## Prefixed ID Strategy

### Why Prefixed IDs?

We're following the pattern used by Stripe, OpenAI, Anthropic, and other API-first companies:

**Benefits:**
1. **Self-Documenting** - Type visible in ID: `prof_...` is clearly a profile, `skill_...` is clearly a skill
2. **Type Safety** - Prevents bugs: Can't accidentally use a skill ID where profile ID expected
3. **Better DX** - External developers immediately understand resource types from IDs
4. **Industry Standard** - Aligns with API best practices

**Examples:**
- `prof_xK9j2mP4nQ8rL5tY7vW3zB1c` - Profile
- `cont_5tY7vW3zB1cxK9j2mP4nQ8r` - Contact Info
- `usr_9jK2mN5pQ8rL3tY6vW4zB7c` - User (future)

### Dual-ID Approach

Primary entities use **two IDs** for best of both worlds:

| ID | Type | Purpose | Visibility |
|----|------|---------|------------|
| `id` | TEXT | Public API, foreign keys, external references | External |
| `internal_id` | BIGSERIAL | Sorting, partitioning, internal operations | Internal only |

**Why both?**
- **Public API:** Use human-readable prefixed IDs for clarity
- **Performance:** Use integer IDs for fast internal operations
- **Scalability:** internal_id enables efficient range partitioning
- **Minimal cost:** ~38 bytes per entity vs 16 bytes for UUID alone

### ID Generation

IDs generated by **application backend** before insert (not database):

```typescript
import { createId } from '@paralleldrive/cuid2';

function generatePrefixedId(prefix: string): string {
  return `${prefix}_${createId()}`;
}

// Usage
const profileId = generatePrefixedId('prof');
await db.profiles.insert({
  id: profileId,
  user_id: userId,
  // internal_id auto-generated by database
});
```

**Properties:**
- 128-bit entropy (collision-resistant)
- URL-safe characters
- Monotonically increasing (helpful for B-tree indexes)
- Library: CUID2, nanoid, or similar

### Prefix Registry

| Prefix | Entity | Example |
|--------|--------|---------|
| `prof_` | Profile | `prof_xK9j2mP4nQ8rL5tY7vW3zB1c` |
| `cont_` | Contact Info | `cont_5tY7vW3zB1cxK9j2mP4nQ8r` |
| `usr_` | User (future auth) | `usr_9jK2mN5pQ8rL3tY6vW4zB7c` |

**Note:** Skills (skills) use INTEGER IDs since they're always accessed in profile context, not as independent API resources.

---

## Overview

This document describes the database schema for Career Sage Profile Builder. All tables live in the `career_id` schema (Career Sage Core Platform), separate from application-specific data.

**Design Principles:**
- Normalized schema with separate tables for each profile section
- **Prefixed IDs** for primary entities (self-documenting, type-safe, follows Stripe/OpenAI pattern)
- **Dual-ID approach**: TEXT id (public API) + BIGSERIAL internal_id (database operations) for primary entities
- INTEGER auto-increment for child/dependent data
- TIMESTAMPTZ for all timestamps (timezone-aware)
- snake_case naming for database fields
- Foreign keys with appropriate cascade behavior
- Display order fields for user-defined sorting
- Skills use junction table pattern with master catalog
- PostgreSQL ENUMs for constrained choice fields
- JSONB for array/structured data
- Minimal database constraints (validation primarily at application layer)

---

## 3.1 Table: career_id.profiles

**Purpose:** Main profile metadata record. One profile per user. Root entity for all career data.

**ID Strategy:** Prefixed ID (`prof_`) with dual-ID approach

### Columns

| Column | Type | Constraints | Nullable | Description |
|--------|------|-------------|----------|-------------|
| `internal_id` | BIGSERIAL | UNIQUE | NOT NULL | Internal database ID for sorting/partitioning |
| `id` | TEXT | PRIMARY KEY | NOT NULL | Public prefixed ID (e.g., `prof_xK9j2mP4nQ8rL5tY`) |
| `user_id` | TEXT | UNIQUE | NOT NULL | Reference to user (auth system TBD, will use prefixed ID) |
| `completion_status` | completion_status_enum | DEFAULT 'incomplete' | NOT NULL | Profile completion status |
| `deleted_at` | TIMESTAMPTZ | | NULL | Timestamp when profile was soft deleted (NULL = active) |
| `is_deleted` | BOOLEAN | DEFAULT false | NOT NULL | Soft delete flag (false = active, true = deleted) |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | NOT NULL | Timestamp when profile was created |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | NOT NULL | Timestamp when profile was last updated |

### Constraints
- **PRIMARY KEY:** `id` (TEXT - prefixed ID)
- **UNIQUE:** `internal_id` (for internal operations)
- **UNIQUE:** `user_id` (one profile per user)

### Indexes
- `idx_profiles_internal_id` on `internal_id` (for chronological queries)
- `idx_profiles_user_id` on `user_id` (for lookups by user)
- `idx_profiles_is_deleted` on `is_deleted` WHERE `is_deleted = false` (partial index for efficient filtering of active profiles)
- `idx_profiles_deleted_at` on `deleted_at` WHERE `deleted_at IS NOT NULL` (partial index for churn analytics)

### Notes
- **Prefixed ID:** `prof_` prefix for self-documenting IDs (e.g., `prof_xK9j2mP4nQ8rL5tY7vW3zB1c`)
- **Dual-ID approach:** 
  - `id` (TEXT): Used for public API, foreign keys, all external references
  - `internal_id` (BIGSERIAL): Used for efficient sorting, partitioning, internal operations
- **Soft Delete Pattern:** 
  - Profiles use soft delete for churn tracking and analytics
  - When deleting, set both `is_deleted = true` AND `deleted_at = NOW()`
  - Never hard delete profiles to preserve historical data
  - Filter queries: `WHERE is_deleted = false` for active profiles
  - Churn analytics: Query `deleted_at` for deletion patterns over time
- ID generated by application backend before insert using CUID2 or similar
- One-to-one relationship with users
- completion_status uses PostgreSQL ENUM for type safety
- user_id will become foreign key when auth system is implemented (will also use prefixed ID like `usr_`)
- updated_at should auto-update via trigger

---

## 3.2 Table: career_id.experience

**Purpose:** Professional experience entries. Many per profile. Includes full-time work, part-time, freelance, internships, volunteer work, and other professional activities.

**ID Strategy:** INTEGER auto-increment (child entity)

### Columns

| Column | Type | Constraints | Nullable | Description |
|--------|------|-------------|----------|-------------|
| `id` | INTEGER | PRIMARY KEY, GENERATED ALWAYS AS IDENTITY | NOT NULL | Unique identifier for this experience entry |
| `profile_id` | TEXT | FOREIGN KEY → career_id.profiles(id) | NOT NULL | Reference to parent profile (prefixed ID) |
| `employment_type` | employment_type_enum | | NOT NULL | Type of employment (full_time, part_time, freelance, internship, volunteer, etc.) |
| `employer` | TEXT | | NOT NULL | Employer, organization, or client name |
| `title` | TEXT | | NOT NULL | Job title or role |
| `location` | TEXT | | NULL | Physical location (e.g., "San Francisco, CA") |
| `location_type` | location_type_enum | | NULL | Work arrangement (on_site, hybrid, remote) |
| `url` | TEXT | | NULL | Employer/organization website URL |
| `start_date` | DATE | | NOT NULL | Start date (YYYY-MM-DD) |
| `end_date` | DATE | | NULL | End date (NULL = current position) |
| `current_position` | BOOLEAN | DEFAULT FALSE | NOT NULL | Whether this is a current position |
| `summary` | TEXT | | NULL | Brief overview of the role |
| `highlights` | JSONB | DEFAULT '[]'::jsonb | NOT NULL | Array of accomplishments/responsibilities |
| `display_order` | INTEGER | DEFAULT 0 | NOT NULL | Display order within profile (lower = first) |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | NOT NULL | Timestamp when entry was created |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | NOT NULL | Timestamp when entry was last updated |

### Constraints
- **PRIMARY KEY:** `id`
- **FOREIGN KEY:** `profile_id` → `career_id.profiles(id)` ON DELETE CASCADE

### Indexes
- `idx_experience_profile_id` on `profile_id` (for fetching all experiences for a profile)
- `idx_experience_display_order` on `profile_id, display_order` (for ordered queries)
- `idx_experience_employment_type` on `employment_type` (for filtering by employment type)
- `idx_experience_location_type` on `location_type` (for filtering by work arrangement)

### Notes
- INTEGER auto-increment primary key (dependent data, not root entity)
- **employment_type** uses PostgreSQL ENUM for type safety - includes all employment types (full-time, part-time, freelance, internship, volunteer, etc.)
- **location_type** uses PostgreSQL ENUM to capture modern work arrangements (on-site, hybrid, remote)
- **employer** instead of "company" to be more inclusive (organizations, clients, etc.)
- **location** stores physical location (city, state), separate from **location_type** (work arrangement)
- More inclusive than "work experience" - covers internships, volunteer work, freelance projects, etc.
- highlights stored as JSONB array of strings: `["Improved system performance by 40%", "Led team of 5 engineers"]`
- current_position can be derived from end_date IS NULL, but stored for convenience
- Multiple entries per profile allowed
- display_order allows user to reorder entries (default chronological)
- Minimal constraints - validation primarily at application layer

---

## 3.3 Table: career_id.education

**Purpose:** Educational background entries. Many per profile. Stores degrees, diplomas, and certificate programs.

**ID Strategy:** INTEGER auto-increment (child entity)

### Columns

| Column | Type | Constraints | Nullable | Description |
|--------|------|-------------|----------|-------------|
| `id` | INTEGER | PRIMARY KEY, GENERATED ALWAYS AS IDENTITY | NOT NULL | Unique identifier for this education entry |
| `profile_id` | TEXT | FOREIGN KEY → career_id.profiles(id) | NOT NULL | Reference to parent profile (prefixed ID) |
| `degree_type` | TEXT | | NOT NULL | Degree type (e.g., "Bachelor of Science", "Master of Arts") |
| `area_of_study` | TEXT | | NOT NULL | Major/area of study (e.g., "Computer Science") |
| `institution` | TEXT | | NOT NULL | Institution name (e.g., "Stanford University") |
| `start_date` | DATE | | NOT NULL | Start date (YYYY-MM-DD) |
| `end_date` | DATE | | NOT NULL | End date (YYYY-MM-DD) |
| `completed` | BOOLEAN | DEFAULT TRUE | NOT NULL | Whether the degree was completed |
| `url` | TEXT | | NULL | Institution website URL |
| `credit_hours` | NUMERIC(5,2) | | NULL | Total credit hours (optional) |
| `coursework` | JSONB | DEFAULT '[]'::jsonb | NOT NULL | Array of relevant coursework |
| `minors` | JSONB | DEFAULT '[]'::jsonb | NOT NULL | Array of minor fields of study |
| `display_order` | INTEGER | DEFAULT 0 | NOT NULL | Display order within profile (lower = first) |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | NOT NULL | Timestamp when entry was created |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | NOT NULL | Timestamp when entry was last updated |

### Constraints
- **PRIMARY KEY:** `id`
- **FOREIGN KEY:** `profile_id` → `career_id.profiles(id)` ON DELETE CASCADE

### Indexes
- `idx_education_profile_id` on `profile_id` (for fetching all education for a profile)
- `idx_education_display_order` on `profile_id, display_order` (for ordered queries)

### Notes
- INTEGER auto-increment primary key (dependent data, not root entity)
- coursework and minors stored as JSONB arrays: `["Data Structures", "Algorithms", "Machine Learning"]`
- completed=false indicates ongoing education or left without completing
- credit_hours mainly for US institutions, optional
- Multiple entries per profile allowed
- Minimal constraints - validation primarily at application layer

---

## 3.4 Table: career_id.certifications

**Purpose:** Professional certifications, licenses, and credentials. Many per profile.

**ID Strategy:** INTEGER auto-increment (child entity)

### Columns

| Column | Type | Constraints | Nullable | Description |
|--------|------|-------------|----------|-------------|
| `id` | INTEGER | PRIMARY KEY, GENERATED ALWAYS AS IDENTITY | NOT NULL | Unique identifier for this certification |
| `profile_id` | TEXT | FOREIGN KEY → career_id.profiles(id) | NOT NULL | Reference to parent profile (prefixed ID) |
| `name` | TEXT | | NOT NULL | Certification name (e.g., "AWS Solutions Architect") |
| `issuer` | TEXT | | NOT NULL | Issuing organization (e.g., "Amazon Web Services") |
| `date` | DATE | | NOT NULL | Date obtained (YYYY-MM-DD) |
| `url` | TEXT | | NULL | Certification verification URL |
| `display_order` | INTEGER | DEFAULT 0 | NOT NULL | Display order within profile (lower = first) |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | NOT NULL | Timestamp when entry was created |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | NOT NULL | Timestamp when entry was last updated |

### Constraints
- **PRIMARY KEY:** `id`
- **FOREIGN KEY:** `profile_id` → `career_id.profiles(id)` ON DELETE CASCADE

### Indexes
- `idx_certifications_profile_id` on `profile_id` (for fetching all certifications for a profile)
- `idx_certifications_display_order` on `profile_id, display_order` (for ordered queries)

### Notes
- INTEGER auto-increment primary key (dependent data, not root entity)
- Simple structure: name, issuer, date, optional URL
- Multiple entries per profile allowed
- display_order allows chronological or custom sorting

---

## 3.5 Table: reference.skills

**Purpose:** Master skills catalog. Shared across entire platform. One entry per unique skill. Located in `reference` schema for clear separation of lookup data.

**ID Strategy:** INTEGER auto-increment (accessed via profile, not exposed independently)

### Columns

| Column | Type | Constraints | Nullable | Description |
|--------|------|-------------|----------|-------------|
| `id` | INTEGER | PRIMARY KEY, GENERATED ALWAYS AS IDENTITY | NOT NULL | Unique identifier for this skill |
| `skill_name` | TEXT | | NOT NULL | Canonical skill name (e.g., "Python", "JavaScript") |
| `category` | TEXT | | NOT NULL | Skill category (e.g., "Programming Language", "Framework") |
| `aliases` | JSONB | DEFAULT '[]'::jsonb | NOT NULL | Common variations/aliases as JSON array |
| `description` | TEXT | | NULL | Brief description of the skill in this category context |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | NOT NULL | Timestamp when skill was added to catalog |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | NOT NULL | Timestamp when skill was last updated |

### Constraints
- **PRIMARY KEY:** `id` (INTEGER auto-increment)
- **UNIQUE:** `(skill_name, category)` (composite unique constraint - allows same skill name in different categories)

### Indexes
- `idx_skills_skill_name` on `skill_name` (for autocomplete lookups, partial match with LIKE/ILIKE)
- `idx_skills_category` on `category` (for filtering by category)
- `idx_skills_composite` on `(skill_name, category)` (for unique constraint and category-specific lookups)
- GIN index on `aliases` for JSONB search: `CREATE INDEX idx_skills_aliases ON reference.skills USING GIN (aliases)`

### Notes
- INTEGER auto-increment ID (skills always fetched with profile, not independent API resource)
- Located in `reference` schema for clear separation of lookup data from user data
- **Composite unique constraint** `(skill_name, category)` allows same skill name in different categories
  - Example: "Testing" can exist in both "QA" and "Medical" categories with different meanings
  - Example: "Research" can exist in "Data Science", "UX", and "Marketing" with different contexts
  - Preserves industry-specific semantic meaning of skills
- Master catalog pre-seeded with ~424 common skills across tech, business, marketing, and general professional categories
- New skills auto-created when users type them (with admin review flag in future)
- aliases stored as JSONB: `["Javascript", "JS"]` for "JavaScript"
- category is required (NOT NULL) to provide context for skill meaning
- Space efficient: each skill+category combination stored once, referenced by thousands of users via junction table

---

## 3.6 Table: career_id.profile_skills

**Purpose:** Junction table linking profiles to skills. Many-to-many relationship. Stores user-specific metadata about each skill (proficiency, experience).

**ID Strategy:** INTEGER auto-increment (child entity / junction table)

### Columns

| Column | Type | Constraints | Nullable | Description |
|--------|------|-------------|----------|-------------|
| `id` | INTEGER | PRIMARY KEY, GENERATED ALWAYS AS IDENTITY | NOT NULL | Unique identifier for this profile-skill link |
| `profile_id` | TEXT | FOREIGN KEY → career_id.profiles(id) | NOT NULL | Reference to parent profile (prefixed ID) |
| `skill_id` | INTEGER | FOREIGN KEY → reference.skills(id) | NULL | Reference to skill in master catalog (INTEGER, nullable if skill deleted) |
| `name` | TEXT | | NULL | User-provided skill name (always displayed, matched to reference later) |
| `proficiency_level` | skill_level_enum | | NULL | User's proficiency level with this skill |
| `years_experience` | NUMERIC(4,1) | | NULL | Years of experience with this skill |
| `display_order` | INTEGER | DEFAULT 0 | NOT NULL | Display order within profile (lower = first) |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | NOT NULL | Timestamp when skill was added to profile |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | NOT NULL | Timestamp when skill metadata was last updated |

### Constraints
- **PRIMARY KEY:** `id`
- **FOREIGN KEY:** `profile_id` → `career_id.profiles(id)` ON DELETE CASCADE
- **FOREIGN KEY:** `skill_id` → `reference.skills(id)` ON DELETE SET NULL
- **UNIQUE:** `(profile_id, skill_id)` WHERE skill_id IS NOT NULL (prevent duplicate skills per profile)

### Indexes
- `idx_profile_skills_profile_id` on `profile_id` (for fetching all skills for a profile)
- `idx_profile_skills_skill_id` on `skill_id` (for finding all users with a skill)
- `idx_profile_skills_composite` on `profile_id, display_order` (for ordered queries)

### Notes
- INTEGER auto-increment primary key (dependent data, not root entity)
- Junction table enables many-to-many relationship between profiles and skills
- Stores user-specific metadata: proficiency_level, years_experience, display_order
- proficiency_level uses PostgreSQL ENUM for type safety
- Foreign keys:
  - profile_id (TEXT): References profiles.id (prefixed ID)
  - skill_id (INTEGER): References skills.id (INTEGER)
- ON DELETE CASCADE for profile_id: deleting profile removes all skill associations
- **ON DELETE SET NULL for skill_id:** if skill deleted from catalog, skill_id becomes null and name field preserves display value
- name field populated when skill association is created, always used for display (preserves user's original input)
- Partial UNIQUE constraint allows null skill_id without violating uniqueness
- display_order allows users to prioritize/reorder skills on their profile
- Minimal constraints - validation primarily at application layer

---

## 3.7 Table: career_id.contact_info

**Purpose:** Contact information and professional links. One-to-one relationship with profile (one contact info per profile).

**ID Strategy:** Prefixed ID (`cont_`) with dual-ID approach

### Columns

| Column | Type | Constraints | Nullable | Description |
|--------|------|-------------|----------|-------------|
| `internal_id` | BIGSERIAL | UNIQUE | NOT NULL | Internal database ID for sorting/partitioning |
| `id` | TEXT | PRIMARY KEY | NOT NULL | Public prefixed ID (e.g., `cont_xK9j2mP4nQ8rL5tY`) |
| `profile_id` | TEXT | FOREIGN KEY → career_id.profiles(id), UNIQUE | NOT NULL | Reference to parent profile (prefixed ID) |
| `first_name` | TEXT | | NOT NULL | First name |
| `last_name` | TEXT | | NOT NULL | Last name |
| `job_title` | TEXT | | NULL | Current or desired job title |
| `email` | TEXT | | NOT NULL | Email address (validated at application layer) |
| `phone` | TEXT | | NULL | Phone number (E.164 format recommended) |
| `websites` | JSONB | DEFAULT '[]'::jsonb | NOT NULL | Array of website URLs (portfolio, blog, etc.) |
| `summary` | TEXT | | NULL | Professional summary or bio |
| `city` | TEXT | | NULL | City |
| `state_region` | TEXT | | NULL | State or region |
| `country` | TEXT | | NULL | Country |
| `postal_code` | TEXT | | NULL | Postal/ZIP code |
| `willing_to_relocate` | BOOLEAN | DEFAULT FALSE | NOT NULL | Whether user is willing to relocate |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | NOT NULL | Timestamp when contact info was created |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | NOT NULL | Timestamp when contact info was last updated |

### Constraints
- **PRIMARY KEY:** `id` (TEXT - prefixed ID)
- **UNIQUE:** `internal_id` (for internal operations)
- **FOREIGN KEY:** `profile_id` → `career_id.profiles(id)` ON DELETE CASCADE
- **UNIQUE:** `profile_id` (one-to-one relationship: one contact info per profile)

### Indexes
- `idx_contact_info_internal_id` on `internal_id` (for chronological queries)
- `idx_contact_info_profile_id` on `profile_id` (for lookups by profile)

### Notes
- **Prefixed ID:** `cont_` prefix for self-documenting IDs (e.g., `cont_xK9j2mP4nQ8rL5tY7vW3zB1c`)
- **Dual-ID approach:**
  - `id` (TEXT): Used for public API, foreign keys, all external references
  - `internal_id` (BIGSERIAL): Used for efficient sorting, partitioning, internal operations
- ID generated by application backend before insert using CUID2 or similar
- One-to-one relationship with profiles (enforced by UNIQUE constraint on profile_id)
- **websites** stored as JSONB array of strings: `["https://portfolio.com", "https://myblog.com"]`
- **Social media links** stored in separate `profile_social_links` junction table (not in this table)
  - Enables platform analytics and standardization
  - See sections 3.8 and 3.9 for catalog and junction table details
- Many fields nullable to support progressive profile completion during onboarding
- Required fields: first_name, last_name, email
- Optional fields: job_title, phone, websites, summary, location fields
- Email and phone validation enforced at application layer (API)
- E.164 phone format recommended: +14155552671
- willing_to_relocate boolean for future job matching features
- Minimal constraints - validation primarily at application layer

---

## 3.8 Table: reference.social_platforms

**Purpose:** Master social platforms catalog. Shared across entire platform. One entry per social platform. Located in `reference` schema for clear separation of lookup data.

**ID Strategy:** INTEGER auto-increment (catalog data)

### Columns

| Column | Type | Constraints | Nullable | Description |
|--------|------|-------------|----------|-------------|
| `id` | INTEGER | PRIMARY KEY, GENERATED ALWAYS AS IDENTITY | NOT NULL | Unique identifier for this platform |
| `platform_name` | TEXT | UNIQUE | NOT NULL | Unique platform identifier (e.g., linkedin, github, twitter) |
| `display_name` | TEXT | | NOT NULL | Human-readable platform name (e.g., LinkedIn, GitHub, Twitter) |
| `base_url` | TEXT | | NULL | Base URL pattern for the platform |
| `icon_name` | TEXT | | NULL | Icon identifier for frontend rendering |
| `category` | TEXT | | NULL | Platform category (e.g., professional, design, development, content, social) |
| `description` | TEXT | | NULL | Brief description of the platform and typical use case |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | NOT NULL | Timestamp when platform was added to catalog |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | NOT NULL | Timestamp when platform was last updated |

### Constraints
- **PRIMARY KEY:** `id` (INTEGER auto-increment)
- **UNIQUE:** `platform_name` (prevents duplicate platforms)

### Indexes
- `idx_social_platforms_platform_name` on `platform_name` (for lookups)
- `idx_social_platforms_category` on `category` (for filtering by category)

### Notes
- INTEGER auto-increment ID (catalog data)
- Located in `reference` schema for clear separation of lookup data from user data
- Pre-seeded with common platforms (LinkedIn, GitHub, Twitter, Instagram, Facebook, YouTube, TikTok, Behance, Dribbble, Medium, DEV, Stack Overflow, Other)
- platform_name is lowercase, no spaces (e.g., "linkedin", "github", "stackoverflow")
- display_name is human-readable (e.g., "LinkedIn", "GitHub", "Stack Overflow")
- base_url helps with URL validation and construction (e.g., "https://linkedin.com/in/")
- icon_name used by frontend for rendering platform icons
- category helps organize platforms by use case (professional, design, development, content, social)
- Consistent with skills catalog pattern for standardization and analytics

---

## 3.9 Table: career_id.profile_social_links

**Purpose:** Junction table linking profiles to social platforms. Many-to-many relationship. Stores user's URLs for each platform.

**ID Strategy:** INTEGER auto-increment (child entity / junction table)

### Columns

| Column | Type | Constraints | Nullable | Description |
|--------|------|-------------|----------|-------------|
| `id` | INTEGER | PRIMARY KEY, GENERATED ALWAYS AS IDENTITY | NOT NULL | Unique identifier for this profile-platform link |
| `profile_id` | TEXT | FOREIGN KEY → career_id.profiles(id) | NOT NULL | Reference to parent profile (prefixed ID) |
| `platform_id` | INTEGER | FOREIGN KEY → reference.social_platforms(id) | NULL | Reference to platform in master catalog (nullable if platform deleted) |
| `platform_name_cache` | TEXT | | NULL | Cached platform name for display when platform_id is null |
| `url` | TEXT | | NOT NULL | Full URL to user's profile on the platform |
| `display_order` | INTEGER | DEFAULT 0 | NOT NULL | Display order within profile (lower = first) |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | NOT NULL | Timestamp when link was added to profile |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | NOT NULL | Timestamp when link was last updated |

### Constraints
- **PRIMARY KEY:** `id`
- **FOREIGN KEY:** `profile_id` → `career_id.profiles(id)` ON DELETE CASCADE
- **FOREIGN KEY:** `platform_id` → `reference.social_platforms(id)` ON DELETE SET NULL
- **UNIQUE:** `(profile_id, platform_id)` WHERE platform_id IS NOT NULL (prevent duplicate platforms per profile)

### Indexes
- `idx_profile_social_links_profile_id` on `profile_id` (for fetching all links for a profile)
- `idx_profile_social_links_platform_id` on `platform_id` (for finding all users with a platform)
- `idx_profile_social_links_composite` on `profile_id, display_order` (for ordered queries)

### Notes
- INTEGER auto-increment primary key (dependent data, not root entity)
- Junction table enables many-to-many relationship between profiles and social platforms
- Foreign keys:
  - profile_id (TEXT): References profiles.id (prefixed ID)
  - platform_id (INTEGER): References social_platforms.id (INTEGER)
- ON DELETE CASCADE for profile_id: deleting profile removes all social links
- **ON DELETE SET NULL for platform_id:** if platform deleted from catalog, platform_id becomes null and platform_name_cache preserves display value
- platform_name_cache populated when link is created, used as fallback display when platform_id is null
- Partial UNIQUE constraint allows null platform_id without violating uniqueness
- display_order allows users to prioritize/reorder platforms on their profile
- url stores full URL (not just username) for flexibility
- Consistent with skills junction table pattern (profile_skills)
- Enables analytics: "How many users have LinkedIn?", "Top 10 most used platforms", etc.

---

## Relationships Summary

```
career_id.profiles (TEXT: prof_*)
  ├─── career_id.experience (INTEGER, many)
  ├─── career_id.education (INTEGER, many)
  ├─── career_id.certifications (INTEGER, many)
  ├─── career_id.profile_skills (INTEGER, many)
  │     └─── reference.skills (INTEGER, many-to-many via junction)
  ├─── career_id.profile_social_links (INTEGER, many)
  │     └─── reference.social_platforms (INTEGER, many-to-many via junction)
  └─── career_id.contact_info (TEXT: cont_*, one-to-one)
```

**Primary Key Strategy:**
- **Prefixed ID (TEXT):** Used for primary entities (profiles, contact_info)
  - Self-documenting (type visible in ID)
  - Type-safe (prevents wrong ID usage)
  - Public API surface (external developers benefit)
  - Follows industry standard (Stripe, OpenAI, Anthropic)
  - Dual-ID with internal_id (BIGSERIAL) for database performance
- **INTEGER:** Used for child/dependent data and catalog data (experience, education, certifications, skills, profile_skills, social_platforms, profile_social_links)
  - Always accessed through parent/profile or as catalog data
  - Simpler, more efficient for internal-only data
  - No need for external visibility
  - Catalog tables (skills, social_platforms) use INTEGER since they're referenced via junction tables, not standalone API resources

**Foreign Key Cascade Behavior:**
- Deleting a profile → CASCADE to all related data (experience, education, certifications, profile_skills, profile_social_links, contact_info)
- Deleting a skill from skills → SET NULL on profile_skills.skill_id (preserves user data via name field)
- Deleting a platform from social_platforms → SET NULL on profile_social_links.platform_id (preserves user data via platform_name_cache)
- Deleting a user → Will cascade to profile when auth FK is added

---

## Storage Estimates

Assuming 100,000 users with average data:

### Prefixed ID Overhead vs UUID
- **TEXT prefixed ID:** ~30 bytes (e.g., `prof_xK9j2mP4nQ8rL5tY7vW3zB1c`)
- **UUID:** 16 bytes
- **BIGSERIAL internal_id:** 8 bytes
- **Total for dual-ID:** ~38 bytes (vs 16 bytes for UUID alone)
- **Trade-off:** ~22 bytes more per primary entity for significant DX benefits

### Storage by Table
- **Profiles** (prefixed ID + internal_id): ~140 bytes/user = ~14 MB
- **Experience** (INTEGER, profile_id as TEXT, employment_type enum, location_type enum): ~3 per user × 545 bytes = ~163.5 MB
- **Education** (INTEGER, profile_id as TEXT): ~2 per user × 430 bytes = ~86 MB
- **Certifications** (INTEGER, profile_id as TEXT): ~2 per user × 230 bytes = ~46 MB
- **skills** (INTEGER): ~5,000 skills × 250 bytes = ~1.25 MB
- **profile_skills** (INTEGER, profile_id as TEXT, skill_id as INTEGER): ~20 per user × 120 bytes = ~240 MB
- **Contact info** (prefixed ID + internal_id): ~390 bytes/user = ~39 MB
- **social_platforms** (INTEGER): ~15 platforms × 300 bytes = ~4.5 KB
- **profile_social_links** (INTEGER, profile_id as TEXT, platform_id as INTEGER): ~3 per user × 150 bytes = ~45 MB

**Total: ~635 MB for 100K users** (very manageable)

**Additional overhead vs pure UUID:** ~79 MB for 100K users (~14% increase)

### Performance Benefits of Dual-ID
- **internal_id** enables:
  - Efficient chronological sorting (ORDER BY internal_id vs ORDER BY created_at)
  - Fast range-based partitioning for scaling
  - Smaller index size for internal operations
  - Better join performance at scale (8-byte integer vs 30-byte text comparison)
- Minimal overhead (~38 bytes per primary entity) for significant operational benefits

---

## Design Decisions Summary

Based on review feedback, the following decisions have been finalized:

✅ **Primary Keys:**
- **Prefixed IDs** (TEXT) with dual-ID approach for primary entities (profiles, skills, contact_info)
  - `id` (TEXT): Public API surface, self-documenting, type-safe
  - `internal_id` (BIGSERIAL): Internal operations, sorting, partitioning
- **INTEGER** auto-increment for child/dependent data (work_experiences, education, certifications, profile_skills)

✅ **Contact info nullable fields:**
- Required: first_name, last_name, email
- Optional (nullable): job_title, phone, linkedin, summary, all location fields
- Supports progressive profile completion

✅ **ENUMs for constrained choices:**
- `completion_status_enum`: 'incomplete', 'complete', 'verified'
- `employment_type_enum`: 'full_time', 'part_time', 'self_employed', 'freelance', 'contract', 'internship', 'apprenticeship', 'seasonal', 'volunteer'
- `location_type_enum`: 'on_site', 'hybrid', 'remote'
- `skill_level_enum`: 'beginner', 'intermediate', 'advanced', 'expert'

✅ **Skill deletion behavior:**
- ON DELETE SET NULL with name field preservation
- Preserves user data when skills removed from catalog

✅ **Array storage:**
- JSONB for all arrays (highlights, coursework, minors, websites, aliases)
- Better query flexibility, JSON-native operations

✅ **Auth system:**
- user_id in profiles table without foreign key constraint
- Will add FK when auth system implemented

✅ **Validation strategy:**
- Minimal database constraints (simple cases only)
- 99% of validation at application layer (frontend + middleware)

## Remaining Questions (If Any)

1. **Prefixed ID library:** Which library should we use for ID generation?
   - **CUID2** (@paralleldrive/cuid2) - Recommended by Stripe, good defaults
   - **nanoid** - Smaller, faster, customizable
   - **ulid** - Timestamp-based, sortable
   - Recommendation: CUID2 for proven reliability and good defaults

2. **name field population:** Handled in application code - always populated with user's input when creating skill associations.
   - Recommendation: Application code for simplicity (one less trigger to maintain)

3. **ENUM extensibility:** If skill levels or completion statuses need to change later, ALTER TYPE is required. Consider if we should use lookup tables instead for easier extensibility (trade-off: more complexity, joins).
   - Recommendation: Keep ENUMs - values are stable, ALTER TYPE is acceptable for rare changes

4. **Social platforms catalog:** Social platforms now use catalog table (social_platforms) instead of ENUM for easier extensibility
   - New platforms can be added via simple INSERT (no schema migration needed)
   - Pre-seeded with 13 common platforms
   - Consistent with skills catalog pattern

---

## Next Steps

After design review approval:

1. **Create ENUMs** (run first, before table creation):
   - `completion_status_enum` ('incomplete', 'complete', 'verified')
   - `employment_type_enum` ('full_time', 'part_time', 'self_employed', 'freelance', 'contract', 'internship', 'apprenticeship', 'seasonal', 'volunteer')
   - `location_type_enum` ('on_site', 'hybrid', 'remote')
   - `skill_level_enum` ('beginner', 'intermediate', 'advanced', 'expert')

2. **Set up prefixed ID generation in backend:**
   - Install CUID2 library: `npm install @paralleldrive/cuid2`
   - Create utility function for generating prefixed IDs
   - Define prefix constants (prof_, cont_)
   - Ensure IDs generated before database inserts

3. **Create migration scripts** (002-010) based on this design:
   - 002: profiles table (with internal_id + id dual-ID)
   - 003: experience table (profile_id as TEXT FK, employment_type and location_type enums)
   - 004: education table (profile_id as TEXT FK)
   - 005: certifications table (profile_id as TEXT FK)
   - 006: skills table (INTEGER auto-increment)
   - 007: profile_skills table (profile_id as TEXT FK, skill_id as INTEGER FK, name field)
   - 008: contact_info table (with internal_id + id dual-ID, profile_id as TEXT FK)
   - 009: social_platforms table (INTEGER auto-increment, pre-seeded with common platforms)
   - 010: profile_social_links table (profile_id as TEXT FK, platform_id as INTEGER FK, platform_name_cache)

3. **Add supporting infrastructure**:
   - Indexes on all foreign keys
   - Composite indexes for ordered queries (profile_id, display_order)
   - GIN index on skills.aliases (JSONB search)
   - updated_at triggers for all tables
   - 012: Rename skill_name_cache to name for clarity

4. **Row Level Security** (if using Supabase):
   - Users can only view/modify their own profile data
   - skills readable by all, writable by system only

5. **Seed data**:
   - skills catalog with ~500-1000 common skills
   - Organized by category (Programming Languages, Frameworks, Tools, Soft Skills, etc.)

6. **Testing**:
   - Apply migrations to development database
   - Verify constraints and triggers
   - Test CASCADE and SET NULL behaviors
   - Confirm JSONB operations work as expected

7. **Documentation**:
   - ERD diagram showing relationships
   - Update DATABASE_HANDOFF.md with finalized schema
   - Document ENUM values for future reference

8. **Hand off to backend team** for Phase 4 implementation (real DB integration)


