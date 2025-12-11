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

- [ ] 2.1 Create experience page
  - [ ] Create `pages/profile/experience.vue`
  - [ ] Add UPageCard with title "Work Experience"
  - [ ] Display loading state while fetching

- [ ] 2.2 Display existing work experience entries
  - [ ] Iterate over `careerIDStore.experience` array
  - [ ] Display each entry with company, title, dates, location, highlights
  - [ ] Show "Present" for current positions (where `endDate` is null)
  - [ ] Order entries by start date (most recent first)
  - [ ] Show empty state with "Add Experience" button if no entries

- [ ] 2.3 Add "Add Experience" functionality
  - [ ] Add "Add Experience" button in header or empty state
  - [ ] Create inline form with UForm and Zod schema
  - [ ] Include fields: company, title, location, url, startDate, endDate, currentPosition checkbox, summary, highlights (array)
  - [ ] Add dynamic highlights field (add/remove bullet points)
  - [ ] Call `careerIDStore.addExperience()` on submit
  - [ ] Show toast notification on success
  - [ ] Clear form after successful add

- [ ] 2.4 Add "Edit" functionality for existing entries
  - [ ] Add edit button/icon for each experience entry
  - [ ] Toggle inline form pre-populated with entry data
  - [ ] Use same form fields as add
  - [ ] Call `careerIDStore.updateExperience(id, data)` on submit
  - [ ] Show toast notification on success

- [ ] 2.5 Add "Delete" functionality for entries
  - [ ] Add delete button/icon for each experience entry
  - [ ] Show confirmation dialog before deleting
  - [ ] Call `careerIDStore.deleteExperience(id)` on confirm
  - [ ] Show toast notification on success
  - [ ] Update UI to show empty state if last entry deleted

- [ ] 2.6 Add client-side validation
  - [ ] Validate required fields: company, title, startDate, at least 1 highlight
  - [ ] Validate date range (endDate >= startDate)
  - [ ] Validate URL format for company website
  - [ ] Display validation errors inline with fields

- [ ] 2.7 Add save button and form submission
  - [ ] Add "Save Changes" button in page header or footer
  - [ ] Use UForm's submit handler
  - [ ] Show loading state during save (`careerIDStore.isSaving`)
  - [ ] Handle errors from API and display error toast

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

- [ ] 3.1 Create education page
  - [ ] Create `pages/profile/education.vue`
  - [ ] Add UPageCard with title "Education"
  - [ ] Display loading state while fetching

- [ ] 3.2 Display existing education entries
  - [ ] Iterate over `careerIDStore.education` array
  - [ ] Display each entry with degree, institution, dates, field of study
  - [ ] Display coursework and minors if present
  - [ ] Order entries by end date (most recent first)
  - [ ] Show empty state with "Add Education" button if no entries

- [ ] 3.3 Add "Add Education" functionality
  - [ ] Add "Add Education" button in header or empty state
  - [ ] Create inline form with UForm and Zod schema
  - [ ] Include fields: degreeType, areaOfStudy, institution, startDate, endDate, completed, url, creditHours, coursework (array), minors (array)
  - [ ] Add dynamic coursework field (add/remove items)
  - [ ] Add dynamic minors field (add/remove items)
  - [ ] Call `careerIDStore.addEducation()` on submit
  - [ ] Show toast notification on success

- [ ] 3.4 Add "Edit" functionality for existing entries
  - [ ] Add edit button/icon for each education entry
  - [ ] Toggle inline form pre-populated with entry data
  - [ ] Call `careerIDStore.updateEducation(id, data)` on submit
  - [ ] Show toast notification on success

- [ ] 3.5 Add "Delete" functionality for entries
  - [ ] Add delete button/icon for each education entry
  - [ ] Show confirmation dialog before deleting
  - [ ] Call `careerIDStore.deleteEducation(id)` on confirm
  - [ ] Show toast notification on success

- [ ] 3.6 Add client-side validation
  - [ ] Validate required fields: degreeType, areaOfStudy, institution, startDate, endDate
  - [ ] Validate date range (endDate >= startDate)
  - [ ] Validate URL format if provided
  - [ ] Display validation errors inline

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

- [ ] 4.1 Create skills page
  - [ ] Create `pages/profile/skills.vue`
  - [ ] Add UPageCard with title "Skills"
  - [ ] Display loading state while fetching

- [ ] 4.2 Display existing skills
  - [ ] Iterate over `careerIDStore.profileSkills` array
  - [ ] Display skills as tags/chips with remove button
  - [ ] Group skills by proficiency level or category if applicable
  - [ ] Show empty state with "Add Skills" button if no entries

- [ ] 4.3 Add "Add Skill" functionality (inline)
  - [ ] Add input field with autocomplete for skill search
  - [ ] Call `careerIDStore.searchSkills(query)` for autocomplete suggestions
  - [ ] Allow user to select from suggestions or add custom skill
  - [ ] Include proficiency level selector (beginner, intermediate, advanced, expert)
  - [ ] Call `careerIDStore.addSkills([skillData])` on add
  - [ ] Display new skill immediately as a tag

- [ ] 4.4 Add "Edit" functionality for skills
  - [ ] Allow inline editing of proficiency level (click to edit)
  - [ ] Call `careerIDStore.updateSkills([{id, proficiencyLevel}])` on save
  - [ ] Show toast notification on success

- [ ] 4.5 Add "Delete" functionality for skills
  - [ ] Add remove button (X) on each skill tag
  - [ ] Call `careerIDStore.deleteSkills([id])` on click
  - [ ] Remove skill tag from UI immediately
  - [ ] Show toast notification on success

- [ ] 4.6 Add bulk operations (optional)
  - [ ] Allow selecting multiple skills for bulk delete
  - [ ] Add "Add Multiple Skills" option if needed

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

- [ ] 5.1 Create certifications page
  - [ ] Create `pages/profile/certifications.vue`
  - [ ] Add UPageCard with title "Certifications"
  - [ ] Display loading state while fetching

- [ ] 5.2 Display existing certification entries
  - [ ] Iterate over `careerIDStore.certifications` array
  - [ ] Display each entry with name, issuer, date, url
  - [ ] Order entries by date (most recent first)
  - [ ] Show empty state with "Add Certification" button if no entries

- [ ] 5.3 Add "Add Certification" functionality
  - [ ] Add "Add Certification" button in header or empty state
  - [ ] Create inline form with UForm and Zod schema
  - [ ] Include fields: name, issuer, date, url (optional)
  - [ ] Call `careerIDStore.addCertification()` on submit
  - [ ] Show toast notification on success

- [ ] 5.4 Add "Edit" functionality for existing entries
  - [ ] Add edit button/icon for each certification entry
  - [ ] Toggle inline form pre-populated with entry data
  - [ ] Call `careerIDStore.updateCertification(id, data)` on submit
  - [ ] Show toast notification on success

- [ ] 5.5 Add "Delete" functionality for entries
  - [ ] Add delete button/icon for each certification entry
  - [ ] Show confirmation dialog before deleting
  - [ ] Call `careerIDStore.deleteCertification(id)` on confirm
  - [ ] Show toast notification on success

- [ ] 5.6 Add client-side validation
  - [ ] Validate required fields: name, issuer, date
  - [ ] Validate URL format if provided
  - [ ] Validate date format (ISO 8601)
  - [ ] Display validation errors inline

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

- [ ] 6.1 Add contact info form to profile index page
  - [ ] Update `pages/profile/index.vue` (already created in Story 1)
  - [ ] Add UForm with Zod schema for contact info
  - [ ] Use UPageCard with "Contact Information" title

- [ ] 6.2 Display contact information fields
  - [ ] Pre-populate form with `careerIDStore.contactInfo` data
  - [ ] Include fields: firstName, lastName, jobTitle, email, phone, linkedin, websites (array), city, stateRegion, country, postalCode, willingToRelocate
  - [ ] Use UFormField with appropriate input types
  - [ ] Add USeparator between field groups

- [ ] 6.3 Add client-side validation
  - [ ] Validate required fields: firstName, lastName, jobTitle, email, phone, city, stateRegion, country, postalCode
  - [ ] Validate email format
  - [ ] Validate phone format
  - [ ] Validate URL format for linkedin and websites
  - [ ] Display validation errors inline with fields

- [ ] 6.4 Add save functionality
  - [ ] Add "Save Changes" button in header
  - [ ] Call `careerIDStore.updateContactInfo(id, data)` on submit
  - [ ] Show loading state during save (`careerIDStore.isSaving`)
  - [ ] Show toast notification on success
  - [ ] Handle errors and display error toast

---

## USER STORY 7: Edit Professional Summary

### Database
- [x] ✅ Professional summary is part of contact_info table (summary field)

### Backend (API)
- [x] ✅ Professional summary is updated via `PATCH /api/career-id/profile/:profileId/contact/:id`
- [x] ✅ careerIDStore method: `updateContactInfo` (includes summary)

### Frontend

- [ ] 7.1 Add professional summary to profile index page
  - [ ] Update `pages/profile/index.vue` (part of contact form)
  - [ ] Add textarea field for summary within UForm

- [ ] 7.2 Display professional summary field
  - [ ] Add UFormField with name="summary"
  - [ ] Use UTextarea component with autoresize
  - [ ] Pre-populate with `careerIDStore.contactInfo.summary`
  - [ ] Set max length to 5000 characters (per API spec)

- [ ] 7.3 Add validation
  - [ ] Validate summary is required (per API spec)
  - [ ] Validate max length (5000 characters)
  - [ ] Display character count indicator
  - [ ] Display validation errors inline

- [ ] 7.4 Save with contact info
  - [ ] Professional summary saves with contact info form (same submit handler)
  - [ ] Call `careerIDStore.updateContactInfo(id, data)` including summary field
  - [ ] Show toast notification on success

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

- [ ] 8.1 Add social links section to profile index page
  - [ ] Display social links in `pages/profile/index.vue`
  - [ ] Show existing links from `careerIDStore.profileSocialLinks`
  - [ ] Display each link with platform icon and URL

- [ ] 8.2 Add "Add Social Link" functionality
  - [ ] Add "Add Social Link" button
  - [ ] Fetch available platforms using `careerIDStore.fetchSocialPlatforms()`
  - [ ] Create inline form with platform selector and URL field
  - [ ] Call `careerIDStore.addSocialLinks([linkData])` on submit
  - [ ] Show toast notification on success

- [ ] 8.3 Add "Edit" functionality for social links
  - [ ] Add edit button for each social link
  - [ ] Allow editing URL only (platform is fixed)
  - [ ] Call `careerIDStore.updateSocialLink(id, {url})` on save
  - [ ] Show toast notification on success

- [ ] 8.4 Add "Delete" functionality for social links
  - [ ] Add delete button for each social link
  - [ ] Call `careerIDStore.deleteSocialLink(id)` on click
  - [ ] Show toast notification on success

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
