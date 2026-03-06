<script setup lang="ts">
import * as z from 'zod'
import type { FormError } from '@nuxt/ui'

const accountStore = useAccountStore()
const supabase = useSupabaseClient()
const toast = useToast()
const saving = ref(false)

const passwordSchema = z.object({
  current: z.string().min(8, 'Must be at least 8 characters'),
  new: z.string().min(8, 'Must be at least 8 characters')
})

type PasswordSchema = z.output<typeof passwordSchema>

const password = reactive<Partial<PasswordSchema>>({
  current: undefined,
  new: undefined
})

const passwordSaving = ref(false)

function validatePassword(state: Partial<PasswordSchema>): FormError[] {
  const errors: FormError[] = []
  if (state.current && state.new && state.current === state.new) {
    errors.push({ name: 'new', message: 'Passwords must be different' })
  }
  return errors
}

async function onSubmit() {
  saving.value = true
  try {
    await accountStore.updateUser({
      preferredName: accountStore.user?.preferredName ?? '',
      firstName: accountStore.user?.firstName ?? '',
      lastName: accountStore.user?.lastName ?? ''
    })
    toast.add({
      title: 'Profile updated',
      description: 'Your name preferences have been saved.',
      icon: 'i-lucide-check',
      color: 'success'
    })
  } catch {
    toast.add({
      title: 'Failed to save',
      description: 'Something went wrong. Please try again.',
      icon: 'i-lucide-x-circle',
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}

async function onSubmitPassword() {
  if (!password.current || !password.new || !accountStore.user?.email) return
  passwordSaving.value = true
  try {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: accountStore.user.email,
      password: password.current
    })
    if (signInError) {
      toast.add({
        title: 'Incorrect password',
        description: 'Your current password is wrong. Please try again.',
        icon: 'i-lucide-x-circle',
        color: 'error'
      })
      return
    }
    const { error: updateError } = await supabase.auth.updateUser({ password: password.new })
    if (updateError) throw updateError
    password.current = undefined
    password.new = undefined
    toast.add({
      title: 'Password updated',
      description: 'Your password has been changed.',
      icon: 'i-lucide-check',
      color: 'success'
    })
  } catch (err: unknown) {
    toast.add({
      title: 'Failed to update password',
      description: (err instanceof Error ? err.message : null) || 'Please try again.',
      icon: 'i-lucide-x-circle',
      color: 'error'
    })
  } finally {
    passwordSaving.value = false
  }
}
</script>

<template>
  <div>
    <UPageCard
      title="Profile"
      description="Manage how you appear in the app and on job applications."
      variant="naked"
      orientation="horizontal"
      class="mb-4"
    >
      <UButton
        label="Save changes"
        color="neutral"
        :loading="saving"
        class="w-fit lg:ms-auto"
        @click="onSubmit"
      />
    </UPageCard>

    <UPageCard variant="subtle">
      <UFormField
        label="Preferred name"
        description="What we'll call you in the app."
        class="grid grid-cols-1 sm:grid-cols-[3fr_2fr] gap-x-6 gap-y-1 sm:gap-y-0 sm:items-center"
      >
        <UInput
          v-model="accountStore.user!.preferredName"
          autocomplete="nickname"
          placeholder="e.g. Alex"
          class="w-full min-w-0"
        />
      </UFormField>
      <USeparator />
      <UFormField
        label="Legal first name"
        description="Your legal first name as it appears on official documents."
        class="grid grid-cols-1 sm:grid-cols-[3fr_2fr] gap-x-6 gap-y-1 sm:gap-y-0 sm:items-center"
      >
        <UInput
          v-model="accountStore.user!.firstName"
          autocomplete="given-name"
          placeholder="e.g. Alexandra"
          class="w-full min-w-0"
        />
      </UFormField>
      <USeparator />
      <UFormField
        label="Legal last name"
        description="Your legal last name as it appears on official documents."
        class="grid grid-cols-1 sm:grid-cols-[3fr_2fr] gap-x-6 gap-y-1 sm:gap-y-0 sm:items-center"
      >
        <UInput
          v-model="accountStore.user!.lastName"
          autocomplete="family-name"
          placeholder="e.g. Smith"
          class="w-full min-w-0"
        />
      </UFormField>
      <USeparator />
      <UFormField
        label="Email"
        description="Used to sign in and for account communication. Contact support to change your email."
        class="grid grid-cols-1 sm:grid-cols-[3fr_2fr] gap-x-6 gap-y-1 sm:gap-y-0 sm:items-center"
      >
        <UInput
          :model-value="accountStore.user?.email ?? ''"
          type="email"
          disabled
          class="w-full min-w-0 opacity-60"
        />
      </UFormField>
    </UPageCard>

    <UPageCard
      title="Password"
      description="Confirm your current password before setting a new one."
      variant="subtle"
      class="mt-4"
    >
      <UForm
        :schema="passwordSchema"
        :state="password"
        :validate="validatePassword"
        class="flex flex-col gap-4 max-w-xs"
        @submit="onSubmitPassword"
      >
        <UFormField name="current">
          <UInput
            v-model="password.current"
            type="password"
            placeholder="Current password"
            class="w-full"
          />
        </UFormField>
        <UFormField name="new">
          <UInput
            v-model="password.new"
            type="password"
            placeholder="New password"
            class="w-full"
          />
        </UFormField>
        <UButton label="Update password" class="w-fit" type="submit" :loading="passwordSaving" />
      </UForm>
    </UPageCard>
  </div>
</template>
