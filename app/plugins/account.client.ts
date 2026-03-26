export default defineNuxtPlugin(() => {
  const accountStore = useAccountStore()
  accountStore.initializeAccount()

  const globalStore = useGlobalStore()
  globalStore.bootstrap()
})
