<script setup lang="ts">
const accountStore = useAccountStore()
const toast = useToast()
const saving = ref(false)

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
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <UInput
          v-model="accountStore.user!.preferredName"
          autocomplete="nickname"
          placeholder="e.g. Alex"
        />
      </UFormField>
      <USeparator />
      <UFormField
        label="Legal first name"
        description="Your legal first name as it appears on official documents, used for background checks when applying for jobs."
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <UInput
          v-model="accountStore.user!.firstName"
          autocomplete="given-name"
          placeholder="e.g. Alexandra"
        />
      </UFormField>
      <USeparator />
      <UFormField
        label="Legal last name"
        description="Your legal last name as it appears on official documents, used for background checks when applying for jobs."
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <UInput
          v-model="accountStore.user!.lastName"
          autocomplete="family-name"
          placeholder="e.g. Smith"
        />
      </UFormField>
      <USeparator />
      <UFormField
        label="Email"
        description="Used to sign in and for account communication. Contact support to change your email."
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <UInput
          :model-value="accountStore.user?.email ?? ''"
          type="email"
          disabled
          class="opacity-60"
        />
      </UFormField>
    </UPageCard>
  </div>
</template>
