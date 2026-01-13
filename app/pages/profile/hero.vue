<script setup lang="ts">
const route = useRoute()
const router = useRouter()

// Mock hero moments data
const heroMoments = ref([
  {
    id: 1,
    title: 'Led successful product launch',
    raw_notes: 'Coordinated cross-functional team to deliver new feature ahead of schedule.',
    created_at: '2024-01-15',
    status: 'discovered'
  },
  {
    id: 2,
    title: 'Mentored junior developer',
    raw_notes: 'Provided guidance and code reviews for new team member.',
    created_at: '2024-01-10',
    status: 'discovered'
  }
])

// Discovery session state
const currentSessionId = ref('session_123')
const currentProfileId = ref('profile_456')

// Discovery session drawer handling
const isDiscoveryDrawerOpen = computed(() => route.query.discoverySession === 'true')

function openDiscoverySession() {
  router.push({
    query: { ...route.query, discoverySession: 'true' }
  })
}

function closeDiscoverySession() {
  const query = { ...route.query }
  delete query.discoverySession
  router.push({ query })
}

function handleDiscoveryClose() {
  closeDiscoverySession()
}

function handleDiscoveryMomentCaptured(moment: any) {
  // Add newly captured moment to list
  heroMoments.value.unshift({
    id: Date.now(),
    title: moment.title,
    raw_notes: moment.rawNotes,
    created_at: new Date().toISOString().split('T')[0],
    status: 'discovered'
  })
}

function handleDiscoverySessionEnded() {
  closeDiscoverySession()
}
</script>

<template>
  <div class="space-y-4">
    <!-- Page Header -->
    <div class="mb-8 space-y-2">
      <h1 class="text-2xl sm:text-3xl font-semibold">HERO</h1>
      <p class="text-sm text-muted">
        Discover and develop your achievement moments into complete HERO stories.
      </p>
    </div>

    <!-- Start Discovery Button -->
    <div class="mb-4">
      <UButton
        label="Start Discovery Session"
        icon="i-lucide-sparkles"
        color="primary"
        @click="openDiscoverySession"
      />
    </div>

    <!-- Hero Moments List -->
    <div class="space-y-4">
      <h2 class="text-lg font-semibold">Discovered Moments</h2>
      
      <!-- Empty State -->
      <UPageCard v-if="heroMoments.length === 0" variant="subtle">
        <div class="text-center py-12">
          <UIcon name="i-lucide-zap" class="w-16 h-16 text-muted mx-auto mb-4" />
          <h3 class="text-lg font-semibold mb-2">No Moments Yet</h3>
          <p class="text-muted mb-6">Start a discovery session to capture your achievement moments.</p>
          <UButton
            label="Start Discovery"
            color="primary"
            icon="i-lucide-play"
            @click="openDiscoverySession"
          />
        </div>
      </UPageCard>

      <!-- Moments List -->
      <div v-else class="flex flex-col gap-4">
        <div
          v-for="moment in heroMoments"
          :key="moment.id"
          class="border border-default rounded-lg p-4 hover:bg-muted/5 transition-colors"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1">
              <h3 class="font-semibold mb-1">{{ moment.title }}</h3>
              <p class="text-sm text-muted mb-2">{{ moment.raw_notes }}</p>
              <p class="text-xs text-muted">Discovered on {{ new Date(moment.created_at).toLocaleDateString() }}</p>
            </div>
            <div class="flex gap-2">
              <UButton
                label="Develop Story"
                icon="i-lucide-edit"
                color="primary"
                variant="outline"
                size="sm"
              />
              <UButton
                icon="i-lucide-trash-2"
                color="error"
                variant="ghost"
                size="sm"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Discovery Session Drawer -->
  <UDrawer
    v-model:open="isDiscoveryDrawerOpen"
    direction="right"
    inset
    :handle="false"
    :modal="false"
    :dismissible="false"
    @update:open="(open) => { if (!open) closeDiscoverySession() }"
  >
    <!-- Hidden trigger (drawer controlled via query param) -->
    <div class="hidden" />

    <!-- Drawer Content -->
    <template #body>
      <div class="w-xl h-full flex flex-col">
        <ProfileHeroDiscoverySessionChat
          :session-id="currentSessionId"
          :profile-id="currentProfileId"
          @close="handleDiscoveryClose"
          @moment-captured="handleDiscoveryMomentCaptured"
          @session-ended="handleDiscoverySessionEnded"
        />
      </div>
    </template>
  </UDrawer>
</template>
