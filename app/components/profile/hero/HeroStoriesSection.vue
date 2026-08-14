<script setup lang="ts">
import type { HeroStory } from '#shared/types/careerId'

interface PendingSuggestions {
  storyId: string
  suggestions: Record<string, Record<string, string>>
}

interface Props {
  stories: HeroStory[]
  isLoading?: boolean
  pendingSuggestions?: PendingSuggestions | null
  editingStoryId?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  pendingSuggestions: null,
  editingStoryId: null
})

const emit = defineEmits<{
  create: []
  delete: [story: HeroStory]
  save: [payload: { story: HeroStory, updates: Partial<HeroStory> }]
  cancel: []
  clearPendingSuggestions: []
}>()

const isExpanded = ref(true)

const sortedStories = computed(() => {
  return [...props.stories].sort((a, b) => {
    return a.displayOrder - b.displayOrder
  })
})

function toggleExpanded() {
  isExpanded.value = !isExpanded.value
}

function handleCreate() {
  emit('create')
}

function handleDelete(story: HeroStory) {
  emit('delete', story)
}

function handleSave(story: HeroStory, updates: Partial<HeroStory>) {
  emit('save', {
    story,
    updates
  })
}

function handleCancel() {
  emit('cancel')
}

function handleClearPendingSuggestions() {
  emit('clearPendingSuggestions')
}

function getPendingSuggestionsForStory(storyId: string) {
  if (props.pendingSuggestions?.storyId === storyId) {
    return props.pendingSuggestions.suggestions
  }
  return null
}
</script>

<template>
  <div class="space-y-3">
    <!-- Header: Collapsible Title with Create Button -->
    <div
      class="flex items-center justify-between cursor-pointer px-3 rounded-lg hover:bg-muted/5 transition-colors"
      @click="toggleExpanded"
    >
      <div class="flex items-center flex-1">
        <div class="flex items-center gap-4">
          <h2 class="text-xl font-semibold text-foreground">
            Your HERO Stories
          </h2>
          <UBadge
            v-if="stories.length > 0"
            color="neutral"
            variant="soft"
            size="md"
          >
            {{ stories.length }}
          </UBadge>
        </div>
      </div>

      <UButton
        label="New HERO Story"
        icon="i-lucide-plus"
        color="primary"
        variant="solid"
        size="md"
        class="cursor-pointer"
        @click.stop="handleCreate"
      />

      <UIcon
        :name="isExpanded ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
        class="w-5 h-5 text-muted shrink-0 ml-4"
      />
    </div>

    <!-- Expanded Content -->
    <template v-if="isExpanded">
      <div v-if="isLoading" class="px-3 text-sm text-muted">
        Loading stories...
      </div>

      <div v-if="stories.length > 0" class="flex items-center justify-between px-3">
        <p class="text-base text-muted">
          Develop your achievement moments into complete HERO stories.
        </p>
      </div>

      <!-- Empty State -->
      <div v-if="!isLoading && stories.length === 0" class="border border-default rounded-lg p-4">
        <div class="flex flex-col items-center gap-4">
          <p class="text-sm text-muted">
            No HERO stories yet. <span class="font-medium">Create your first story</span> to highlight your achievements.
          </p>
          <UButton
            label="New HERO Story"
            icon="i-lucide-plus"
            color="primary"
            size="md"
            class="cursor-pointer shrink-0"
            @click="handleCreate"
          />
        </div>
      </div>

      <!-- Stories List -->
      <div v-else-if="!isLoading" class="space-y-2 px-2 min-w-0">
        <ProfileHeroStoryCard
          v-for="story in sortedStories"
          :key="story.id"
          :story="story"
          :pending-suggestions="getPendingSuggestionsForStory(story.id)"
          :is-editing-requested="story.id === editingStoryId"
          @delete="handleDelete(story)"
          @save="(updates) => handleSave(story, updates)"
          @cancel="handleCancel"
          @suggestions-applied="handleClearPendingSuggestions"
        />
      </div>
    </template>
  </div>
</template>
