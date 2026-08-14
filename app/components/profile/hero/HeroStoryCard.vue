<script setup lang="ts">
import type { HeroStory } from '#shared/types/careerId'

interface Props {
  story: HeroStory
  pendingSuggestions?: Record<string, Record<string, string>> | null
  isEditingRequested?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  pendingSuggestions: null,
  isEditingRequested: false
})

const emit = defineEmits<{
  delete: [storyId: string]
  save: [payload: Partial<HeroStory>]
  cancel: []
  suggestionsApplied: []
}>()

const isEditing = ref(false)

const isAwaitingWizard = computed(() => isHeroStoryAwaitingWizard(props.story))
const wizardResumeTo = computed(() => `/profile/hero-wizard?storyId=${props.story.id}`)
const filledCount = computed(() => {
  return HERO_WIZARD_DETAIL_FIELDS.filter(field => isHeroFieldFilled(props.story[field])).length
})
const createdOn = computed(() => {
  return new Date(props.story.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

function startEditing() {
  isEditing.value = true
}

function cancelEditing() {
  isEditing.value = false
  emit('cancel')
}

function handleSave(updates: Partial<HeroStory>) {
  emit('save', updates)
  isEditing.value = false
}

function handleDelete() {
  emit('delete', props.story.id)
}

function handleSuggestionsApplied() {
  emit('suggestionsApplied')
}

watch(() => props.pendingSuggestions, (suggestions) => {
  if (suggestions) {
    isEditing.value = true
  }
}, { immediate: true })

watch(() => props.isEditingRequested, (requested) => {
  if (requested) {
    isEditing.value = true
  }
}, { immediate: true })
</script>

<template>
  <!-- Edit Mode -->
  <UPageCard
    v-if="isEditing"
    variant="subtle"
    class="min-w-0 overflow-hidden"
  >
    <div class="space-y-4 min-w-0">
      <h3 class="text-lg font-semibold">
        Edit HERO Story
      </h3>

      <ProfileHeroStoryDetailPanel
        :story="story"
        :pending-suggestions="pendingSuggestions"
        @save="handleSave"
        @cancel="cancelEditing"
        @suggestions-applied="handleSuggestionsApplied"
      />
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
          v-if="isAwaitingWizard"
          label="Continue in wizard"
          color="primary"
          variant="soft"
          size="xs"
          icon="i-lucide-book-open"
          class="cursor-pointer mb-2"
          :to="wizardResumeTo"
        />

        <h3 class="font-semibold mb-1 text-foreground">
          {{ story.title }}
        </h3>
        <p class="text-xs text-muted">
          {{ filledCount }} of 12 details · Created on {{ createdOn }}
        </p>
      </div>

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
