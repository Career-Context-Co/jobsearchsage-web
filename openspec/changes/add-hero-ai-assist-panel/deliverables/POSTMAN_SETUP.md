# Postman Collection Setup - HERO Section Enhancement API

This document provides setup instructions and usage guidance for the HERO Section Enhancement API Postman collection.

## Prerequisites

1. **Local Development Environment**
   - Nuxt dev server running (`npm run dev`)
   - Server accessible at `http://localhost:3000`
   - Database migration `022_create_hero_story_sessions.sql` applied
   - AI Gateway API key configured in environment

2. **Valid Test Data**
   - A profile ID that exists in your database
   - A hero story ID that exists for that profile
   - (Optional) Experience records for richer context

## Import the Collection

1. Open Postman
2. Click **Import** in the top left
3. Select the file: `openspec/changes/add-hero-ai-assist-panel/deliverables/HERO_Section_Enhancement.postman_collection.json`
4. Click **Import**

## Configure Collection Variables

After importing, configure these variables at the collection level:

1. Click on the collection name
2. Select the **Variables** tab
3. Update the following variables:

| Variable | Description | Example Value |
|----------|-------------|---------------|
| `baseUrl` | Your local dev server URL | `http://localhost:3000` |
| `profile_id` | Valid profile ID from your DB | `prof_myf2i85se9xri4e4wgsxxim7` |
| `story_id` | Valid hero story ID from your DB | `hero_j1pez9j9k14y` |
| `session_id_hurdle` | Auto-set by tests | (leave empty) |
| `session_id_expectation` | Auto-set by tests | (leave empty) |
| `session_id_response` | Auto-set by tests | (leave empty) |
| `session_id_outcome` | Auto-set by tests | (leave empty) |

**Important:** Only set `baseUrl`, `profile_id`, and `story_id`. The session ID variables are automatically populated by test scripts.

## Test Structure

The collection is organized into two folders:

### 1. Happy Path Tests

These tests demonstrate the full conversation flow for each section type:

- **Start Hurdle Enhancement** - Creates a session with full context (moment + experience)
- **Continue Hurdle Enhancement (Rounds 1-3)** - Multi-turn conversation
- **Continue Hurdle Enhancement - Complete** - Final response that completes the conversation
- **End Hurdle Enhancement - Save to Database** - Saves final output to hero_stories table
- **Start Expectation Enhancement** - Demonstrates minimal context (no moment or experience)
- **Start Response Enhancement** - Demonstrates moment-only context
- **Start Outcome Enhancement** - Demonstrates starting with partial field values

### 2. Error Tests

These tests validate error handling:

- **Missing required fields** - Tests for missing `profile_id`, `section_type`, `session_id`, `user_message`
- **Invalid section_type** - Tests validation of section type values
- **Invalid session_id** - Tests handling of non-existent session
- **End - Missing session_id** - Tests end endpoint without session_id
- **End - Session Not Completed** - Tests ending a session that hasn't been completed yet

## Running Tests

### Run All Tests

1. Click the collection name
2. Click **Run** button
3. Select all requests or specific folders
4. Click **Run HERO Section Enhancement API**

### Run Individual Tests

1. Navigate to a specific request
2. Click **Send**
3. View response in the bottom panel
4. Check **Test Results** tab for assertions

### Recommended Test Order

For best results, run tests in this order:

1. **Happy Path Tests** first (in sequence)
   - This populates session ID variables
   - Demonstrates complete conversation flows
   
2. **Error Tests** second
   - These can run in any order
   - Some tests reuse session IDs from happy path

## Understanding Test Results

Each test includes assertions that verify:

### Start Endpoint Tests
- ✅ Status code is 201 (Created)
- ✅ Response has `success: true`
- ✅ Response contains `session_id` (number)
- ✅ Response contains `ai_message` (non-empty string)
- ✅ `is_complete` is false

### Continue Endpoint Tests
- ✅ Status code is 200 (OK)
- ✅ Response has `success: true`
- ✅ Response contains `ai_message`
- ✅ `is_complete` field is present

### Complete Endpoint Tests (Final Continue)
- ✅ Status code is 200
- ✅ `is_complete` is true
- ✅ `final_output` is present
- ✅ `final_output` has proper field names (e.g., hurdleProblem, hurdleScope, hurdleStakes)

### End Endpoint Tests
- ✅ Status code is 200
- ✅ Response has `success: true`
- ✅ Response contains `story_id`
- ✅ Response contains `section_type`
- ✅ `fields_updated` array contains correct field names
- ✅ `updated_story` contains the saved story data
- ✅ Session marked as applied in database

### Error Tests
- ✅ Appropriate status code (400 for bad request, 404 for not found)
- ✅ Error message contains relevant field name
- ✅ Error code is correct

## Verifying Database State

After running tests, you can verify database state:

```sql
-- View all sessions created by tests
SELECT id, profile_id, story_id, section_type, session_status, created_at, ended_at
FROM public.hero_story_sessions
WHERE profile_id = 'YOUR_PROFILE_ID'
ORDER BY created_at DESC;

-- View conversation history for a specific session
SELECT 
  id,
  section_type,
  session_status,
  session_data->'conversation_history' as conversation,
  session_data->'final_output' as output
FROM public.hero_story_sessions
WHERE id = YOUR_SESSION_ID;

-- Verify completed sessions have ended_at timestamp
SELECT id, section_type, session_status, ended_at
FROM public.hero_story_sessions
WHERE session_status = 'completed'
AND ended_at IS NOT NULL;

-- Verify hero story was updated with final output
SELECT 
  id,
  title,
  hurdle_problem,
  hurdle_scope,
  hurdle_stakes,
  updated_at
FROM career_id.hero_stories
WHERE id = 'YOUR_STORY_ID';
```

## Test Scenarios Covered

### Conversation Flow Tests
✅ Start → Continue → Continue → Complete → End flow (Hurdle)  
✅ Start multiple sections simultaneously (different session_ids)  
✅ Minimal context (no moment or experience)  
✅ Partial context (moment only, no experience)  
✅ Partial field values (some fields pre-filled)  
✅ Save completed session output to hero_stories table

### Database Verification Tests
✅ Session created with correct section_type  
✅ Conversation_history updates after each continue  
✅ Final_output stored when complete  
✅ Session status changes to 'completed'  
✅ ended_at timestamp set on completion  
✅ Hero story fields updated with correct values  
✅ Field names match section type (hurdleProblem vs expectationRole, etc.)

### Error Handling Tests
✅ Missing required fields  
✅ Invalid section_type  
✅ Invalid session_id  
✅ Missing user_message

## Troubleshooting

### Tests Fail with "Cannot read property 'json' of undefined"
**Issue:** Response is not JSON  
**Fix:** Check dev server logs for errors, ensure AI Gateway API key is configured

### Tests Fail with "SESSION_NOT_FOUND"
**Issue:** Session ID not found in database  
**Fix:** Run happy path tests first to create sessions, or update session ID variables manually

### Tests Fail with Foreign Key Errors
**Issue:** Invalid `profile_id` or `story_id`  
**Fix:** Update collection variables with valid IDs from your database

### AI Responses are Generic
**Issue:** Not enough context provided  
**Fix:** Provide `moment_title`, `moment_description`, and `source_experience` in start requests

### Session Doesn't Complete
**Issue:** AI needs more information before completing  
**Fix:** Continue the conversation with more detailed responses, or run a fresh session

## Advanced Usage

### Testing with Real User Flow

To simulate a real user filling out a HERO story:

1. Start with empty field values
2. Send conversational responses (not structured data)
3. Continue until AI completes the conversation
4. Verify final_output matches expected field structure

### Testing Regeneration Flow

To test the regeneration flow:

1. Complete a conversation
2. Start a new session with the same story_id and updated field values
3. Verify new session has different session_id
4. Previous session should remain in database as 'completed'

### Testing Concurrent Sessions

To test multiple sections simultaneously:

1. Start 4 sessions (one for each section type)
2. Continue each session independently
3. Verify each has separate session_id and conversation_history
4. Complete in any order

## Collection Maintenance

When updating the collection:

1. Export from Postman: Collection → ... → Export
2. Choose **Collection v2.1**
3. Save to `deliverables/HERO_Section_Enhancement.postman_collection.json`
4. Commit changes with descriptive message

## Additional Resources

- **API Documentation:** See `openspec/changes/add-hero-ai-assist-panel/design.md`
- **Prompt Documentation:** See `deliverables/prompts/hero-section-enhancement-prompt.md`
- **Session Data Structure:** See `deliverables/migrations/SESSION_DATA_STRUCTURE.md`
- **Database Schema:** See `deliverables/migrations/022_create_hero_story_sessions.sql`
