export default defineNuxtRouteMiddleware((to) => {
  if (to.path.startsWith('/profile/hero')) {
    const account = useAccountStore()
    if (!account.isHeroEnabled) {
      return navigateTo('/profile')
    }
  }
})
