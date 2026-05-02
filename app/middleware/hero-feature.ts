export default defineNuxtRouteMiddleware((to) => {
  const feature = to.meta.featureFlag
  if (typeof feature !== 'string') return

  const account = useAccountStore()
  if (!account.isFeatureEnabled(feature)) {
    return navigateTo('/profile')
  }
})
