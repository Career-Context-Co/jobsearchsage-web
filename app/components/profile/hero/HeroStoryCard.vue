<script setup lang="ts">
import type { HeroStory } from '#shared/types/careerId'
import { ref, computed, watch } from 'vue'

interface Props {
  story: HeroStory
  pendingSuggestions?: Record<string, Record<string, string>> | null
  isHighlighted?: boolean
  isEditingRequested?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  pendingSuggestions: null,
  isHighlighted: false,
  isEditingRequested: false
})

const emit = defineEmits<{
  delete: [storyId: string]
  save: [payload: Partial<HeroStory>]
  cancel: []
  openAIHelp: [storyId: string]
  openAIOptions: [storyId: string]
  suggestionsApplied: []
}>()

const isEditing = ref(false)
const isSaving = ref(false)

// Form data for editing
const formData = ref({
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

function startEditing() {
  // Load current story data into form
  formData.value = {
    title: props.story.title || '',
    hurdleProblem: props.story.hurdleProblem || '',
    hurdleScope: props.story.hurdleScope || '',
    hurdleStakes: props.story.hurdleStakes || '',
    expectationRole: props.story.expectationRole || '',
    expectationGoals: props.story.expectationGoals || '',
    expectationConstraints: props.story.expectationConstraints || '',
    responseActions: props.story.responseActions || '',
    responseTools: props.story.responseTools || '',
    responseChallenges: props.story.responseChallenges || '',
    outcomeDeliverable: props.story.outcomeDeliverable || '',
    outcomeMetrics: props.story.outcomeMetrics || '',
    outcomeImpact: props.story.outcomeImpact || ''
  }
  isEditing.value = true
}

function cancelEditing() {
  isEditing.value = false
  emit('cancel')
}

function validateForm(): boolean {
  const errors: Record<string, string> = {}
  if (!formData.value.title.trim()) {
    errors.title = 'Story title is required'
  }
  formErrors.value = errors
  return Object.keys(errors).length === 0
}

function handleSave() {
  if (!validateForm()) return
  
  isSaving.value = true
  try {
    const payload: Partial<HeroStory> = {
      title: formData.value.title.trim(),
      hurdleProblem: formData.value.hurdleProblem.trim() || null,
      hurdleScope: formData.value.hurdleScope.trim() || null,
      hurdleStakes: formData.value.hurdleStakes.trim() || null,
      expectationRole: formData.value.expectationRole.trim() || null,
      expectationGoals: formData.value.expectationGoals.trim() || null,
      expectationConstraints: formData.value.expectationConstraints.trim() || null,
      responseActions: formData.value.responseActions.trim() || null,
      responseTools: formData.value.responseTools.trim() || null,
      responseChallenges: formData.value.responseChallenges.trim() || null,
      outcomeDeliverable: formData.value.outcomeDeliverable.trim() || null,
      outcomeMetrics: formData.value.outcomeMetrics.trim() || null,
      outcomeImpact: formData.value.outcomeImpact.trim() || null
    }
    emit('save', payload)
    isEditing.value = false
  } finally {
    isSaving.value = false
  }
}

function handleDelete() {
  emit('delete', props.story.id)
}

function handleOpenAIHelp() {
  emit('openAIHelp', props.story.id)
}

function handleOpenAIOptions() {
  emit('openAIOptions', props.story.id)
}

const isTitleEmpty = computed(() => !formData.value.title.trim())

// Apply AI suggestions to the form
function applyAISuggestions(suggestions: Record<string, Record<string, string>>) {
  if (suggestions.hurdle) {
    if (suggestions.hurdle.problem) formData.value.hurdleProblem = suggestions.hurdle.problem
    if (suggestions.hurdle.scope) formData.value.hurdleScope = suggestions.hurdle.scope
    if (suggestions.hurdle.stakes) formData.value.hurdleStakes = suggestions.hurdle.stakes
  }
  if (suggestions.expectation) {
    if (suggestions.expectation.role) formData.value.expectationRole = suggestions.expectation.role
    if (suggestions.expectation.goals) formData.value.expectationGoals = suggestions.expectation.goals
    if (suggestions.expectation.constraints) formData.value.expectationConstraints = suggestions.expectation.constraints
  }
  if (suggestions.response) {
    if (suggestions.response.actions) formData.value.responseActions = suggestions.response.actions
    if (suggestions.response.tools) formData.value.responseTools = suggestions.response.tools
    if (suggestions.response.challenges) formData.value.responseChallenges = suggestions.response.challenges
  }
  if (suggestions.outcome) {
    if (suggestions.outcome.deliverable) formData.value.outcomeDeliverable = suggestions.outcome.deliverable
    if (suggestions.outcome.metrics) formData.value.outcomeMetrics = suggestions.outcome.metrics
    if (suggestions.outcome.impact) formData.value.outcomeImpact = suggestions.outcome.impact
  }
}

// Watch for pending suggestions and apply them
watch(() => props.pendingSuggestions, (newSuggestions) => {
  if (newSuggestions) {
    // Ensure we're in edit mode
    if (!isEditing.value) {
      startEditing()
    }
    // Apply the suggestions to the form
    applyAISuggestions(newSuggestions)
    // Notify parent that suggestions have been applied
    emit('suggestionsApplied')
  }
}, { immediate: true })

watch(() => props.isEditingRequested, (requested) => {
  if (requested && !isEditing.value) {
    startEditing()
  }
}, { immediate: true })
</script>

<template>
  <UPageCard v-if="isEditing" variant="subtle">
    <!-- Edit Mode -->
    <div class="space-y-4">
      <!-- Header with AI Help Button -->
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-lg font-semibold">Edit HERO Story</h3>
        <UButton
          label="Get AI Help"
          icon="i-lucide-sparkles"
          color="primary"
          variant="ghost"
          size="sm"
          class="cursor-pointer"
          @click="handleOpenAIOptions"
        />
      </div>
      
      <!-- Title Section -->
      <div>
        <label class="block text-lg font-medium mb-1">Story Title <span class="text-error">*</span></label>
        <UInput
          v-model="formData.title"
          placeholder="e.g. Led platform migration that reduced infrastructure costs by 40%"
          class="w-full"
          :error="!!formErrors.title"
        />
        <p v-if="formErrors.title" class="text-sm text-error mt-1">{{ formErrors.title }}</p>
      </div>

      <!-- HERO Sections - Grouped -->
      <div class="space-y-4">
        <!-- HURDLE Section -->
        <div class="pb-4 border-b border-default">
          <h4 class="text-lg font-semibold mb-2">The Hurdle</h4>
          <div class="space-y-2">
            <div>
              <label class="block text-base font-medium mb-1">[PROBLEM] The Specific Challenge</label>
              <UTextarea
                v-model="formData.hurdleProblem"
                placeholder="What was the specific problem or opportunity you identified?"
                :rows="2"
                autoresize
                class="w-full"
              />
            </div>
            <div>
              <label class="block text-base font-medium mb-1">[SCOPE] Size & Scale</label>
              <UTextarea
                v-model="formData.hurdleScope"
                placeholder="How big was the problem? Who or what was affected?"
                :rows="2"
                autoresize
                class="w-full"
              />
            </div>
            <div>
              <label class="block text-base font-medium mb-1">[STAKES] Why It Mattered</label>
              <UTextarea
                v-model="formData.hurdleStakes"
                placeholder="What was at risk? Why did this matter to the business or team?"
                :rows="2"
                autoresize
                class="w-full"
              />
            </div>
          </div>
        </div>

        <!-- EXPECTATION Section -->
        <div class="pb-4 border-b border-default">
          <h4 class="text-lg font-semibold mb-2">The Expectation</h4>
          <div class="space-y-2">
            <div>
              <label class="block text-base font-medium mb-1">[ROLE] Your Responsibility</label>
              <UTextarea
                v-model="formData.expectationRole"
                placeholder="What was your role or authority in addressing this challenge?"
                :rows="2"
                autoresize
                class="w-full"
              />
            </div>
            <div>
              <label class="block text-base font-medium mb-1">[GOALS] Targets to Achieve</label>
              <UTextarea
                v-model="formData.expectationGoals"
                placeholder="What were you trying to accomplish? What were the goals or targets?"
                :rows="2"
                autoresize
                class="w-full"
              />
            </div>
            <div>
              <label class="block text-base font-medium mb-1">[CONSTRAINTS] Limits & Boundaries</label>
              <UTextarea
                v-model="formData.expectationConstraints"
                placeholder="What constraints did you operate under? (budget, timeline, resources, etc.)"
                :rows="2"
                autoresize
                class="w-full"
              />
            </div>
          </div>
        </div>

        <!-- RESPONSE Section -->
        <div class="pb-4 border-b border-default">
          <h4 class="text-lg font-semibold mb-2">The Response</h4>
          <div class="space-y-2">
            <div>
              <label class="block text-base font-medium mb-1">[ACTIONS] Steps You Took</label>
              <UTextarea
                v-model="formData.responseActions"
                placeholder="What specific actions did you take? Walk through your approach step-by-step."
                :rows="2"
                autoresize
                class="w-full"
              />
            </div>
            <div>
              <label class="block text-base font-medium mb-1">[TOOLS] Technologies & Resources</label>
              <UTextarea
                v-model="formData.responseTools"
                placeholder="What tools, technologies, or systems did you use?"
                :rows="2"
                autoresize
                class="w-full"
              />
            </div>
            <div>
              <label class="block text-base font-medium mb-1">[CHALLENGES] Obstacles Overcome</label>
              <UTextarea
                v-model="formData.responseChallenges"
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
          <h4 class="text-lg font-semibold mb-2">The Outcome</h4>
          <div class="space-y-2">
            <div>
              <label class="block text-base font-medium mb-1">[DELIVERABLE] What Was Delivered</label>
              <UTextarea
                v-model="formData.outcomeDeliverable"
                placeholder="What did you deliver? What was the tangible output?"
                :rows="2"
                autoresize
                class="w-full"
              />
            </div>
            <div>
              <label class="block text-base font-medium mb-1">[METRICS] Measurable Results</label>
              <UTextarea
                v-model="formData.outcomeMetrics"
                placeholder="Use numbers and percentages. E.g., '40% cost reduction', '3x faster', 'served 1M users'"
                :rows="2"
                autoresize
                class="w-full"
              />
            </div>
            <div>
              <label class="block text-base font-medium mb-1">[IMPACT] Qualitative Impact</label>
              <UTextarea
                v-model="formData.outcomeImpact"
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
          @click="cancelEditing"
          :disabled="isSaving"
        />
        <UButton
          label="Update"
          color="primary"
          size="sm"
          icon="i-lucide-check"
          @click="handleSave"
          :loading="isSaving"
          :disabled="isTitleEmpty || isSaving"
        />
      </div>
    </div>
  </UPageCard>

  <!-- View Mode -->
  <UPageCard
    v-else
    variant="subtle"
  >
    <div class="flex items-start justify-between gap-4">
      <div class="flex-1 min-w-0">
        <UButton
          v-if="isHighlighted"
          label="Finish your HERO story"
          color="primary"
          variant="soft"
          size="xs"
          icon="i-lucide-sparkles"
          class="mb-2 cursor-pointer"
          @click.stop="handleOpenAIHelp"
        />

        <!-- Title -->
        <h3 class="font-semibold mb-1 text-foreground">{{ story.title }}</h3>
      
        <!-- Timestamp -->
        <p class="text-xs text-muted">
          Created on {{ new Date(story.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) }}
        </p>
      </div>
      
      <!-- Action Buttons -->
      <div class="flex gap-2 shrink-0">
        <UButton
          icon="i-lucide-pencil"
          color="neutral"
          variant="ghost"
          size="xs"
          class="cursor-pointer"
          @click="startEditing"
        />
        <UButton
          icon="i-lucide-trash-2"
          color="error"
          variant="ghost"
          size="xs"
          class="cursor-pointer"
          @click="handleDelete"
        />
      </div>
    </div>
  </UPageCard>
</template>
