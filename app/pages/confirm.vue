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
  try {
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const code = route.query.code as string
    const accessToken = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')
    const token = hashParams.get('access_token') || route.query.token

    // OAuth callback: pass code string directly (PKCE verifier is in sessionStorage from signInWithOAuth)
    if (code) {
      const { error: exchangeError } = await supabaseClient.auth.exchangeCodeForSession(code)
      if (exchangeError) throw exchangeError
      await accountStore.hydrateFromSession()
      return navigateTo((route.query.next as string) || '/')
    }

    // Hash tokens: from our OAuth callback (from=oauth) or email confirmation link
    if (accessToken && refreshToken) {
      const { error: sessionError } = await supabaseClient.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      if (sessionError) throw sessionError
      await accountStore.hydrateFromSession()
      const nextPath = route.query.from === 'oauth' ? ((route.query.next as string) || '/') : '/signin?confirmed=true'
      return navigateTo(nextPath)
    }

    // Email confirmation with token in query
    if (token) {
      const { error: exchangeError } = await supabaseClient.auth.exchangeCodeForSession(window.location.href)
      if (exchangeError) throw exchangeError
      return navigateTo('/signin?confirmed=true')
    }

    throw new Error('No confirmation token found in URL')
  } catch (err: any) {
    console.error('Email confirmation error:', err)
    error.value = err?.message || 'Failed to confirm email'
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
            {{ loading ? 'Confirming your email...' : 'Confirmation Failed' }}
          </h1>
        </div>
      </template>

      <div class="text-center py-8">
        <!-- Loading state -->
        <div v-if="loading" class="flex flex-col items-center gap-4">
          <Icon name="i-lucide-loader-2" class="w-12 h-12 animate-spin text-primary" />
          <p class="text-neutral-600 dark:text-neutral-400">
            Please wait while we confirm your email address...
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
