## 1. Configuration & Infrastructure

- [x] 1.1 Update `nuxt.config.ts` — configure `supabase.redirectOptions` with `login: '/signin'`, `callback: '/confirm'`, and `exclude` paths for `/signin` and `/confirm`
- [x] 1.2 Create `app/middleware/auth.global.ts` — check `useSupabaseUser()`, redirect unauthenticated users to `/signin` (except `/signin` and `/confirm`), redirect authenticated users away from `/signin`

## 2. Server Auth Endpoints

- [x] 2.1 Create `server/api/auth/sign-up.post.ts` — accept `{ email, password }`, validate input (email required, password ≥ 6 chars), call `serverSupabaseClient().auth.signUp()`, auto-create profile shell in `career_id.profiles` with `prof_*` CUID2 ID, return `{ success: true, message: 'Please check your email to confirm your account' }`. Handle duplicate email errors.
- [x] 2.2 Create `server/api/auth/sign-in.post.ts` — accept `{ email, password }`, call `serverSupabaseClient().auth.signInWithPassword()`, look up user's `profileId` from `career_id.profiles` (create one defensively if missing), return `{ success: true, data: { user: { id, email }, session: { accessToken, refreshToken }, profileId } }`. Handle invalid credentials and unconfirmed email errors.
- [x] 2.3 Create `server/api/auth/sign-out.post.ts` — call `serverSupabaseClient().auth.signOut()`, return `{ success: true, message: 'Signed out successfully' }`. Follow existing error handling patterns from `server/utils/error-handler.ts`.

## 3. Account Store Auth Integration

- [x] 3.1 Update `app/stores/accountStore.ts` — add user state (`user: { id, email, name?, avatar? } | null`, `profileId: string | null`, `isAuthenticated` getter), add `signIn(email, password)` action that `$fetch`es `POST /api/auth/sign-in`, receives session tokens, calls `useSupabaseClient().auth.setSession()` to establish client session, stores user data and profileId. Add `signUp(email, password)` action that `$fetch`es `POST /api/auth/sign-up` and returns the success message. Add `signOut()` action that `$fetch`es `POST /api/auth/sign-out`, calls `useSupabaseClient().auth.signOut()` client-side, clears user state, and calls `careerIDStore.resetProfile()`.
- [x] 3.2 Add `hydrateFromSession()` action to `accountStore` — on app init, check `useSupabaseUser()` for existing session, populate user state and profileId from session data. Update `app/plugins/account.client.ts` to call this on startup.

## 4. Sign-In Page & Email Confirmation

- [x] 4.1 Create `app/pages/signin.vue` — use `fullscreen` layout via `definePageMeta({ layout: 'fullscreen' })`. Build switchable sign-in/sign-up form with `mode` ref toggling between `'signin'` and `'signup'`. Include email input, password input, submit button, mode toggle link, and Google OAuth button. Style with Nuxt UI components (`UInput`, `UButton`, `UCard`, `UAlert`).
- [x] 4.2 Wire sign-in form — on submit, call `accountStore.signIn(email, password)`. On success, `navigateTo('/')`. On error, display error message via `UAlert`.
- [x] 4.3 Wire sign-up form — on submit, call `accountStore.signUp(email, password)`. On success, show "Please check your email to confirm your account" message (no redirect). On error, display error message.
- [x] 4.4 Wire Google OAuth button — on click, call `useSupabaseClient().auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/confirm' } })`. This is the one client-side Supabase auth call (browser redirect requirement).
- [x] 4.5 Create `app/pages/confirm.vue` — use `fullscreen` layout. On mount, extract token/code from URL hash params, call `useSupabaseClient().auth.exchangeCodeForSession()`. On success, redirect to `/signin` with query param `?confirmed=true`. On error, display error message with link back to `/signin`. Handle the `?confirmed=true` query param in `signin.vue` to show a success alert.

## 5. User Menu & App Integration

- [x] 5.1 Update `app/components/UserMenu.vue` — replace hardcoded `user` ref with computed property from `accountStore.user` (or `useSupabaseUser()` as fallback). Display user email as name. Wire "Log out" menu item to call `accountStore.signOut()` then `navigateTo('/signin')`. Remove template/theme links that are demo-only (optional cleanup).
- [x] 5.2 Update `app/app.vue` — replace hardcoded `careerIDStore.profileId` usage with `accountStore.profileId`. Only attempt `fetchProfile()` when `accountStore.isAuthenticated && accountStore.profileId`. Remove the hardcoded profileId check.
- [x] 5.3 Update `app/stores/careerIDStore.ts` — remove hardcoded `profileId: 'prof_myf2i85se9xri4e4wgsxxim7'` and `userId: 'nswk'` from initial state. Change `profileId` and `userId` to `null` defaults. Ensure `createProfile()` uses `accountStore.user.id` for `userId` instead of `this.userId`.
