<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { HeroStory } from '#shared/types/careerId'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const careerIDStore = useCareerIDStore()
const sageAIStore = useSageAIStore()

const { heroMoments, isLoading: isMomentsLoading, error: momentsError } = storeToRefs(careerIDStore)
const { discoverySession, isLoading: isDiscoveryLoading, error: discoveryError } = storeToRefs(sageAIStore)

const profileId = computed(() => careerIDStore.profile?.id || careerIDStore.profileId)
const savedDiscoverySessions = new Set<number>()

// Show create form inline
const isShowingCreateForm = ref(false)

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
  outcomeImpact: ''
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
    outcomeImpact: ''
  }
  formErrors.value = {}
}

function startAddingStory() {
  resetCreateForm()
  isShowingCreateForm.value = true
}

function cancelAddingStory() {
  isShowingCreateForm.value = false
  resetCreateForm()
}

function handleSaveNewStory() {
  const errors: Record<string, string> = {}
  
  if (!formDataForCreate.value.title.trim()) {
    errors.title = 'Story title is required'
  }
  
  formErrors.value = errors
  if (Object.keys(errors).length > 0) return

  try {
    // Create new story
    const newStory: HeroStory = {
      id: `story_${Math.random().toString(36).substr(2, 9)}`,
      profileId: profileId.value || 'profile_123',
      displayOrder: heroStories.value.length + 1,
      isDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
      outcomeImpact: formDataForCreate.value.outcomeImpact.trim() || null
    }
    heroStories.value.unshift(newStory)
    toast.add({
      title: 'Success',
      description: `Your HERO story "${formDataForCreate.value.title}" has been created.`,
      icon: 'i-lucide-check',
      color: 'success'
    })
    
    cancelAddingStory()
  } catch (err: any) {
    toast.add({
      title: 'Error',
      description: err?.message || 'Failed to save HERO story',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  }
}

// Mock hero stories for Phase 3A (will be replaced with real data in Phase 3B)
const heroStories = ref<HeroStory[]>([
  {
    id: 'story_001',
    profileId: 'profile_123',
    title: 'Led Platform Migration that Reduced Infrastructure Costs',
    hurdleProblem: 'The existing monolithic platform was difficult to maintain and scaled poorly during peak traffic.',
    hurdleScope: 'Affected 5 internal teams and impacted performance for 100k+ users during peak usage.',
    hurdleStakes: 'Technical debt was limiting our ability to add features quickly and increasing operational costs.',
    expectationRole: 'As the lead architect, I was responsible for designing and executing the migration.',
    expectationGoals: 'Reduce infrastructure costs by 30-40% while maintaining 99.9% uptime.',
    expectationConstraints: 'Limited to 3 months timeline and could not disrupt existing services.',
    responseActions: 'Designed a phased migration approach with comprehensive test coverage.',
    responseTools: 'Kubernetes, Docker, Terraform, PostgreSQL, Redis.',
    responseChallenges: 'Initial data consistency issues during cutover required a custom sync service.',
    outcomeDeliverable: 'Successfully migrated 50+ microservices to new Kubernetes-based infrastructure.',
    outcomeMetrics: '40% cost reduction, 60% faster API response, 99.95% uptime.',
    outcomeImpact: 'Enabled 3 new features generating $2M in revenue. Recognized as Q2 MVP.',
    sourceExperienceId: null,
    displayOrder: 1,
    isDeleted: false,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  }
])

const isDiscoveryDrawerOpen = computed(() => route.query.discoverySession === 'true')

const chatMessages = computed(() => discoverySession.value?.session_data?.conversation_history ?? [])
const capturedMoments = computed(() =>
  (discoverySession.value?.session_data?.captured_moments ?? []).map((moment, index) => ({
    id: `${discoverySession.value?.id ?? 'session'}-${index}`,
    title: moment.title,
    rawNotes: moment.rawNotes
  }))
)

function handleSaveStory(payload: any) {
  // When save is triggered from HeroStoryCard (inline edit)
  // Payload is the updated fields from the card
  const storyId = payload.story?.id
  if (!storyId) return

  const index = heroStories.value.findIndex(s => s.id === storyId)
  if (index !== -1) {
    heroStories.value[index] = {
      ...heroStories.value[index],
      ...payload.updates,
      updatedAt: new Date().toISOString()
    }
  }
  toast.add({
    title: 'Success',
    description: `Your HERO story has been updated.`,
    icon: 'i-lucide-check',
    color: 'success'
  })
}

function handleDeleteStory(story: HeroStory) {
  if (!confirm('Are you sure you want to delete this HERO story?')) {
    return
  }
  
  const index = heroStories.value.findIndex(s => s.id === story.id)
  if (index !== -1) {
    heroStories.value.splice(index, 1)
    toast.add({
      title: 'Success',
      description: 'HERO story deleted successfully.',
      icon: 'i-lucide-check',
      color: 'success'
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

function handleMomentDevelop() {
  // Start a new story
  // In Phase 3B, we'll prefill data from the selected moment
  startAddingStory()
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
        <div>
          <h1 class="text-2xl sm:text-3xl font-semibold mb-2">Your HERO Journey</h1>
          <p class="text-sm text-muted">
            Discover and develop your achievement moments into complete HERO stories.
          </p>
        </div>
    </div>

    <!-- Create/Edit Story Form -->
    <div v-if="isShowingCreateForm" class="mb-6">
      <UPageCard
        title="Create New HERO Story"
        variant="subtle"
      >
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
            <p v-if="formErrors.title" class="text-sm text-error mt-1">{{ formErrors.title }}</p>
          </div>

          <!-- HERO Sections - Grouped -->
          <div class="space-y-3">
            <!-- HURDLE Section -->
            <div class="pb-3 border-b border-default">
              <h4 class="text-xs font-semibold text-foreground mb-2">🎯 The Hurdle</h4>
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
              <h4 class="text-xs font-semibold text-foreground mb-2">📋 The Expectation</h4>
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
              <h4 class="text-xs font-semibold text-foreground mb-2">⚡ The Response</h4>
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
              <h4 class="text-xs font-semibold text-foreground mb-2">🏆 The Outcome</h4>
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
              @click="handleSaveNewStory"
              :disabled="!formDataForCreate.title.trim()"
            />
          </div>
        </div>
      </UPageCard>
    </div>

    <!-- Your HERO Stories Section -->
    <div v-if="!isShowingCreateForm" class="mb-6">
      <ProfileHeroStoriesSection
        :stories="heroStories"
        @create="startAddingStory"
        @delete="handleDeleteStory"
        @save="handleSaveStory"
      />
    </div>

    <!-- Hero Moments List -->
    <div v-if="!isShowingCreateForm" class="mt-8">
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
</template>
