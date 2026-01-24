<script setup lang="ts">
import { storeToRefs } from 'pinia'

const route = useRoute()
const router = useRouter()
const careerIDStore = useCareerIDStore()
const sageAIStore = useSageAIStore()

const { heroMoments, isLoading: isMomentsLoading, error: momentsError } = storeToRefs(careerIDStore)
const { discoverySession, isLoading: isDiscoveryLoading, error: discoveryError } = storeToRefs(sageAIStore)

const profileId = computed(() => careerIDStore.profile?.id || careerIDStore.profileId)
const savedDiscoverySessions = new Set<number>()

const isDiscoveryDrawerOpen = computed(() => route.query.discoverySession === 'true')

const chatMessages = computed(() => discoverySession.value?.session_data?.conversation_history ?? [])
const capturedMoments = computed(() =>
  (discoverySession.value?.session_data?.captured_moments ?? []).map((moment, index) => ({
    id: `${discoverySession.value?.id ?? 'session'}-${index}`,
    title: moment.title,
    rawNotes: moment.rawNotes
  }))
)

async function ensureDiscoverySession() {
  if (!profileId.value) return

  if (discoverySession.value && discoverySession.value.session_status === 'active') {
    return
  }

  if (!discoverySession.value) {
    const restored = sageAIStore.restoreSessionFromCache(profileId.value)
    if (restored) {
      return
    }
  }

  await sageAIStore.startDiscoverySession(profileId.value)
}

function openDiscoverySession() {
  router.push({
    query: { ...route.query, discoverySession: 'true' }
  })
  ensureDiscoverySession()
}

function closeDiscoverySession() {
  const query = { ...route.query }
  delete query.discoverySession
  router.push({ query })
}

async function handleSendMessage(payload: { userMessage: string; capturedMoments: Array<{ title: string; rawNotes: string }> }) {
  if (!discoverySession.value?.id) return
  const response = await sageAIStore.continueDiscoverySession(
    discoverySession.value.id,
    payload.userMessage,
    payload.capturedMoments
  )

  if (response?.should_end_session) {
    await finalizeDiscoverySession()
  }
}

async function handleEndSession() {
  if (!discoverySession.value?.id) return
  await finalizeDiscoverySession()
}

const dedupeCapturedMoments = (moments: Array<{ title: string; rawNotes: string }>) => {
  const seen = new Set<string>()
  return moments.filter((moment) => {
    const key = `${moment.title}||${moment.rawNotes}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

async function finalizeDiscoverySession() {
  if (!discoverySession.value?.id || !profileId.value) return

  await sageAIStore.endDiscoverySession(discoverySession.value.id)

  const captured = discoverySession.value?.session_data?.captured_moments ?? []
  const uniqueMoments = dedupeCapturedMoments(captured)
  const sessionId = discoverySession.value.id

  if (savedDiscoverySessions.has(sessionId) || uniqueMoments.length === 0) {
    return
  }

  try {
    await careerIDStore.createMoments(
      profileId.value,
      uniqueMoments.map(moment => ({
        title: moment.title,
        rawNotes: moment.rawNotes,
        discoverySessionId: sessionId
      }))
    )
  } catch (error: any) {
    throw error
  }

  savedDiscoverySessions.add(sessionId)
}

async function handleSaveMoments(payload: { capturedMoments: Array<{ title: string; rawNotes: string }> }) {
  if (!discoverySession.value?.id || !profileId.value) return

  const uniqueMoments = dedupeCapturedMoments(payload.capturedMoments)
  const sessionId = discoverySession.value.id

  await careerIDStore.createMoments(
    profileId.value,
    uniqueMoments.map(moment => ({
      title: moment.title,
      rawNotes: moment.rawNotes,
      discoverySessionId: sessionId
    }))
  )

  savedDiscoverySessions.add(sessionId)
}

function handleDevelopFromSession() {
  // TODO: Navigate to story development with session context
  console.log('Develop captured moment into story')
}

function handleMomentDevelop(moment: any) {
  // TODO: Navigate to story development
  console.log('Develop moment:', moment)
}

async function handleMomentSave(payload: { moment: { id: string | number }; updates: { title: string; rawNotes: string } }) {
  if (!profileId.value) return
  await careerIDStore.updateMoment(profileId.value, payload.moment.id, {
    title: payload.updates.title,
    rawNotes: payload.updates.rawNotes
  })
}

async function handleMomentRemove(moment: any) {
  if (!profileId.value) return
  await careerIDStore.deleteMoment(profileId.value, moment.id)
}

onMounted(async () => {
  if (profileId.value) {
    await careerIDStore.fetchMoments(profileId.value)
  }
})
</script>

<template>
  <div class="space-y-4">
    <!-- Page Header -->
    <div class="mb-8 space-y-2">
      <h1 class="text-2xl sm:text-3xl font-semibold">Your HERO Journey</h1>
      <p class="text-sm text-muted">
        Discover and develop your achievement moments into complete HERO stories.
      </p>
    </div>

    <!-- Hero Moments List -->
    <ProfileHeroDiscoveredMomentsSection
      :moments="heroMoments"
      :is-loading="isMomentsLoading"
      :error="momentsError"
      @develop="handleMomentDevelop"
      @remove="handleMomentRemove"
      @save="handleMomentSave"
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
          :session-id="discoverySession?.id ?? ''"
          :profile-id="profileId"
          :messages="chatMessages"
          :captured-moments="capturedMoments"
          :is-loading="isDiscoveryLoading"
          :error="discoveryError"
          :session-status="discoverySession?.session_status"
          @close="closeDiscoverySession"
          @send-message="handleSendMessage"
          @end-session="handleEndSession"
          @develop-story="handleDevelopFromSession"
          @save-moments="handleSaveMoments"
        />
      </div>
    </template>
  </UDrawer>
</template>
