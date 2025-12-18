# Change: Add Resume Upload and AI Extraction

## Why

Users currently must manually enter all career information through a multi-step onboarding form, which is time-consuming and creates friction during initial profile creation. Many users already have resumes that contain this information in a structured format. By enabling resume upload with AI-powered extraction, we can dramatically reduce onboarding time from 15-20 minutes to 2-3 minutes, improving conversion rates and user satisfaction.

This feature provides an accelerated onboarding path that automatically extracts and pre-fills career data from uploaded resume documents, allowing users to review and refine rather than manually type everything from scratch.

## What Changes

- Add resume upload step as the first step in the onboarding stepper (before Contact step)
- Support multiple resume formats: PDF, DOCX, DOC, JPG, PNG (up to 10MB)
- Integrate Vercel AI SDK 5 with OpenAI GPT-4 Vision for AI-powered resume parsing and data extraction
- Use Nuxt UI's `UFileUpload` component for file upload interface
- Extract structured career data: professional experience, education, skills, contact information, and certifications
- Pre-fill onboarding form sections with extracted data
- Display extraction progress with loading states and status indicators
- Allow users to review, correct, and supplement extracted data before saving
- Store files temporarily in memory during extraction, then discard (no persistent file storage)
- Provide "Skip" option to allow users to manually enter data instead
- Handle extraction errors gracefully with fallback to manual entry

## Impact

### Affected Specs
- [`profile-builder`](../../specs/profile-builder/spec.md) - MODIFIED to add resume upload capability

### Affected Code
- **Frontend:**
  - [`app/pages/profile/onboarding.vue`](../../../app/pages/profile/onboarding.vue) - Add new "Upload" step to stepper
  - New component: `app/components/profile/ResumeUploadSection.vue` - Upload UI and file handling
  - [`app/stores/careerIDStore.ts`](../../../app/stores/careerIDStore.ts) - May need extraction state management
  
- **Backend:**
  - New API endpoint: `server/api/career-id/resume/extract.post.ts` - Handle file upload and AI extraction
  - New utility: `server/utils/resume-extractor.ts` - OpenAI integration and extraction logic
  - New utility: `server/utils/file-validator.ts` - File type and size validation
  - [`server/utils/career-id-transformer.ts`](../../../server/utils/career-id-transformer.ts) - May need extraction response transformation

- **Types:**
  - [`shared/types/careerId.ts`](../../../shared/types/careerId.ts) - Add extraction request/response types

### Dependencies
- New: `ai` npm package (Vercel AI SDK 5)
- New: `@ai-sdk/openai` npm package (OpenAI provider for Vercel AI SDK)
- Existing: `zod` npm package (already installed, used for schema validation)
- Nuxt UI: `UFileUpload` component (built-in, no installation needed)
- Environment variable: `OPENAI_API_KEY` for API authentication

### Performance Considerations
- AI extraction typically takes 5-15 seconds depending on resume complexity
- File size limit of 10MB prevents excessive memory usage
- Files processed in memory only (no disk I/O overhead)
- Rate limiting may be needed for OpenAI API calls

### User Experience Impact
- **Positive:** Dramatically reduces onboarding time (15-20 min → 2-3 min)
- **Positive:** Reduces data entry errors and typos
- **Positive:** Improves conversion rates for new users
- **Consideration:** Users must review extracted data for accuracy (85%+ accuracy target)
- **Consideration:** Extraction failures require fallback to manual entry

### Security Considerations
- Resume files contain PII (names, addresses, phone numbers, work history)
- Files must be processed securely and never persisted to disk
- OpenAI API calls must use secure HTTPS connections
- API key must be stored securely in environment variables
- File validation prevents malicious file uploads

### Out of Scope
- Handwritten resume processing
- Scanned image resumes with poor OCR quality
- Non-English resumes
- Resume parsing for non-standard/creative formats
- Real-time resume updating from external sources
- Bulk resume upload
- Persistent resume file storage
