## Context

The app currently has no authentication. User identity is hardcoded in `careerIDStore` (`profileId: 'prof_myf2i85se9xri4e4wgsxxim7'`, `userId: 'nswk'`), `UserMenu.vue` displays a static user, and all routes are publicly accessible. `@nuxtjs/supabase` v2.0.1 is already installed and configured with `redirect: false`. The server already uses `serverSupabaseClient()` for database operations, and RLS policies are in place on the Supabase side.

The app follows a strict server-first pattern: all business logic lives in Nitro server endpoints, and the client only calls `$fetch()` to those endpoints. Auth must follow this same pattern.

## Goals / Non-Goals

**Goals:**
- Implement email+password sign-up and sign-in via server-side Nitro endpoints
- Add Google OAuth sign-in (client-side redirect — inherent browser requirement)
- Protect all routes behind authentication with a global middleware
- Handle email confirmation flow
- Store authenticated user state in `accountStore`
- Auto-create a profile shell on sign-up
- Replace hardcoded user identity throughout the app
- Wire up real sign-out in `UserMenu.vue`

**Non-Goals:**
- Password reset flow (future change)
- User profile editing (name, avatar) in settings
- Role-based access control
- Multi-factor authentication
- Social providers beyond Google
- Server-side rendering auth (app is SPA with `ssr: false`)

## Decisions

### 1. Server-side auth endpoints over client-side Supabase auth calls

**Decision**: Create `/api/auth/sign-up`, `/api/auth/sign-in`, `/api/auth/sign-out` Nitro endpoints that call `serverSupabaseClient().auth.*` methods.

**Rationale**: Consistent with the app's existing architecture where all business logic is server-side. Enables custom logic like auto-creating a profile on sign-up. Keeps auth implementation details out of client code.

**Alternative considered**: Direct client-side `useSupabaseClient().auth.*` calls — simpler but breaks the server-first pattern and can't hook in custom logic.

**Session management**: The sign-in endpoint returns session tokens (`access_token`, `refresh_token`). The client calls `useSupabaseClient().auth.setSession()` once to establish the session — this is the minimal client-side Supabase interaction needed for `@nuxtjs/supabase` to manage cookies and `useSupabaseUser()` reactivity.

### 2. Google OAuth as client-side exception

**Decision**: Google OAuth uses `useSupabaseClient().auth.signInWithOAuth({ provider: 'google' })` directly from the client.

**Rationale**: OAuth requires a browser redirect to the provider's consent page. There is no server-side alternative for initiating this flow. The `@nuxtjs/supabase` plugin handles the callback and session automatically.

**Alternative considered**: Server-initiated OAuth — not possible with browser redirect flows.

### 3. Single `/signin` page with switchable forms

**Decision**: One page at `/signin` with a toggle between sign-in and sign-up modes. Uses the existing `fullscreen` layout.

**Rationale**: Simpler routing, common UX pattern. The fullscreen layout already exists and provides a clean container without the dashboard sidebar.

**Alternative considered**: Separate `/signin` and `/signup` pages — more files for no real benefit.

### 4. User state in `accountStore`, not `careerIDStore`

**Decision**: Extend `accountStore` with user identity (`id`, `email`, `name`, `avatar`), `profileId`, and auth actions (`signIn`, `signUp`, `signOut`). Remove hardcoded `profileId`/`userId` from `careerIDStore`.

**Rationale**: `accountStore` already manages account-level concerns (feature flags). User identity is an account concern, not a career-ID concern. `careerIDStore` should receive `profileId` from `accountStore` rather than owning it.

**Alternative considered**: New dedicated `authStore` — adds another store when `accountStore` already exists for this purpose.

### 5. Global auth middleware using `useSupabaseUser()`

**Decision**: Create `auth.global.ts` middleware that checks `useSupabaseUser()`. If null and not on `/signin` or `/confirm`, redirect to `/signin`. If authenticated and on `/signin`, redirect to `/`.

**Rationale**: `useSupabaseUser()` is the reactive ref provided by `@nuxtjs/supabase` that reflects the current session state. It's the canonical way to check auth in the Nuxt Supabase ecosystem.

**Alternative considered**: Custom cookie/token checking — reinvents what the plugin already provides.

### 6. Email confirmation via `/confirm` page

**Decision**: Create a `/confirm` page that extracts the token from the URL hash and calls `useSupabaseClient().auth.exchangeCodeForSession()` to complete email verification.

**Rationale**: Supabase sends a confirmation email with a link containing a token. The app needs a page to handle this callback. After successful confirmation, redirect to `/signin` with a success message.

### 7. Sign-up auto-creates profile shell

**Decision**: The `/api/auth/sign-up` endpoint, after successfully creating the Supabase auth user, also creates a profile shell in `career_id.profiles` using the same pattern as the existing `POST /api/career-id/profile` endpoint.

**Rationale**: Every user needs a profile. Creating it at sign-up time eliminates the need for a separate "create profile" step and ensures the profile exists when the user first signs in.

**ID prefix**: Profile IDs continue to use `prof_*` prefix (existing convention).

### 8. Structured API responses

**Decision**: Auth endpoints follow the existing response pattern: `{ success: boolean, message: string, data?: { ... } }`.

**Rationale**: Consistency with all other API endpoints in the app.

**Sign-in response data**:
```
{
  success: true,
  message: 'Signed in successfully',
  data: {
    user: { id, email, name, avatar },
    session: { accessToken, refreshToken },
    profileId: 'prof_...'
  }
}
```

**Sign-up response data**:
```
{
  success: true,
  message: 'Please check your email to confirm your account'
}
```

## Risks / Trade-offs

**[Session token in response body]** → The sign-in endpoint returns session tokens in the JSON response, which the client then passes to `setSession()`. This is a standard pattern for server-side auth with client-side session management. The tokens are short-lived and transmitted over HTTPS.

**[Google OAuth is client-side]** → This is an unavoidable exception to the server-first pattern. OAuth browser redirects cannot be initiated server-side. The exception is minimal and well-understood.

**[Profile creation coupled to sign-up]** → If the profile insert fails after auth user creation, the user exists in Supabase Auth but has no profile. Mitigation: the sign-in flow should check for profile existence and create one if missing (defensive).

**[Email confirmation UX]** → Users must check their email before they can sign in. If the confirmation email is delayed or goes to spam, users may be confused. Mitigation: clear messaging on the sign-up success state ("Please check your email to confirm your account").

**[Hardcoded ID removal is breaking]** → Removing `profileId: 'prof_myf2i85se9xri4e4wgsxxim7'` and `userId: 'nswk'` from `careerIDStore` means the app won't work without authentication. This is intentional — the app should require auth.
