# Implementation Tasks: Resume Upload and AI Extraction

## Overview
This feature adds resume upload with AI-powered data extraction to the profile onboarding flow. Tasks are organized by user story, following the Database → Backend → Frontend pattern.

**Key Points:**
- Database schema already exists (no changes needed)
- New backend API endpoint for resume extraction
- New frontend upload step in onboarding stepper
- OpenAI GPT-4 Vision API integration for extraction

---

## USER STORY 1: Add Resume Upload Step to Onboarding Flow

**Goal:** Display an optional resume upload step at the beginning of onboarding (Step 0) so users can choose the fastest path to populate their Career ID Profile.

### Database
- [x] ✅ Profiles table exists with all required fields
- [x] ✅ All profile section tables exist (experience, education, certifications, skills, contact_info)
- [x] ✅ No new migrations needed

### Backend (API)
- [x] ✅ Profile creation endpoint exists: `POST /api/career-id/profile`
- [x] ✅ Profile fetch endpoint exists: `GET /api/career-id/profile/:profileId`
- [x] ✅ All section CRUD endpoints exist (experience, education, etc.)

### Frontend
- [x] Update `app/pages/profile/onboarding.vue` stepper configuration
  - [x] Add "Upload" step as first step (before Contact)
  - [x] Add icon: `i-lucide-upload`
  - [x] Add title: "Upload"
  - [x] Update step values: `['upload', 'contact', 'experience', 'education', 'additional']`
- [x] Create `app/components/profile/ResumeUploadSection.vue` component
  - [x] Use Nuxt UI's `UFileUpload` component (https://ui.nuxt.com/docs/components/file-upload)
  - [x] Configure `UFileUpload` with:
    - [x] `accept` prop: `.pdf,.docx,.doc,.jpg,.jpeg,.png`
    - [x] `max-size` prop: `10485760` (10MB in bytes)
    - [x] `multiple` prop: `false` (single file upload)
  - [x] Display supported formats (PDF, DOCX, DOC, JPG, PNG)
  - [x] Display max file size (10MB)
  - [x] Add "Skip" button to proceed to manual entry
  - [x] Handle file selection event from `UFileUpload`
- [x] Add ResumeUploadSection to onboarding template
  - [x] Show when `activeStep === 'upload'`
  - [x] Handle skip action (advance to Contact step)
  - [x] Handle upload success (advance to Contact step with pre-filled data)

---

## USER STORY 2: Upload Resume File with Validation

**Goal:** Allow users to upload their resume in PDF, Word, or image format with proper validation.

### Database
- [x] ✅ No database changes needed

### Backend (API)
- [x] Create `server/utils/file-validator.ts` (utility for validation logic)
  - [x] Implement `validateResumeFile()` function
  - [x] Check file extension (PDF, DOCX, DOC, JPG, PNG)
  - [x] Check file size (max 10MB)
  - [x] Check MIME type matches extension
  - [x] Return validation result with error messages
  - [x] Export validation types and constants
- [x] Create `server/api/career-id/resume/extract.post.ts` (initial endpoint with validation only)
  - [x] Implement event handler with multipart form data
  - [x] Read uploaded file using `readMultipartFormData()`
  - [x] Call `validateResumeFile()` utility
  - [x] Return 400 error if validation fails with specific error message
  - [x] Return 413 error if file too large
  - [x] If validation passes, return success response (placeholder for now)
  - [x] Add request/response logging
  - [x] Add error handling for file read failures

**Note:** This creates the endpoint with validation only. USER STORY 3 will enhance this endpoint to add AI extraction logic.

### Frontend
- [x] Configure `UFileUpload` validation in ResumeUploadSection
  - [x] Use built-in `accept` prop for file type validation
  - [x] Use built-in `max-size` prop for file size validation (10MB)
  - [x] Handle `@error` event for validation errors
  - [x] Display validation errors using Nuxt UI's error states
  - [x] Show error message: "File is too large. Maximum size is 10MB."
  - [x] Show error message: "File format not supported. Please upload PDF, Word, JPG, or PNG."
- [x] Implement upload progress UI
  - [x] Use `UFileUpload`'s built-in progress indicator
  - [x] Show extraction status messages below file upload
  - [x] Display engaging loading state during extraction
  - [x] Communicate extraction is in progress
- [x] Add visual feedback
  - [x] `UFileUpload` provides drag-over highlighting automatically
  - [x] Show file name after selection (built-in to `UFileUpload`)
  - [x] Show file size after selection (built-in to `UFileUpload`)

---

## USER STORY 3: Extract Career Data from Resume

**Goal:** Parse the uploaded resume and extract structured career data to pre-fill the profile form accurately.

### Database
- [x] ✅ All tables exist for storing extracted data
- [x] ✅ Experience table (employment_type, employer, title, dates, highlights)
- [x] ✅ Education table (degree_type, area_of_study, institution, dates, coursework)
- [x] ✅ Certifications table (name, issuer, date)
- [x] ✅ Profile_skills table (name, proficiency_level, years_experience)
- [x] ✅ Contact_info table (first_name, last_name, email, phone, location, summary)

### Backend (API)
- [x] Install dependencies
  - [x] Install Vercel AI SDK and OpenAI provider: `npm install ai @ai-sdk/openai zod`
- [x] Create `server/utils/resume-extractor.ts`
  - [x] Import Vercel AI SDK: `import { generateObject } from 'ai'`
  - [x] Import OpenAI provider: `import { openai } from '@ai-sdk/openai'`
  - [x] Import Zod: `import { z } from 'zod'`
  - [x] Implement `extractResumeData()` function
    - [x] Define Zod schema for extraction (contactInfo, experience, education, skills, certifications)
    - [x] Convert file buffer to base64
    - [x] Use `generateObject()` with GPT-4 Vision model
    - [x] Pass Zod schema for type-safe structured output
    - [x] Send extraction prompt with base64 image
    - [x] Return typed extraction result
    - [x] Handle API errors and timeouts
  - [x] Implement `transformExtractionToProfile()` function
    - [x] Map Zod-validated response to existing profile schema types
    - [x] Transform experience data to match Experience interface
    - [x] Transform education data to match Education interface
    - [x] Transform skills to match ProfileSkill interface
    - [x] Transform contact info to match ContactInfo interface
    - [x] Transform certifications to match Certification interface
  - [x] Implement merge and deduplication logic
    - [x] Identify duplicate experience entries across uploads
    - [x] Identify duplicate education entries across uploads
    - [x] Identify duplicate skills across uploads
    - [x] Merge duplicates keeping most complete version
  - [x] Export extraction types and functions
- [x] Enhance `server/api/career-id/resume/extract.post.ts` (add AI extraction to existing endpoint)
  - [x] Keep existing file upload and validation logic from USER STORY 2
  - [x] After validation passes, call `extractResumeData()` utility
  - [x] Transform extraction result using `transformExtractionToProfile()`
  - [x] Return transformed data as JSON response
  - [x] Add error handling for extraction failures (500, 503)
  - [x] Clear file data from memory after processing
  - [x] Update request/response logging to include extraction metrics
- [x] Create deliverables
  - [x] Create `deliverables/schemas/extraction-types.ts`
    - [x] Define `ResumeExtractionRequest` type
    - [x] Define `ResumeExtractionResponse` type
    - [x] Define `ExtractionError` type
    - [x] Define OpenAI structured output schema
  - [x] Update `deliverables/schemas/api-spec.md`
    - [x] Document POST `/api/career-id/resume/extract` endpoint
    - [x] Document request format (multipart/form-data)
    - [x] Document response format (extracted profile data)
    - [x] Document error responses (400, 413, 500, 503)
    - [x] Add example requests and responses

### Frontend
- [x] Add extraction state to `app/stores/careerIDStore.ts`
  - [x] Add `isExtracting: boolean` (loading state)
  - [x] Add `extractionError: string | null` (error message)
  - [x] Add `extractionResult: ProfileData | null` (extracted data)
- [x] Add `extractResumeData()` action to store
  - [x] Accept File object as parameter
  - [x] Create FormData with file
  - [x] Call `/api/career-id/resume/extract` endpoint
  - [x] Set `isExtracting = true` during request
  - [x] Handle successful response
  - [x] Handle error response
  - [x] Set `isExtracting = false` after completion
  - [x] Return extraction result or throw error
- [x] Add `applyExtractionToProfile()` action to store
  - [x] Populate store state with extracted data
  - [x] Set `contactInfo` from extraction
  - [x] Set `experience` array from extraction
  - [x] Set `education` array from extraction
  - [x] Set `profileSkills` array from extraction
  - [x] Set `certifications` array from extraction
  - [x] Merge with existing data if multiple uploads
  - [x] Deduplicate entries
- [x] Connect ResumeUploadSection to store
  - [x] Import `useCareerIDStore` composable
  - [x] Call `store.extractResumeData()` on file upload
  - [x] Display `store.isExtracting` loading state
  - [x] Display `store.extractionError` if present
  - [x] Call `store.applyExtractionToProfile()` on success
  - [x] Emit success event to parent (onboarding.vue)

---

## USER STORY 4: Handle Resume Extraction Failures

**Goal:** Provide clear feedback if a resume cannot be processed so users can upload an alternative version or proceed manually.

### Database
- [x] ✅ No database changes needed

### Backend (API)
- [x] Enhance error handling in `server/api/career-id/resume/extract.post.ts`
  - [x] Catch OpenAI API timeout errors
  - [x] Catch OpenAI API error responses
  - [x] Catch invalid API key errors
  - [x] Catch corrupted file errors
  - [x] Return user-friendly error messages
  - [x] Log technical details server-side
- [x] Add error response types
  - [x] 400: Invalid file format or size
  - [x] 413: File too large
  - [x] 500: Server error during extraction
  - [x] 503: OpenAI API unavailable

### Frontend
- [x] Add error handling to ResumeUploadSection
  - [x] Display user-friendly error message: "We couldn't read this resume. Can you try uploading another version (PDF, Markdown, or plain text)?"
  - [x] Provide "Try Another File" button
  - [x] Provide "Skip to Manual Entry" button
  - [x] Reset upload interface on retry
  - [x] Clear previous failed file
- [x] Add toast notifications
  - [x] Show error toast for extraction failures
  - [x] Show error toast for file validation failures
  - [x] Provide retry and skip options in toast
- [x] Add retry logic
  - [x] Clear error state when retrying
  - [x] Allow user to upload different file after failure
  - [x] Track retry attempts (optional: limit to 3 retries)

---

## USER STORY 5: Pre-fill Profile Form with Extracted Data

**Goal:** Display extracted career data pre-filled in the profile form so users can review, correct, and save it quickly.

### Database
- [x] ✅ All tables ready to receive extracted data
- [x] ✅ Existing API endpoints handle data saving

### Backend (API)
- [x] ✅ All CRUD endpoints exist for saving profile data
- [x] ✅ POST endpoints: experience, education, certifications, skills, contact
- [x] ✅ PATCH endpoints: experience, education, certifications, skills, contact
- [x] ✅ DELETE endpoints: experience, education, certifications, skills

### Frontend
- [ ] Verify form sections display extracted data
  - [ ] Verify `ContactSection` displays extracted contact info
  - [ ] Verify `ExperienceSection` displays extracted experience entries
  - [ ] Verify `EducationSection` displays extracted education entries
  - [ ] Verify `AdditionalSection` displays extracted skills
  - [ ] Verify `AdditionalSection` displays extracted certifications
- [ ] Ensure all extracted data is editable
  - [ ] Users can edit any pre-filled field
  - [ ] Users can add new entries
  - [ ] Users can delete extracted entries
  - [ ] Users can reorder entries
- [ ] Add visual indicators (optional)
  - [ ] Mark extracted fields with subtle indicator
  - [ ] Differentiate extracted vs manually entered data
- [ ] Preserve data through form submission
  - [ ] Extracted data saves correctly via existing API endpoints
  - [ ] User edits to extracted data save correctly
  - [ ] Mixed extracted and manual data saves correctly
- [ ] Add success feedback
  - [ ] Show success toast after successful extraction
  - [ ] Display summary: "Found X jobs, Y degrees, Z skills"
  - [ ] Auto-advance to Contact step after 2 seconds

---

## USER STORY 6: Visual Indicators for Extracted Data

**Goal:** Visually distinguish resume-extracted data from manually entered data using purple borders and badges, allowing users to manually decide what to keep or delete.

### Database
- [x] ✅ No database changes needed - `isExtracted` is frontend-only flag

### Backend (API)
- [x] Update type definitions in `shared/types/careerId.ts`
  - [x] Add `isExtracted?: boolean` to Experience interface
  - [x] Add `isExtracted?: boolean` to Education interface
  - [x] Add `isExtracted?: boolean` to Certification interface
  - [x] Add `isExtracted?: boolean` to ProfileSkill interface
  - [x] Add `isExtracted?: boolean` to ContactInfo interface
- [x] Update `server/utils/resume-extractor.ts`
  - [x] Add `isExtracted: true` to all items in `transformExtractionToProfile()`
  - [x] Set extracted skills to group 'Extracted' instead of null

### Frontend
- [x] Update `app/stores/careerIDStore.ts`
  - [x] Modify `applyExtractionToProfile()` to always merge (remove mode parameter)
  - [x] Set `isExtracted: true` on all extracted items
  - [x] Set `group: 'Extracted'` for all extracted skills
  - [x] Keep both old and new data (show duplicates with visual indicators)
- [x] Update `app/components/profile/ContactSection.vue`
  - [x] Add purple border (`ring-2 ring-purple-500`) to all input fields when `contactInfo?.isExtracted`
  - [x] Add "Extracted" badge with sparkles icon to section header
- [x] Update `app/components/profile/ExperienceSection.vue`
  - [x] Add purple border to cards where `experience.isExtracted`
  - [x] Add "Extracted" badge with sparkles icon to card titles (both collapsed and expanded views)
- [x] Update `app/components/profile/EducationSection.vue`
  - [x] Add purple border to cards where `education.isExtracted`
  - [x] Add "Extracted" badge with sparkles icon to card titles (both collapsed and expanded views)
- [x] Update `app/components/profile/AdditionalSection.vue`
  - [x] Add purple border to certification cards where `cert.isExtracted`
  - [x] Add "Extracted" badge with sparkles icon to certification titles
  - [x] Preserve `isExtracted` field in local state transformation
  - [x] Extracted skills automatically appear in "Extracted" group (via store logic)
- [x] Update `app/pages/profile/onboarding.vue`
  - [x] Update info banner message to explain visual indicators approach
  - [x] No deletion logic needed - users manually delete unwanted items
- [x] Update `app/components/profile/ResumeUploadSection.vue`
  - [x] Remove mode parameter from `applyExtractionToProfile()` call
  - [x] Always use merge mode with visual indicators

**Key Behavior:**
- No auto-delete or overwrite
- No confirmation modal for destructive actions
- Extracted data shown alongside existing data with purple borders
- Users manually review and delete unwanted items using existing delete buttons
- Skills from resume extraction automatically grouped as "Extracted"

---

## USER STORY 7: Refactor Onboarding Sections for Section-Based Editing

**Goal:** Refactor Experience, Education, and Additional (Skills/Certifications) sections to match the `ContactSectionNew.vue` pattern with individual item editing, immediate API saves, and UI consistency with profile view pages.

### Overview of Changes

**Current State:**
- 5 onboarding steps with "Additional" combining Skills + Certifications
- `ExperienceSection.vue` - Complex change tracking across all items
- `EducationSection.vue` - Complex change tracking across all items  
- `AdditionalSection.vue` - Combines skills AND certifications in one component
- Bulk save on "Continue" button
- Inconsistent UI compared to profile view pages

**Target State:**
- 6 onboarding steps with separate Skills and Certifications steps
- `ExperienceSectionNew.vue` - Individual edit mode per item, matches `profile/experience.vue`
- `EducationSectionNew.vue` - Individual edit mode per item, matches `profile/education.vue`
- `SkillsSection.vue` - Group-based editing, matches `profile/skills.vue`
- `CertificationsSection.vue` - Individual edit mode per item, matches `profile/certifications.vue`
- Immediate API saves per item/section
- Continue button only validates and navigates
- UI exactly matches profile view pages

### Database
- [ ] ✅ No database changes needed - all tables and endpoints exist

### Backend (API)
- [ ] ✅ All required CRUD endpoints already exist
- [ ] ✅ Experience endpoints: POST, PATCH, DELETE
- [ ] ✅ Education endpoints: POST, PATCH, DELETE
- [ ] ✅ Skills endpoints: POST, PATCH, DELETE
- [ ] ✅ Certifications endpoints: POST, PATCH, DELETE

### Frontend

#### Phase 1: Update Onboarding Stepper Structure
- [x] Update `app/pages/profile/onboarding.vue` stepper configuration
  - [x] Update `steps` array from 5 to 6 steps
  - [x] Change step values: `['upload', 'contact', 'experience', 'education', 'skills', 'certifications']`
  - [x] Update step objects:
    - [x] Keep: Upload, Contact, Experience, Education
    - [x] Add Skills: `{ title: 'Skills', icon: 'i-lucide-lightbulb', value: 'skills' }`
    - [x] Add Certifications: `{ title: 'Certifications', icon: 'i-lucide-award', value: 'certifications' }`
    - [x] Remove: "Additional" step
  - [x] Update template refs
    - [x] Remove: `additionalSectionRef`
    - [x] Add: `skillsSectionRef`, `certificationsSectionRef`
  - [x] Update event handlers
    - [x] Remove `handleSaveAllAdditional` handler
    - [x] Add comments noting new sections will handle own API calls
  - [x] Update Continue button navigation logic
    - [x] Update `autosaveCurrentStep()` to include 'skills' and 'certifications' cases
    - [x] Continue button already only validates and navigates (no changes needed)
  - [x] Comment out AdditionalSection in template
  - [x] Add placeholder comments for new SkillsSection and CertificationsSection components

#### Phase 2: Create ExperienceSectionNew.vue
- [x] Create `app/components/profile/ExperienceSectionNew.vue`
  - [x] Copy from `ExperienceSection.vue` as starting point
  - [x] Update to match `profile/experience.vue` UI patterns exactly
  - [x] Add TypeScript interfaces:
    - [x] `ExperienceFormData` interface with edit state
    - [x] `ExperienceErrors` interface for validation
- [x] Implement individual item edit mode
  - [x] Add `editingExperienceId` state (tracks which item is being edited)
  - [x] View mode: Show experience details with Edit/Delete buttons
  - [x] Edit mode: Show form fields with Save Changes/Cancel buttons
  - [x] Only one item editable at a time
  - [x] Match layout exactly with `profile/experience.vue`
- [x] Add API integration per item
  - [x] Import `useCareerIDStore` and `useToast`
  - [x] Implement `saveExperience()` function
    - [x] Validate form data
    - [x] Call `careerIDStore.addExperience()` for new items
    - [x] Call `careerIDStore.updateExperience()` for existing items
    - [x] Show success toast on save
    - [x] Show error toast on failure
    - [x] Reset `isExtracted` flag handled by store
  - [x] Implement `deleteExperience()` function
    - [x] Show confirmation dialog
    - [x] Call `careerIDStore.deleteExperience()`
    - [x] Show success/error toasts
  - [x] Add loading state per item (`isSavingExperience`)
- [x] Implement extraction highlighting
  - [x] Check `experience.isExtracted` per experience item
  - [x] Show purple ring (`ring-1 ring-purple-500`) on extracted items
  - [x] Show "Extracted" badge with sparkles icon
  - [x] Extraction flag reset handled by store after save
- [x] Add exposed methods for compatibility
  - [x] `triggerSave()`: Auto-saves any item currently in edit mode
  - [x] `revertChanges()`: Cancels all edit modes, resets form data
  - [x] `handleApiError()`: Displays API error messages
  - [x] Maintain same interface as `ContactSectionNew.vue`
- [x] Validation
  - [x] Implement field validation (required fields, date formats, URL)
  - [x] Show inline error messages with specific field errors
  - [x] Prevent save if validation fails
  - [x] Validate date ranges (start date < end date)
- [x] Update onboarding.vue to use ExperienceSectionNew
  - [x] Replace ProfileExperienceSection with ProfileExperienceSectionNew
  - [x] Comment out old component for side-by-side testing
- [x] Fix extracted experience issues (lessons learned for other sections)
  - [x] Use index-based tracking (`editingExperienceIndex`) instead of ID-based
  - [x] Use `experience.id || expIndex` for v-for keys to handle items without IDs
  - [x] Remove extracted version after saving to prevent duplicates
  - [x] Handle delete for extracted items (no API call, just filter from array)

#### Phase 3: Create EducationSectionNew.vue
- [x] Create `app/components/profile/EducationSectionNew.vue`
  - [x] Copy from `EducationSection.vue` as starting point
  - [x] Update to match `profile/education.vue` UI patterns exactly
  - [x] Add TypeScript interfaces:
    - [x] `EducationFormData` interface with edit state
    - [x] `EducationErrors` interface for validation
- [x] Implement individual item edit mode
  - [x] **IMPORTANT**: Use `editingEducationIndex` (index-based) NOT `editingEducationId` (ID-based)
  - [x] **IMPORTANT**: Use `v-for="(education, eduIndex) in educations" :key="education.id || eduIndex"`
  - [x] View mode: Show education details with Edit/Delete buttons
  - [x] Edit mode: Show form fields with Save Changes/Cancel buttons
  - [x] Only one item editable at a time
  - [x] Match layout exactly with `profile/education.vue`
  - [x] Pass index to `startEditingEducation(eduIndex)` not object
  - [x] Check `editingEducationIndex !== eduIndex` for view/edit toggle
- [x] Add API integration per item
  - [x] Import `useCareerIDStore` and `useToast`
  - [x] Implement `saveEducation()` function
    - [x] Validate form data
    - [x] Call `careerIDStore.addEducation()` for new items
    - [x] Call `careerIDStore.updateEducation()` for existing items
    - [x] **IMPORTANT**: After adding, remove extracted version from array to avoid duplicates
    - [x] Show success toast on save
    - [x] Show error toast on failure
    - [x] Reset `isExtracted` flag handled by store
  - [x] Implement `deleteEducation()` function
    - [x] **IMPORTANT**: Accept education object, not just ID
    - [x] Check if `education.id` exists
    - [x] If ID exists: Call `careerIDStore.deleteEducation(id)` (API delete)
    - [x] If NO ID: Filter from array only (extracted item, no API call needed)
    - [x] Show confirmation dialog
    - [x] Show success/error toasts
  - [x] Add loading state per item (`isSavingEducation`)
- [x] Implement extraction highlighting
  - [x] Check `education.isExtracted` per education item
  - [x] Show purple ring on extracted items
  - [x] Show "Extracted" badge with sparkles icon
  - [x] Extraction flag reset handled by store after save
- [x] Add exposed methods for compatibility
  - [x] `triggerSave()`: Auto-saves any item in edit mode
  - [x] `revertChanges()`: Cancels all edit modes
  - [x] `handleApiError()`: Displays API errors
- [x] Validation
  - [x] Required fields: degree type, area of study, institution
  - [x] Date format validation (MM/YYYY)
  - [x] Date range validation (start < end)
  - [x] URL validation if provided
  - [x] Credit hours validation (0-500 range)
  - [x] Show inline error messages
- [x] Update onboarding.vue to use EducationSectionNew
  - [x] Replace ProfileEducationSection with ProfileEducationSectionNew
  - [x] Comment out old component for side-by-side testing

#### Phase 4: Create SkillsSection.vue
- [x] Create `app/components/profile/SkillsSection.vue`
  - [x] Copy skills-related logic from `AdditionalSection.vue`
  - [x] **SIMPLIFIED**: Tag-based input for onboarding (no proficiency/years for speed)
  - [x] Add TypeScript interfaces:
    - [x] `SkillItem` interface (simplified - just name + id)
    - [x] `SkillGroupFormData` interface with edit state
    - [x] Validation errors interface
- [x] Implement group-based editing
  - [x] Skills organized by groups/categories
  - [x] View mode: Show group name + skill badges
  - [x] Edit mode: Tag-based input (type + Enter to add skills)
  - [x] **SIMPLIFIED UI**: Quick skill entry for onboarding, not full profile/skills.vue
  - [x] **NOTE**: Skills use group-based editing, not individual items
  - [x] **NOTE**: Extracted skills without IDs can be identified by matching name + group
  - [x] **NOTE**: When saving a group, remove extracted skills from that group after save
- [x] Add API integration per group
  - [x] Import `useCareerIDStore` and `useToast`
  - [x] Implement `saveGroup()` function
    - [x] Validate group and skills
    - [x] Handle add, update, and delete of skills in group
    - [x] **CRITICAL**: Check each skill's ID to determine ADD vs UPDATE
      - Skills without IDs → `careerIDStore.addSkills()` (new or extracted)
      - Skills with IDs → `careerIDStore.updateSkills()` (existing in DB)
    - [x] Call `careerIDStore.addSkills()` for new skills (with default proficiency/years)
    - [x] Call `careerIDStore.updateSkills()` for modified skills
    - [x] Call `careerIDStore.deleteSkills()` for removed skills
    - [x] Show success/error toasts
    - [x] Remove extracted skills from store after save
  - [x] Implement `deleteGroup()` function
    - [x] Show confirmation dialog
    - [x] Delete all skills in group (by ID if saved, or filter from array)
    - [x] Show success/error toasts
  - [x] Add loading state per group (`isSavingGroup`)
- [x] Implement extraction highlighting
  - [x] Add `hasExtractedSkills` flag per group
  - [x] Show purple ring on groups with extracted skills
  - [x] Show "Extracted" badge on group header
  - [x] Purple ring on individual extracted skill badges
  - [x] Extracted skills removed from store after save
- [x] Add exposed methods for compatibility
  - [x] `triggerSave()`: Auto-saves any group in edit mode
  - [x] `revertChanges()`: Cancels all group edits
  - [x] `handleApiError()`: Displays API errors
- [x] Validation
  - [x] Group name required (except "No Group")
  - [x] At least one skill required per group
  - [x] Duplicate skill detection within group
  - [x] Show inline error messages per group
- [x] Update onboarding.vue to use SkillsSection
  - [x] Replace commented TODO with ProfileSkillsSection
  - [x] No event handlers needed (component handles its own API calls)

#### Phase 5: Create CertificationsSection.vue
- [x] Create `app/components/profile/CertificationsSection.vue`
  - [x] Copy certifications logic from `AdditionalSection.vue`
  - [x] Match structure of `profile/certifications.vue` EXACTLY
  - [x] Add TypeScript interfaces:
    - [x] `CertificationFormData` interface
    - [x] `CertificationErrors` interface for validation
- [x] Implement individual item edit mode
  - [x] Add `isAddingCertification` state (for add form)
  - [x] **IMPORTANT**: Use `editingCertificationIndex` (index-based) NOT `editingCertificationId`
  - [x] **IMPORTANT**: Use `v-for="(cert, certIndex) in certifications" :key="cert.id || certIndex"`
  - [x] View mode: List of certifications with Edit/Delete buttons
  - [x] Add mode: Show "Add Certification" button → reveals form
  - [x] Edit mode: Show form fields with Save/Cancel buttons
  - [x] Match UI exactly with `profile/certifications.vue`
  - [x] Pass index to `startEditingCertification(certIndex)` not object
  - [x] Check `editingCertificationIndex !== certIndex` for view/edit toggle
- [x] Add API integration per item
  - [x] Import `useCareerIDStore` and `useToast`
  - [x] Implement `saveCertification()` function
    - [x] Validate form data
    - [x] **CRITICAL**: Check if item has ID to determine ADD vs UPDATE
    - [x] Call `careerIDStore.addCertification()` for new items
    - [x] Call `careerIDStore.updateCertification()` for existing items
    - [x] **IMPORTANT**: After adding, remove extracted version from array to avoid duplicates
    - [x] Show success toast
    - [x] Show error toast on failure
    - [x] Reset `isExtracted` flag handled by store
  - [x] Implement `deleteCertification()` function
    - [x] **IMPORTANT**: Accept certification object, not just ID
    - [x] Check if `certification.id` exists
    - [x] If ID exists: Call `careerIDStore.deleteCertification(id)` (API delete)
    - [x] If NO ID: Filter from array only (extracted item, no API call needed)
    - [x] Show confirmation dialog
    - [x] Show success/error toasts
  - [x] Add loading state (`isSavingCertification`)
- [x] Implement extraction highlighting
  - [x] Check `certification.isExtracted` per certification
  - [x] Show purple ring on extracted items
  - [x] Show "Extracted" badge with sparkles icon
  - [x] Extraction flag reset handled by store after save
- [x] Add exposed methods for compatibility
  - [x] `triggerSave()`: Auto-saves any certification in edit mode
  - [x] `revertChanges()`: Cancels all edit modes
  - [x] `handleApiError()`: Displays API errors
- [x] Validation
  - [x] Required: name, issuer, issue date
  - [x] Date format: MM/YYYY
  - [x] Expiration date: Optional (only validate format if provided)
  - [x] **NOTE**: If certification has no expiration, expiration date is optional
  - [x] URL validation if provided
  - [x] Show inline error messages
- [x] Update onboarding.vue to use CertificationsSection
  - [x] Replace commented TODO with ProfileCertificationsSection
  - [x] No event handlers needed (component handles its own API calls)

#### Phase 6: Update Store for Per-Item Extraction Flags
- [ ] Update `app/stores/careerIDStore.ts` - Experience extraction
  - [ ] Enhance `applyExtractionToProfile()` for Experience
  - [ ] Implement intelligent comparison for experiences
    - [ ] Compare employer, title, start/end dates
    - [ ] Use case-insensitive string comparison
    - [ ] Normalize dates for comparison
  - [ ] Set `isExtracted: true` only on NEW or DIFFERENT experiences
  - [ ] Merge extracted experiences with existing ones (no duplicates)
  - [ ] Add helper function: `isDifferentExperience()`
- [ ] Update `app/stores/careerIDStore.ts` - Education extraction
  - [ ] Enhance `applyExtractionToProfile()` for Education
  - [ ] Implement intelligent comparison for education
    - [ ] Compare institution, degree type, area of study, dates
    - [ ] Use case-insensitive comparison
  - [ ] Set `isExtracted: true` only on NEW or DIFFERENT items
  - [ ] Merge extracted education with existing (no duplicates)
  - [ ] Add helper function: `isDifferentEducation()`
- [ ] Update `app/stores/careerIDStore.ts` - Skills extraction
  - [ ] Enhance `applyExtractionToProfile()` for Skills
  - [ ] Implement intelligent comparison for skills
    - [ ] Compare skill name (case-insensitive, trimmed)
    - [ ] Consider proficiency level and years if present
  - [ ] Set `isExtracted: true` only on NEW or DIFFERENT skills
  - [ ] Merge extracted skills with existing (no duplicates)
  - [ ] Add helper function: `isDifferentSkill()`
- [ ] Update `app/stores/careerIDStore.ts` - Certifications extraction
  - [ ] Enhance `applyExtractionToProfile()` for Certifications
  - [ ] Implement intelligent comparison for certifications
    - [ ] Compare name and issuer (case-insensitive)
    - [ ] Compare issue dates
  - [ ] Set `isExtracted: true` only on NEW or DIFFERENT certifications
  - [ ] Merge extracted certifications with existing (no duplicates)
  - [ ] Add helper function: `isDifferentCertification()`
- [ ] Add reset logic for extraction flags
  - [ ] Update `updateExperience()`: Reset `isExtracted` after successful save
  - [ ] Update `updateEducation()`: Reset `isExtracted` after successful save
  - [ ] Update `updateSkills()`: Reset `isExtracted` after successful save
  - [ ] Update `updateCertification()`: Reset `isExtracted` after successful save

#### Phase 7: Update TypeScript Types
- [ ] Update `shared/types/careerId.ts`
  - [ ] Verify `Experience` interface has `isExtracted?: boolean`
  - [ ] Verify `Education` interface has `isExtracted?: boolean`
  - [ ] Verify `ProfileSkill` interface has `isExtracted?: boolean`
  - [ ] Verify `Certification` interface has `isExtracted?: boolean`
  - [ ] Add JSDoc comments explaining `isExtracted` flag usage

#### Phase 8: Integration and Testing
- [ ] Update onboarding.vue to use new components
  - [ ] Replace `<ProfileExperienceSection>` with `<ProfileExperienceSectionNew>`
  - [ ] Replace `<ProfileEducationSection>` with `<ProfileEducationSectionNew>`
  - [ ] Replace `<ProfileAdditionalSection>` with separate components:
    - [ ] Add `<ProfileSkillsSection>` for skills step
    - [ ] Add `<ProfileCertificationsSection>` for certifications step
  - [ ] Update `v-show` conditions for 6 steps
  - [ ] Update component refs to match new names
  - [ ] Comment out old components for side-by-side testing
- [ ] Test complete onboarding flow (6 steps)
  - [ ] Step 1: Upload resume → extraction works
  - [ ] Step 2: Contact → section-based editing works
  - [ ] Step 3: Experience → individual item edit/save works
  - [ ] Step 4: Education → individual item edit/save works
  - [ ] Step 5: Skills → group-based edit/save works
  - [ ] Step 6: Certifications → individual item edit/save works
  - [ ] Verify "Continue" button only navigates (no saves)
- [ ] Test extraction highlighting
  - [ ] Upload resume with existing data
  - [ ] Verify only NEW/DIFFERENT items get purple highlights
  - [ ] Verify identical items don't get extraction flags
  - [ ] Verify saving an item removes its extraction flag
  - [ ] Test all sections: Contact, Experience, Education, Skills, Certifications
- [ ] Test individual item operations
  - [ ] Experience: Add, Edit, Delete, Save, Cancel
  - [ ] Education: Add, Edit, Delete, Save, Cancel
  - [ ] Skills: Add group, Edit group, Delete group, Add skill, Remove skill
  - [ ] Certifications: Add, Edit, Delete, Save, Cancel
  - [ ] Verify API calls happen immediately on "Save Changes"
  - [ ] Verify loading states show during API calls
  - [ ] Verify success/error toasts appear
- [ ] Verify UI consistency with profile view
  - [ ] Compare `ExperienceSectionNew.vue` with `profile/experience.vue`
  - [ ] Compare `EducationSectionNew.vue` with `profile/education.vue`
  - [ ] Compare `SkillsSection.vue` with `profile/skills.vue`
  - [ ] Compare `CertificationsSection.vue` with `profile/certifications.vue`
  - [ ] Ensure identical layouts, buttons, interactions, validation
  - [ ] Test responsive behavior on mobile/tablet
- [ ] Test validation
  - [ ] Required field validation in all sections
  - [ ] Date format validation (MM/YYYY)
  - [ ] Date range validation (start < end)
  - [ ] URL validation where applicable
  - [ ] Inline error messages display correctly
  - [ ] Save prevented when validation fails
- [ ] Test Cancel behavior
  - [ ] Cancel reverts unsaved changes
  - [ ] Cancel in onboarding doesn't delete extracted data
  - [ ] Cancel closes edit mode and returns to view mode

#### Phase 9: Cleanup
- [ ] Remove old components (after thorough testing)
  - [ ] Delete `app/components/profile/ExperienceSection.vue`
  - [ ] Delete `app/components/profile/EducationSection.vue`
  - [ ] Delete `app/components/profile/AdditionalSection.vue`
- [ ] Rename new components (remove "New" suffix)
  - [ ] Rename `ExperienceSectionNew.vue` → `ExperienceSection.vue`
  - [ ] Rename `EducationSectionNew.vue` → `EducationSection.vue`
  - [ ] Update all imports in `onboarding.vue`
  - [ ] Verify no references to "New" components remain
- [ ] Update documentation
  - [ ] Update comments in onboarding.vue
  - [ ] Document section-based editing pattern
  - [ ] Document extraction flag reset behavior
  - [ ] Add JSDoc comments to exposed component methods

---

## Testing & Verification

### Backend Testing
- [ ] Test file validation with various file types
  - [ ] Valid: PDF, DOCX, DOC, JPG, PNG
  - [ ] Invalid: TXT, ZIP, EXE, etc.
- [ ] Test file size validation
  - [ ] Valid: Files under 10MB
  - [ ] Invalid: Files over 10MB
- [ ] Test extraction with sample resumes
  - [ ] Standard format resume (clear sections)
  - [ ] Non-standard format resume (creative layout)
  - [ ] Image-based resume (JPG/PNG)
- [ ] Test error handling
  - [ ] OpenAI API timeout
  - [ ] OpenAI API error response
  - [ ] Invalid API key
  - [ ] Corrupted file
- [ ] Test merge and deduplication
  - [ ] Upload same resume twice
  - [ ] Upload two different resumes with overlapping data
  - [ ] Verify duplicates are merged correctly
- [ ] Verify data transformation accuracy
  - [ ] Experience dates parsed correctly
  - [ ] Education degrees mapped correctly
  - [ ] Skills extracted and deduplicated
  - [ ] Contact info formatted correctly

### Frontend Testing
- [ ] Test file upload UI
  - [ ] Drag-and-drop works
  - [ ] File picker works
  - [ ] File validation displays errors
- [ ] Test extraction flow
  - [ ] Upload shows progress
  - [ ] Extraction shows status messages
  - [ ] Success advances to Contact step
  - [ ] Extracted data appears in form sections
- [ ] Test error scenarios
  - [ ] Invalid file shows error
  - [ ] Extraction failure shows error
  - [ ] Retry button works
  - [ ] Skip button works
- [ ] Test navigation
  - [ ] Can skip upload step
  - [ ] Can navigate back to upload
  - [ ] Can proceed after extraction
- [ ] Test data editing
  - [ ] Can edit extracted contact info
  - [ ] Can edit extracted experience
  - [ ] Can edit extracted education
  - [ ] Can edit extracted skills
  - [ ] Can save edited data
- [ ] Test multiple uploads
  - [ ] Can upload second resume
  - [ ] Data merges correctly
  - [ ] Duplicates are removed

### Integration Testing
- [ ] Test complete onboarding flow with resume upload
  - [ ] Upload resume
  - [ ] Review extracted data
  - [ ] Edit/correct data
  - [ ] Save profile
  - [ ] Verify data persisted correctly
- [ ] Test complete onboarding flow without resume upload
  - [ ] Skip upload step
  - [ ] Manually enter all data
  - [ ] Save profile
  - [ ] Verify data persisted correctly
- [ ] Test error recovery flow
  - [ ] Upload fails
  - [ ] Retry with same file
  - [ ] Retry with different file
  - [ ] Skip to manual entry
  - [ ] Complete onboarding manually
- [ ] Test profile completion check
  - [ ] Complete profile with resume upload
  - [ ] Try to access onboarding again
  - [ ] Verify upload step is hidden
  - [ ] Verify extraction API returns 403

### Performance Testing
- [ ] Measure extraction time for various file sizes
  - [ ] Small resume (< 1MB): Target < 10 seconds
  - [ ] Medium resume (1-5MB): Target < 15 seconds
  - [ ] Large resume (5-10MB): Target < 20 seconds
- [ ] Test memory usage during extraction
  - [ ] Verify files not persisted to disk
  - [ ] Verify memory cleared after extraction
- [ ] Test concurrent extractions (if applicable)
  - [ ] Multiple users uploading simultaneously
  - [ ] Rate limiting works correctly

---

## Documentation & Deployment

### Documentation
- [ ] Update README with resume upload feature
- [ ] Document OpenAI API key setup
- [ ] Document supported file formats
- [ ] Document extraction accuracy expectations (85%+)
- [ ] Add troubleshooting guide for common issues
- [ ] Document merge and deduplication logic

### Environment Setup
- [ ] Add `OPENAI_API_KEY` to production environment
- [ ] Add `ENABLE_RESUME_UPLOAD` feature flag (optional)
- [ ] Verify environment variables in deployment

### Monitoring & Metrics
- [ ] Add logging for extraction requests
  - [ ] Log file type and size
  - [ ] Log extraction duration
  - [ ] Log extraction success/failure
  - [ ] Log merge/deduplication events
- [ ] Add metrics tracking
  - [ ] Extraction success rate
  - [ ] Average extraction time
  - [ ] OpenAI API costs
  - [ ] User adoption rate (upload vs manual entry)
  - [ ] Multiple upload frequency

### Deployment Checklist
- [ ] Backend changes deployed
- [ ] Frontend changes deployed
- [ ] Environment variables configured
- [ ] OpenAI API key verified
- [ ] Feature flag enabled (if using)
- [ ] Monitoring dashboards updated
- [ ] User documentation published

---

## Dependencies & Prerequisites

**External Services:**
- OpenAI API account with GPT-4 Vision access
- API key with sufficient quota/credits

**NPM Packages:**
- `ai` - Vercel AI SDK 5 (framework-agnostic AI utilities)
- `@ai-sdk/openai` - OpenAI provider for Vercel AI SDK
- `zod` - TypeScript-first schema validation (already installed)

**Nuxt UI Components:**
- `UFileUpload` - Built-in Nuxt UI component for file uploads (https://ui.nuxt.com/docs/components/file-upload)

**Environment Variables:**
- `OPENAI_API_KEY` - Required for AI extraction
- `ENABLE_RESUME_UPLOAD` - Optional feature flag (default: true)

**Existing Infrastructure:**
- Database schema (profiles, experience, education, etc.)
- API endpoints for saving profile data
- Pinia store (careerIDStore) for state management
- Onboarding stepper UI

---

## Risk Mitigation

**Risk: AI extraction accuracy below 85%**
- Mitigation: Iterate on prompts, require user review, track metrics

**Risk: OpenAI API costs too high**
- Mitigation: Rate limiting, cost monitoring, budget alerts

**Risk: API latency too high (> 20 seconds)**
- Mitigation: Progress indicators, async processing (future), file size limits

**Risk: Privacy concerns with PII in resumes**
- Mitigation: In-memory processing only, no file persistence, secure API calls

**Risk: Unsupported file formats**
- Mitigation: Clear validation, error messages, fallback to manual entry

**Risk: Duplicate data from multiple uploads**
- Mitigation: Merge and deduplication logic, user review before saving
