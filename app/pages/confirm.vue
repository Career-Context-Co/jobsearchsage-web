<script setup lang="ts">
definePageMeta({
  layout: 'fullscreen'
})

const supabaseClient = useSupabaseClient()
const route = useRoute()
const accountStore = useAccountStore()

const loading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  const next = (route.query.next as string) || '/'

  try {
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')
    const isOAuth = route.query.from === 'oauth'

    // Hash tokens from our server OAuth callback
    if (accessToken && refreshToken) {
      const { data, error: sessionError } = await supabaseClient.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      })
      if (sessionError) throw sessionError
      if (data.session) {
        // Give reactive state time to propagate before navigating
        await new Promise(resolve => setTimeout(resolve, 500))
        await accountStore.hydrateFromSession()
        return navigateTo(isOAuth ? next : '/signin?confirmed=true')
      }
    }

    // Direct OAuth code (fallback if server callback not used)
    const code = route.query.code as string
    if (code) {
      const { error: exchangeError } = await supabaseClient.auth.exchangeCodeForSession(code)
      if (exchangeError) throw exchangeError
      await new Promise(resolve => setTimeout(resolve, 500))
      await accountStore.hydrateFromSession()
      return navigateTo(next)
    }

    // Email confirmation token in query
    const emailToken = route.query.token as string
    if (emailToken) {
      const { error: exchangeError } = await supabaseClient.auth.exchangeCodeForSession(window.location.href)
      if (exchangeError) throw exchangeError
      return navigateTo('/signin?confirmed=true')
    }

    // No URL params — check if session already exists in cookies
    const { data: { session } } = await supabaseClient.auth.getSession()
    if (session) {
      await accountStore.hydrateFromSession()
      return navigateTo(next)
    }

    return navigateTo('/signin?error=no_session')
  } catch (err: unknown) {
    console.error('Confirmation error:', err)
    error.value = (err instanceof Error ? err.message : null) || 'Failed to complete sign-in'
    loading.value = false
  }
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 p-4">
    <UCard class="w-full max-w-md">
      <template #header>
        <div class="text-center">
          <h1 class="text-2xl font-bold text-neutral-900 dark:text-white">
            {{ loading ? 'Signing you in...' : 'Confirmation Failed' }}
          </h1>
        </div>
      </template>

      <div class="text-center py-8">
        <!-- Loading state -->
        <div v-if="loading" class="flex flex-col items-center gap-4">
          <Icon name="i-lucide-loader-2" class="w-12 h-12 animate-spin text-primary" />
          <p class="text-neutral-600 dark:text-neutral-400">
            Please wait while we get you signed in...
          </p>
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="space-y-4">
          <Icon name="i-lucide-alert-circle" class="w-12 h-12 text-red-500 mx-auto" />
          <UAlert
            color="red"
            variant="subtle"
            :title="error"
            class="text-left"
          />
          <p class="text-sm text-neutral-600 dark:text-neutral-400">
            The confirmation link may be invalid or expired.
          </p>
          <UButton
            to="/signin"
            color="primary"
            block
            class="mt-4"
          >
            Return to sign in
          </UButton>
        </div>
      </div>
    </UCard>
  </div>
</template>
