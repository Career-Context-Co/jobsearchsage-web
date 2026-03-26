<script setup lang="ts">
import type { FormSubmitEvent, AuthFormField } from '@nuxt/ui'
import * as Sentry from '@sentry/nuxt'
import * as z from 'zod'

definePageMeta({
  layout: 'fullscreen'
})

const route = useRoute()
const accountStore = useAccountStore()
const globalStore = useGlobalStore()
const supabaseClient = useSupabaseClient()
const toast = useToast()
const posthog = usePostHog()

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

/** Map missing/empty form values so z.string() never sees undefined (avoids Zod's "expected string, received undefined"). */
function formOptionalTrimmedName() {
  return z.preprocess((v: unknown) => {
    if (v === undefined || v === null || v === '') return undefined
    const t = String(v).trim()
    return t === '' ? undefined : t
  }, z.string().max(120, 'Please use a shorter name').optional())
}

function formRequiredTrimmed(messageWhenEmpty: string) {
  return z.preprocess((v: unknown) => {
    if (v === undefined || v === null) return ''
    return String(v).trim()
  }, z.string().min(1, messageWhenEmpty))
}

function formEmail() {
  return z.preprocess((v: unknown) => {
    if (v === undefined || v === null) return ''
    return String(v).trim()
  }, z
    .string()
    .min(1, 'Please enter your email address')
    .email('Please enter a valid email address'))
}

function formPassword() {
  return z.preprocess((v: unknown) => {
    if (v === undefined || v === null) return ''
    return String(v)
  }, z.string().min(6, 'Password must be at least 6 characters'))
}

const signUpAuthSchema = z.object({
  preferredName: formOptionalTrimmedName(),
  firstName: formRequiredTrimmed('Please enter your legal first name'),
  lastName: formRequiredTrimmed('Please enter your legal last name'),
  email: formEmail(),
  password: formPassword()
})

const signInAuthSchema = z.object({
  email: formEmail(),
  password: formPassword()
})

type AuthFormPayload = z.infer<typeof signUpAuthSchema> | z.infer<typeof signInAuthSchema>

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
        help: 'What you\'d like to be called — we\'ll use this throughout the app'
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
const schema = computed(() => (isSignUp.value ? signUpAuthSchema : signInAuthSchema))

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

function submitAuthForm(payload: FormSubmitEvent<Record<string, unknown>>) {
  void onSubmit(payload as FormSubmitEvent<AuthFormPayload>)
}

async function onSubmit(event: FormSubmitEvent<AuthFormPayload>) {
  error.value = null
  successMessage.value = null
  loading.value = true

  const data = event.data

  try {
    if (isSignIn.value) {
      await accountStore.signIn(data.email, data.password)
      // Identify user on successful sign-in
      posthog?.identify(data.email)
      Sentry.setUser({ email: data.email })
      posthog?.capture('user_signed_in', { method: 'email' })
      await navigateTo('/')
    } else {
      const signupData = data as z.infer<typeof signUpAuthSchema>

      if (globalStore.features.signupEmailConfirmation) {
        // Confirmation-required path — user must click the email link before signing in
        const response = await accountStore.signUp(
          signupData.email,
          signupData.password,
          signupData.firstName,
          signupData.lastName,
          signupData.preferredName
        )
        if (response.success) {
          posthog?.capture('user_signed_up', {
            method: 'email',
            has_preferred_name: !!signupData.preferredName
          })
          successMessage.value = response.message
        }
      } else {
        // Immediate path — user is signed in right after account creation
        const response = await accountStore.signUpImmediate(
          signupData.email,
          signupData.password,
          signupData.firstName,
          signupData.lastName,
          signupData.preferredName
        )
        if (response.success) {
          posthog?.identify(signupData.email)
          Sentry.setUser({ email: signupData.email })
          posthog?.capture('user_signed_up', {
            method: 'email',
            has_preferred_name: !!signupData.preferredName
          })
          await navigateTo('/')
        }
      }
    }
  } catch (err: unknown) {
    console.error('Auth error:', err)
    Sentry.captureException(err)

    // Extract user-friendly error message from various possible error structures
    let errorMessage = `Failed to ${isSignIn.value ? 'sign in' : 'sign up'}`

    if (typeof err === 'object' && err !== null) {
      const o = err as Record<string, unknown>
      const data = o.data as Record<string, unknown> | undefined
      const nested = data?.error as Record<string, unknown> | undefined
      if (typeof nested?.message === 'string') {
        errorMessage = nested.message
      } else if (typeof data?.message === 'string') {
        errorMessage = data.message
      } else if (typeof o.message === 'string') {
        errorMessage = o.message
      } else if (typeof o.statusMessage === 'string') {
        errorMessage = o.statusMessage
      }
    }

    error.value = errorMessage
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div
    class="relative isolate flex min-h-screen flex-col items-center justify-center gap-6 overflow-hidden bg-neutral-50 p-6 md:p-10 dark:bg-neutral-950"
  >
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_100%_0%,rgba(87,204,153,0.1)_0%,transparent_70%),radial-gradient(ellipse_70%_55%_at_0%_100%,rgba(43,107,94,0.08)_0%,transparent_65%)] dark:hidden"
    />

    <!-- App Logo/Name -->
    <div class="relative z-10 mb-8 flex items-center justify-center">
      <img
        src="/brand/wordmark.svg"
        class="h-10 w-auto"
        alt="JobSearchSage"
      >
    </div>

    <!-- Auth Form Card -->
    <UCard
      class="relative z-10 w-full max-w-md rounded-2xl border border-neutral-200/80 bg-white shadow-[0_8px_32px_rgba(25,79,79,0.08)] dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
    >
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
          providers: 'mb-4'
        }"
        @submit="submitAuthForm"
      >
        <!-- Title -->
        <template #title>
          <h1 class="text-center text-2xl font-bold text-gray-900 dark:text-white">
            {{ isSignIn ? 'Welcome back' : 'Hey there 👋' }}
          </h1>
        </template>

        <!-- Description -->
        <template #description>
          <p class="text-center text-gray-600 dark:text-gray-400">
            {{ isSignIn ? 'Login to get back to your job search!' : 'Sign up to master your job search!' }}
          </p>
        </template>

        <!-- Success / error (single #validation slot for vue/valid-v-slot) -->
        <template #validation>
          <UAlert
            v-if="successMessage"
            color="success"
            variant="soft"
            icon="i-lucide-check-circle"
            :title="successMessage"
            :close-button="{ icon: 'i-lucide-x', color: 'gray', variant: 'link', padded: false }"
            @close="successMessage = null"
          />
          <UAlert
            v-else-if="error"
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
    <div class="relative z-10 text-center">
      <p class="text-sm text-gray-600 dark:text-gray-400">
        By clicking continue, you agree to our
        <ULink to="#" class="text-primary font-medium">Terms of Service</ULink>
        and
        <ULink to="#" class="text-primary font-medium">Privacy Policy</ULink>.
      </p>
    </div>
  </div>
</template>
