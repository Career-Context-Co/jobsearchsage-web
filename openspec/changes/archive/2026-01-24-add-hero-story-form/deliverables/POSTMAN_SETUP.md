# Postman Collection Setup Guide

## Quick Start

### 1. Import Collection

1. Open **Postman**
2. Click **Import** (top left)
3. Select **HERO_Stories_CRUD.postman_collection.json** from this folder
4. Collection appears in left sidebar: "HERO Stories CRUD - Phase 2 Backend"

### 2. Set Collection Variables

The collection has 3 variables that need to be configured:

1. Click the collection name → **Variables** tab
2. Set the following:

| Variable | Value | Example |
|----------|-------|---------|
| `baseUrl` | Your dev server URL | `http://localhost:3000` |
| `profileId` | A valid profile ID from your database | `prof_xK9j2mP4nQ8rL5tY7vW3zB1c` |
| `storyId` | *(leave empty)* - Auto-populated by first POST request | — |

### 3. Run Requests

The collection contains 8 test requests organized as:

**Main Tests:**
1. ✅ POST - Create New Story (Full) - **RUN THIS FIRST** - captures storyId
2. ✅ POST - Create Minimal Story (Title Only)
3. ✅ GET - List All Stories
4. ✅ GET - Fetch Single Story
5. ✅ PATCH - Update Story (Partial)
6. ✅ PATCH - Update Title Only
7. ✅ PATCH - Clear Optional Fields
8. ✅ DELETE - Soft Delete Story

**Error Tests:** (folder)
- ERROR: Missing Title (400)
- ERROR: Invalid sourceExperienceId (400)
- ERROR: No Update Fields (400)
- ERROR: Story Not Found (404)

### 4. Run Collection (Automated)

For sequential testing with automatic variable capture:

1. Click "Run" button next to collection name
2. Select all requests in the order shown
3. Set delay between requests (e.g., 500ms for database)
4. Click **Run** button

The first POST request automatically captures the story ID for subsequent requests.

## What Each Request Tests

### 1. POST - Create New Story (Full)
- Creates a complete HERO story with all fields
- Server generates prefixed ID (`story_*`)
- **Captures `storyId` variable** for use in other requests
- Expected: 201 Created

### 2. POST - Create Minimal Story (Title Only)
- Creates story with only required `title` field
- Other fields are null in response
- Expected: 201 Created

### 3. GET - List All Stories
- Fetches all non-deleted stories for the profile
- Ordered by `display_order`, then `created_at` DESC
- Expected: 200 OK with array of stories

### 4. GET - Fetch Single Story
- Retrieves specific story by ID
- Uses `{{storyId}}` variable from POST response
- Expected: 200 OK with single story object

### 5. PATCH - Update Story (Partial)
- Updates 2 specific fields without affecting others
- Tests partial update capability
- Expected: 200 OK with updated story

### 6. PATCH - Update Title Only
- Updates just the title field
- All other fields remain unchanged
- Expected: 200 OK with updated story

### 7. PATCH - Clear Optional Fields
- Sets optional fields to null
- Tests clearing/resetting fields
- Expected: 200 OK with nulled fields

### 8. DELETE - Soft Delete Story
- Soft deletes the story (sets deleted_at + is_deleted=true)
- Record remains in database
- Expected: 200 OK with success message

## Test Assertions

Each request (except DELETE) includes automated tests:

- **Status code verification** (201, 200, 404, 400)
- **Response structure validation** (success=true/false)
- **Data type validation** (array/object checks)
- **Field value verification** (for updated values)
- **Variable capture** (storyId from POST)

View test results:
1. Run a request
2. Click **Tests** tab in response
3. Green checkmarks = passed, red X = failed

## Example Workflow

```
1. Click "1. POST - Create New Story (Full)" → Send
   ✅ Returns 201 Created with storyId
   ✅ storyId automatically saved to {{storyId}} variable

2. Click "3. GET - List All Stories" → Send
   ✅ Returns 200 OK with 1+ stories
   ✅ First story matches created story

3. Click "4. GET - Fetch Single Story" → Send
   ✅ Returns 200 OK with the story
   ✅ Uses {{storyId}} from step 1

4. Click "5. PATCH - Update Story (Partial)" → Send
   ✅ Returns 200 OK with updated fields

5. Click "8. DELETE - Soft Delete Story" → Send
   ✅ Returns 200 OK success message

6. Click "3. GET - List All Stories" again → Send
   ✅ Story no longer appears (is_deleted=false filtering)
```

## Troubleshooting

### Variable Not Set
- **Error:** `{{variable}}` appears in URL
- **Fix:** Go to collection → Variables tab → Enter values

### 404 Not Found
- **Cause:** Story ID doesn't match profile ID
- **Fix:** Ensure you're using same {{profileId}} throughout

### 400 Validation Error
- **Cause:** Missing required field or invalid type
- **Fix:** Check request body matches endpoint requirements

### Connection Refused
- **Cause:** Dev server not running
- **Fix:** Start server: `npm run dev` in workspace root

## Reference

### URL Patterns
```
POST   /api/career-id/profile/:profileId/hero-stories
GET    /api/career-id/profile/:profileId/hero-stories
GET    /api/career-id/profile/:profileId/hero-stories/:storyId
PATCH  /api/career-id/profile/:profileId/hero-stories/:storyId
DELETE /api/career-id/profile/:profileId/hero-stories/:storyId
```

### Request/Response Fields

**Story Object (all endpoints return camelCase):**
- `id` - Prefixed ID (story_*)
- `title` - Story title (required)
- `hurdleProblem`, `hurdleScope`, `hurdleStakes` - Hurdle fields
- `expectationRole`, `expectationGoals`, `expectationConstraints` - Expectation fields
- `responseActions`, `responseTools`, `responseChallenges` - Response fields
- `outcomeDeliverable`, `outcomeMetrics`, `outcomeImpact` - Outcome fields
- `sourceExperienceId` - Optional FK to experience
- `displayOrder` - Display ordering (default 0)
- `deletedAt` - Soft delete timestamp (null if active)
- `isDeleted` - Soft delete flag (false=active)
- `createdAt` - ISO 8601 creation timestamp
- `updatedAt` - ISO 8601 update timestamp

## Next Steps

After successful testing:

1. ✅ Verify all endpoints work with your database
2. ✅ Check all validation rules work correctly
3. ✅ Confirm camelCase transformation in responses
4. ✅ Test soft delete filtering (deleted stories excluded from GET list)
5. ✅ Proceed to **Phase 3A: Frontend UI Implementation**

---

**Collection Version:** 1.0  
**API Version:** HERO Stories CRUD v1  
**Last Updated:** 2026-01-24
