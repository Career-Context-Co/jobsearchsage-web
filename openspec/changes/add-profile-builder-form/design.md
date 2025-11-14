# Design: Profile Builder Form

## Context
The profile builder form is the foundation of JobSearchSage's value proposition. Users need to enter their career data once, and this data will be used to generate job-specific resumes, track applications, and power AI coaching. The form must balance comprehensiveness (capturing all necessary data) with usability (not overwhelming users).

**Constraints:**
- Must work within Nuxt 4 SSR environment
- Must use Nuxt UI components for consistency
- Must support progressive enhancement (work without JavaScript for basic functionality)
- Profile data is PII and must be handled securely
- Form should be mobile-friendly and accessible

**Stakeholders:**
- End users (job seekers) - need simple, clear form experience
- Resume generation feature - needs structured, complete data
- AI coaching feature - needs rich context about user's career

## Goals / Non-Goals

**Goals:**
- Capture all career data needed for resume generation (experience, education, certifications, skills, contact)
- Provide clear, guided form experience with validation and help text
- Support multiple entries per section (multiple jobs, degrees, etc.)
- Persist data reliably with proper validation
- Allow users to save partial progress and return later

**Non-Goals:**
- Resume parsing/import (future feature)
- LinkedIn integration (future feature)
- AI-assisted profile completion (future feature)
- Profile templates or suggestions (future feature)
- Sharing profiles publicly (not a use case)

## Decisions

```markdown
### Decision 1: Normalized Database Schema
**What:** Use separate tables for each profile section (work_experiences, education, certifications, skills, contact_info) rather than JSON columns.

**Why:**
- Enables efficient querying and filtering (e.g., "find all users with Python skill")
- Supports future features like skill recommendations, industry benchmarking
- Easier to maintain data integrity with foreign keys and constraints
- Better indexing and performance for resume generation queries

**Alternatives considered:**
- Single JSON column in user_profiles table: Simpler initially but limits querying and future features
- Document database (MongoDB): Not aligned with current tech stack, adds complexity

### Decision 2: Schema Separation (Core Platform vs. Application)
**What:** Separate database schemas for Career Sage Core Platform (`open_career`) and JobSearchSage application (`jobsearchsage`). Core Career Sage Profile data lives in `open_career` schema; application-specific workflow data lives in `jobsearchsage` schema.

**Why:**
- **Clear separation of concerns**: Career Sage Profile is career identity data that persists across all applications; job search tracking is application-specific workflow data
- **Enables platform vision**: Future Career Sage apps (CareerCoachSage, TalentSourceSage) can access core profile data without coupling to JobSearchSage's implementation
- **Privacy isolation**: Third-party apps get profile access via API but can't access other apps' proprietary data (e.g., job application tracking)
- **Independent scaling**: Core platform and applications can scale, deploy, and evolve independently
- **Future open standard transition**: Clean boundary makes it easier to open-source the platform layer while keeping applications proprietary

**Schema placement rules:**
- `open_career` schema: User profiles, work experience, education, certifications, skills (master catalog), profile_skills junction table, contact information - anything that IS the Career Sage Profile
- `jobsearchsage` schema: Job applications, generated resumes, contacts, interviews, notes, communication templates - anything that's application workflow

**Cross-schema relationships:**
- ✅ Applications CAN reference core platform (e.g., `jobsearchsage.job_applications.profile_id` → `open_career.profiles.id`)
- ❌ Core platform should NOT reference applications (maintains platform independence)

**Alternatives considered:**
- Single schema for everything: Simpler initially but creates tight coupling, prevents clean platform/app separation, makes future third-party integrations messy
- Separate databases entirely: Over-engineered for current scale, adds operational complexity, makes transactions across boundaries harder

**Additional details:**
- Skills junction table (`profile_skills`) lives in `open_career` because skills are fundamental career identity data needed by all Career Sage applications, not just job searching
- Master skills catalog (`skills`) in `open_career` enables standardization, analytics, and skill-based matching across entire platform ecosystem
- This separation aligns with Career Sage Co.'s evolution strategy: start as proprietary platform, transition to open standard while maintaining first-party application competitive advantage
```

### Decision 3: Progressive Disclosure UI with Section Navigation
**What:** Use a tabbed or stepped interface where users can navigate between sections (Experience, Education, etc.) rather than one long scrolling form.

**Why:**
- Reduces cognitive load by showing one section at a time
- Provides clear sense of progress
- Easier to validate and provide feedback per section
- Mobile-friendly (less scrolling)

**Alternatives considered:**
- Single long form with sections: Overwhelming for users, harder to navigate on mobile
- Wizard with forced sequential flow: Too rigid, users may want to skip sections and return later

### Decision 4: Auto-save vs Explicit Save
**What:** Use explicit save buttons per section rather than auto-save.

**Why:**
- Users expect control over when data is saved
- Clearer feedback on save success/failure
- Simpler to implement validation (validate on save, not on every keystroke)
- Reduces unnecessary API calls

**Alternatives considered:**
- Auto-save on blur: Can be confusing if validation fails, users may not notice save status
- Auto-save with debounce: Complex to implement correctly, harder to show clear feedback

### Decision 5: Accomplishments as Array Field
**What:** Store work experience accomplishments as a JSON array in the database rather than separate table.

**Why:**
- Accomplishments are tightly coupled to specific jobs (no independent querying needed)
- Simpler schema (one less table and foreign key)
- Easier to maintain order and grouping
- Sufficient for resume generation use case

**Alternatives considered:**
- Separate accomplishments table: Over-normalized for this use case, adds complexity
- Text field with delimiters: Harder to parse, validate, and render

### Decision 6: Skills Normalization with Junction Table
**What:** Store skills in a normalized many-to-many relationship using three tables:
- `open_career.skills`: Master catalog of all skills (shared across platform)
- `open_career.profile_skills`: Junction table linking profiles to skills with metadata (proficiency level, years experience, display order)
- One skill entry (e.g., "Python") referenced by thousands of users via junction table

**Why:**
- **Space efficiency**: Each skill stored once and referenced many times (e.g., "Python" stored once, not duplicated per user)
- **Data consistency**: Prevents spelling variations ("Javascript" vs "JavaScript") through standardization
- **Analytics power**: Enables platform-wide queries like "How many users have Python?" or "Most in-demand skills by industry"
- **Rich metadata per skill**: Junction table stores user-specific data (proficiency level, years of experience, display order) without bloating master skills table
- **Future features**: Enables skill recommendations ("Users with your profile also have..."), job matching, industry benchmarking
- **Performance**: Properly indexed B-tree lookups on junction table are faster than array operations or JSON queries

**Alternatives considered:**
- PostgreSQL array column (`skill_ids UUID[]`): Saves ~900 bytes per user but loses metadata (proficiency, ordering), makes queries complex, no referential integrity
- JSONB column: Flexible but breaks referential integrity, makes analytics queries messy, no foreign key constraints
- One row per skill per user without master table: Massive data duplication, inconsistent skill names, can't do cross-user skill analysis

**Additional details:**
- Master skills table pre-seeded with ~500-1000 common skills on deploy
- New skills auto-created when users type them, flagged for admin review to catch typos
- Autocomplete UI queries skills table for typeahead suggestions
- Storage cost is trivial: ~62 bytes per skill per user = ~124 MB for 100K users with 20 skills average
- Junction table placed in `open_career` schema because skills are part of core Career Sage Profile, needed by all future applications (CareerCoachSage, TalentSourceSage)

## Risks / Trade-offs

**Risk:** Complex form may overwhelm users
- **Mitigation:** Progressive disclosure, clear instructions, optional fields, save partial progress

**Risk:** Users may enter inconsistent or low-quality data
- **Mitigation:** Validation rules, placeholder examples, help text, character limits, skill autocomplete from master catalog

**Risk:** Master skills table could accumulate duplicates/typos from user input
- **Mitigation:** Admin review workflow for new skills, future ML-based skill normalization, aliases field for common variations

**Risk:** Database schema may need changes as features evolve
- **Mitigation:** Use migrations for schema changes, design for extensibility (e.g., display_order field for reordering entries)

**Trade-off:** Normalized schema adds complexity
- **Benefit:** Enables future features (skill matching, analytics, recommendations), better querying, cross-platform data sharing
- **Cost:** More tables to manage, more complex queries, junction table adds rows
- **Decision:** Worth it for long-term platform vision and Career Sage Core Platform's goal to become industry infrastructure

**Trade-off:** Junction table creates more database rows than array approach
- **Benefit:** Rich metadata per skill, referential integrity, fast indexed queries, platform-wide analytics
- **Cost:** ~92 MB more storage for 100K users vs array approach
- **Decision:** Marginal storage cost far outweighed by query performance and feature enablement; modern databases handle millions of junction table rows easily

**Trade-off:** Explicit save requires user action
- **Benefit:** Clear control and feedback
- **Cost:** Users might forget to save
- **Decision:** Worth it for simplicity and clarity; add "unsaved changes" warning if needed

## Migration Plan

**Phase 1-2 (Frontend + Backend Mocks):**
- No database changes needed
- Frontend and backend can develop in parallel using mock data
- Low risk, easy to iterate

**Phase 3 (Database):**
- Create all tables in single migration batch
- Add indexes for foreign keys
- Test with seed data before Phase 4
- Rollback plan: Drop all tables if needed (no production data yet)

**Phase 4-5 (Backend + Frontend Integration):**
- Replace mocks with real database queries
- Test thoroughly with real data
- Monitor for performance issues (query optimization)

**Future migrations:**
- Add columns for new fields (e.g., profile visibility settings)
- Add tables for new features (e.g., resume templates)
- Use Nuxt/Nitro migration tooling for version control

## Open Questions

1. **Authentication:** How will we identify users? (user_id foreign key assumes auth system exists)
   - **Answer needed before Phase 3:** Confirm auth system design or use placeholder user_id for now

2. **Profile visibility:** Should profiles have privacy settings? (public/private/unlisted)
   - **Answer:** Not in scope for this change, but schema should allow adding this later

3. **Data limits:** Should we limit number of entries per section? (e.g., max 10 jobs)
   - **Answer:** Start with no hard limits, add if performance issues arise

4. **Validation rules:** What are the exact validation rules for phone numbers, dates, etc.?
   - **Answer needed before Phase 4:** Document specific validation rules (formats, ranges, required fields)

5. **Order/sorting:** How should entries be ordered within sections? (chronological, user-defined)
   - **Answer:** Add `order` field to all tables, default to chronological (newest first), allow user reordering in future

