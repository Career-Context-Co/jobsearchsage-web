# Design: Profile View and Edit Dashboard

## Context
The profile builder form (from `2025-12-11-add-profile-builder-form`) established the data model, database schema, and API endpoints for creating Career ID profiles. Users can now create profiles, but they have no way to view their complete profile or edit it after creation. This design adds the viewing and editing layer on top of the existing API infrastructure.

### Constraints
- Must use existing API endpoints (`/api/career-id/profile/:profileId` and sub-resource endpoints)
- Must follow Nuxt UI component patterns and design system
- Profile data is sensitive PII - display thoughtfully and securely
- Must work for profiles with varying levels of completeness (some sections may be empty)

### Stakeholders
- Job seekers maintaining their career information over time
- Users who need to update their profile before generating a new resume
- Users who want to keep their profile current even when not actively job searching

## Goals / Non-Goals

### Goals
- Provide a clear, organized view of all profile sections in one dashboard
- Allow editing any section without navigating away from the profile page
- Save changes immediately with clear success/error feedback
- Support both adding new entries and editing/deleting existing entries
- Maintain visual consistency with the rest of the JobSearchSage application

### Non-Goals
- Profile sharing or public profile URLs (future feature)
- Version history or undo functionality (out of scope for this change)
- Offline editing or sync capabilities (out of scope)
- Bulk import/export of profile data (separate feature)
- Profile templates or suggested content (future AI feature)
- Real-time collaboration or multi-user editing (not applicable)

## Decisions

### 1. Dashboard Layout Pattern
**Decision**: Multi-page layout with sidebar navigation (settings-style pattern)

**Structure**:
- Sidebar navigation with sections as menu items
- Each section is a separate route under `/profile`
- Routes: `/profile` (contact/overview), `/profile/experience`, `/profile/education`, `/profile/certifications`, `/profile/skills`
- Professional summary and social links are part of `/profile` (contact info section)

**Rationale**:
- Matches existing settings page pattern in the application
- User provided screenshot showing this exact navigation pattern
- Provides focused view of each section without overwhelming users
- Sidebar navigation makes it easy to jump between sections
- Consistent with Nuxt UI Dashboard template conventions

**Alternatives considered**:
- Single-page dashboard with all sections: Rejected per user requirements
- Tabbed interface: Less flexible than sidebar navigation

### 2. Edit Mode Pattern
**Decision**: Inline editing with form fields (settings-style)

**Pattern**:
- Use UForm with UPageCard for each section
- Fields are displayed as editable inputs directly on the page
- Save button in header or footer of each section
- Toast notifications for success/error feedback
- No modals needed - all editing happens on the page

**Rationale**:
- User specified inline editing approach
- Matches settings pages pattern (`/settings/index.vue` example)
- Simpler UX - users see exactly what they're editing
- Works well with form validation and error display
- Follows Nuxt UI patterns (UForm, UFormField, UPageCard)

**Alternatives considered**:
- Modal editing: Rejected per user requirements
- Separate edit pages: Too much navigation overhead

### 3. Data Fetching and State Management Strategy
**Decision**: Use careerIDStore (Pinia) for all profile data

**Rationale**:
- User confirmed: "as long as the careerIDStore is updated, other features will read from it"
- Store already exists with all CRUD methods for each section
- Centralized state management for profile data
- Other features (resume generation, Sage AI) consume data from the store
- Single source of truth for profile state

**Implementation**:
```typescript
// On profile page mount
const careerIDStore = useCareerIDStore()
const user = useSupabaseUser()

// Fetch complete profile
await careerIDStore.fetchProfile(user.value.id)

// Access data from store
const experience = computed(() => careerIDStore.experience)
const contactInfo = computed(() => careerIDStore.contactInfo)

// Update data using store actions
await careerIDStore.updateContactInfo(id, data)
await careerIDStore.addExperience(data)
```

**Store provides**:
- `fetchProfile(profileId)` - Loads all sections
- Section arrays: `experience`, `education`, `certifications`, `profileSkills`, `profileSocialLinks`
- CRUD methods for each section (add, update, delete)
- UI state: `isLoading`, `isSaving`, `error`, `lastSaved`
- Computed getters: `completionPercentage`, `skillsByProficiency`, etc.

**Alternatives considered**:
- Local component state: Rejected - other features need access to profile data
- Direct API calls without store: Rejected - doesn't propagate to other features

### 4. Mutation Strategy
**Decision**: Use careerIDStore actions for all mutations

**Pattern**:
1. User edits fields → clicks save
2. Frontend validates using Zod schema
3. Call store action (e.g., `careerIDStore.updateContactInfo(id, data)`)
4. Store handles API call and updates local state
5. Toast notification on success/error

**Rationale**:
- Store already implements all CRUD operations
- Store handles `isSaving` loading state
- Store updates local state on success
- Consistent with user requirement to use careerIDStore
- Other features automatically see updated data

**Example**:
```typescript
async function onSubmit(event: FormSubmitEvent<ContactSchema>) {
  try {
    await careerIDStore.updateContactInfo(
      careerIDStore.contactInfo!.id,
      event.data
    )
    toast.add({
      title: 'Success',
      description: 'Contact info updated',
      icon: 'i-lucide-check',
      color: 'success'
    })
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'Failed to update contact info',
      color: 'error'
    })
  }
}
```

**Alternatives considered**:
- Direct API calls: Rejected - doesn't update store, breaks data propagation

### 5. Handling Empty Sections
**Decision**: Show empty state with "Add" CTA for each section

**Visual pattern**:
```
┌─────────────────────────────────┐
│  Work Experience                │
│  ┌───────────────────────────┐  │
│  │  No work experience added │  │
│  │  [+ Add Experience]       │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

**Rationale**:
- Clear affordance for adding first entry
- Maintains section structure even when empty
- Encourages profile completion

### 6. Profile ID Handling
**Decision**: Use authenticated user's profile ID from Supabase session

**Implementation**:
```typescript
// In component or composable
const user = useSupabaseUser()
const profileId = computed(() => user.value?.id || null)
```

**Assumption**: User ID === Profile ID (one profile per user)

**Fallback**: If profile doesn't exist (404), redirect to profile builder/onboarding

**Rationale**:
- Simple 1:1 relationship between user and profile
- No need for profile selection UI
- Matches existing API pattern

## Component Structure

### Proposed Route Structure
```
pages/profile/
├── index.vue                    # Contact info, summary, social links (main overview)
├── experience.vue              # Work experience list with inline forms
├── education.vue               # Education list with inline forms
├── certifications.vue          # Certifications list with inline forms
└── skills.vue                  # Skills management with inline add/remove
```

### Layout Update
```
layouts/default.vue
└── Navigation links updated:
    - Profile (parent with children)
      - Overview (/)
      - Experience (/experience)
      - Education (/education)
      - Certifications (/certifications)
      - Skills (/skills)
```

### Component Responsibilities
- **pages/profile/index.vue**: Contact info form with UForm, professional summary, social links
- **pages/profile/experience.vue**: List of experience entries, each with inline edit form
- **pages/profile/education.vue**: List of education entries, each with inline edit form
- **pages/profile/certifications.vue**: List of certification entries, each with inline edit form
- **pages/profile/skills.vue**: Skills management interface with tags and inline add/remove

### Shared Components (if needed)
- **components/profile/ExperienceForm.vue**: Reusable experience form fields
- **components/profile/EducationForm.vue**: Reusable education form fields
- **components/profile/CertificationForm.vue**: Reusable certification form fields
- **components/profile/SkillTag.vue**: Individual skill tag component

Note: May not need separate components - inline forms in each page are simpler

## State Management

### Use Existing careerIDStore (Pinia)

All profile data and mutations go through the existing `careerIDStore`:

```typescript
// In any profile page
const careerIDStore = useCareerIDStore()
const user = useSupabaseUser()

// On mount - fetch complete profile
onMounted(async () => {
  if (!careerIDStore.isProfileLoaded) {
    await careerIDStore.fetchProfile(user.value!.id)
  }
})

// Access data via computed
const contactInfo = computed(() => careerIDStore.contactInfo)
const experience = computed(() => careerIDStore.experience)

// Mutations via store actions
async function saveContact(data: ContactInfo) {
  await careerIDStore.updateContactInfo(contactInfo.value!.id, data)
}

async function addExperience(data: Omit<Experience, 'id'>) {
  await careerIDStore.addExperience(data)
}
```

### Store Benefits
- Single source of truth for profile data
- Automatic propagation to other features (resume generation, Sage AI)
- Built-in loading/error states
- Completion percentage calculation
- Already implements all CRUD operations

## Error Handling

### Error Scenarios
1. **Profile not found (404)**: Redirect to `/profile/onboarding` (profile builder)
2. **Validation errors (400)**: Display field-level errors in form
3. **Network errors**: Show retry option with error toast
4. **Unauthorized (401)**: Redirect to login
5. **Server errors (500)**: Generic error message with support link

### Validation Strategy
- **Client-side**: Immediate feedback on required fields, format validation (email, URL, dates)
- **Server-side**: Authoritative validation, enforce business rules
- **Display**: Show errors inline for forms, toasts for general errors

## Risks / Trade-offs

### Risk: Profile data too large for single request
**Likelihood**: Low (typical profile < 50KB)
**Impact**: Medium (slow initial load)
**Mitigation**: Monitor performance, implement lazy loading if needed

### Risk: Concurrent edits from multiple tabs/devices
**Likelihood**: Low (most users edit from one location)
**Impact**: Medium (data loss or conflicts)
**Mitigation**: Use timestamp-based optimistic locking if this becomes an issue (out of scope for v1)

### Trade-off: Mixed edit patterns (inline vs modal)
**Downside**: Less consistent UX
**Upside**: Better usability for each section's complexity level
**Decision**: Accept inconsistency in favor of usability

## Migration Plan

### Existing Users
- No migration needed - API and data model already exist
- Users who created profiles via the builder form will see their data in the new dashboard
- Empty sections handled gracefully with "Add" CTAs

### Rollout
1. Deploy new frontend components with feature flag (optional)
2. Monitor for errors and performance issues
3. Gather user feedback on edit UX patterns
4. Iterate on empty states and validation messages

### Rollback
- Revert to placeholder profile page (current state)
- No data migration needed (backend unchanged)

## Open Questions

1. **Should social links be displayed prominently or in a separate collapsible section?**
   - Recommendation: Include in contact section or as separate visible section (social presence is important for job seeking)

2. **How should we handle display_order for experience/education entries?**
   - Recommendation: Display in reverse chronological order (most recent first), add drag-to-reorder in future iteration

3. **Should we show a profile completion percentage/progress indicator?**
   - Recommendation: Yes, helps motivate users to complete their profile. Calculate based on filled sections.

4. **What should happen when a user deletes all entries in a section?**
   - Recommendation: Show empty state with "Add" CTA, allow section to be empty (some users may not have certifications, for example)

5. **Should we implement auto-save or require explicit save actions?**
   - Recommendation: Explicit save for v1 (clearer UX), consider auto-save for future iterations
