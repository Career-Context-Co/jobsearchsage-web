## Why

The app currently has no authentication — user identity is hardcoded (`profileId` and `userId` in careerIDStore), the UserMenu shows a static user, and all routes are publicly accessible. Adding Supabase auth enables real multi-user support, secures the application, and connects user identity to the existing RLS-protected database.

## What Changes

- Add server-side auth endpoints (`/api/auth/sign-up`, `/api/auth/sign-in`, `/api/auth/sign-out`) that handle all Supabase auth logic server-side, consistent with the app's existing pattern of keeping business logic out of client code
- Add a `/signin` page with switchable sign-in/sign-up forms and Google OAuth button, using the fullscreen layout
- Add a `/confirm` page to handle Supabase email confirmation token exchange
- Add global auth middleware to protect all routes except `/signin` and `/confirm`
- **BREAKING**: Move user identity into `accountStore` — replace hardcoded `profileId`/`userId` in `careerIDStore` with values derived from the authenticated user
- Update `UserMenu.vue` to display real user data and wire up sign-out
- Update `app.vue` to load profile based on authenticated user instead of hardcoded IDs
- Update `nuxt.config.ts` with Supabase redirect configuration
- Sign-up server endpoint auto-creates a profile shell for new users
- Google OAuth uses client-side `signInWithOAuth()` (inherently browser-redirect-based, no server-side alternative)

## Capabilities

### New Capabilities
- `user-auth`: Authentication system — sign-up (email+password), sign-in (email+password), Google OAuth, email confirmation, sign-out, session management, route protection, and user state management in accountStore

### Modified Capabilities
- `profile-builder`: Profile creation is now triggered automatically on sign-up (server-side), and profile loading is tied to the authenticated user's identity rather than hardcoded IDs

## Impact

- **Server**: New `server/api/auth/` endpoints (sign-up, sign-in, sign-out)
- **Pages**: New `app/pages/signin.vue`, `app/pages/confirm.vue`
- **Middleware**: New `app/middleware/auth.global.ts`
- **Stores**: `accountStore.ts` gains user state + auth actions; `careerIDStore.ts` loses hardcoded IDs
- **Components**: `UserMenu.vue` updated for real user data + sign-out
- **Config**: `nuxt.config.ts` supabase section updated
- **App root**: `app.vue` updated for auth-aware profile loading
- **Dependencies**: No new dependencies — `@nuxtjs/supabase` v2.0.1 already installed and configured
