export default defineNuxtRouteMiddleware(async (to, from) => {
  const accountStore = useAccountStore()
  const publicRoutes = ['/signin', '/confirm']
  const isPublicRoute = publicRoutes.some(route => to.path.startsWith(route))

  if (isPublicRoute) return

  if (from.path.startsWith('/confirm') || from.path.startsWith('/signin')) {
    return
  }

  // Check auth: useSupabaseUser() is populated from cookies by @nuxtjs/supabase.
  // Fall back to getSession() in case the composable hasn't caught up yet.
  const user = useSupabaseUser()
  let resolvedUser = user.value

  if (!resolvedUser) {
    const supabase = useSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    resolvedUser = session?.user ?? null
  }

  if (!resolvedUser) {
    return navigateTo('/signin')
  }

  // Hydrate account store if needed (once per app session)
  if (!accountStore.isAuthenticated) {
    await accountStore.hydrateFromSession()
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
