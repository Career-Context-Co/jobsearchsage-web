export default defineNuxtRouteMiddleware(async (to, from) => {
  const user = useSupabaseUser()
  const accountStore = useAccountStore()

  // Public routes that don't require authentication
  const publicRoutes = ['/signin', '/confirm']
  const isPublicRoute = publicRoutes.some(route => to.path.startsWith(route))

  // If user is authenticated but store isn't hydrated yet (e.g. page reload),
  // hydrate the store now so profileId is available
  if (user.value && !accountStore.isAuthenticated) {
    await accountStore.hydrateFromSession()
  }

  // If navigating away from /confirm or /signin, allow it through even if
  // useSupabaseUser() hasn't caught up yet — session was just established
  if (from.path.startsWith('/confirm') || from.path.startsWith('/signin')) {
    return
  }

  // If not authenticated and trying to access a protected route, redirect to signin
  if (!user.value && !isPublicRoute) {
    return navigateTo('/signin')
  }

  // If authenticated and trying to access signin, redirect to home
  if (user.value && to.path.startsWith('/signin')) {
    return navigateTo('/')
  }
})
