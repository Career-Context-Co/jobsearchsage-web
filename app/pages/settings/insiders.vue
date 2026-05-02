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
      <p class="text-sm text-muted">
        No insider-only features are available right now. HERO and AI bullet enhancement are now available to everyone.
      </p>
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
      <p class="text-sm text-muted">
        New experimental features will appear here when they are ready for early access.
      </p>
    </UPageCard>
  </div>
</template>
