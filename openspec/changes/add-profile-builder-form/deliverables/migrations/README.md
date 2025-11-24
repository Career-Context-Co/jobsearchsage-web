# Career Sage Profile Database Migrations

This directory contains SQL migration scripts for the Career Sage Profile Builder database schema.

## Overview

These migrations create the database schemas and all related tables for Career Sage Core Platform profile data.

**Schemas:**
- `career_id` - Core profile and user data
- `reference` - Reference/lookup/catalog data (skills, social platforms, etc.)

**Database:** PostgreSQL  
**Total Migrations:** 11

---

## Migration Order

⚠️ **IMPORTANT:** Migrations must be run in numerical order due to dependencies.

| Script | Description | Dependencies |
|--------|-------------|--------------|
| `001_create_enums.sql` | Create schemas (career_id, reference) and PostgreSQL ENUMs | None |
| `002_create_profiles.sql` | Create profiles table (career_id schema) | 001 |
| `003_create_experience.sql` | Create experience table (career_id schema) | 001, 002 |
| `004_create_education.sql` | Create education table (career_id schema) | 002 |
| `005_create_certifications.sql` | Create certifications table (career_id schema) | 002 |
| `006_create_skills.sql` | Create skills catalog table (reference schema) | 001 |
| `007_create_profile_skills.sql` | Create profile_skills junction table (career_id schema) | 002, 006 |
| `008_create_contact_info.sql` | Create contact_info table (career_id schema) | 002 |
| `009_create_social_platforms.sql` | Create social_platforms catalog table (reference schema) | None |
| `010_create_profile_social_links.sql` | Create profile_social_links junction table (career_id schema) | 002, 009 |
| `011_alter_skills_constraint.sql` | Alter skills table constraint to allow same name in different categories | 006 |

---

## Running Migrations

### Option 1: Using psql (Manual)

```bash
# Set your database connection
export DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# Run migrations in order
psql $DATABASE_URL -f 001_create_enums.sql
psql $DATABASE_URL -f 002_create_profiles.sql
psql $DATABASE_URL -f 003_create_experience.sql
psql $DATABASE_URL -f 004_create_education.sql
psql $DATABASE_URL -f 005_create_certifications.sql
psql $DATABASE_URL -f 006_create_skills.sql
psql $DATABASE_URL -f 007_create_profile_skills.sql
psql $DATABASE_URL -f 008_create_contact_info.sql
psql $DATABASE_URL -f 009_create_social_platforms.sql
psql $DATABASE_URL -f 010_create_profile_social_links.sql
psql $DATABASE_URL -f 011_alter_skills_constraint.sql
```

### Option 2: Run All at Once

```bash
# Run all migrations in sequence
for file in {001..011}*.sql; do
  echo "Running $file..."
  psql $DATABASE_URL -f $file
  if [ $? -ne 0 ]; then
    echo "Error running $file"
    exit 1
  fi
done
echo "All migrations completed successfully!"
```

### Option 3: Using Migration Tool

If using a migration tool (e.g., Flyway, Liquibase, db-migrate), configure it to run these scripts in numerical order.

---

## What Gets Created

### Schemas
- `career_id` - Career Sage Core Platform schema (profile and user data)
- `reference` - Reference/lookup/catalog data (skills, social platforms, etc.)

### ENUMs
- `career_id.completion_status_enum` - Profile completion status ('incomplete', 'complete', 'verified')
- `career_id.employment_type_enum` - Employment type ('full_time', 'part_time', 'self_employed', 'freelance', 'contract', 'internship', 'apprenticeship', 'seasonal', 'volunteer')
- `career_id.location_type_enum` - Work location arrangement ('on_site', 'hybrid', 'remote')
- `career_id.skill_level_enum` - Skill proficiency levels ('beginner', 'intermediate', 'advanced', 'expert')

### Tables

**career_id schema (profile/user data):**
1. **`career_id.profiles`** - Main profile metadata (prefixed ID: `prof_`)
2. **`career_id.experience`** - Professional experience including work, internships, volunteer, freelance (INTEGER)
3. **`career_id.education`** - Educational background (INTEGER)
4. **`career_id.certifications`** - Professional certifications (INTEGER)
5. **`career_id.profile_skills`** - Profile-skill junction with metadata (INTEGER)
6. **`career_id.contact_info`** - Contact information (prefixed ID: `cont_`)
7. **`career_id.profile_social_links`** - Profile-platform junction with URLs (INTEGER)

**reference schema (lookup/catalog data):**
8. **`reference.skills`** - Master skills catalog (INTEGER)
9. **`reference.social_platforms`** - Master social platforms catalog (INTEGER)

### Functions
- `career_id.update_updated_at_column()` - Trigger function for auto-updating `updated_at` timestamps

### Triggers
- `updated_at` triggers on all tables for automatic timestamp updates

### Indexes
- Primary key indexes (automatic)
- Foreign key indexes for performance
- Composite indexes for ordered queries (`profile_id`, `display_order`)
- GIN index on `reference.skills.aliases` for JSONB search
- Partial unique index on `profile_skills` to prevent duplicates

---

## Prefixed ID Requirements

Before using the database, you need to set up prefixed ID generation in your backend:

```bash
# Install CUID2 library
npm install @paralleldrive/cuid2
```

```typescript
// utils/prefixedId.ts
import { createId } from '@paralleldrive/cuid2';

export const PREFIXES = {
  PROFILE: 'prof_',
  CONTACT: 'cont_',
  USER: 'usr_', // Future use
} as const;

export function generatePrefixedId(prefix: string): string {
  return `${prefix}${createId()}`;
}

// Usage
const profileId = generatePrefixedId(PREFIXES.PROFILE);
// Example: prof_xK9j2mP4nQ8rL5tY7vW3zB1c
```

⚠️ **IMPORTANT:** Prefixed IDs must be generated by application code **before** database insert. The database does not auto-generate these IDs.

---

## Verification

After running migrations, verify the schema:

```sql
-- Check schemas exist
SELECT schema_name FROM information_schema.schemata 
WHERE schema_name IN ('career_id', 'reference');

-- Check all tables exist in career_id schema
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'career_id' 
ORDER BY table_name;

-- Check all tables exist in reference schema
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'reference' 
ORDER BY table_name;

-- Check ENUMs exist
SELECT typname FROM pg_type 
WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'career_id')
AND typtype = 'e';

-- Check indexes (career_id schema)
SELECT tablename, indexname FROM pg_indexes 
WHERE schemaname = 'career_id' 
ORDER BY tablename, indexname;

-- Check indexes (reference schema)
SELECT tablename, indexname FROM pg_indexes 
WHERE schemaname = 'reference' 
ORDER BY tablename, indexname;
```

Expected output:
- 2 schemas (career_id, reference)
- 7 tables in career_id schema (profiles, experience, education, certifications, profile_skills, contact_info, profile_social_links)
- 2 tables in reference schema (skills, social_platforms)
- 4 ENUMs (completion_status_enum, employment_type_enum, location_type_enum, skill_level_enum)
- Multiple indexes (at least 1-3 per table)

---

## Rollback

To rollback migrations (⚠️ **DESTRUCTIVE - deletes all data**):

```sql
-- Drop all tables (cascades to dependent tables)
DROP TABLE IF EXISTS career_id.profile_social_links CASCADE;
DROP TABLE IF EXISTS reference.social_platforms CASCADE;
DROP TABLE IF EXISTS career_id.contact_info CASCADE;
DROP TABLE IF EXISTS career_id.profile_skills CASCADE;
DROP TABLE IF EXISTS reference.skills CASCADE;
DROP TABLE IF EXISTS career_id.certifications CASCADE;
DROP TABLE IF EXISTS career_id.education CASCADE;
DROP TABLE IF EXISTS career_id.experience CASCADE;
DROP TABLE IF EXISTS career_id.profiles CASCADE;

-- Drop ENUMs
DROP TYPE IF EXISTS career_id.skill_level_enum;
DROP TYPE IF EXISTS career_id.location_type_enum;
DROP TYPE IF EXISTS career_id.employment_type_enum;
DROP TYPE IF EXISTS career_id.completion_status_enum;

-- Drop function
DROP FUNCTION IF EXISTS career_id.update_updated_at_column();

-- Drop schemas (if empty)
DROP SCHEMA IF EXISTS reference;
DROP SCHEMA IF EXISTS career_id;
```

---

## Next Steps

After migrations are applied:

1. ✅ **Verify schema** - Run verification queries above
2. 🔄 **Seed reference data** - Load common skills into `reference.skills` and platforms into `reference.social_platforms` (see `../seeds/`)
3. 🔌 **Update backend** - Replace mock endpoints with real database queries (Phase 4)
4. 🔐 **Add authentication** - When auth system ready, add foreign key constraint on `profiles.user_id`
5. 🛡️ **Enable RLS** - Add Row Level Security policies when using Supabase/auth

---

## Notes

- **No RLS policies:** Row Level Security not included since authentication isn't set up yet
- **No auth FK:** `profiles.user_id` doesn't have foreign key constraint yet (will be added when auth system implemented)
- **Prefixed IDs:** `profiles` and `contact_info` use prefixed IDs (generated by app, not DB)
- **Child tables:** All other tables use INTEGER auto-increment IDs
- **JSONB fields:** Simple arrays for `highlights`, `coursework`, `minors`, `websites`, `aliases` (strings)
- **Display order:** All sections support custom ordering via `display_order` field
- **Soft deletes:** 
  - Skills use `ON DELETE SET NULL` with `skill_name_cache` fallback
  - Social platforms use `ON DELETE SET NULL` with `platform_name_cache` fallback
- **Catalog tables:** Both skills and social platforms use catalog + junction table pattern for standardization and analytics

---

## Troubleshooting

**Error: schema "career_id" does not exist**
- Run `001_create_enums.sql` first (it creates the schema)

**Error: type "completion_status_enum" does not exist**
- Ensure ENUMs are created before tables (run 001 first)

**Error: relation "career_id.profiles" does not exist**
- Run migrations in order (002 before 003-005, 007-008)

**Error: function "update_updated_at_column" already exists**
- Safe to ignore, or use `CREATE OR REPLACE FUNCTION`

For more details, see `SCHEMA_DESIGN.md`.

