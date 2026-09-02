<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { HeroStory } from '#shared/types/careerId'

definePageMeta({
  middleware: 'hero-feature'
})

const route = useRoute()
const router = useRouter()
const toast = useToast()
const careerIDStore = useCareerIDStore()
const accountStore = useAccountStore()
const sageAIStore = useSageAIStore()

const {
  // HERO Moment UI is temporarily hidden while the feature is paused.
  // heroMoments,
  heroStories,
  isLoading,
  error
} = storeToRefs(careerIDStore)
const { discoverySession, isLoading: isDiscoveryLoading, error: discoveryError } = storeToRefs(sageAIStore)

const profileId = computed(() => careerIDStore.profile?.id || careerIDStore.profileId || accountStore.profileId)
const savedDiscoverySessions = new Set<number>()
type HeroAssistantMode = 'launcher' | 'story' | 'discovery'

function navigateToWizard(prefill?: { title?: string, sourceExperienceId?: number | null }) {
  const query: Record<string, string> = {}
  if (prefill?.title) {
    query.title = prefill.title
  }
  if (prefill?.sourceExperienceId != null) {
    query.sourceExperienceId = String(prefill.sourceExperienceId)
  }
  return navigateTo({
    path: '/profile/hero-wizard',
    query
  })
}

const isHeroAssistantOpen = ref(false)
const heroAssistantMode = ref<HeroAssistantMode>('launcher')
const currentStoryIdForAI = ref<string | null>(null)
const editingStoryId = ref<string | null>(null)

// Pending AI suggestions for existing stories (edit mode)
const pendingStoryAISuggestions = ref<{
  storyId: string
  suggestions: Record<string, Record<string, string>>
} | null>(null)

const isDiscoveryDrawerOpen = computed(() => route.query.discoverySession === 'true')
const routeSourceExperienceId = computed(() => normalizeSourceExperienceId(route.query.sourceExperienceId))
const routeHeroStoryId = computed(() => {
  return typeof route.query.heroStoryId === 'string' && route.query.heroStoryId.trim()
    ? route.query.heroStoryId.trim()
    : null
})

const heroAssistantTitle = computed(() => {
  if (heroAssistantMode.value === 'story') return 'Get AI Help for Your Story'
  if (heroAssistantMode.value === 'discovery') return 'HERO Discovery Session'
  return 'HERO AI Help'
})

const currentStoryForAI = computed(() => {
  return currentStoryIdForAI.value
    ? heroStories.value.find(story => story.id === currentStoryIdForAI.value) ?? null
    : null
})

const heroAssistantSubtitle = computed(() => {
  if (heroAssistantMode.value === 'story') {
    return `Working on: ${currentStoryForAI.value?.title ?? 'Selected HERO story'}`
  }
  if (heroAssistantMode.value === 'discovery') return 'Talk through your work to find strong story ideas.'
  return 'Choose how you want to work with HERO.'
})

const chatMessages = computed(() => discoverySession.value?.session_data?.conversation_history ?? [])
const isNudgeDiscoverySession = computed(() => {
  return discoverySession.value?.session_type === 'experience_nudge_story'
    || discoverySession.value?.session_data?.mode === 'experience_nudge_story'
})
const capturedMoments = computed(() =>
  isNudgeDiscoverySession.value
    ? []
    : (discoverySession.value?.session_data?.captured_moments ?? []).map((moment, index) => ({
    id: `${discoverySession.value?.id ?? 'session'}-${index}`,
    title: moment.title,
    rawNotes: moment.rawNotes
    }))
)

async function handleSaveStory(payload: { story?: HeroStory, updates?: Partial<HeroStory> }) {
  const storyId = payload.story?.id
  if (!storyId || !profileId.value || !payload.updates) return

  try {
    // Clear any existing errors before attempting update
    careerIDStore.error = null

    await careerIDStore.updateStory(profileId.value, storyId, payload.updates)
    if (editingStoryId.value === storyId) {
      editingStoryId.value = null
    }
    toast.add({
      title: 'Success',
      description: 'Your HERO story has been updated.',
      icon: 'i-lucide-check',
      color: 'success'
    })
  } catch (err: any) {
    // Error is already set in the store, just show a toast
    toast.add({
      title: 'Error',
      description: 'Failed to update HERO story. Please try again.',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  }
}

async function handleDeleteStory(story: HeroStory) {
  if (!confirm('Are you sure you want to delete this HERO story?')) {
    return
  }

  try {
    if (!profileId.value) {
      throw new Error('Profile is required to delete a story')
    }

    // Clear any existing errors before attempting delete
    careerIDStore.error = null

    await careerIDStore.deleteStory(profileId.value, story.id)
    toast.add({
      title: 'Success',
      description: 'HERO story deleted successfully.',
      icon: 'i-lucide-check',
      color: 'success'
    })
  } catch (err: any) {
    // Error is already set in the store, just show a toast
    toast.add({
      title: 'Error',
      description: 'Failed to delete HERO story. Please try again.',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  }
}

async function ensureDiscoverySession() {
  if (!profileId.value) return

  const sourceExperienceId = routeSourceExperienceId.value
  const existingSourceExperienceId = normalizeSourceExperienceId(
    discoverySession.value?.session_data?.user_context?.source_experience_id
  )

  if (
    discoverySession.value
    && discoverySession.value.session_status === 'active'
    && (!sourceExperienceId || existingSourceExperienceId === sourceExperienceId)
  ) {
    return
  }

  if (!discoverySession.value && !sourceExperienceId) {
    const restored = sageAIStore.restoreSessionFromCache(profileId.value)
    if (restored) {
      return
    }
  }

  const sourceExperience = sourceExperienceId
    ? careerIDStore.experience.find(exp => exp.id === sourceExperienceId) ?? null
    : null

  if (sourceExperienceId && existingSourceExperienceId !== sourceExperienceId) {
    sageAIStore.clearSessionCache()
    sageAIStore.discoverySession = null
  }

  await sageAIStore.startDiscoverySession(profileId.value, {
    source_experience: sourceExperience
  })
}

function openDiscoverySession() {
  heroAssistantMode.value = 'discovery'
  isHeroAssistantOpen.value = true
  router.push({
    query: { ...route.query, discoverySession: 'true' }
  })
  ensureDiscoverySession()
}

function backToHeroLauncher() {
  heroAssistantMode.value = 'launcher'
  currentStoryIdForAI.value = null
  clearAssistantRouteQuery()
}

function handleLauncherStorySelect(storyId: string) {
  openAIPanelForStory(storyId)
}

function handleLauncherCreateStory() {
  closeHeroAssistant()
  return navigateToWizard()
}

function handleStoryEditCancel() {
  editingStoryId.value = null
}

function handleLauncherDiscovery() {
  openDiscoverySession()
}

function clearAssistantRouteQuery() {
  const query = { ...route.query }
  delete query.discoverySession
  delete query.heroStoryId
  router.replace({ query })
}

function closeHeroAssistant() {
  isHeroAssistantOpen.value = false
  currentStoryIdForAI.value = null
  clearAssistantRouteQuery()
}

function closeDiscoverySession() {
  closeHeroAssistant()
}

async function handleSendMessage(payload: { userMessage: string, capturedMoments: Array<{ title: string, rawNotes: string }> }) {
  if (!discoverySession.value?.id) return

  if (isNudgeDiscoverySession.value) {
    const response = await sageAIStore.continueNudgeDiscoverySession(
      discoverySession.value.id,
      payload.userMessage
    )

    if (response?.shouldEndSession) {
      await handleEndSession()
    }
    return
  }

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

  if (isNudgeDiscoverySession.value) {
    const result = await sageAIStore.endNudgeDiscoverySession(discoverySession.value.id)
    if (result?.heroStoryId) {
      clearAssistantRouteQuery()
      openAIPanelForStory(result.heroStoryId)
    } else {
      closeHeroAssistant()
    }
    return
  }

  await finalizeDiscoverySession()
  closeHeroAssistant()
}

const dedupeCapturedMoments = (moments: Array<{ title: string, rawNotes: string }>) => {
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

async function handleSaveMoments(payload: { capturedMoments: Array<{ title: string, rawNotes: string }> }) {
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

function normalizeSourceExperienceId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isInteger(parsed)) return parsed
  }
  return null
}

function handleMomentDevelop(moment?: { title?: string, source_experience_id?: string | number | null }) {
  const sourceExperienceId = normalizeSourceExperienceId(moment?.source_experience_id)
  return navigateToWizard({
    title: moment?.title?.trim() || undefined,
    sourceExperienceId
  })
}

function handleMomentDevelopWithAI(moment?: { title?: string, source_experience_id?: string | number | null }) {
  return handleMomentDevelop(moment)
}

function openAIPanelForStory(storyId: string) {
  currentStoryIdForAI.value = storyId
  editingStoryId.value = storyId
  heroAssistantMode.value = 'story'
  isHeroAssistantOpen.value = true
}

function closeAIPanel() {
  closeHeroAssistant()
}

function openRoutedHeroStorySession() {
  if (!routeHeroStoryId.value) return

  openAIPanelForStory(routeHeroStoryId.value)
}

function handleAcceptAISuggestions(suggestions: Record<string, Record<string, string>>) {
  if (currentStoryIdForAI.value) {
    pendingStoryAISuggestions.value = {
      storyId: currentStoryIdForAI.value,
      suggestions
    }
  }

  closeAIPanel()

  toast.add({
    title: 'Success',
    description: 'AI suggestions applied to your story.',
    icon: 'i-lucide-check',
    color: 'success'
  })
}

function clearPendingAISuggestions() {
  pendingStoryAISuggestions.value = null
}

async function handleMomentSave(payload: { moment: { id: string | number }, updates: { title: string, rawNotes: string } }) {
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
  if (!profileId.value) return

  if (!careerIDStore.isProfileLoaded) {
    try {
      await careerIDStore.fetchProfile(profileId.value)
    } catch {
      // Profile fetch failed — moments/stories will still be attempted
    }
  }

  await Promise.allSettled([
    // HERO Moment UI is temporarily hidden while the feature is paused.
    // careerIDStore.fetchMoments(profileId.value),
    careerIDStore.fetchStories(profileId.value)
  ])

  if (isDiscoveryDrawerOpen.value) {
    heroAssistantMode.value = 'discovery'
    isHeroAssistantOpen.value = true
    await ensureDiscoverySession()
  }

  openRoutedHeroStorySession()
})

watch(isDiscoveryDrawerOpen, (open) => {
  if (open) {
    heroAssistantMode.value = 'discovery'
    isHeroAssistantOpen.value = true
    ensureDiscoverySession()
  }
})

watch(routeHeroStoryId, () => {
  openRoutedHeroStorySession()
})
</script>

<template>
  <div class="space-y-4">
    <!-- Page Header -->
    <div class="mb-8 space-y-2">
      <div>
        <h1 class="text-2xl sm:text-3xl font-semibold mb-2">
          Your HERO Journey
        </h1>
        <p class="text-sm text-muted">
          Discover and develop your achievement moments into complete HERO stories.
        </p>
      </div>
    </div>

    <!-- Your HERO Stories Section -->
    <div class="mb-6">
      <ProfileHeroStoriesSection
        :stories="heroStories"
        :is-loading="isLoading"
        :pending-suggestions="pendingStoryAISuggestions"
        :editing-story-id="editingStoryId"
        @create="navigateToWizard"
        @delete="handleDeleteStory"
        @save="handleSaveStory"
        @cancel="handleStoryEditCancel"
        @clear-pending-suggestions="clearPendingAISuggestions"
      />
    </div>

    <!--
      HERO Moment UI is temporarily hidden while the feature is paused.
      <div class="mt-8">
        <ProfileHeroDiscoveredMomentsSection
          :moments="heroMoments"
          :is-loading="isLoading"
          @develop="handleMomentDevelop"
          @develop-with-a-i="handleMomentDevelopWithAI"
          @remove="handleMomentRemove"
          @save="handleMomentSave"
          @start-session="openDiscoverySession"
        />
      </div>
    -->
  </div>

  <!-- HERO Assistant Panel -->
  <USlideover
    v-model:open="isHeroAssistantOpen"
    side="right"
    :overlay="false"
    :modal="false"
    :inset="true"
    :dismissible="true"
    :ui="{ content: 'max-w-2xl w-full' }"
    @update:open="(open) => { if (!open) closeHeroAssistant() }"
  >
    <template #header="{ close }">
      <div class="w-full flex items-start justify-between gap-4">
        <div class="flex items-start gap-3 flex-1">
          <UButton
            v-if="heroAssistantMode !== 'launcher'"
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            size="sm"
            class="cursor-pointer mt-0.5"
            @click="backToHeroLauncher"
          />
          <div class="flex-1">
            <h2 class="text-lg font-semibold">
              {{ heroAssistantTitle }}
            </h2>
            <p class="text-sm text-muted mt-1">
              {{ heroAssistantSubtitle }}
            </p>
          </div>
        </div>
        <UButton
          icon="i-lucide-x"
          color="neutral"
          variant="ghost"
          size="md"
          class="cursor-pointer"
          @click="close"
        />
      </div>
    </template>
    <template #body>
      <div v-if="heroAssistantMode === 'launcher'" class="h-full p-4">
        <ProfileHeroSessionLauncher
          :stories="heroStories"
          @select-story="handleLauncherStorySelect"
          @create-story="handleLauncherCreateStory"
          @start-discovery="handleLauncherDiscovery"
          @close="closeHeroAssistant"
        />
      </div>
      <div v-else-if="heroAssistantMode === 'discovery'" class="h-full flex flex-col">
        <ProfileHeroDiscoverySessionChat
          :session-id="discoverySession?.id ?? ''"
          :profile-id="profileId"
          :mode="isNudgeDiscoverySession ? 'experience_nudge_story' : 'moment_discovery'"
          :messages="chatMessages"
          :captured-moments="capturedMoments"
          :is-loading="isDiscoveryLoading"
          :error="discoveryError"
          :session-status="discoverySession?.session_status"
          @close="closeDiscoverySession"
          @send-message="handleSendMessage"
          @end-session="handleEndSession"
          @develop-story="handleMomentDevelop"
          @save-moments="handleSaveMoments"
        />
      </div>
      <div v-else class="h-full">
        <div
          v-if="currentStoryForAI"
          class="mb-3 rounded-lg border border-default bg-default/40 p-3"
        >
          <p class="text-xs font-medium text-muted uppercase tracking-wide mb-1">
            Working On
          </p>
          <p class="text-sm font-semibold text-foreground">
            {{ currentStoryForAI.title }}
          </p>
        </div>
        <ProfileHeroSessionPane
          v-if="currentStoryIdForAI && profileId"
          :story-id="currentStoryIdForAI"
          :profile-id="profileId"
          @close="closeAIPanel"
          @accept="handleAcceptAISuggestions"
        />
      </div>
    </template>
    <template #footer>
      <div class="flex items-center justify-end w-full">
        <UButton
          label="Close"
          color="neutral"
          variant="ghost"
          class="cursor-pointer"
          @click="closeHeroAssistant"
        />
      </div>
    </template>
  </USlideover>
</template>
