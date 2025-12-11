# Change: Add Profile View and Edit Dashboard

## Why
Users need to maintain their Career ID profile throughout their careers, not just during initial creation. Currently, the profile page only displays placeholder content and lacks the ability to view the complete profile or edit any sections. This prevents users from keeping their career information current and accurate, which is essential for generating up-to-date resumes and powering other JobSearchSage features like Sage AI coaching.

## What Changes
- Create a comprehensive profile dashboard that displays all career information organized by section (Experience, Education, Certifications, Skills, Contact Info, Professional Summary, Social Links)
- Add edit capabilities for each section with inline or modal editing patterns
- Wire up frontend components to existing API endpoints for viewing, updating, adding, and deleting profile data
- Implement real-time data persistence (changes save immediately to the database)
- Display profile completion status and visual indicators for empty sections
- Support adding multiple entries for repeating sections (experience, education, certifications, skills)
- Provide clear visual distinction between view and edit modes

## Impact
- Affected specs: `profile-builder` (MODIFIED to add view and edit capabilities)
- Affected code:
  - `app/pages/profile/index.vue` - Replace placeholder with complete profile dashboard
  - `app/components/profile/` - Add view and edit components for each section
  - Existing API endpoints in `server/api/career-id/profile/` - Already built, will be consumed by new frontend
  - `app/stores/careerIDStore.ts` - May need to add profile data state management

**Note**: This change extends the existing `profile-builder` capability, which focused on initial profile creation. This adds the complementary viewing and editing experience for maintaining profiles over time.
