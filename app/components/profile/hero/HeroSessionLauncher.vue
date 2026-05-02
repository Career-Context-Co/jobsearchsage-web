<script setup lang="ts">
import type { HeroStory } from '#shared/types/careerId'

type LauncherView = 'picker' | 'story-picker'

const props = defineProps<{
  stories: HeroStory[]
}>()

const emit = defineEmits<{
  selectStory: [storyId: string]
  createStory: []
  startDiscovery: []
  close: []
}>()

const currentView = ref<LauncherView>('picker')
const coachingMessage = ref('What would you like to do with HERO today?')

const sortedStories = computed(() => {
  return [...props.stories].sort((a, b) => a.displayOrder - b.displayOrder)
})

const sections = [
  {
    id: 'story',
    label: 'Work on a HERO story',
    description: 'Improve or finish a story',
    subtitle: 'Choose an existing story or start a new one',
    icon: 'i-lucide-bookmark'
  },
  {
    id: 'discovery',
    label: 'Do discovery',
    description: 'Find possible stories',
    subtitle: 'Talk through your work and capture strong story ideas',
    icon: 'i-lucide-sparkles'
  }
]

function selectSection(sectionId: string) {
  if (sectionId === 'story') {
    currentView.value = 'story-picker'
    coachingMessage.value = 'Which HERO story do you want to work on?'
    return
  }

  emit('startDiscovery')
}

function backToPicker() {
  currentView.value = 'picker'
  coachingMessage.value = 'What would you like to do with HERO today?'
}

function selectStory(storyId: string) {
  emit('selectStory', storyId)
}

function createStory() {
  emit('createStory')
}
</script>

<template>
  <div class="h-full flex flex-col space-y-4">
    <div class="bg-primary-500/10 border border-primary-200/70 dark:border-primary-700/60 rounded-2xl p-4">
      <div class="flex gap-3 items-start">
        <UIcon
          name="i-lucide-sparkles"
          class="w-5 h-5 text-primary-600 dark:text-primary-400 shrink-0 mt-0.5"
        />
        <p class="text-sm font-medium text-primary-950 dark:text-primary-200">
          {{ coachingMessage }}
        </p>
      </div>
    </div>

    <div v-if="currentView === 'picker'" class="flex-1">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          v-for="section in sections"
          :key="section.id"
          type="button"
          class="p-5 rounded-lg border-2 transition-all duration-200 text-left border-primary-300 dark:border-primary-600 bg-white dark:bg-gray-800 hover:border-primary-500 hover:shadow-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          @click="selectSection(section.id)"
        >
          <div class="flex flex-col gap-2">
            <UIcon
              :name="section.icon"
              class="w-7 h-7 text-primary-600 dark:text-primary-400"
            />
            <h3 class="text-base font-semibold">
              {{ section.label }}
            </h3>
            <p class="text-xs font-medium text-muted">
              {{ section.description }}
            </p>
            <p class="text-xs text-muted">
              {{ section.subtitle }}
            </p>
          </div>
        </button>
      </div>
    </div>

    <div v-else-if="currentView === 'story-picker'" class="flex-1 space-y-3">
      <button
        type="button"
        class="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors cursor-pointer"
        @click="backToPicker"
      >
        <UIcon
          name="i-lucide-arrow-left"
          class="w-4 h-4"
        />
        Back
      </button>

      <UButton
        label="Create new HERO story"
        icon="i-lucide-plus"
        color="primary"
        variant="soft"
        block
        class="cursor-pointer justify-start"
        @click="createStory"
      />

      <div v-if="sortedStories.length === 0" class="text-sm text-muted">
        No HERO stories yet. Create one to start shaping it with AI.
      </div>

      <div v-else class="space-y-2">
        <button
          v-for="story in sortedStories"
          :key="story.id"
          type="button"
          class="w-full p-4 rounded-lg border-2 text-left transition-all duration-200 border-primary-200 dark:border-primary-700 bg-white dark:bg-gray-800 hover:border-primary-500 hover:shadow-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          @click="selectStory(story.id)"
        >
          <div class="flex items-start gap-3">
            <div class="shrink-0 p-1.5 rounded-md bg-primary-50 dark:bg-primary-900/30 mt-0.5">
              <UIcon
                name="i-lucide-bookmark"
                class="w-4 h-4 text-primary-600 dark:text-primary-400"
              />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-foreground">
                {{ story.title }}
              </p>
              <p class="text-xs text-muted mt-1">
                Continue shaping this HERO story
              </p>
            </div>
            <UIcon
              name="i-lucide-chevron-right"
              class="w-4 h-4 text-muted shrink-0 mt-0.5"
            />
          </div>
        </button>
      </div>
    </div>
  </div>
</template>
