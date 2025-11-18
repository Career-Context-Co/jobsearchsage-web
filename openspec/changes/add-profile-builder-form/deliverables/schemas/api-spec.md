# Profile Builder API Specification

Version: 1.0.0  
Last Updated: 2025-11-18

## Overview

This document specifies the REST API contract for the Career Sage Profile Builder feature. The Profile Builder API enables users to create, read, update, and delete their career profile data, which serves as the foundation for resume generation and other JobSearchSage features.

### Base URL

```
/api/profile
```

### Authentication

All endpoints require authentication. The authenticated user's ID is used to scope profile access (users can only access their own profiles).

**Authentication Method**: Session-based (implementation-specific)

**Authorization Rule**: Users can only access and modify their own profile data.

### Data Format

- **Request Content-Type**: `application/json`
- **Response Content-Type**: `application/json`
- **Date Format**: ISO 8601 (`YYYY-MM-DD`)
- **Timestamps**: ISO 8601 with timezone (`YYYY-MM-DDTHH:mm:ss.sssZ`)

---

## Endpoints

### Profile Management

#### GET /api/profile

Retrieve the complete profile for the authenticated user, including all sections.

**Authentication**: Required

**Request**:
```http
GET /api/profile
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "profile": {
      "id": "uuid",
      "user_id": "uuid",
      "created_at": "2025-01-15T10:30:00.000Z",
      "updated_at": "2025-01-15T10:30:00.000Z",
      "completion_status": "incomplete"
    },
    "work_experiences": [
      {
        "id": "uuid",
        "profile_id": "uuid",
        "company": "Acme Corp",
        "title": "Senior Software Engineer",
        "location": "San Francisco, CA",
        "url": "https://acme.com",
        "start_date": "2020-01-15",
        "end_date": null,
        "current_position": true,
        "summary": "Led development of core platform features",
        "highlights": [
          "Improved API performance by 40%",
          "Mentored 5 junior engineers"
        ],
        "display_order": 0,
        "created_at": "2025-01-15T10:30:00.000Z",
        "updated_at": "2025-01-15T10:30:00.000Z"
      }
    ],
    "education": [
      {
        "id": "uuid",
        "profile_id": "uuid",
        "degree_type": "Bachelor of Science",
        "area_of_study": "Computer Science",
        "institution": "Stanford University",
        "start_date": "2012-09-01",
        "end_date": "2016-06-15",
        "completed": true,
        "url": "https://stanford.edu",
        "credit_hours": 120,
        "coursework": ["Algorithms", "Machine Learning", "Databases"],
        "minors": ["Mathematics"],
        "display_order": 0,
        "created_at": "2025-01-15T10:30:00.000Z",
        "updated_at": "2025-01-15T10:30:00.000Z"
      }
    ],
    "certifications": [
      {
        "id": "uuid",
        "profile_id": "uuid",
        "name": "AWS Solutions Architect - Professional",
        "issuer": "Amazon Web Services",
        "date": "2023-06-15",
        "url": "https://aws.amazon.com/certification/",
        "display_order": 0,
        "created_at": "2025-01-15T10:30:00.000Z",
        "updated_at": "2025-01-15T10:30:00.000Z"
      }
    ],
    "skill_categories": [
      {
        "id": "uuid",
        "profile_id": "uuid",
        "name": "Programming Languages",
        "description": "Languages I use daily",
        "skills": ["Python", "JavaScript", "TypeScript", "Go"],
        "display_order": 0,
        "created_at": "2025-01-15T10:30:00.000Z",
        "updated_at": "2025-01-15T10:30:00.000Z"
      }
    ],
    "contact_info": {
      "id": "uuid",
      "profile_id": "uuid",
      "first_name": "Jane",
      "last_name": "Doe",
      "job_title": "Senior Software Engineer",
      "email": "jane.doe@example.com",
      "phone": "+14155552671",
      "linkedin": "https://linkedin.com/in/janedoe",
      "websites": ["https://janedoe.dev", "https://github.com/janedoe"],
      "summary": "Experienced software engineer passionate about building scalable systems",
      "city": "San Francisco",
      "state_region": "CA",
      "country": "United States",
      "postal_code": "94102",
      "willing_to_relocate": false,
      "created_at": "2025-01-15T10:30:00.000Z",
      "updated_at": "2025-01-15T10:30:00.000Z"
    }
  }
}
```

**Response** (404 Not Found):
```json
{
  "success": false,
  "error": {
    "code": "PROFILE_NOT_FOUND",
    "message": "No profile exists for this user"
  }
}
```

---

#### POST /api/profile

Create a new profile for the authenticated user. All sections are optional during creation.

**Authentication**: Required

**Request**:
```json
{
  "contact_info": {
    "firstName": "Jane",
    "lastName": "Doe",
    "jobTitle": "Software Engineer",
    "email": "jane.doe@example.com",
    "phone": "+14155552671",
    "linkedin": "https://linkedin.com/in/janedoe",
    "websites": ["https://janedoe.dev"],
    "summary": "Passionate software engineer",
    "city": "San Francisco",
    "stateRegion": "CA",
    "country": "United States",
    "postalCode": "94102",
    "willingToRelocate": false
  },
  "work_experiences": [],
  "education": [],
  "certifications": [],
  "skill_categories": []
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Profile created successfully",
  "data": {
    /* ProfileDTO object (same structure as GET /api/profile) */
  }
}
```

**Response** (400 Bad Request):
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "contact_info.email",
        "message": "Invalid email format",
        "code": "INVALID_FORMAT"
      }
    ]
  }
}
```

**Response** (409 Conflict):
```json
{
  "success": false,
  "error": {
    "code": "PROFILE_ALREADY_EXISTS",
    "message": "A profile already exists for this user"
  }
}
```

---

#### PUT /api/profile

Update profile metadata (currently only completion_status).

**Authentication**: Required

**Request**:
```json
{
  "completion_status": "complete"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    /* ProfileDTO object */
  }
}
```

---

### Work Experience

#### POST /api/profile/work-experience

Add a new work experience entry.

**Authentication**: Required

**Request**:
```json
{
  "company": "Acme Corp",
  "title": "Software Engineer",
  "location": "San Francisco, CA",
  "url": "https://acme.com",
  "startDate": "2020-01-15",
  "endDate": null,
  "currentPosition": true,
  "summary": "Working on core platform features",
  "highlights": [
    "Built scalable API serving 1M+ requests/day",
    "Mentored junior developers"
  ],
  "display_order": 0
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Work experience added successfully",
  "data": {
    /* WorkExperience object */
  }
}
```

**Validation Rules**:
- `company`: Required, 1-200 characters
- `title`: Required, 1-200 characters
- `location`: Optional, max 200 characters
- `url`: Optional, valid URL format
- `startDate`: Required, ISO 8601 format (YYYY-MM-DD)
- `endDate`: Optional, ISO 8601 format, must be >= startDate
- `currentPosition`: Required, boolean
- `summary`: Optional, max 2000 characters
- `highlights`: Required, at least 1 entry, each 1-500 characters

---

#### PUT /api/profile/work-experience/:id

Update an existing work experience entry.

**Authentication**: Required

**Request**:
```json
{
  "title": "Senior Software Engineer",
  "highlights": [
    "Built scalable API serving 1M+ requests/day",
    "Mentored 5 junior developers",
    "Led migration to microservices"
  ]
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Work experience updated successfully",
  "data": {
    /* WorkExperience object */
  }
}
```

**Response** (404 Not Found):
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Work experience entry not found"
  }
}
```

---

#### DELETE /api/profile/work-experience/:id

Delete a work experience entry.

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Work experience deleted successfully"
}
```

**Response** (404 Not Found):
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Work experience entry not found"
  }
}
```

---

### Education

#### POST /api/profile/education

Add a new education entry.

**Authentication**: Required

**Request**:
```json
{
  "degreeType": "Bachelor of Science",
  "areaOfStudy": "Computer Science",
  "institution": "Stanford University",
  "startDate": "2012-09-01",
  "endDate": "2016-06-15",
  "completed": true,
  "url": "https://stanford.edu",
  "creditHours": 120,
  "coursework": ["Algorithms", "Machine Learning"],
  "minors": ["Mathematics"],
  "display_order": 0
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Education added successfully",
  "data": {
    /* Education object */
  }
}
```

**Validation Rules**:
- `degreeType`: Required, 1-200 characters
- `areaOfStudy`: Required, 1-200 characters
- `institution`: Required, 1-200 characters
- `startDate`: Required, ISO 8601 format
- `endDate`: Required, ISO 8601 format, must be >= startDate
- `completed`: Required, boolean
- `url`: Optional, valid URL format
- `creditHours`: Optional, 0-999
- `coursework`: Optional, array of strings, each max 200 characters
- `minors`: Optional, array of strings, each max 200 characters

---

#### PUT /api/profile/education/:id

Update an existing education entry.

**Authentication**: Required

**Request**: (Same structure as POST, all fields optional)

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Education updated successfully",
  "data": {
    /* Education object */
  }
}
```

---

#### DELETE /api/profile/education/:id

Delete an education entry.

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Education deleted successfully"
}
```

---

### Certifications

#### POST /api/profile/certifications

Add a new certification.

**Authentication**: Required

**Request**:
```json
{
  "name": "AWS Solutions Architect - Professional",
  "issuer": "Amazon Web Services",
  "date": "2023-06-15",
  "url": "https://aws.amazon.com/certification/",
  "display_order": 0
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Certification added successfully",
  "data": {
    /* Certification object */
  }
}
```

**Validation Rules**:
- `name`: Required, 1-200 characters
- `issuer`: Required, 1-200 characters
- `date`: Required, ISO 8601 format (YYYY-MM-DD)
- `url`: Optional, valid URL format

---

#### PUT /api/profile/certifications/:id

Update an existing certification.

**Authentication**: Required

**Request**: (Same structure as POST, all fields optional)

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Certification updated successfully",
  "data": {
    /* Certification object */
  }
}
```

---

#### DELETE /api/profile/certifications/:id

Delete a certification.

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Certification deleted successfully"
}
```

---

### Skill Categories

#### POST /api/profile/skill-categories

Add a new skill category with skills.

**Authentication**: Required

**Request**:
```json
{
  "name": "Programming Languages",
  "description": "Languages I use daily",
  "skills": ["Python", "JavaScript", "TypeScript", "Go"],
  "display_order": 0
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Skill category added successfully",
  "data": {
    /* SkillCategory object */
  }
}
```

**Validation Rules**:
- `name`: Required, 1-100 characters
- `description`: Optional, max 500 characters
- `skills`: Required, array of strings, at least 1 entry, each 1-100 characters

---

#### PUT /api/profile/skill-categories/:id

Update an existing skill category.

**Authentication**: Required

**Request**: (Same structure as POST, all fields optional)

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Skill category updated successfully",
  "data": {
    /* SkillCategory object */
  }
}
```

---

#### DELETE /api/profile/skill-categories/:id

Delete a skill category.

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Skill category deleted successfully"
}
```

---

### Contact Information

#### POST /api/profile/contact-info

Create or update contact information (one-to-one relationship with profile).

**Authentication**: Required

**Request**:
```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "jobTitle": "Senior Software Engineer",
  "email": "jane.doe@example.com",
  "phone": "+14155552671",
  "linkedin": "https://linkedin.com/in/janedoe",
  "websites": ["https://janedoe.dev", "https://github.com/janedoe"],
  "summary": "Experienced software engineer passionate about building scalable systems",
  "city": "San Francisco",
  "stateRegion": "CA",
  "country": "United States",
  "postalCode": "94102",
  "willingToRelocate": false
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Contact information saved successfully",
  "data": {
    /* ContactInfo object */
  }
}
```

**Validation Rules**:
- `firstName`: Required, 1-100 characters
- `lastName`: Required, 1-100 characters
- `jobTitle`: Required, 1-200 characters
- `email`: Required, valid email format
- `phone`: Required, valid phone format
- `linkedin`: Required, valid URL format
- `websites`: Optional, array of valid URLs
- `summary`: Required, 1-5000 characters
- `city`: Required, 1-100 characters
- `stateRegion`: Required, 1-100 characters
- `country`: Required, 1-100 characters
- `postalCode`: Required, 1-20 characters
- `willingToRelocate`: Required, boolean

---

#### PUT /api/profile/contact-info

Update existing contact information (same as POST - replaces all fields).

**Authentication**: Required

**Request**: (Same structure as POST)

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Contact information updated successfully",
  "data": {
    /* ContactInfo object */
  }
}
```

---

## Error Codes

All error responses follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": []  // Optional field-level errors
  }
}
```

### HTTP Status Codes

- `200 OK` - Successful GET, PUT, or DELETE
- `201 Created` - Successful POST
- `400 Bad Request` - Validation error or malformed request
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - User not authorized to access this resource
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource already exists (e.g., duplicate profile)
- `500 Internal Server Error` - Server error

### Application Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `VALIDATION_ERROR` | Request validation failed | 400 |
| `INVALID_FORMAT` | Field format is invalid (email, URL, date) | 400 |
| `REQUIRED` | Required field is missing | 400 |
| `TOO_LONG` | Field exceeds maximum length | 400 |
| `TOO_SHORT` | Field below minimum length | 400 |
| `INVALID_RANGE` | Date range is invalid (end before start) | 400 |
| `PROFILE_NOT_FOUND` | Profile does not exist | 404 |
| `NOT_FOUND` | Resource not found | 404 |
| `PROFILE_ALREADY_EXISTS` | User already has a profile | 409 |
| `UNAUTHORIZED` | Authentication required | 401 |
| `FORBIDDEN` | Not authorized to access this resource | 403 |
| `INTERNAL_ERROR` | Unexpected server error | 500 |

---

## Field-Level Validation

When validation fails, the error response includes a `details` array with specific field errors:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "contact_info.email",
        "message": "Invalid email format",
        "code": "INVALID_FORMAT"
      },
      {
        "field": "work_experiences[0].highlights",
        "message": "At least one highlight is required",
        "code": "REQUIRED"
      }
    ]
  }
}
```

### Field Path Format

- Simple field: `"email"`
- Nested field: `"contact_info.email"`
- Array element: `"work_experiences[0].company"`

---

## Rate Limiting

To be determined. Recommended limits:
- General endpoints: 100 requests per minute per user
- Profile creation: 5 requests per hour per user (prevents abuse)

---

## Changelog

### Version 1.0.0 (2025-11-18)
- Initial API specification
- Endpoints for profile, work experience, education, certifications, skill categories, and contact info
- Aligned with frontend types in `app/types/index.d.ts`
- Error handling and validation rules defined

