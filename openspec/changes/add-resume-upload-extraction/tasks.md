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
- [ ] Enhance error handling in `server/api/career-id/resume/extract.post.ts`
  - [ ] Catch OpenAI API timeout errors
  - [ ] Catch OpenAI API error responses
  - [ ] Catch invalid API key errors
  - [ ] Catch corrupted file errors
  - [ ] Return user-friendly error messages
  - [ ] Log technical details server-side
- [ ] Add error response types
  - [ ] 400: Invalid file format or size
  - [ ] 413: File too large
  - [ ] 500: Server error during extraction
  - [ ] 503: OpenAI API unavailable

### Frontend
- [ ] Add error handling to ResumeUploadSection
  - [ ] Display user-friendly error message: "We couldn't read this resume. Can you try uploading another version (PDF, Word, or a screenshot)?"
  - [ ] Provide "Try Another File" button
  - [ ] Provide "Skip to Manual Entry" button
  - [ ] Reset upload interface on retry
  - [ ] Clear previous failed file
- [ ] Add toast notifications
  - [ ] Show error toast for extraction failures
  - [ ] Show error toast for file validation failures
  - [ ] Provide retry and skip options in toast
- [ ] Add retry logic
  - [ ] Clear error state when retrying
  - [ ] Allow user to upload different file after failure
  - [ ] Track retry attempts (optional: limit to 3 retries)

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

## USER STORY 6: Prevent Multiple Resume Uploads After Onboarding

**Goal:** Ensure users cannot re-upload resumes after their profile is set up to maintain a clean data pipeline.

### Database
- [x] ✅ Profile completion_status field exists
- [x] ✅ Can check if profile is complete

### Backend (API)
- [ ] Add profile completion check to extraction endpoint
  - [ ] Check if profile already exists and is complete
  - [ ] Return 403 error if profile is already complete
  - [ ] Error message: "Profile already exists. Resume upload is only available during initial onboarding."

### Frontend
- [ ] Hide resume upload step after profile creation
  - [ ] Check if profile exists and is complete on onboarding load
  - [ ] Skip upload step if profile is complete
  - [ ] Start at Contact step if profile is complete
- [ ] Disable resume upload in profile settings
  - [ ] Do not show resume upload option in profile dashboard
  - [ ] Do not show resume upload option in settings
  - [ ] Prevent access to extraction API if profile is complete
- [ ] Add conditional rendering
  - [ ] Only show upload step if profile is incomplete or doesn't exist
  - [ ] Show appropriate message if user tries to access upload after completion

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
