export default defineNuxtPlugin(async () => {
  const accountStore = useAccountStore()
  accountStore.initializeAccount()
  
  // Hydrate user state from existing session
  await accountStore.hydrateFromSession()
})
