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
    // Email confirmation tokens need manual handling (not auto-detected)
    const emailToken = route.query.token as string
    if (emailToken) {
      const { error: exchangeError } = await supabaseClient.auth.exchangeCodeForSession(window.location.href)
      if (exchangeError) throw exchangeError
      return navigateTo('/signin?confirmed=true')
    }

    // OAuth flows (PKCE ?code= and implicit #access_token=) are handled
    // automatically by detectSessionInUrl during Supabase client init.
    // getSession() awaits that initialization, so the session is ready.
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
