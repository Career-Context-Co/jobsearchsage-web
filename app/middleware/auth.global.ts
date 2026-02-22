export default defineNuxtRouteMiddleware(async (to, from) => {
  const user = useSupabaseUser()
  const accountStore = useAccountStore()

  // Public routes that don't require authentication
  const publicRoutes = ['/signin', '/confirm']
  const isPublicRoute = publicRoutes.some(route => to.path.startsWith(route))

  // If navigating away from /confirm or /signin, allow it through even if
  // useSupabaseUser() hasn't caught up yet — session was just established
  if (from.path.startsWith('/confirm') || from.path.startsWith('/signin')) {
    return
  }

  // useSupabaseUser() is populated asynchronously. On page reload, it may be
  // null while the Supabase client is still initializing from storage.
  // Fall back to getSession() to avoid a false redirect on slow init.
  let resolvedUser = user.value
  if (!resolvedUser && !isPublicRoute) {
    const supabase = useSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    resolvedUser = session?.user ?? null
  }

  // If user is authenticated but store isn't hydrated yet (e.g. page reload),
  // hydrate the store now so profileId is available
  if (resolvedUser && !accountStore.isAuthenticated) {
    await accountStore.hydrateFromSession()
  }

  // If not authenticated and trying to access a protected route, redirect to signin
  if (!resolvedUser && !isPublicRoute) {
    return navigateTo('/signin')
  }

  // If authenticated and trying to access signin, redirect to home
  if (resolvedUser && to.path.startsWith('/signin')) {
    return navigateTo('/')
  }
})
