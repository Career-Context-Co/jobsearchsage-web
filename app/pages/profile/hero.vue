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

function handleMomentDevelop(moment: any) {
  // TODO: Navigate to story development
  console.log('Develop moment:', moment)
}

function handleMomentRemove(moment: any) {
  // Remove moment from list
  heroMoments.value = heroMoments.value.filter(m => m.id !== moment.id)
}

// Collapsible moments section
const isMomentsExpanded = ref(true)

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

    <!-- Hero Moments List -->
    <ProfileHeroDiscoveredMomentsSection
      :moments="heroMoments"
      @develop="handleMomentDevelop"
      @remove="handleMomentRemove"
      @start-session="openDiscoverySession"
    />
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
