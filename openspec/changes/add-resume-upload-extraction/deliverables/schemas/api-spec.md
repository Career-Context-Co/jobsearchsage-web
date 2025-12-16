# Resume Extraction API Specification

## Overview

The Resume Extraction API enables automated extraction of structured career data from resume files using Vercel AI Gateway (with GPT-4o Vision). This endpoint accepts resume uploads in multiple formats (PDF, DOCX, DOC, JPG, PNG) and returns structured profile data that can be used to pre-fill career profile forms.

**Base URL:** `/api/career-id/resume`

**Authentication:** Not required for this endpoint (user-specific endpoints will require auth)

---

## Endpoints

### POST `/api/career-id/resume/extract`

Extract structured career data from an uploaded resume file.

#### Request

**Content-Type:** `multipart/form-data`

**Form Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | Resume file to extract data from |

**Supported File Formats:**
- PDF (`.pdf`)
- Microsoft Word (`.docx`, `.doc`)
- Images (`.jpg`, `.jpeg`, `.png`)

**File Constraints:**
- Maximum file size: 10MB
- MIME type must match file extension

#### Response

**Success Response (200 OK)**

```typescript
{
  success: true,
  message: "Resume data extracted successfully",
  data: {
    contactInfo: {
      firstName: string,
      lastName: string,
      email: string,
      phone: string | null,
      jobTitle: string | null,
      city: string | null,
      stateRegion: string | null,
      country: string | null,
      postalCode: string | null,
      summary: string | null,
      websites: string[],
      willingToRelocate: boolean
    },
    experience: [
      {
        employmentType: 'full_time' | 'part_time' | 'contract' | 'freelance' | 'internship',
        employer: string,
        title: string,
        location?: string,
        locationType: 'on_site' | 'remote' | 'hybrid',
        url: string | null,
        startDate: string,  // YYYY-MM or YYYY format
        endDate: string | null,  // YYYY-MM or YYYY format, null if current
        currentPosition: boolean,
        summary: string | null,
        highlights: string[],  // Bullet points/achievements
        displayOrder: number
      }
    ],
    education: [
      {
        degreeType: string,
        areaOfStudy: string,
        institution: string,
        startDate: string,  // YYYY-MM or YYYY format
        endDate: string,  // YYYY-MM or YYYY format
        completed: boolean,
        url: string | null,
        creditHours: number | null,
        coursework: string[],
        minors: string[],
        displayOrder: number
      }
    ],
    profileSkills: [
      {
        name: string,
        group: string | null,
        proficiencyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert',
        yearsExperience: number | null,
        displayOrder: number
      }
    ],
    certifications: [
      {
        name: string,
        issuer: string,
        issueDate: string,  // YYYY-MM or YYYY format
        url: string | null,
        displayOrder: number
      }
    ]
  },
  metadata: {
    filename: string,
    fileSize: number,
    extractionTimeMs: number,
    extractedCounts: {
      experience: number,
      education: number,
      skills: number,
      certifications: number
    }
  }
}
```

**Error Responses**

##### 400 Bad Request

Invalid file format or validation error.

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "File format not supported. Please upload PDF, DOCX, DOC, JPG, or PNG files."
  }
}
```

**Error Codes (400):**
- `VALIDATION_ERROR` - Generic validation failure
- `INVALID_EXTENSION` - File extension not supported
- `INVALID_MIME_TYPE` - MIME type doesn't match extension
- `MISSING_FILE` - No file provided in request

##### 413 Payload Too Large

File exceeds the 10MB size limit.

```json
{
  "success": false,
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "File is too large (12.45MB). Maximum size is 10MB."
  }
}
```

##### 500 Internal Server Error

Server error during extraction processing.

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Failed to process resume upload. Please try again."
  }
}
```

**Error Codes (500):**
- `INTERNAL_ERROR` - Unexpected server error
- `EXTRACTION_PARSE_ERROR` - Failed to parse AI response

##### 503 Service Unavailable

OpenAI API is unavailable or extraction timed out.

```json
{
  "success": false,
  "error": {
    "code": "EXTRACTION_TIMEOUT",
    "message": "Resume extraction timed out. The file may be too large or complex."
  }
}
```

**Error Codes (503):**
- `EXTRACTION_TIMEOUT` - Extraction took longer than 30 seconds
- `EXTRACTION_SERVICE_ERROR` - OpenAI API error
- `SERVICE_UNAVAILABLE` - OpenAI API key missing or service down

---

## Example Requests

### cURL

```bash
curl -X POST \
  http://localhost:3000/api/career-id/resume/extract \
  -H 'Content-Type: multipart/form-data' \
  -F 'file=@/path/to/resume.pdf'
```

### JavaScript (Fetch API)

```javascript
const formData = new FormData()
formData.append('file', fileInput.files[0])

const response = await fetch('/api/career-id/resume/extract', {
  method: 'POST',
  body: formData
})

const result = await response.json()

if (result.success) {
  console.log('Extraction successful:', result.data)
  console.log('Metadata:', result.metadata)
} else {
  console.error('Extraction failed:', result.error)
}
```

### TypeScript (with Nuxt useFetch)

```typescript
const extractResume = async (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  
  const { data, error } = await useFetch('/api/career-id/resume/extract', {
    method: 'POST',
    body: formData
  })
  
  if (error.value) {
    throw new Error(error.value.data?.error?.message || 'Extraction failed')
  }
  
  return data.value
}
```

---

## Example Responses

### Success Response (Complete Extraction)

```json
{
  "success": true,
  "message": "Resume data extracted successfully",
  "data": {
    "contactInfo": {
      "firstName": "Jane",
      "lastName": "Doe",
      "email": "jane.doe@example.com",
      "phone": "+1 (555) 123-4567",
      "jobTitle": "Senior Software Engineer",
      "city": "San Francisco",
      "stateRegion": "CA",
      "country": "United States",
      "postalCode": "94103",
      "summary": "Experienced software engineer with 8+ years building scalable web applications. Specialized in React, Node.js, and cloud architecture.",
      "websites": [
        "https://janedoe.dev",
        "https://github.com/janedoe"
      ],
      "willingToRelocate": false
    },
    "experience": [
      {
        "employmentType": "full_time",
        "employer": "Tech Corp",
        "title": "Senior Software Engineer",
        "location": "San Francisco, CA",
        "locationType": "hybrid",
        "url": "https://techcorp.com",
        "startDate": "2020-03",
        "endDate": null,
        "currentPosition": true,
        "summary": "Lead development of customer-facing web applications serving 2M+ users",
        "highlights": [
          "Architected and built microservices platform handling 10K requests/second",
          "Led team of 5 engineers in agile development process",
          "Reduced page load times by 40% through performance optimization",
          "Implemented CI/CD pipeline reducing deployment time from hours to minutes"
        ],
        "displayOrder": 0
      },
      {
        "employmentType": "full_time",
        "employer": "StartupXYZ",
        "title": "Software Engineer",
        "location": "Remote",
        "locationType": "remote",
        "url": null,
        "startDate": "2018-01",
        "endDate": "2020-02",
        "currentPosition": false,
        "summary": "Full-stack development for early-stage startup",
        "highlights": [
          "Built MVP from scratch using React and Node.js",
          "Implemented user authentication and payment processing",
          "Collaborated with designers to create responsive UI"
        ],
        "displayOrder": 1
      }
    ],
    "education": [
      {
        "degreeType": "Bachelor of Science",
        "areaOfStudy": "Computer Science",
        "institution": "Stanford University",
        "startDate": "2014",
        "endDate": "2018",
        "completed": true,
        "url": "https://stanford.edu",
        "creditHours": 180,
        "coursework": [
          "Data Structures and Algorithms",
          "Operating Systems",
          "Database Systems",
          "Machine Learning"
        ],
        "minors": ["Mathematics"],
        "displayOrder": 0
      }
    ],
    "profileSkills": [
      {
        "name": "JavaScript",
        "group": "Programming Languages",
        "proficiencyLevel": "expert",
        "yearsExperience": 8,
        "displayOrder": 0
      },
      {
        "name": "React",
        "group": "Frontend Frameworks",
        "proficiencyLevel": "expert",
        "yearsExperience": 6,
        "displayOrder": 1
      },
      {
        "name": "Node.js",
        "group": "Backend Technologies",
        "proficiencyLevel": "advanced",
        "yearsExperience": 5,
        "displayOrder": 2
      },
      {
        "name": "AWS",
        "group": "Cloud Platforms",
        "proficiencyLevel": "advanced",
        "yearsExperience": 4,
        "displayOrder": 3
      },
      {
        "name": "Leadership",
        "group": "Soft Skills",
        "proficiencyLevel": "advanced",
        "yearsExperience": 3,
        "displayOrder": 4
      }
    ],
    "certifications": [
      {
        "name": "AWS Certified Solutions Architect",
        "issuer": "Amazon Web Services",
        "issueDate": "2022-06",
        "url": "https://aws.amazon.com/certification/",
        "displayOrder": 0
      },
      {
        "name": "Professional Scrum Master I",
        "issuer": "Scrum.org",
        "issueDate": "2021-03",
        "url": "https://www.scrum.org/",
        "displayOrder": 1
      }
    ]
  },
  "metadata": {
    "filename": "Jane_Doe_Resume.pdf",
    "fileSize": 2457600,
    "extractionTimeMs": 8432,
    "extractedCounts": {
      "experience": 2,
      "education": 1,
      "skills": 5,
      "certifications": 2
    }
  }
}
```

### Error Response Examples

**Invalid File Format (400)**

```json
{
  "success": false,
  "error": {
    "code": "INVALID_EXTENSION",
    "message": "File format not supported. Please upload PDF, DOCX, DOC, JPG, or PNG files. Got: resume.txt"
  }
}
```

**File Too Large (413)**

```json
{
  "success": false,
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "File is too large (12.45MB). Maximum size is 10MB."
  }
}
```

**Extraction Timeout (503)**

```json
{
  "success": false,
  "error": {
    "code": "EXTRACTION_TIMEOUT",
    "message": "Resume extraction timed out. The file may be too large or complex."
  }
}
```

**OpenAI Service Error (503)**

```json
{
  "success": false,
  "error": {
    "code": "EXTRACTION_SERVICE_ERROR",
    "message": "Failed to extract data from resume. Please try again or use a different file format."
  }
}
```

---

## Implementation Notes

### AI Extraction Process

1. **File Upload**: Client uploads resume file via multipart/form-data
2. **Validation**: Server validates file format, size, and MIME type
3. **Conversion**: File is converted to base64 for AI processing
4. **AI Extraction**: AI (via Vercel AI Gateway with GPT-4o Vision) analyzes the resume and extracts structured data
5. **Schema Validation**: Extracted data is validated against Zod schema
6. **Transformation**: Data is transformed to match existing profile schema
7. **Response**: Structured data is returned to client

### Performance

- **Typical extraction time**: 5-15 seconds (depending on resume complexity)
- **Timeout**: 30 seconds maximum
- **File size limit**: 10MB maximum
- **Rate limiting**: Consider implementing per-user/IP limits in production

### Data Quality

- **Target accuracy**: 85%+ for standard resume formats
- **User review required**: All extracted data should be reviewed by users before saving
- **Supported languages**: English only (currently)
- **Format support**: Standard professional resume formats work best

### Privacy & Security

- **No file persistence**: Files are processed in-memory only and never written to disk
- **Data handling**: Resume data contains PII and must be handled securely
- **API key security**: AI Gateway API key must be stored in environment variables
- **HTTPS required**: All API calls must use secure connections in production

### Error Handling

- **Client-side**: Implement retry logic with exponential backoff
- **User messaging**: Display user-friendly error messages, hide technical details
- **Fallback**: Always provide option to skip extraction and enter data manually
- **Logging**: Log technical errors server-side for debugging

---

## Environment Configuration

### Required Environment Variables

```bash
# Vercel AI Gateway API key for resume extraction
NUXT_AI_GATEWAY_API_KEY=your-gateway-api-key-here
```

### Optional Configuration

```bash
# Enable/disable resume upload feature
ENABLE_RESUME_UPLOAD=true

# Override extraction timeout (milliseconds)
EXTRACTION_TIMEOUT_MS=30000

# Override max file size (bytes)
MAX_RESUME_FILE_SIZE=10485760
```

---

## Testing

### Test Cases

1. **Valid PDF resume**: Should extract all sections successfully
2. **Valid DOCX resume**: Should extract all sections successfully
3. **Valid image resume (JPG/PNG)**: Should extract visible text and structure
4. **Oversized file (>10MB)**: Should return 413 error
5. **Invalid file format (.txt)**: Should return 400 error
6. **Empty file**: Should return 400 error
7. **Corrupted file**: Should return 503 extraction error
8. **Non-English resume**: May fail or return partial results (expected)
9. **Complex multi-page resume**: Should handle but may timeout
10. **Resume with no experience**: Should return empty experience array

### Manual Testing

```bash
# Test with sample PDF resume
curl -X POST http://localhost:3000/api/career-id/resume/extract \
  -F 'file=@test-resume.pdf' | jq

# Test with oversized file
curl -X POST http://localhost:3000/api/career-id/resume/extract \
  -F 'file=@large-file.pdf' | jq

# Test with invalid format
curl -X POST http://localhost:3000/api/career-id/resume/extract \
  -F 'file=@document.txt' | jq
```

---

## Versioning

**Current Version:** 1.0.0

**Changelog:**
- v1.0.0 (2024-12): Initial release with Vercel AI Gateway (GPT-4o Vision) extraction

**Future Enhancements:**
- Multi-language support
- Streaming extraction progress
- Bulk resume processing
- Custom extraction schemas
- Integration with external resume parsing services
