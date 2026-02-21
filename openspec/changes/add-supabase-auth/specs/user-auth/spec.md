## ADDED Requirements

### Requirement: Email and password sign-up
The system SHALL allow users to create an account using email and password via a server-side endpoint.

#### Scenario: Successful sign-up
- **WHEN** a user submits a valid email and password to `POST /api/auth/sign-up`
- **THEN** the system SHALL create a Supabase auth user
- **AND** the system SHALL auto-create a profile shell in `career_id.profiles` with a `prof_*` prefixed CUID2 ID
- **AND** the system SHALL return `{ success: true, message: 'Please check your email to confirm your account' }`

#### Scenario: Sign-up with existing email
- **WHEN** a user submits an email that is already registered
- **THEN** the system SHALL return an error response with an appropriate message
- **AND** the system SHALL NOT create a duplicate auth user or profile

#### Scenario: Sign-up with invalid input
- **WHEN** a user submits an empty email or password shorter than 6 characters
- **THEN** the system SHALL return a validation error response

### Requirement: Email and password sign-in
The system SHALL allow users to sign in using email and password via a server-side endpoint.

#### Scenario: Successful sign-in
- **WHEN** a user submits valid credentials to `POST /api/auth/sign-in`
- **THEN** the system SHALL authenticate the user via Supabase
- **AND** the system SHALL return session tokens (`accessToken`, `refreshToken`), user data (`id`, `email`), and the user's `profileId`
- **AND** the response SHALL follow the structured format `{ success: true, data: { user, session, profileId } }`

#### Scenario: Sign-in with invalid credentials
- **WHEN** a user submits incorrect email or password
- **THEN** the system SHALL return an error response with message 'Invalid login credentials'

#### Scenario: Sign-in with unconfirmed email
- **WHEN** a user signs in before confirming their email
- **THEN** the system SHALL return an error indicating the email is not confirmed

### Requirement: Google OAuth sign-in
The system SHALL allow users to sign in using Google OAuth via a client-side browser redirect.

#### Scenario: Initiate Google OAuth
- **WHEN** a user clicks the Google sign-in button
- **THEN** the system SHALL initiate `useSupabaseClient().auth.signInWithOAuth({ provider: 'google' })` to redirect to Google's consent page

#### Scenario: Google OAuth callback
- **WHEN** Google redirects back to the app after successful authentication
- **THEN** the `@nuxtjs/supabase` plugin SHALL automatically handle the session
- **AND** the auth middleware SHALL redirect the user to the home page

### Requirement: Sign-out
The system SHALL allow authenticated users to sign out via a server-side endpoint.

#### Scenario: Successful sign-out
- **WHEN** an authenticated user triggers sign-out via `POST /api/auth/sign-out`
- **THEN** the system SHALL invalidate the Supabase session
- **AND** the system SHALL return `{ success: true, message: 'Signed out successfully' }`
- **AND** the client SHALL clear local user state and redirect to `/signin`

### Requirement: Email confirmation
The system SHALL handle Supabase email confirmation via a dedicated `/confirm` page.

#### Scenario: Successful email confirmation
- **WHEN** a user clicks the confirmation link in their email and lands on `/confirm`
- **THEN** the system SHALL extract the token from the URL
- **AND** the system SHALL exchange the token for a session via `useSupabaseClient().auth.exchangeCodeForSession()`
- **AND** the system SHALL redirect the user to `/signin` with a success indicator

#### Scenario: Invalid or expired confirmation token
- **WHEN** a user visits `/confirm` with an invalid or expired token
- **THEN** the system SHALL display an error message
- **AND** the system SHALL provide a link to return to `/signin`

### Requirement: Route protection
The system SHALL protect all routes behind authentication using a global middleware.

#### Scenario: Unauthenticated user accesses protected route
- **WHEN** an unauthenticated user navigates to any route other than `/signin` or `/confirm`
- **THEN** the middleware SHALL redirect the user to `/signin`

#### Scenario: Authenticated user accesses sign-in page
- **WHEN** an authenticated user navigates to `/signin`
- **THEN** the middleware SHALL redirect the user to `/`

#### Scenario: Unauthenticated user accesses sign-in page
- **WHEN** an unauthenticated user navigates to `/signin`
- **THEN** the middleware SHALL allow access to the page

### Requirement: Sign-in page UI
The system SHALL provide a single `/signin` page with switchable sign-in and sign-up forms.

#### Scenario: Display sign-in form by default
- **WHEN** a user navigates to `/signin`
- **THEN** the page SHALL display the sign-in form with email and password fields
- **AND** the page SHALL use the `fullscreen` layout
- **AND** the page SHALL display a link to switch to the sign-up form
- **AND** the page SHALL display a Google OAuth sign-in button

#### Scenario: Switch to sign-up form
- **WHEN** a user clicks the sign-up link
- **THEN** the page SHALL display the sign-up form with email and password fields
- **AND** the page SHALL display a link to switch back to the sign-in form

#### Scenario: Display confirmation message after sign-up
- **WHEN** a user successfully submits the sign-up form
- **THEN** the page SHALL display a message: "Please check your email to confirm your account"
- **AND** the page SHALL NOT redirect the user

#### Scenario: Display error on failed sign-in or sign-up
- **WHEN** a sign-in or sign-up request fails
- **THEN** the page SHALL display the error message returned by the server

### Requirement: User state management
The system SHALL store authenticated user state in `accountStore`.

#### Scenario: Store user data after sign-in
- **WHEN** a user successfully signs in
- **THEN** `accountStore` SHALL store the user's `id`, `email`, and `profileId`
- **AND** `accountStore` SHALL establish the client session via `useSupabaseClient().auth.setSession()`

#### Scenario: Clear user state on sign-out
- **WHEN** a user signs out
- **THEN** `accountStore` SHALL clear all user state
- **AND** `careerIDStore` SHALL reset profile data via `resetProfile()`

#### Scenario: User menu displays real user data
- **WHEN** a user is authenticated
- **THEN** `UserMenu.vue` SHALL display the user's email (or name if available)
- **AND** the "Log out" menu item SHALL trigger `accountStore.signOut()`

### Requirement: Session persistence
The system SHALL persist the user session across page reloads.

#### Scenario: Page reload with valid session
- **WHEN** an authenticated user reloads the page
- **THEN** `useSupabaseUser()` SHALL return the user data from the persisted session cookie
- **AND** the auth middleware SHALL allow access to protected routes
- **AND** `accountStore` SHALL re-hydrate user state from the session
