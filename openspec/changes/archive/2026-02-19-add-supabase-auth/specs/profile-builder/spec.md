## ADDED Requirements

### Requirement: Auto-create profile on sign-up
The system SHALL automatically create a profile shell when a new user signs up, eliminating the need for a separate profile creation step.

#### Scenario: Profile created during sign-up
- **WHEN** a new user successfully signs up via `POST /api/auth/sign-up`
- **THEN** the system SHALL create a profile in `career_id.profiles` with the user's Supabase auth `user_id`
- **AND** the profile SHALL have a `prof_*` prefixed CUID2 ID
- **AND** the profile SHALL have `completion_status` set to `'incomplete'`

#### Scenario: Defensive profile creation on sign-in
- **WHEN** a user signs in and no profile exists for their `user_id`
- **THEN** the sign-in endpoint SHALL create a profile shell
- **AND** the sign-in response SHALL include the newly created `profileId`

### Requirement: Profile loading tied to authenticated user
The system SHALL load the profile based on the authenticated user's identity rather than hardcoded IDs.

#### Scenario: Profile loaded from authenticated session
- **WHEN** an authenticated user loads the app
- **THEN** `app.vue` SHALL use the `profileId` from `accountStore` (derived from the authenticated user) to load the profile via `careerIDStore.fetchProfile()`

#### Scenario: No hardcoded profile or user IDs
- **WHEN** the app initializes
- **THEN** `careerIDStore` SHALL NOT contain hardcoded `profileId` or `userId` values
- **AND** these values SHALL be set dynamically from the authenticated user's session data

## MODIFIED Requirements

### Requirement: Profile Builder Form Access
The application SHALL provide a guided profile builder form accessible from the Profile page, requiring authentication.

#### Scenario: Display profile builder form
- **WHEN** an authenticated user navigates to the Profile page
- **THEN** the application SHALL display a profile builder form with multiple sections
- **AND** the form SHALL include sections for Professional Experience, Education, Certifications, Skills, and Contact Information

#### Scenario: Unauthenticated access to profile page
- **WHEN** an unauthenticated user attempts to navigate to the Profile page
- **THEN** the global auth middleware SHALL redirect the user to `/signin`
