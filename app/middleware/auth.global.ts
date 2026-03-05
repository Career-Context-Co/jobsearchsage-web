export default defineNuxtRouteMiddleware(async (to, from) => {
  const accountStore = useAccountStore()
  const publicRoutes = ['/signin', '/confirm']
  const isPublicRoute = publicRoutes.some(route => to.path.startsWith(route))

  if (isPublicRoute) return

  // After OAuth or email sign-in, the session was just established.
  // Let the navigation through — cookies may not have flushed yet.
  if (from.path.startsWith('/confirm') || from.path.startsWith('/signin')) {
    return
  }

  // Hydrate auth state if needed (once per app session)
  if (!accountStore.isAuthenticated) {
    const supabase = useSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      await accountStore.hydrateFromSession()
    }
  }

  if (!accountStore.isAuthenticated) {
    return navigateTo('/signin')
  }

  // Load profile if needed (once per app session)
  const careerIDStore = useCareerIDStore()
  if (!careerIDStore.isProfileLoaded) {
    try {
      await careerIDStore.fetchProfileByUser()
    } catch (error: any) {
      const status = error?.status ?? error?.statusCode
      if (status !== 404) console.error('Failed to load profile:', error)
      careerIDStore.error = null
    }
  }
})
