<script setup lang="ts">
const accountStore = useAccountStore()

const heroEnabled = computed({
  get: () => accountStore.isHeroEnabled,
  set: (value: boolean) => accountStore.setHeroEnabled(value)
})
</script>

<template>
  <UPageCard
    title="Insiders Program"
    description="Get early access to new features and help shape the future of JobSearchSage. Your feedback directly influences what we build next."
    variant="naked"
    orientation="vertical"
    class="mb-4"
  />

  <UPageCard variant="subtle">
    <div class="flex max-sm:flex-col justify-between items-start gap-4">
      <div class="flex-1 min-w-0">
        <div class="font-medium text-highlighted">HERO Framework</div>
        <p class="text-sm text-muted mt-1">
          Enable the HERO story framework to capture and develop your career achievements using the Hurdle, Expectation, Response, Outcome methodology. Perfect for preparing compelling interview stories.
        </p>
      </div>
      <USwitch
        v-model="heroEnabled"
        size="lg"      
      />
    </div>
  </UPageCard>
</template>
