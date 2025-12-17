<script setup lang="ts">
const open = ref(false)
const router = useRouter()

function confirmRedo() {
  open.value = false
  router.push('/profile/onboarding')
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Redo Onboarding?"
    description="Your existing profile data will be overwritten"
  >
    <UButton
      label="Redo Onboarding"
      color="primary"
      icon="i-lucide-arrow-right"
      trailing
    />

    <template #body>
      <div class="space-y-4">
        <UAlert
          color="warning"
          icon="i-lucide-alert-triangle"
          title="Your existing profile data will be overwritten"
          description="Redoing onboarding will allow you to upload a new resume. Any newly extracted information will overwrite your current profile data."
        />

        <p class="text-sm text-muted">
          Are you sure you want to continue?
        </p>

        <div class="flex gap-2 justify-end pt-4">
          <UButton
            label="Cancel"
            color="neutral"
            variant="ghost"
            @click="open = false"
          />
          <UButton
            label="Continue"
            color="primary"
            icon="i-lucide-arrow-right"
            trailing
            @click="confirmRedo"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
