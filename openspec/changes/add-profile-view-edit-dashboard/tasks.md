# Implementation Tasks

## USER STORY 1: View Complete Profile Dashboard

### Database
- [x] ✅ Database schema already complete (from profile-builder change)
- [x] ✅ `get_full_profile` function exists

### Backend (API)
- [x] ✅ `GET /api/career-id/profile/:profileId` endpoint exists
- [x] ✅ Returns all profile sections in single request

### Frontend

- [x] 1.1 Update navigation structure in `layouts/default.vue`
  - [x] Add Profile parent menu item with children
  - [x] Add child routes: Overview, Experience, Education, Certifications, Skills
  - [x] Set up navigation to `/profile`, `/profile/experience`, etc.

- [x] 1.2 Create profile index page (overview/contact section)
  - [x] Create/update `pages/profile/index.vue`
  - [x] Add careerIDStore integration
  - [x] Fetch profile data on mount using `careerIDStore.fetchProfile()`
  - [x] Handle loading state with skeleton
  - [x] Handle error state (redirect to onboarding if no profile)

- [x] 1.3 Display contact information section
  - [x] Display name, email, phone, location from `careerIDStore.contactInfo`
  - [x] Display professional summary (part of contact info)
  - [x] Display social links from `careerIDStore.profileSocialLinks`
  - [x] Use UPageCard for layout (settings-style)

- [x] 1.4 Performance verification
  - [x] Test profile page loads in < 2 seconds
  - [x] Verify `get_full_profile` API call is efficient
  - [x] Add loading skeleton during data fetch

---

## USER STORY 2: Edit Work Experience

### Database
- [x] ✅ Experience table and schema complete

### Backend (API)
- [x] ✅ `GET /api/career-id/profile/:profileId/experience` exists
- [x] ✅ `POST /api/career-id/profile/:profileId/experience` exists
- [x] ✅ `PATCH /api/career-id/profile/:profileId/experience/:id` exists
- [x] ✅ `DELETE /api/career-id/profile/:profileId/experience/:id` exists
- [x] ✅ careerIDStore methods: `addExperience`, `updateExperience`, `deleteExperience`

### Frontend

- [x] 2.1 Create experience page
  - [x] Create `pages/profile/experience.vue`
  - [x] Add UPageCard with title "Work Experience"
  - [x] Display loading state while fetching

- [x] 2.2 Display existing work experience entries
  - [x] Iterate over `careerIDStore.experience` array
  - [x] Display each entry with company, title, dates, location, highlights
  - [x] Show "Present" for current positions (where `endDate` is null)
  - [x] Order entries by start date (most recent first)
  - [x] Show empty state with "Add Experience" button if no entries

- [x] 2.3 Add "Add Experience" functionality
  - [x] Add "Add Experience" button in header or empty state
  - [x] Create inline form with TypeScript validation
  - [x] Include fields: employmentType, employer, title, location, locationType, url, startDate, endDate, currentPosition checkbox, summary, highlights (array)
  - [x] Add dynamic highlights field (add/remove bullet points)
  - [x] Call `careerIDStore.addExperience()` on submit
  - [x] Show toast notification on success
  - [x] Clear form after successful add

- [x] 2.4 Add "Edit" functionality for existing entries
  - [x] Add edit button/icon for each experience entry
  - [x] Toggle inline form pre-populated with entry data
  - [x] Use same form fields as add
  - [x] Call `careerIDStore.updateExperience(id, data)` on submit
  - [x] Show toast notification on success

- [x] 2.5 Add "Delete" functionality for entries
  - [x] Add delete button/icon for each experience entry
  - [x] Show confirmation dialog before deleting
  - [x] Call `careerIDStore.deleteExperience(id)` on confirm
  - [x] Show toast notification on success
  - [x] Update UI to show empty state if last entry deleted

- [x] 2.6 Add client-side validation
  - [x] Validate required fields: employer, title, startDate, at least 1 highlight
  - [x] Validate date range (endDate >= startDate)
  - [x] Validate URL format for company website
  - [x] Display validation errors inline with fields

- [x] 2.7 Add save button and form submission
  - [x] Add "Save Experience" button in form
  - [x] Show loading state during save (`careerIDStore.isSaving`)
  - [x] Handle errors from API and display error toast

---

## USER STORY 3: Edit Education

### Database
- [x] ✅ Education table and schema complete

### Backend (API)
- [x] ✅ `GET /api/career-id/profile/:profileId/education` exists
- [x] ✅ `POST /api/career-id/profile/:profileId/education` exists
- [x] ✅ `PATCH /api/career-id/profile/:profileId/education/:id` exists
- [x] ✅ `DELETE /api/career-id/profile/:profileId/education/:id` exists
- [x] ✅ careerIDStore methods: `addEducation`, `updateEducation`, `deleteEducation`

### Frontend

- [x] 3.1 Create education page
  - [x] Create `pages/profile/education.vue`
  - [x] Add UPageCard with title "Education"
  - [x] Display loading state while fetching

- [x] 3.2 Display existing education entries
  - [x] Iterate over `careerIDStore.education` array
  - [x] Display each entry with degree, institution, dates, field of study
  - [x] Display coursework and minors if present
  - [x] Order entries by end date (most recent first)
  - [x] Show empty state with "Add Education" button if no entries

- [x] 3.3 Add "Add Education" functionality
  - [x] Add "Add Education" button in header or empty state
  - [x] Create inline form with TypeScript validation
  - [x] Include fields: degreeType, areaOfStudy, institution, startDate, endDate, completed, url, creditHours, coursework (array), minors (array)
  - [x] Add dynamic coursework field (add/remove items)
  - [x] Add dynamic minors field (add/remove items)
  - [x] Call `careerIDStore.addEducation()` on submit
  - [x] Show toast notification on success

- [x] 3.4 Add "Edit" functionality for existing entries
  - [x] Add edit button/icon for each education entry
  - [x] Toggle inline form pre-populated with entry data
  - [x] Call `careerIDStore.updateEducation(id, data)` on submit
  - [x] Show toast notification on success

- [x] 3.5 Add "Delete" functionality for entries
  - [x] Add delete button/icon for each education entry
  - [x] Show confirmation dialog before deleting
  - [x] Call `careerIDStore.deleteEducation(id)` on confirm
  - [x] Show toast notification on success

- [x] 3.6 Add client-side validation
  - [x] Validate required fields: degreeType, areaOfStudy, institution, startDate, endDate
  - [x] Validate date range (endDate >= startDate)
  - [x] Validate URL format if provided
  - [x] Display validation errors inline

---

## USER STORY 4: Edit Skills

### Database
- [x] ✅ Skills and profile_skills tables complete

### Backend (API)
- [x] ✅ `GET /api/career-id/profile/:profileId/skills` exists
- [x] ✅ `POST /api/career-id/profile/:profileId/skills` exists (bulk add)
- [x] ✅ `PATCH /api/career-id/profile/:profileId/skills` exists (bulk update)
- [x] ✅ `DELETE /api/career-id/profile/:profileId/skills` exists (bulk delete)
- [x] ✅ `GET /api/reference/skills/search?q=` exists (for autocomplete)
- [x] ✅ careerIDStore methods: `addSkills`, `updateSkills`, `deleteSkills`, `searchSkills`

### Frontend

- [x] 4.1 Create skills page
  - [x] Create `pages/profile/skills.vue`
  - [x] Use collapsible group layout similar to AdditionalSection
  - [x] Display loading state while fetching

- [x] 4.2 Display existing skills
  - [x] Iterate over `careerIDStore.profileSkills` array
  - [x] Group skills by group/category (with "No Group" default)
  - [x] Display collapsed view with skill badges
  - [x] Display expanded view with clean skill list
  - [x] Show empty state with "Add Skill Group" button if no entries

- [x] 4.3 Add "Add Skill" functionality
  - [x] Add skill rows with "Add Skill" button
  - [x] Include click-to-search autocomplete for skill names
  - [x] Call `careerIDStore.searchSkills(query)` for autocomplete suggestions
  - [x] Inline proficiency level selector (dropdown with 4 levels)
  - [x] Inline years of experience input (number)
  - [x] Single Save/Cancel buttons at bottom of group
  - [x] Call `careerIDStore.addSkills([skillData])` on save

- [x] 4.4 Add "Edit" functionality for skills
  - [x] Edit entire group with all skills at once
  - [x] Edit skill name, proficiency level, and years for each skill
  - [x] Edit group name separately
  - [x] Call `careerIDStore.updateSkills()` on save
  - [x] Show toast notification on success

- [x] 4.5 Add "Delete" functionality for skills
  - [x] Remove individual skills with trash icon button
  - [x] Delete entire group with confirmation
  - [x] Call `careerIDStore.deleteSkills([ids])` on delete
  - [x] Show toast notification on success

- [x] 4.6 Add group management
  - [x] Add new groups with "Add Skill Group" button
  - [x] Rename groups (except "No Group")
  - [x] Handle group changes (move skills between groups)
  - [x] Validate group names and skill data
  - [x] Keep group open after save for quick skill additions

---

## USER STORY 5: Edit Certifications

### Database
- [x] ✅ Certifications table and schema complete

### Backend (API)
- [x] ✅ `GET /api/career-id/profile/:profileId/certifications` exists
- [x] ✅ `POST /api/career-id/profile/:profileId/certifications` exists
- [x] ✅ `PATCH /api/career-id/profile/:profileId/certifications/:id` exists
- [x] ✅ `DELETE /api/career-id/profile/:profileId/certifications/:id` exists
- [x] ✅ careerIDStore methods: `addCertification`, `updateCertification`, `deleteCertification`

### Frontend

- [x] 5.1 Create certifications page
  - [x] Create `pages/profile/certifications.vue`
  - [x] Add UPageCard with title "Certifications"
  - [x] Display loading state while fetching

- [x] 5.2 Display existing certification entries
  - [x] Iterate over `careerIDStore.certifications` array
  - [x] Display each entry with name, issuer, date, url
  - [x] Order entries by date (most recent first)
  - [x] Show empty state with "Add Certification" button if no entries

- [x] 5.3 Add "Add Certification" functionality
  - [x] Add "Add Certification" button in header or empty state
  - [x] Create inline form with TypeScript validation
  - [x] Include fields: name, issuer, date, url (optional)
  - [x] Call `careerIDStore.addCertification()` on submit
  - [x] Show toast notification on success

- [x] 5.4 Add "Edit" functionality for existing entries
  - [x] Add edit button/icon for each certification entry
  - [x] Toggle inline form pre-populated with entry data
  - [x] Call `careerIDStore.updateCertification(id, data)` on submit
  - [x] Show toast notification on success

- [x] 5.5 Add "Delete" functionality for entries
  - [x] Add delete button/icon for each certification entry
  - [x] Show confirmation dialog before deleting
  - [x] Call `careerIDStore.deleteCertification(id)` on confirm
  - [x] Show toast notification on success

- [x] 5.6 Add client-side validation
  - [x] Validate required fields: name, issuer, date
  - [x] Validate URL format if provided
  - [x] Validate date format (MM/YYYY)
  - [x] Display validation errors inline

---

## USER STORY 6: Edit Contact Information

### Database
- [x] ✅ Contact_info table and schema complete

### Backend (API)
- [x] ✅ `GET /api/career-id/profile/:profileId/contact` exists
- [x] ✅ `POST /api/career-id/profile/:profileId/contact` exists
- [x] ✅ `PATCH /api/career-id/profile/:profileId/contact/:id` exists
- [x] ✅ careerIDStore methods: `createContactInfo`, `updateContactInfo`

### Frontend

- [x] 6.1 Add contact info form to profile index page
  - [x] Update `pages/profile/index.vue` (already created in Story 1)
  - [x] Use UPageCard with "Contact Information" title

- [x] 6.2 Display contact information fields
  - [x] Pre-populate form with `careerIDStore.contactInfo` data
  - [x] Include fields: firstName, lastName, jobTitle, email, phone, linkedin, websites (array), city, stateRegion, country, postalCode, willingToRelocate
  - [x] Use UInput with appropriate input types
  - [x] Add USeparator between field groups

- [x] 6.3 Add client-side validation
  - [x] Validate required fields: firstName, lastName, jobTitle, email, phone, city, stateRegion, country, postalCode
  - [x] Validate email format
  - [x] Validate phone format
  - [x] Validate URL format for linkedin and websites
  - [x] Display validation errors inline with fields

- [x] 6.4 Add save functionality
  - [x] Add "Save Changes" button in header
  - [x] Call `careerIDStore.updateContactInfo(id, data)` on submit
  - [x] Show loading state during save (`careerIDStore.isSaving`)
  - [x] Show toast notification on success
  - [x] Handle errors and display error toast

---

## USER STORY 7: Edit Professional Summary

### Database
- [x] ✅ Professional summary is part of contact_info table (summary field)

### Backend (API)
- [x] ✅ Professional summary is updated via `PATCH /api/career-id/profile/:profileId/contact/:id`
- [x] ✅ careerIDStore method: `updateContactInfo` (includes summary)

### Frontend

- [x] 7.1 Add professional summary to profile index page
  - [x] Update `pages/profile/index.vue` (separate edit section)
  - [x] Add textarea field for summary with separate edit mode

- [x] 7.2 Display professional summary field
  - [x] Use UTextarea component with autoresize
  - [x] Pre-populate with `careerIDStore.contactInfo.summary`
  - [x] Set max length to 5000 characters (per API spec)

- [x] 7.3 Add validation
  - [x] Validate summary is required (per API spec)
  - [x] Validate max length (5000 characters)
  - [x] Display character count indicator
  - [x] Display validation errors inline

- [x] 7.4 Save with contact info
  - [x] Professional summary has separate save handler
  - [x] Call `careerIDStore.updateContactInfo(id, data)` with summary field
  - [x] Show toast notification on success

---

## Social Links (Included in Story 1 & 6)

### Database
- [x] ✅ profile_social_links and social_platforms tables complete

### Backend (API)
- [x] ✅ `GET /api/career-id/profile/:profileId/socials` exists
- [x] ✅ `POST /api/career-id/profile/:profileId/socials` exists (bulk add)
- [x] ✅ `PATCH /api/career-id/profile/:profileId/socials/:id` exists
- [x] ✅ `DELETE /api/career-id/profile/:profileId/socials/:id` exists
- [x] ✅ `GET /api/reference/social-platforms` exists
- [x] ✅ careerIDStore methods: `addSocialLinks`, `updateSocialLink`, `deleteSocialLink`, `fetchSocialPlatforms`

### Frontend

- [x] 8.1 Add social links section to profile index page
  - [x] Display social links in `pages/profile/index.vue`
  - [x] Show existing links from `careerIDStore.profileSocialLinks`
  - [x] Display each link with platform icon and URL

- [x] 8.2 Add "Add Social Link" functionality
  - [x] Add "Add Social Link" button
  - [x] Fetch available platforms using `careerIDStore.fetchSocialPlatforms()`
  - [x] Create inline form with platform selector and URL field
  - [x] Call `careerIDStore.addSocialLinks([linkData])` on submit
  - [x] Show toast notification on success

- [x] 8.3 Add "Edit" functionality for social links
  - [x] Add edit button for each social link
  - [x] Allow editing URL only (platform is fixed)
  - [x] Call `careerIDStore.updateSocialLink(id, {url})` on save
  - [x] Show toast notification on success

- [x] 8.4 Add "Delete" functionality for social links
  - [x] Add delete button for each social link
  - [x] Call `careerIDStore.deleteSocialLink(id)` on click
  - [x] Show toast notification on success

---

## Testing & Polish

### Frontend

- [ ] 9.1 Error handling and UX improvements
  - [ ] Add global error handling for store errors
  - [ ] Display user-friendly error messages
  - [ ] Add retry logic for failed API calls
  - [ ] Handle network errors gracefully

- [ ] 9.2 Loading states
  - [ ] Add loading skeletons for all sections while fetching
  - [ ] Show loading indicators during save operations
  - [ ] Disable form buttons during save to prevent double-submit

- [ ] 9.3 Toast notifications
  - [ ] Standardize success toast messages across all sections
  - [ ] Standardize error toast messages
  - [ ] Use appropriate icons and colors (success, error)

- [ ] 9.4 Confirmation dialogs
  - [ ] Add confirmation before deleting any entry
  - [ ] Use UModal for confirmation dialogs
  - [ ] Prevent accidental deletions

- [ ] 9.5 Responsive design
  - [ ] Test all pages on mobile, tablet, desktop
  - [ ] Ensure forms are usable on mobile devices
  - [ ] Test sidebar navigation on mobile

- [ ] 9.6 Accessibility
  - [ ] Add ARIA labels to buttons and forms
  - [ ] Ensure keyboard navigation works
  - [ ] Test with screen readers
  - [ ] Ensure proper focus management

- [ ] 9.7 Manual testing
  - [ ] Test complete flow: view → edit → save → verify
  - [ ] Test adding entries to empty sections
  - [ ] Test editing existing entries
  - [ ] Test deleting entries (including last entry)
  - [ ] Test validation errors
  - [ ] Test error handling (network failures, server errors)
  - [ ] Test navigation between profile sections

- [ ] 9.8 Type checking and linting
  - [ ] Run `pnpm typecheck` and fix TypeScript errors
  - [ ] Run `pnpm lint` and fix linting errors
  - [ ] Ensure all components are properly typed

- [ ] 9.9 Performance testing
  - [ ] Verify profile loads in < 2 seconds
  - [ ] Check for unnecessary re-renders
  - [ ] Optimize if performance issues detected
