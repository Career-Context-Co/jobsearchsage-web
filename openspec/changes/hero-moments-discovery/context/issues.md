
## JSS-84:HERO Moments Discovery Database Tasks

**Why:**
There needs to be a data structure to store discovered moments separately from completed HERO stories, track which moments have been converted into stories, maintain the relationship between moments and their source experiences, and support analytics on moment discovery and conversion rates.

**What Needs to Be Done:**
- Create `career_id.hero_moments` table with columns for storing moment metadata (id, profile_id, title, raw_notes, source_experience_id, discovery_session_id, created_at, converted_at, converted_story_id, is_deleted)
- Add `converted_moment_id` column to `career_id.hero_stories` table to track which moment (if any) was developed into each story
- Create database functions to:
  - Query all unconverted moments for a given profile (for display on management page)
  - Mark a moment as converted and link it to a story
  - Query discovery session data and moment counts for analytics
  - Calculate conversion statistics (total moments discovered, moments converted, conversion rate per user)
- Ensure proper foreign key relationships between moments, profiles, experiences, and stories
- Implement soft delete or archival mechanism for removed moments during discovery sessions

---

## JSS-85: HERO Moments Discovery Backend Tasks

**Why:**
There needs to be API endpoints that allow the frontend to capture moments during discovery sessions, retrieve and display moments for users, update moment details, delete moments before session completion, mark moments as converted when developing into stories, and retrieve analytics data on discovery activity.

**What Needs to Be Done:**
- Design endpoints for hero moments CRUD operations (create, read all, read single, update, delete)
- Design endpoints for discovery session operations (start session, end session, get session state)
- Design endpoints for moment conversion (mark moment as converted, link to story)
- Design endpoints for analytics (get moment counts, get conversion metrics)
- Define request and response models for all moment operations including:
  - Moment creation (title, raw_notes, source_experience_id, discovery_session_id)
  - Moment updates (title, raw_notes)
  - Session state (session_id, captured_moments, session_start_time)
  - Conversion responses (moment_id, story_id, conversion_timestamp)
- Implement all endpoints with validation (title length, raw_notes length, required fields), error handling, and authorization checks
- Test all endpoints for functionality, edge cases (concurrent edits, session timeout, invalid data), and authorization (users can only access/modify their own moments and sessions)

---

## JSS-86: HERO Moments Discovery Frontend Tasks

**Why:**
There needs to be an interface where users can discover and capture moments during a guided discovery session, view and manage their discovered moments with edit and delete capabilities, see the distinction between moments and completed stories, and navigate to develop moments into full HERO stories.

**What Needs to Be Done:**
- Define TypeScript types and interfaces for:
  - HeroMoment (id, profile_id, title, raw_notes, source_experience_id, discovery_session_id, created_at, converted_at, is_converted)
  - DiscoverySession (session_id, profile_id, captured_moments, session_start_time, session_status)
  - MomentFormData (title, raw_notes, source_experience_id)
- Create discovery session page that displays:
  - Current question prompt (placeholder for AI coach integration)
  - User input area for capturing achievement narrative
  - Running list of captured moments in the session
  - Session controls (Continue, End Session)
- Create HERO management page sections to display:
  - Discovered Moments section (distinct visual style, count, sorted by recency)
  - Each moment card with title, first 2 sentences of raw notes, discovery timestamp, status badge
  - Action buttons for each moment (Develop into Story, Remove)
- Create components:
  - MomentCaptureForm for collecting and confirming moment data during discovery
  - MomentCard for displaying moment preview with title and excerpt
  - MomentEditForm for inline editing of title and raw_notes during discovery
  - MomentConfirmationDialog for confirming removal during session
  - DiscoveredMomentsSection for display on HERO management page
- Build Pinia store for managing:
  - Active discovery session state (captured_moments, session_id, session_status)
  - Discovered moments list (all unconverted moments for the profile)
  - UI state (loading states, error states, edit mode for specific moments)
- Implement store actions to:
  - Call API to start discovery session
  - Call API to create moment
  - Call API to update moment
  - Call API to delete moment
  - Call API to end discovery session
  - Call API to fetch all unconverted moments
  - Call API to mark moment as converted (when developing into story)
  - Handle session state persistence across page refresh
- Integrate all components and pages with the store and API:
  - Discovery session page fetches session state and displays moment list from store
  - Management page fetches unconverted moments and displays in dedicated section
  - Forms call store actions to create/update/delete moments
  - "Develop into Story" button navigates to Story Builder with moment context loaded
  - All user interactions (capture, edit, delete, end session) update store and persist to API
- Implement loading indicators, error messages, and success confirmations for all operations
- Preserve discovery session state on page refresh (cache running session data locally until session completion)