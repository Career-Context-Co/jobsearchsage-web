<script setup lang="ts">
definePageMeta({
  layout: 'fullscreen'
})

const supabaseClient = useSupabaseClient()
const route = useRoute()

const loading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    // Extract token from URL hash or query params
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const token = hashParams.get('access_token') || route.query.token as string
    const type = hashParams.get('type') || route.query.type as string
    
    if (!token) {
      throw new Error('No confirmation token found in URL')
    }
    
    // Exchange the code/token for a session
    const { error: exchangeError } = await supabaseClient.auth.exchangeCodeForSession(
      window.location.href
    )
    
    if (exchangeError) {
      throw exchangeError
    }
    
    // Success - redirect to signin with confirmation flag
    await navigateTo('/signin?confirmed=true')
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
