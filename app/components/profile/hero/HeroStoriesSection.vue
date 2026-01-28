<script setup lang="ts">
import { ref, computed } from 'vue'
import type { HeroStory } from '#shared/types/careerId'

interface Props {
  stories: HeroStory[]
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false
})

const emit = defineEmits<{
  create: []
  delete: [story: HeroStory]
  save: [payload: { story: HeroStory; updates: Partial<HeroStory> }]
  cancel: []
  openAIHelp: [storyId: string]
}>()

// Collapsible state
const isExpanded = ref(true)

// Sort stories by display order
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

function handleOpenAIHelp(storyId: string) {
  emit('openAIHelp', storyId)
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
          <h2 class="text-xl font-semibold text-foreground">Your HERO Stories</h2>
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
        label="Create Story"
        icon="i-lucide-bookmark"
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

      <!-- Subtitle with description -->
      <div v-if="stories.length > 0" class="flex items-center justify-between px-3">
        <p class="text-base text-muted">
          Develop your achievement moments into complete HERO stories.
        </p>
      </div>

      <!-- Empty State (Compact) -->
      <div v-if="!isLoading && stories.length === 0" class="border border-default rounded-lg p-4">
        <div class="flex flex-col items-center gap-4">
          <p class="text-sm text-muted">
            No HERO stories yet. <span class="font-medium">Create your first story</span> to highlight your achievements.
          </p>
          <UButton
            label="Create Story"
            icon="i-lucide-plus"
            color="primary"
            size="md"
            class="cursor-pointer shrink-0"
            @click="handleCreate"
          />
        </div>
      </div>

      <!-- Stories List -->
      <div v-else-if="!isLoading" class="space-y-2 px-2">
        <ProfileHeroStoryCard
          v-for="story in sortedStories"
          :key="story.id"
          :story="story"
          @delete="handleDelete(story)"
          @save="(updates) => handleSave(story, updates)"
          @open-a-i-help="handleOpenAIHelp"
        />
      </div>
    </template>
  </div>
</template>
