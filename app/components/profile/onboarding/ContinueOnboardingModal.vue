<script setup lang="ts">
import { useCareerIDStore } from '~/stores/careerIDStore'

const careerIDStore = useCareerIDStore()
const accountStore = useAccountStore()

const shouldShow = computed(() =>
  (careerIDStore.profile?.completionStatus === 'incomplete' || accountStore.user?.onboardingStep != null)
  && careerIDStore.isProfileLoaded
)
</script>

<template>
  <UButton
    v-if="shouldShow"
    label="Continue Onboarding"
    color="primary"
    icon="i-lucide-arrow-right"
    trailing
    to="/profile/onboarding"
  />
</template>
