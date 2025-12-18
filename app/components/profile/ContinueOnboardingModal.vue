<script setup lang="ts">
import { useCareerIDStore } from '~/stores/careerIDStore'

const open = ref(false)
const router = useRouter()
const careerIDStore = useCareerIDStore()

// Only show this modal if user has incomplete status (took a break or still onboarding)
const shouldShow = computed(() => 
  careerIDStore.profile?.completionStatus === 'incomplete' && careerIDStore.isProfileLoaded
)

function confirmContinue() {
  open.value = false
  router.push('/profile/onboarding')
}
</script>

<template>
  <UModal
    v-if="shouldShow"
    v-model:open="open"
    title="Continue Onboarding?"
    description="Pick up where you left off"
  >
    <UButton
      label="Continue Onboarding"
      color="primary"
      icon="i-lucide-arrow-right"
      trailing
    />

    <template #body>
      <div class="space-y-4">
        <UAlert
          color="primary"
          icon="i-lucide-coffee"
          title="Welcome back!"
          description="You took a break during onboarding. Your saved progress is preserved and ready for you to continue."
        />

        <p class="text-sm text-muted">
          Ready to complete your profile?
        </p>

        <div class="flex gap-2 justify-end pt-4">
          <UButton
            label="Not Now"
            color="neutral"
            variant="ghost"
            @click="open = false"
          />
          <UButton
            label="Continue"
            color="primary"
            icon="i-lucide-arrow-right"
            trailing
            @click="confirmContinue"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
