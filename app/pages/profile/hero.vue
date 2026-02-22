<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { HeroStory } from '#shared/types/careerId'

definePageMeta({
  middleware: ['hero-feature']
})

const route = useRoute()
const router = useRouter()
const toast = useToast()
const careerIDStore = useCareerIDStore()
const accountStore = useAccountStore()
const sageAIStore = useSageAIStore()

const {
  heroMoments,
  heroStories,
  isLoading,
  isSaving,
  error
} = storeToRefs(careerIDStore)
const { discoverySession, isLoading: isDiscoveryLoading, error: discoveryError } = storeToRefs(sageAIStore)

const profileId = computed(() => careerIDStore.profile?.id || careerIDStore.profileId || accountStore.profileId)
const savedDiscoverySessions = new Set<number>()

// Show create form inline
const isShowingCreateForm = ref(false)

// AI Panel state
const isAIPanelOpen = ref(false)
const currentStoryIdForAI = ref<string | null>(null)

// Pending AI suggestions for existing stories (edit mode)
const pendingStoryAISuggestions = ref<{
  storyId: string
  suggestions: Record<string, Record<string, string>>
} | null>(null)

// Inline form state for creating new story only
const formDataForCreate = ref({
  title: '',
  hurdleProblem: '',
  hurdleScope: '',
  hurdleStakes: '',
  expectationRole: '',
  expectationGoals: '',
  expectationConstraints: '',
  responseActions: '',
  responseTools: '',
  responseChallenges: '',
  outcomeDeliverable: '',
  outcomeMetrics: '',
  outcomeImpact: '',
  sourceExperienceId: null as number | null
})

const formErrors = ref<Record<string, string>>({})

function resetCreateForm() {
  formDataForCreate.value = {
    title: '',
    hurdleProblem: '',
    hurdleScope: '',
    hurdleStakes: '',
    expectationRole: '',
    expectationGoals: '',
    expectationConstraints: '',
    responseActions: '',
    responseTools: '',
    responseChallenges: '',
    outcomeDeliverable: '',
    outcomeMetrics: '',
    outcomeImpact: '',
    sourceExperienceId: null
  }
  formErrors.value = {}
}

function startAddingStory(prefill?: { title?: string, sourceExperienceId?: number | null }) {
  resetCreateForm()
  if (prefill?.title) {
    formDataForCreate.value.title = prefill.title
  }
  if (prefill?.sourceExperienceId !== undefined) {
    formDataForCreate.value.sourceExperienceId = prefill.sourceExperienceId
  }
  isShowingCreateForm.value = true
}

function cancelAddingStory() {
  isShowingCreateForm.value = false
  resetCreateForm()
}

async function handleSaveNewStory() {
  const errors: Record<string, string> = {}

  if (!formDataForCreate.value.title.trim()) {
    errors.title = 'Story title is required'
  }

  formErrors.value = errors
  if (Object.keys(errors).length > 0) return

  try {
    if (!profileId.value) {
      throw new Error('Profile is required to create a story')
    }

    // Clear any existing errors before attempting create
    careerIDStore.error = null

    const created = await careerIDStore.createStory(profileId.value, {
      title: formDataForCreate.value.title.trim(),
      hurdleProblem: formDataForCreate.value.hurdleProblem.trim() || null,
      hurdleScope: formDataForCreate.value.hurdleScope.trim() || null,
      hurdleStakes: formDataForCreate.value.hurdleStakes.trim() || null,
      expectationRole: formDataForCreate.value.expectationRole.trim() || null,
      expectationGoals: formDataForCreate.value.expectationGoals.trim() || null,
      expectationConstraints: formDataForCreate.value.expectationConstraints.trim() || null,
      responseActions: formDataForCreate.value.responseActions.trim() || null,
      responseTools: formDataForCreate.value.responseTools.trim() || null,
      responseChallenges: formDataForCreate.value.responseChallenges.trim() || null,
      outcomeDeliverable: formDataForCreate.value.outcomeDeliverable.trim() || null,
      outcomeMetrics: formDataForCreate.value.outcomeMetrics.trim() || null,
      outcomeImpact: formDataForCreate.value.outcomeImpact.trim() || null,
      sourceExperienceId: formDataForCreate.value.sourceExperienceId ?? undefined,
      displayOrder: heroStories.value.length + 1
    })
    toast.add({
      title: 'Success',
      description: `Your HERO story "${created.title}" has been created.`,
      icon: 'i-lucide-check',
      color: 'success'
    })

    cancelAddingStory()
  } catch (err: any) {
    // Error is already set in the store, just show a toast
    toast.add({
      title: 'Error',
      description: 'Failed to save HERO story. Please try again.',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  }
}

const isDiscoveryDrawerOpen = computed(() => route.query.discoverySession === 'true')

const chatMessages = computed(() => discoverySession.value?.session_data?.conversation_history ?? [])
const capturedMoments = computed(() =>
  (discoverySession.value?.session_data?.captured_moments ?? []).map((moment, index) => ({
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

async function handleSendMessage(payload: { userMessage: string, capturedMoments: Array<{ title: string, rawNotes: string }> }) {
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
  startAddingStory({
    title: moment?.title?.trim() || undefined,
    sourceExperienceId
  })
}

function handleMomentDevelopWithAI(moment?: { title?: string, source_experience_id?: string | number | null }) {
  // Pre-fill create form with moment data
  const sourceExperienceId = normalizeSourceExperienceId(moment?.source_experience_id)

  if (moment?.title) {
    formDataForCreate.value.title = moment.title.trim()
  }
  if (sourceExperienceId !== null) {
    formDataForCreate.value.sourceExperienceId = sourceExperienceId
  }

  currentStoryIdForAI.value = 'create'
  isAIPanelOpen.value = true
}

// AI Panel functions
function openAIPanel() {
  // Use a temporary ID for create form
  currentStoryIdForAI.value = 'create'
  isAIPanelOpen.value = true
}

function openAIPanelForStory(storyId: string) {
  currentStoryIdForAI.value = storyId
  isAIPanelOpen.value = true
}

function closeAIPanel() {
  isAIPanelOpen.value = false
  currentStoryIdForAI.value = null
}

function applyAISuggestionsToCreateForm(suggestions: Record<string, Record<string, string>>) {
  if (suggestions.hurdle) {
    formDataForCreate.value.hurdleProblem = suggestions.hurdle.problem || formDataForCreate.value.hurdleProblem
    formDataForCreate.value.hurdleScope = suggestions.hurdle.scope || formDataForCreate.value.hurdleScope
    formDataForCreate.value.hurdleStakes = suggestions.hurdle.stakes || formDataForCreate.value.hurdleStakes
  }
  if (suggestions.expectation) {
    formDataForCreate.value.expectationRole = suggestions.expectation.role || formDataForCreate.value.expectationRole
    formDataForCreate.value.expectationGoals = suggestions.expectation.goals || formDataForCreate.value.expectationGoals
    formDataForCreate.value.expectationConstraints = suggestions.expectation.constraints || formDataForCreate.value.expectationConstraints
  }
  if (suggestions.response) {
    formDataForCreate.value.responseActions = suggestions.response.actions || formDataForCreate.value.responseActions
    formDataForCreate.value.responseTools = suggestions.response.tools || formDataForCreate.value.responseTools
    formDataForCreate.value.responseChallenges = suggestions.response.challenges || formDataForCreate.value.responseChallenges
  }
  if (suggestions.outcome) {
    formDataForCreate.value.outcomeDeliverable = suggestions.outcome.deliverable || formDataForCreate.value.outcomeDeliverable
    formDataForCreate.value.outcomeMetrics = suggestions.outcome.metrics || formDataForCreate.value.outcomeMetrics
    formDataForCreate.value.outcomeImpact = suggestions.outcome.impact || formDataForCreate.value.outcomeImpact
  }
}

function handleAcceptAISuggestions(suggestions: Record<string, Record<string, string>>) {
  if (currentStoryIdForAI.value === 'create') {
    // CREATE mode: Apply suggestions directly to create form
    applyAISuggestionsToCreateForm(suggestions)
  } else if (currentStoryIdForAI.value) {
    // EDIT mode: Store pending suggestions for the HeroStoryCard to consume
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

// Check if form has any data (for AI button disabled state)
const hasFormData = computed(() => {
  return !!(
    formDataForCreate.value.hurdleProblem
    || formDataForCreate.value.hurdleScope
    || formDataForCreate.value.hurdleStakes
    || formDataForCreate.value.expectationRole
    || formDataForCreate.value.expectationGoals
    || formDataForCreate.value.expectationConstraints
    || formDataForCreate.value.responseActions
    || formDataForCreate.value.responseTools
    || formDataForCreate.value.responseChallenges
    || formDataForCreate.value.outcomeDeliverable
    || formDataForCreate.value.outcomeMetrics
    || formDataForCreate.value.outcomeImpact
  )
})

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
    careerIDStore.fetchMoments(profileId.value),
    careerIDStore.fetchStories(profileId.value)
  ])
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

    <!-- Create/Edit Story Form -->
    <div v-if="isShowingCreateForm" class="mb-6">
      <UPageCard variant="subtle">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">
              Create New HERO Story
            </h3>
            <UButton
              label="Get AI Help"
              icon="i-lucide-sparkles"
              color="primary"
              variant="ghost"
              size="sm"
              class="cursor-pointer"
              :disabled="!hasFormData"
              @click="openAIPanel"
            />
          </div>
        </template>

        <div class="space-y-4">
          <!-- Title Section -->
          <div>
            <label class="block text-sm font-medium mb-1">Story Title <span class="text-error">*</span></label>
            <UInput
              v-model="formDataForCreate.title"
              placeholder="e.g. Led platform migration that reduced infrastructure costs by 40%"
              class="w-full"
              :error="!!formErrors.title"
            />
            <p v-if="formErrors.title" class="text-sm text-error mt-1">
              {{ formErrors.title }}
            </p>
          </div>

          <!-- HERO Sections - Grouped -->
          <div class="space-y-3">
            <!-- HURDLE Section -->
            <div class="pb-3 border-b border-default">
              <h4 class="text-xs font-semibold text-foreground mb-2">
                🎯 The Hurdle
              </h4>
              <div class="space-y-2">
                <div>
                  <label class="block text-xs font-medium text-muted mb-1">[PROBLEM] The Specific Challenge</label>
                  <UTextarea
                    v-model="formDataForCreate.hurdleProblem"
                    placeholder="What was the specific problem or opportunity you identified?"
                    :rows="2"
                    autoresize
                    class="w-full"
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium text-muted mb-1">[SCOPE] Size & Scale</label>
                  <UTextarea
                    v-model="formDataForCreate.hurdleScope"
                    placeholder="How big was the problem? Who or what was affected?"
                    :rows="2"
                    autoresize
                    class="w-full"
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium text-muted mb-1">[STAKES] Why It Mattered</label>
                  <UTextarea
                    v-model="formDataForCreate.hurdleStakes"
                    placeholder="What was at risk? Why did this matter to the business or team?"
                    :rows="2"
                    autoresize
                    class="w-full"
                  />
                </div>
              </div>
            </div>

            <!-- EXPECTATION Section -->
            <div class="pb-3 border-b border-default">
              <h4 class="text-xs font-semibold text-foreground mb-2">
                📋 The Expectation
              </h4>
              <div class="space-y-2">
                <div>
                  <label class="block text-xs font-medium text-muted mb-1">[ROLE] Your Responsibility</label>
                  <UTextarea
                    v-model="formDataForCreate.expectationRole"
                    placeholder="What was your role or authority in addressing this challenge?"
                    :rows="2"
                    autoresize
                    class="w-full"
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium text-muted mb-1">[GOALS] Targets to Achieve</label>
                  <UTextarea
                    v-model="formDataForCreate.expectationGoals"
                    placeholder="What were you trying to accomplish? What were the goals or targets?"
                    :rows="2"
                    autoresize
                    class="w-full"
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium text-muted mb-1">[CONSTRAINTS] Limits & Boundaries</label>
                  <UTextarea
                    v-model="formDataForCreate.expectationConstraints"
                    placeholder="What constraints did you operate under? (budget, timeline, resources, etc.)"
                    :rows="2"
                    autoresize
                    class="w-full"
                  />
                </div>
              </div>
            </div>

            <!-- RESPONSE Section -->
            <div class="pb-3 border-b border-default">
              <h4 class="text-xs font-semibold text-foreground mb-2">
                ⚡ The Response
              </h4>
              <div class="space-y-2">
                <div>
                  <label class="block text-xs font-medium text-muted mb-1">[ACTIONS] Steps You Took</label>
                  <UTextarea
                    v-model="formDataForCreate.responseActions"
                    placeholder="What specific actions did you take? Walk through your approach step-by-step."
                    :rows="2"
                    autoresize
                    class="w-full"
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium text-muted mb-1">[TOOLS] Technologies & Resources</label>
                  <UTextarea
                    v-model="formDataForCreate.responseTools"
                    placeholder="What tools, technologies, or systems did you use?"
                    :rows="2"
                    autoresize
                    class="w-full"
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium text-muted mb-1">[CHALLENGES] Obstacles Overcome</label>
                  <UTextarea
                    v-model="formDataForCreate.responseChallenges"
                    placeholder="What obstacles did you encounter and how did you overcome them?"
                    :rows="2"
                    autoresize
                    class="w-full"
                  />
                </div>
              </div>
            </div>

            <!-- OUTCOME Section -->
            <div>
              <h4 class="text-xs font-semibold text-foreground mb-2">
                🏆 The Outcome
              </h4>
              <div class="space-y-2">
                <div>
                  <label class="block text-xs font-medium text-muted mb-1">[DELIVERABLE] What Was Delivered</label>
                  <UTextarea
                    v-model="formDataForCreate.outcomeDeliverable"
                    placeholder="What did you deliver? What was the tangible output?"
                    :rows="2"
                    autoresize
                    class="w-full"
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium text-muted mb-1">[METRICS] Measurable Results</label>
                  <UTextarea
                    v-model="formDataForCreate.outcomeMetrics"
                    placeholder="Use numbers and percentages. E.g., '40% cost reduction', '3x faster', 'served 1M users'"
                    :rows="2"
                    autoresize
                    class="w-full"
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium text-muted mb-1">[IMPACT] Qualitative Impact</label>
                  <UTextarea
                    v-model="formDataForCreate.outcomeImpact"
                    placeholder="How did this impact the business, team, or users? What recognition did you receive?"
                    :rows="2"
                    autoresize
                    class="w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center justify-end gap-2 pt-2">
            <UButton
              label="Cancel"
              color="neutral"
              variant="ghost"
              size="sm"
              @click="cancelAddingStory"
            />
            <UButton
              label="Save"
              color="primary"
              size="sm"
              icon="i-lucide-check"
              :loading="isSaving"
              :disabled="!formDataForCreate.title.trim() || isSaving"
              @click="handleSaveNewStory"
            />
          </div>
        </div>
      </UPageCard>
    </div>

    <!-- Your HERO Stories Section -->
    <div v-if="!isShowingCreateForm" class="mb-6">
      <ProfileHeroStoriesSection
        :stories="heroStories"
        :is-loading="isLoading"
        :pending-suggestions="pendingStoryAISuggestions"
        @create="startAddingStory"
        @delete="handleDeleteStory"
        @save="handleSaveStory"
        @open-a-i-help="openAIPanelForStory"
        @clear-pending-suggestions="clearPendingAISuggestions"
      />
    </div>

    <!-- Hero Moments List -->
    <div v-if="!isShowingCreateForm" class="mt-8">
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
          @develop-story="handleMomentDevelop"
          @save-moments="handleSaveMoments"
        />
      </div>
    </template>
  </UDrawer>

  <!-- AI Help Panel Slideover -->
  <USlideover
    v-model:open="isAIPanelOpen"
    side="right"
    :overlay="false"
    :dismissible="true"
    :modal="false"
    :inset="true"
    :ui="{ content: 'max-w-2xl w-full' }"
    @update:open="(open) => { if (!open) closeAIPanel() }"
  >
    <template #header="{ close }">
      <div class="w-full flex items-start justify-between gap-4">
        <div class="flex-1">
          <h2 class="text-lg font-semibold">
            Get AI Help for Your Story
          </h2>
          <p class="text-sm text-muted mt-1">
            AI-guided story enhancement
          </p>
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
      <div class="h-full">
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
          @click="closeAIPanel"
        />
      </div>
    </template>
  </USlideover>
</template>
