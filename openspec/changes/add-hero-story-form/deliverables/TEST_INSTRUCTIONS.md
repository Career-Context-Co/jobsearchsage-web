# HERO Stories CRUD Endpoints - Test Scripts

This directory contains comprehensive test specifications for the HERO Story Form API endpoints (Phase 2: Backend).

## Files

- **be-001-hero-stories-crud.json** - Complete test specification with request/response examples for all 5 CRUD endpoints

## Quick Start

### Using Postman

1. Import `be-001-hero-stories-crud.json` into Postman
2. Create a collection variable:
   - `{{profileId}}`: Your test profile ID (e.g., `prof_xK9j2mP4nQ8rL5tY7vW3zB1c`)
   - `{{baseUrl}}`: `http://localhost:3000`
3. Replace placeholders in requests:
   - `{profileId}` → Use `{{profileId}}`
   - `{storyId}` → Use story ID from POST response
4. Run requests sequentially

### Using curl

```bash
# Create story
curl -X POST http://localhost:3000/api/career-id/profile/prof_xK9j2mP4nQ8rL5tY7vW3zB1c/hero-stories \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "Led complete redesign of customer portal",
    "hurdleProblem": "Portal was slow and outdated",
    "responseActions": "Built new React frontend with Lambda backend"
  }'

# List stories
curl http://localhost:3000/api/career-id/profile/prof_xK9j2mP4nQ8rL5tY7vW3zB1c/hero-stories

# Get single story (replace STORY_ID with actual ID)
curl http://localhost:3000/api/career-id/profile/prof_xK9j2mP4nQ8rL5tY7vW3zB1c/hero-stories/STORY_ID

# Update story
curl -X PATCH http://localhost:3000/api/career-id/profile/prof_xK9j2mP4nQ8rL5tY7vW3zB1c/hero-stories/STORY_ID \
  -H 'Content-Type: application/json' \
  -d '{"title": "Updated title"}'

# Delete story (soft delete)
curl -X DELETE http://localhost:3000/api/career-id/profile/prof_xK9j2mP4nQ8rL5tY7vW3zB1c/hero-stories/STORY_ID
```

## Endpoints Tested

### 1. POST /api/career-id/profile/:profileId/hero-stories
**Create a new HERO story**

- **Status:** 201 Created
- **Body:** All fields shown in test file
  - Required: `title`
  - Optional: All 12 HERO tagged fields, `sourceExperienceId`, `displayOrder`
- **Returns:** Created story object with generated ID

### 2. GET /api/career-id/profile/:profileId/hero-stories
**List all stories for a profile**

- **Status:** 200 OK
- **Returns:** Array of story objects
- **Filtering:** Automatically excludes deleted stories (`is_deleted=false`)
- **Ordering:** By `display_order` ASC, then `created_at` DESC

### 3. GET /api/career-id/profile/:profileId/hero-stories/:storyId
**Fetch a specific story**

- **Status:** 200 OK or 404 Not Found
- **Returns:** Single story object
- **Validation:** Verifies story belongs to specified profile

### 4. PATCH /api/career-id/profile/:profileId/hero-stories/:storyId
**Update story fields**

- **Status:** 200 OK or 404 Not Found
- **Body:** Any combination of updateable fields (see test file)
- **Returns:** Updated story object

### 5. DELETE /api/career-id/profile/:profileId/hero-stories/:storyId
**Soft-delete a story**

- **Status:** 200 OK or 404 Not Found
- **Returns:** Success message
- **Behavior:** Sets `deleted_at` timestamp + `is_deleted=true`; story remains in DB for audit trail

## Validation Rules

### Required Fields
- **POST (create):** `title` is required
- **PATCH (update):** At least one field must be provided
- **All operations:** `profileId` and `storyId` (for single-item operations)

### Field Types
- **title:** String, required for create, optional for update
- **HERO fields:** All nullable TEXT (hurdle_*, expectation_*, response_*, outcome_*)
- **sourceExperienceId:** Optional integer FK to experience table
- **displayOrder:** Optional integer (default 0)

### Validation Errors (Expected)
- **400 Bad Request:** Missing required fields, invalid types
- **404 Not Found:** Story doesn't exist or doesn't belong to profile

## Response Format

All responses follow this structure:

```json
{
  "success": true/false,
  "message": "Human-readable message (create/update/delete only)",
  "data": {}  // Story object or array of stories
}
```

### Story Object Fields
- `id` - Prefixed ID (story_*)
- `internalId` - Internal BIGINT
- `profileId` - FK to profile
- `title` - Story title
- `hurdleProblem`, `hurdleScope`, `hurdleStakes` - Hurdle section
- `expectationRole`, `expectationGoals`, `expectationConstraints` - Expectation section
- `responseActions`, `responseTools`, `responseChallenges` - Response section
- `outcomeDeliverable`, `outcomeMetrics`, `outcomeImpact` - Outcome section
- `sourceExperienceId` - Optional FK to experience
- `displayOrder` - Display ordering
- `deletedAt` - Soft delete timestamp (null if active)
- `isDeleted` - Soft delete flag
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

## Test Coverage

The test spec includes:

✅ **Happy Path Tests**
- Create with all fields
- Create with minimal fields (title only)
- List stories
- Get single story
- Partial update
- Update title only
- Clear fields (set to null)
- Soft delete

✅ **Validation Tests**
- Missing profileId
- Missing/empty title
- Invalid sourceExperienceId type
- No update fields (PATCH with empty body)
- Story not found
- Ownership validation

✅ **Response Validation**
- Correct HTTP status codes
- Proper error messages and codes
- camelCase field transformation
- Timestamp formatting (ISO 8601)

## Database Requirements

- Profile must exist: `career_id.profiles`
- Table exists: `career_id.hero_stories` (verified in Phase 1)
- Optional: Experience record if using `sourceExperienceId`

## Next Steps

After successful endpoint testing:
1. Verify all validation rules work correctly
2. Check camelCase transformation in responses
3. Test soft delete filtering (deleted stories should not appear in GET list)
4. Validate ownership checks (wrong profileId should return 404)
5. Proceed to Phase 3A: Frontend UI implementation

## Notes

- All timestamps are ISO 8601 format with timezone (Z = UTC)
- Server generates prefixed IDs (story_*); client does not provide IDs on create
- Soft delete pattern: Records remain in DB with `is_deleted=true` and `deleted_at` set
- All HERO fields are individually nullable and can be edited independently
- Frontend should support non-linear editing (fill fields in any order)
