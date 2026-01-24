# Test Scripts & Deliverables - HERO Stories CRUD Phase 2

## Overview

Complete test suite for HERO Story Form API endpoints, ready to import into Postman for immediate testing.

## Files Included

### 1. **HERO_Stories_CRUD.postman_collection.json** ⭐ MAIN FILE
   - **Format:** Postman Collection v2.1
   - **Size:** ~50KB
   - **Contents:** 8 test requests + 4 error scenarios
   - **Status:** Ready to import into Postman

**What's Inside:**
- ✅ 8 sequential test requests (happy path)
- ✅ 4 error test scenarios
- ✅ Pre-configured collection variables
- ✅ Built-in test assertions (automated validation)
- ✅ Auto-capture of storyId from POST response
- ✅ Complete example request/response pairs

### 2. **POSTMAN_SETUP.md** - Quick Start Guide
   - Step-by-step import instructions
   - Variable configuration guide
   - Workflow walkthrough
   - Troubleshooting tips
   - Reference documentation

### 3. **TEST_INSTRUCTIONS.md** - Comprehensive Reference
   - Detailed endpoint specifications
   - Validation rules and constraints
   - Response format documentation
   - Field definitions
   - Testing instructions for curl and manual testing

## Quick Import (3 Steps)

1. **Download** `HERO_Stories_CRUD.postman_collection.json`
2. **Import** in Postman (File → Import)
3. **Set variables:**
   - `baseUrl`: `http://localhost:3000`
   - `profileId`: Your test profile ID

Done! Ready to test.

## Test Coverage

### ✅ Happy Path Tests (8 requests)

| # | Endpoint | Method | Test | Expected |
|---|----------|--------|------|----------|
| 1 | `/hero-stories` | POST | Create full story | 201 Created + ID capture |
| 2 | `/hero-stories` | POST | Create minimal story | 201 Created |
| 3 | `/hero-stories` | GET | List all stories | 200 OK + array |
| 4 | `/hero-stories/:id` | GET | Fetch single story | 200 OK + object |
| 5 | `/hero-stories/:id` | PATCH | Partial update | 200 OK + updated fields |
| 6 | `/hero-stories/:id` | PATCH | Update title only | 200 OK + title change |
| 7 | `/hero-stories/:id` | PATCH | Clear fields (null) | 200 OK + nulled fields |
| 8 | `/hero-stories/:id` | DELETE | Soft delete | 200 OK + message |

### ✅ Error Scenarios (4 tests)

| Error | Method | Input | Expected |
|-------|--------|-------|----------|
| Missing title | POST | Empty body | 400 + REQUIRED |
| Invalid sourceExperienceId | POST | Non-integer | 400 + INVALID |
| No update fields | PATCH | Empty body | 400 + REQUIRED |
| Story not found | GET | Invalid ID | 404 + NOT_FOUND |

### ✅ Validations Tested

- ✅ Required field enforcement (title)
- ✅ Type validation (sourceExperienceId must be integer)
- ✅ Partial update capability (only provided fields change)
- ✅ Null value clearing (fields can be set to null)
- ✅ Ownership validation (story belongs to profile)
- ✅ Soft delete pattern (deleted_at + is_deleted flags)
- ✅ Filtering (deleted stories excluded from list)
- ✅ Ordering (display_order, then created_at DESC)
- ✅ Auto-increment (internal_id)
- ✅ ID generation (server-side prefixed IDs)
- ✅ camelCase transformation (response fields)
- ✅ Timestamp formatting (ISO 8601)

## Collection Features

### Automated Test Assertions
Every request includes built-in tests:

```javascript
// Status validation
pm.test('Status code is 201', ...)

// Response structure
pm.test('Response has success=true', ...)

// Field validation
pm.test('Response contains story ID', ...)

// Variable capture
pm.collectionVariables.set('storyId', ...)
```

### Variable Auto-Capture
- First POST request captures `storyId`
- All subsequent requests use `{{storyId}}` automatically
- No manual variable entry needed after first request

### Example Data
- Real-world HERO story (customer portal redesign)
- Complete with all 12 HERO fields populated
- 200+ words of realistic content
- Demonstrates full API capabilities

## Usage Workflow

### Sequential Testing (Recommended)

```
1. Run Request 1: POST Create Story
   → Captures storyId automatically
   
2. Run Request 3: GET List Stories
   → Verify story in list
   
3. Run Request 4: GET Fetch Story
   → Verify single story retrieval
   
4. Run Request 5: PATCH Update
   → Verify partial update works
   
5. Run Request 8: DELETE Story
   → Verify soft delete
   
6. Run Request 3 Again: GET List
   → Verify deleted story excluded
```

### Bulk Testing (Collection Run)

Use Postman's "Run" feature:
1. Click collection name → "Run"
2. Select requests in order
3. Set delay between requests (500ms recommended)
4. Click "Run" button
5. Watch all tests pass automatically

## Validation Points

### API Contract Validation
- ✅ All endpoints present and working
- ✅ All response fields present
- ✅ All field types correct
- ✅ All field names camelCased
- ✅ All timestamps ISO 8601 format

### Data Integrity
- ✅ Server generates IDs (not client)
- ✅ ID format matches spec (`story_*`)
- ✅ All fields persist correctly
- ✅ Soft delete flags set properly
- ✅ Timestamps auto-generated

### Business Logic
- ✅ Required fields enforced
- ✅ Optional fields nullable
- ✅ Partial updates work
- ✅ Ownership validated
- ✅ Deleted records filtered

## Response Examples

### Success Response (POST Create)
```json
{
  "success": true,
  "message": "Hero story created successfully",
  "data": {
    "id": "story_clx2k9j3m0000glg",
    "title": "Led complete redesign of customer portal",
    "hurdleProblem": "Portal was slow and outdated",
    ...
    "createdAt": "2026-01-24T15:30:00.000Z"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "REQUIRED",
    "message": "title is required and cannot be empty"
  }
}
```

## Next Steps

### 1. Import & Configure (5 minutes)
- Import collection into Postman
- Set {{baseUrl}} and {{profileId}} variables
- Ensure dev server running

### 2. Run Tests (5 minutes)
- Run Request 1 (POST Create)
- Run Requests 2-8 in order
- Or use Collection Run for all tests

### 3. Verify Results (5 minutes)
- All requests return correct status codes
- All tests pass (green checkmarks)
- Story data persists across requests
- Error scenarios return expected errors

### 4. Document Findings (5 minutes)
- Screenshot test results
- Note any failures or inconsistencies
- Create GitHub issue if problems found

### 5. Proceed to Frontend (Phase 3A)
- Backend is verified and ready
- Ready for frontend integration
- APIs ready for UI implementation

## File Reference

| File | Purpose | Size | Format |
|------|---------|------|--------|
| HERO_Stories_CRUD.postman_collection.json | Import into Postman | ~50KB | JSON v2.1 |
| POSTMAN_SETUP.md | Quick start guide | ~8KB | Markdown |
| TEST_INSTRUCTIONS.md | Reference docs | ~12KB | Markdown |

## Support & Troubleshooting

### Common Issues

**Q: Variables not working?**
A: Go to collection → Variables tab → enter {{baseUrl}} and {{profileId}} values

**Q: 404 errors?**
A: Ensure profileId matches a real profile in your database

**Q: Connection refused?**
A: Start dev server: `npm run dev`

**Q: Tests failing?**
A: Check request URL has correct profiles and story IDs

## Endpoints Summary

```
POST   /api/career-id/profile/:profileId/hero-stories
       Create story with all or partial HERO fields
       
GET    /api/career-id/profile/:profileId/hero-stories
       List all non-deleted stories (ordered by display_order, created_at DESC)
       
GET    /api/career-id/profile/:profileId/hero-stories/:storyId
       Fetch single story (validates ownership)
       
PATCH  /api/career-id/profile/:profileId/hero-stories/:storyId
       Update specific fields (partial updates supported)
       
DELETE /api/career-id/profile/:profileId/hero-stories/:storyId
       Soft delete story (sets deleted_at + is_deleted)
```

## Success Criteria

✅ All requests complete without errors
✅ All status codes match expected values
✅ All test assertions pass (green checks)
✅ Response data matches request data
✅ Story persists across GET requests
✅ Soft delete removes story from list
✅ Error scenarios return proper errors
✅ Variables capture correctly

---

**Ready to test! Import HERO_Stories_CRUD.postman_collection.json into Postman and get started.**
