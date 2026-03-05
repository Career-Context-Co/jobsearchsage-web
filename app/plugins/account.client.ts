export default defineNuxtPlugin(() => {
  const accountStore = useAccountStore()
  accountStore.initializeAccount()
})
