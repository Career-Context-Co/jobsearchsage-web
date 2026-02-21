<script setup lang="ts">
import type { FormSubmitEvent, AuthFormField } from '@nuxt/ui'
import * as z from 'zod'

definePageMeta({
  layout: 'fullscreen'
})

const route = useRoute()
const accountStore = useAccountStore()
const supabaseClient = useSupabaseClient()
const toast = useToast()

const mode = ref<'signin' | 'signup'>('signin')
const loading = ref(false)
const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)

// Check for confirmation success or OAuth errors
onMounted(() => {
  if (route.query.error === 'oauth_failed') {
    error.value = 'Google sign-in failed. Please try again.'
    navigateTo('/signin', { replace: true })
  } else if (route.query.error === 'no_code') {
    error.value = 'No authorization code received. Please try again.'
    navigateTo('/signin', { replace: true })
  }
  if (route.query.confirmed === 'true') {
    successMessage.value = 'Success! Your email has been confirmed. You can now sign in.'
    
    // Show toast notification
    toast.add({
      title: 'Email Confirmed!',
      description: 'Your email has been successfully confirmed. You can now sign in to your account.',
      icon: 'i-lucide-check-circle',
      color: 'success'
    })
    
    // Clear the query param from URL after showing message
    setTimeout(() => {
      navigateTo('/signin', { replace: true })
    }, 100)
  }
})

const isSignIn = computed(() => mode.value === 'signin')
const isSignUp = computed(() => mode.value === 'signup')

// Define fields based on mode
const fields = computed<AuthFormField[]>(() => {
  const baseFields: AuthFormField[] = []
  
  // Add name fields for sign-up
  if (isSignUp.value) {
    baseFields.push(
      {
        name: 'preferredName',
        type: 'text',
        label: 'Preferred first name',
        placeholder: 'e.g. Alex',
        required: false,
        size: 'md',
        help: "What you'd like to be called — we'll use this throughout the app"
      },
      {
        name: 'firstName',
        type: 'text',
        label: 'Legal first name',
        placeholder: 'e.g. Alexandra',
        required: true,
        size: 'md',
        help: 'Your legal name as it appears on official documents, used for background checks when applying for jobs'
      },
      {
        name: 'lastName',
        type: 'text',
        label: 'Legal last name',
        placeholder: 'e.g. Smith',
        required: true,
        size: 'md',
        help: 'Your legal last name as it appears on official documents'
      }
    )
  }
  
  // Email and password for both modes
  baseFields.push(
    {
      name: 'email',
      type: 'email',
      label: 'Email',
      placeholder: 'name@email.com',
      required: true
    },
    {
      name: 'password',
      type: 'password',
      label: 'Password',
      placeholder: 'Make it strong 💪',
      required: true
    }
  )
  
  return baseFields
})

// Define schema based on mode
const schema = computed(() => {
  if (isSignUp.value) {
    return z.object({
      preferredName: z.string().optional(),
      firstName: z.string().min(1, 'Legal first name is required'),
      lastName: z.string().min(1, 'Legal last name is required'),
      email: z.string().email('Invalid email'),
      password: z.string().min(6, 'Password must be at least 6 characters')
    })
  }
  
  return z.object({
    email: z.string().email('Invalid email'),
    password: z.string().min(6, 'Password must be at least 6 characters')
  })
})

type SignInSchema = z.output<typeof schema.value>

const providers = [{
  label: 'Continue with Google',
  icon: 'i-simple-icons-google',
  color: 'neutral' as const,
  variant: 'outline' as const,
  size: 'lg' as const,
  onClick: handleGoogleSignIn
}]

const toggleMode = () => {
  mode.value = isSignIn.value ? 'signup' : 'signin'
  error.value = null
  successMessage.value = null
  
  // Clear the confirmed query param if present
  if (route.query.confirmed) {
    navigateTo('/signin', { replace: true })
  }
}

async function handleGoogleSignIn() {
  error.value = null
  const config = useRuntimeConfig()
  const { data } = await supabaseClient.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: config.public.appRedirectUrl }
  })
  if (data?.url) window.location.href = data.url
  else error.value = 'Failed to start Google sign-in'
}

async function onSubmit(event: FormSubmitEvent<SignInSchema>) {
  error.value = null
  successMessage.value = null
  loading.value = true

  try {
    if (isSignIn.value) {
      await accountStore.signIn(event.data.email, event.data.password)
      await navigateTo('/')
    } else {
      const response = await accountStore.signUp(
        event.data.email,
        event.data.password,
        (event.data as any).firstName,
        (event.data as any).lastName,
        (event.data as any).preferredName
      )
      // On success, show confirmation message (don't redirect)
      if (response.success) {
        successMessage.value = response.message
      }
    }
  } catch (err: any) {
    console.error('Auth error:', err)
    
    // Extract user-friendly error message from various possible error structures
    let errorMessage = `Failed to ${isSignIn.value ? 'sign in' : 'sign up'}`
    
    if (err?.data?.error?.message) {
      // Structured error from our API
      errorMessage = err.data.error.message
    } else if (err?.data?.message) {
      // Alternative structure
      errorMessage = err.data.message
    } else if (err?.message) {
      // Direct error message
      errorMessage = err.message
    } else if (err?.statusMessage) {
      // HTTP status message
      errorMessage = err.statusMessage
    }
    
    error.value = errorMessage
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center gap-6 p-6 md:p-10 bg-neutral-50 dark:bg-neutral-950">
    <!-- App Logo/Name -->
    <p class="text-xl text-center font-bold text-primary mb-8">
      JobSearchSage
    </p>

    <!-- Auth Form Card -->
    <UCard class="bg-white dark:bg-neutral-900 rounded-2xl shadow-lg max-w-md w-full">
      <UAuthForm
        :key="mode"
        :fields="fields"
        :schema="schema"
        :providers="providers"
        :loading="loading"
        :submit="{
          label: isSignIn ? 'Login' : 'Sign up',
          color: 'primary',
          block: true,
          size: 'lg'
        }"
        :ui="{
          root: 'space-y-4',
          body: 'space-y-4',
          form: 'space-y-4',
          providers: 'mb-4',
        }"
        @submit="onSubmit"
      >
        <!-- Title -->
        <template #title>
          <h1 class="text-2xl text-center font-bold text-gray-900 dark:text-white">
            {{ isSignIn ? 'Welcome back' : 'Hey there 👋' }}
          </h1>
        </template>

        <!-- Description -->
        <template #description>
          <p class="text-gray-600 dark:text-gray-400 text-center">
            {{ isSignIn ? 'Login to get back to your job search!' : 'Sign up to master your job search!' }}
          </p>
        </template>

        <!-- Success message -->
        <template v-if="successMessage" #validation>
          <UAlert
            color="success"
            variant="soft"
            icon="i-lucide-check-circle"
            :title="successMessage"
            :close-button="{ icon: 'i-lucide-x', color: 'gray', variant: 'link', padded: false }"
            @close="successMessage = null"
          />
        </template>

        <!-- Error message -->
        <template v-if="error" #validation>
          <UAlert
            color="error"
            variant="soft"
            icon="i-lucide-alert-circle"
            :title="error"
            :close-button="{ icon: 'i-lucide-x', color: 'gray', variant: 'link', padded: false }"
            @close="error = null"
          />
        </template>

        <!-- Forgot password link (only for sign-in) -->
        <template v-if="isSignIn" #password-hint>
          <ULink to="#" class="text-primary font-medium" tabindex="-1">
            Forgot your password?
          </ULink>
        </template>

        <!-- Footer with mode toggle -->
        <template #footer>
          <div class="text-center">
            <p class="text-gray-600 dark:text-gray-400">
              {{ isSignUp ? 'Already have an account?' : "Don't have an account?" }}
              <UButton
                variant="link"
                :padded="false"
                class="font-medium"
                @click="toggleMode"
              >
                {{ isSignUp ? 'Login' : 'Sign up' }}
              </UButton>
            </p>
          </div>
        </template>
      </UAuthForm>
    </UCard>

    <!-- Legal -->
    <div class="text-center">
      <p class="text-sm text-gray-500 dark:text-gray-400">
        By clicking continue, you agree to our 
        <ULink to="#" class="text-primary font-medium">Terms of Service</ULink> 
        and 
        <ULink to="#" class="text-primary font-medium">Privacy Policy</ULink>.
      </p>
    </div>
  </div>
</template>
