<script setup lang="ts">
import { useCareerIDStore } from '@/stores/careerIDStore'
import type { Experience } from '#shared/types/careerId'

interface Props {
  storyId: string
  profileId: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'accept-suggestions': [section: string, suggestions: Record<string, string>]
  'close': []
}>()

const careerIDStore = useCareerIDStore()

const linkedExperience = ref<Experience | null>(null)
const selectedSection = ref<string | null>(null)

const sections = [
  {
    id: 'hurdle',
    label: 'Hurdle',
    description: 'The Challenge',
    subtitle: 'What problem did you face?',
    icon: 'i-lucide-mountain'
  },
  {
    id: 'expectation',
    label: 'Expectation',
    description: 'The Plan',
    subtitle: 'What were you trying to achieve?',
    icon: 'i-lucide-target'
  },
  {
    id: 'response',
    label: 'Response',
    description: 'The Action',
    subtitle: 'What steps did you take?',
    icon: 'i-lucide-zap'
  },
  {
    id: 'outcome',
    label: 'Outcome',
    description: 'The Result',
    subtitle: 'What was the impact?',
    icon: 'i-lucide-trophy'
  }
]

const selectedSectionConfig = computed(() =>
  sections.find(s => s.id === selectedSection.value) ?? null
)

const momentTitle = computed(() => {
  if (props.storyId === 'create') return undefined
  const story = careerIDStore.heroStories.find(s => s.id === props.storyId)
  return story?.momentTitle ?? undefined
})

type SectionType = 'hurdle' | 'expectation' | 'response' | 'outcome'

const sectionTypeValue = computed(() => selectedSection.value as SectionType)

const sourceExperience = computed(() => {
  if (!linkedExperience.value) return undefined
  const exp = linkedExperience.value
  return {
    id: exp.id,
    title: exp.title,
    employer: exp.employer,
    summary: exp.summary ?? null,
    highlights: exp.highlights ?? [],
    context_notes: exp.contextNotes ?? null
  }
})

function selectSection(id: string) {
  selectedSection.value = id
}

function backToPicker() {
  selectedSection.value = null
}

function handleAcceptSuggestions(section: string, suggestions: Record<string, string>) {
  emit('accept-suggestions', section, suggestions)
}

function handleClose() {
  emit('close')
}

async function fetchLinkedExperience() {
  if (props.storyId === 'create') return

  if (careerIDStore.heroStories.length === 0) {
    await careerIDStore.fetchStories(props.profileId)
  }

  const story = careerIDStore.heroStories.find(s => s.id === props.storyId)
  if (!story?.sourceExperienceId) return

  if (careerIDStore.experience.length === 0) {
    await careerIDStore.fetchProfile(props.profileId)
  }

  const expId = typeof story.sourceExperienceId === 'string'
    ? parseInt(story.sourceExperienceId, 10)
    : story.sourceExperienceId

  linkedExperience.value = careerIDStore.experience.find(e => e.id === expId) ?? null
}

onMounted(async () => {
  await fetchLinkedExperience()
})
</script>

<template>
  <div class="h-full flex flex-col space-y-4">
    <!-- Section Picker -->
    <template v-if="!selectedSection">
      <!-- Coaching header -->
      <div class="bg-primary-500/10 border border-primary-200/70 dark:border-primary-700/60 rounded-2xl p-4">
        <div class="flex gap-3 items-start">
          <UIcon name="i-lucide-sparkles" class="w-6 h-6 text-primary-600 dark:text-primary-400 shrink-0 mt-0.5" />
          <p class="text-base font-medium text-primary-950 dark:text-primary-200">
            I'll help you craft a compelling HERO story. Which section would you like to work on?
          </p>
        </div>
      </div>

      <div class="flex-1 grid grid-cols-2 gap-4">
        <button
          v-for="section in sections"
          :key="section.id"
          type="button"
          class="p-6 rounded-lg border-2 border-primary-300 dark:border-primary-600 bg-white dark:bg-gray-800 hover:border-primary-500 hover:shadow-md cursor-pointer text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          @click="selectSection(section.id)"
        >
          <div class="flex flex-col gap-2">
            <UIcon :name="section.icon" class="w-8 h-8 text-primary-600 dark:text-primary-400" />
            <h3 class="text-lg font-semibold">
              {{ section.label }}
            </h3>
            <p class="text-sm font-medium text-muted">
              {{ section.description }}
            </p>
            <p class="text-xs text-muted">
              {{ section.subtitle }}
            </p>
          </div>
        </button>
      </div>
    </template>

    <!-- Enhancement Pane for selected section -->
    <template v-else>
      <!-- Back button -->
      <button
        type="button"
        class="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
        @click="backToPicker"
      >
        <UIcon name="i-lucide-arrow-left" class="w-4 h-4" />
        Back to sections
      </button>

      <div class="flex-1 overflow-hidden">
        <ProfileHeroHeroEnhancementPane
          :story-id="storyId"
          :profile-id="profileId"
          :section-type="sectionTypeValue"
          :section-label="selectedSectionConfig?.label ?? ''"
          :source-experience="sourceExperience"
          :moment-title="momentTitle"
          @accept-suggestions="handleAcceptSuggestions"
          @close="handleClose"
        />
      </div>
    </template>
  </div>
</template>
