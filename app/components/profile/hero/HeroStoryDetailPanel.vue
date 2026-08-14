<script setup lang="ts">
import type { HeroStory } from '#shared/types/careerId'
import type { HeroWizardDraft } from '@/utils/heroWizardSections'

interface Props {
  story: HeroStory
  pendingSuggestions?: Record<string, Record<string, string>> | null
  isSaving?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  pendingSuggestions: null,
  isSaving: false
})

const emit = defineEmits<{
  save: [payload: Partial<HeroStory>]
  cancel: []
  suggestionsApplied: []
}>()

const careerIDStore = useCareerIDStore()

const formData = ref<HeroWizardDraft>(applyHeroStoryToDraft(props.story))
const formErrors = ref<Record<string, string>>({})

const isTitleEmpty = computed(() => !formData.value.title.trim())

const linkedExperience = computed(() => {
  const experienceId = formData.value.sourceExperienceId
  if (experienceId == null) return null
  return careerIDStore.experience.find(item => item.id === experienceId) ?? null
})

const linkedExperienceLabel = computed(() => {
  if (linkedExperience.value) {
    return `${linkedExperience.value.title} at ${linkedExperience.value.employer}`
  }
  return formData.value.sourceExperienceId == null
    ? 'Standalone story'
    : 'Linked experience unavailable'
})

const linkedExperienceTo = computed(() => {
  if (!linkedExperience.value) return undefined
  return `/profile/experience#experience-${linkedExperience.value.id}`
})

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

  const { sourceExperienceId: _sourceExperienceId, ...updates } = heroWizardFullUpdatePayload(formData.value)
  emit('save', updates)
}

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

watch(() => props.story.id, () => {
  formData.value = applyHeroStoryToDraft(props.story)
  formErrors.value = {}
})

watch(() => props.pendingSuggestions, (newSuggestions) => {
  if (newSuggestions) {
    applyAISuggestions(newSuggestions)
    emit('suggestionsApplied')
  }
}, { immediate: true })
</script>

<template>
  <div class="space-y-4 min-w-0 w-full">
    <div class="space-y-3 min-w-0">
      <UFormField
        label="Story Title"
        required
        class="min-w-0"
        :error="formErrors.title"
      >
        <UTextarea
          v-model="formData.title"
          placeholder="e.g. Led platform migration that reduced infrastructure costs by 40%"
          :rows="2"
          autoresize
          class="w-full min-w-0 max-w-full"
          :ui="{ base: 'w-full min-w-0' }"
          :error="!!formErrors.title"
        />
      </UFormField>

      <div class="flex items-start gap-2 text-sm min-w-0">
        <span class="text-muted shrink-0 pt-0.5">From Experience</span>
        <NuxtLink
          v-if="linkedExperienceTo"
          :to="linkedExperienceTo"
          class="min-w-0 max-w-full"
        >
          <UBadge
            color="primary"
            variant="subtle"
            size="md"
            trailing-icon="i-lucide-arrow-up-right"
            class="max-w-full h-auto whitespace-normal cursor-pointer hover:bg-primary/20"
          >
            <span class="wrap-break-word">{{ linkedExperienceLabel }}</span>
          </UBadge>
        </NuxtLink>
        <UBadge
          v-else
          color="neutral"
          variant="subtle"
          size="md"
          class="max-w-full h-auto whitespace-normal"
        >
          <span class="wrap-break-word">{{ linkedExperienceLabel }}</span>
        </UBadge>
      </div>
    </div>

    <div
      v-for="section in HERO_WIZARD_SECTIONS"
      :key="section.key"
      class="border border-default rounded-lg p-4 min-w-0 overflow-hidden"
    >
      <div class="flex items-center gap-3 mb-4">
        <div class="size-8 shrink-0 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
          {{ section.letter }}
        </div>
        <h4 class="text-base font-semibold">
          {{ section.title }}
        </h4>
        <UPopover
          mode="hover"
          enable-touch
          :open-delay="100"
        >
          <UButton
            icon="i-lucide-info"
            color="neutral"
            variant="ghost"
            size="xs"
            class="cursor-pointer"
            :aria-label="`About ${section.title}`"
          />
          <template #content>
            <div class="p-3 max-w-xs space-y-1.5">
              <p class="text-sm font-semibold">
                {{ section.title }}
              </p>
              <p class="text-sm text-muted italic">
                {{ section.question }}
              </p>
              <p class="text-sm text-muted">
                {{ section.description }}
              </p>
            </div>
          </template>
        </UPopover>
      </div>

      <div class="space-y-4 min-w-0">
        <UFormField
          v-for="field in section.fields"
          :key="field.key"
          class="min-w-0"
          :description="field.prompt"
        >
          <template #label>
            <span class="inline-flex items-center gap-2 min-w-0">
              <UBadge
                :label="field.tag"
                color="primary"
                variant="subtle"
                size="sm"
                class="shrink-0"
              />
              <span>{{ field.label }}</span>
            </span>
          </template>
          <UTextarea
            v-model="formData[field.dbField]"
            placeholder="Write your answer here…"
            :rows="2"
            autoresize
            class="w-full min-w-0 max-w-full"
            :ui="{ base: 'w-full min-w-0' }"
          />
        </UFormField>
      </div>
    </div>

    <div class="flex items-center justify-end gap-2 pt-2">
      <UButton
        label="Cancel"
        color="neutral"
        variant="ghost"
        size="sm"
        class="cursor-pointer"
        :disabled="isSaving"
        @click="emit('cancel')"
      />
      <UButton
        label="Update"
        color="primary"
        size="sm"
        icon="i-lucide-check"
        class="cursor-pointer"
        :loading="isSaving"
        :disabled="isTitleEmpty || isSaving"
        @click="handleSave"
      />
    </div>
  </div>
</template>
