<script setup lang="ts">
const accountStore = useAccountStore()

const heroEnabled = computed({
  get: () => accountStore.isHeroEnabled,
  set: (value: boolean) => accountStore.setHeroEnabled(value)
})

const bulletEnhancementEnabled = computed({
  get: () => accountStore.isBulletEnhancementEnabled,
  set: (value: boolean) => accountStore.setBulletEnhancementEnabled(value)
})

// Coming soon features (not yet functional)
const resumeGenerationEnabled = ref(false)
</script>

<template>
  <UPageCard
    title="Insiders Program"
    description="Get early access to new features and help shape the future of JobSearchSage. Your feedback directly influences what we build next."
    variant="naked"
    orientation="vertical"
    class="mb-4"
  />

  <!-- Available Section -->
  <div class="mb-6">
    <UPageCard
      title="Available"
      description="These features are ready to use. Toggle them on to enable them in your account. You can turn them off at any time."
      variant="naked"
      class="mb-4"
    />

    <UPageCard variant="subtle" :ui="{ container: 'divide-y divide-default' }">
      <p class="text-sm text-muted">No features available yet. Stay tuned for updates! 😄👍</p>
    </UPageCard>
  </div>

  <!-- Coming Soon Section -->
  <div>
    <UPageCard
      title="Coming Soon"
      description="These features are in development and will be available soon. Check back later to try them out."
      variant="naked"
      class="mb-4"
    />

    <UPageCard variant="subtle" :ui="{ container: 'divide-y divide-default' }">
      <UFormField
        name="bulletEnhancement"
        label="AI Bullet Enhancement"
        description="Use AI to enhance your resume bullet points with more impactful, metrics-driven language that highlights your achievements."
        class="flex items-center justify-between not-last:pb-4 gap-2"
      >
        <USwitch v-model="bulletEnhancementEnabled" disabled/>
      </UFormField>

      <UFormField
        name="hero"
        label="HERO Framework"
        description="Enable the HERO story framework to capture and develop your career achievements using the Hurdle, Expectation, Response, Outcome methodology. Perfect for preparing compelling interview stories."
        class="flex items-center justify-between not-last:pb-4 gap-2 opacity-60"
      >
        <USwitch v-model="heroEnabled" disabled />
      </UFormField>

    </UPageCard>
  </div>
</template>
