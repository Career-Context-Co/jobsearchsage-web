## ADDED Requirements

### Requirement: Resume List Cache
The `docsStore` Pinia store SHALL maintain a cached list of resume list items (`id`, `title`, `updatedAt`) populated by the list API. Pages SHALL read from this cache rather than calling `$fetch` directly.

#### Scenario: List is fetched and cached
- **WHEN** `listResumes()` is called
- **THEN** the store SHALL call `GET /api/docs/resumes` and populate `resumes` with lightweight items containing `id`, `title`, and `updatedAt`
- **AND** `isLoading` SHALL be `true` during the fetch and `false` upon completion

#### Scenario: List reflects a newly created resume
- **WHEN** `createResume()` is called and the server returns the new record
- **THEN** the store SHALL prepend the new resume list item to `resumes`

#### Scenario: List reflects a deleted resume
- **WHEN** `deleteResume(id)` succeeds
- **THEN** the store SHALL remove the matching item from `resumes`

### Requirement: Lazy Content Hydration
Resume `content` and `designSettings` SHALL not be fetched as part of the list. When a full resume record is loaded, the store SHALL merge it onto the existing list item so subsequent accesses do not re-fetch.

#### Scenario: Content is fetched and merged on first open
- **WHEN** `getResume(id)` is called and the list item for that id does not yet have `content`
- **THEN** the store SHALL call `GET /api/docs/resumes/:id`
- **AND** SHALL merge `content` and `designSettings` onto the existing list item
- **AND** SHALL return the enriched item

#### Scenario: Cached content is returned without re-fetching
- **WHEN** `getResume(id)` is called and the list item for that id already has `content`
- **THEN** the store SHALL return the cached item immediately without making a network request

#### Scenario: Updated content is merged back into the cache
- **WHEN** `updateResume(id, patch)` succeeds
- **THEN** the store SHALL merge the patch fields (`title`, `content`, `designSettings`) onto the list item in `resumes`

### Requirement: Single Loading Flag
The store SHALL expose one `isLoading` boolean that is `true` during any active read operation and `false` otherwise.

#### Scenario: isLoading is true during list fetch
- **WHEN** `listResumes()` is in flight
- **THEN** `isLoading` SHALL be `true`

#### Scenario: isLoading is true during record fetch
- **WHEN** `getResume(id)` is making a network request
- **THEN** `isLoading` SHALL be `true`

### Requirement: Error Handling Delegated to Components
Store actions SHALL throw on failure. Components that call store actions SHALL catch errors and manage their own error display state. The store SHALL NOT hold error state.

#### Scenario: Action throws on API failure
- **WHEN** a store action receives a non-success response from the API
- **THEN** the action SHALL throw an error with a descriptive message
- **AND** the calling component SHALL catch the error and update its local error state
