export default defineNuxtRouteMiddleware(() => {
  const globalStore = useGlobalStore()
  if (!globalStore.features.hero) {
    return navigateTo('/profile')
  }
})
