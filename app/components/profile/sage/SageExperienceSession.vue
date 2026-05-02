<script setup lang="ts">
import type { Experience } from '#shared/types/careerId'

type InterviewMode = 'notes_help' | 'role_summary'
type SessionView = 'picker' | 'bullet-picker' | 'enhancing' | 'responsibility-picker' | 'interviewing'

const sections = [
  {
    id: 'achievement',
    label: 'Achievement Bullet',
    description: 'Enhance a key achievement',
    subtitle: 'Improve a specific bullet in your highlights',
    icon: 'i-lucide-sparkles',
    available: true
  },
  {
    id: 'responsibility',
    label: 'Responsibility',
    description: 'Polish your role notes or summary',
    subtitle: 'Generate AI notes or refine your role summary',
    icon: 'i-lucide-briefcase',
    available: true
  }
]

const responsibilityModes = [
  {
    id: 'notes_help' as InterviewMode,
    label: 'Sage Notes',
    description: 'Generate AI role notes',
    subtitle: 'Sage will ask questions and create notes about your role',
    icon: 'i-lucide-notebook-pen'
  },
  {
    id: 'role_summary' as InterviewMode,
    label: 'Role Summary',
    description: 'Improve your summary',
    subtitle: 'Sage will help you craft a compelling role description',
    icon: 'i-lucide-pencil-line'
  }
]

const props = defineProps<{
  experience: Experience
  profileId: string
}>()

const emit = defineEmits<{
  confirm: [bulletIndex: number, improvedBullet: string]
  applySummary: [summary: string]
  close: []
}>()

const currentView = ref<SessionView>('picker')
const selectedBulletIndex = ref<number | null>(null)
const interviewMode = ref<InterviewMode | null>(null)
const coachingMessage = ref('I\'ll help you improve your experience. What would you like to work on?')

const selectedBullet = computed(() =>
  selectedBulletIndex.value !== null
    ? props.experience.highlights[selectedBulletIndex.value] ?? ''
    : ''
)

function selectSection(sectionId: string) {
  if (sectionId === 'achievement') {
    currentView.value = 'bullet-picker'
    coachingMessage.value = 'Great! Pick the achievement bullet you want to improve.'
  } else if (sectionId === 'responsibility') {
    currentView.value = 'responsibility-picker'
    coachingMessage.value = 'What kind of help do you need with this role?'
  }
}

function selectInterviewMode(mode: InterviewMode) {
  interviewMode.value = mode
  currentView.value = 'interviewing'
  coachingMessage.value = mode === 'notes_help'
    ? 'I\'ll ask you questions to build AI notes for this role.'
    : 'I\'ll help you craft a strong role summary.'
}

function selectBullet(index: number) {
  selectedBulletIndex.value = index
  currentView.value = 'enhancing'
  coachingMessage.value = 'Let\'s improve that bullet. Answer a few quick questions.'
}

function backToPicker() {
  currentView.value = 'picker'
  selectedBulletIndex.value = null
  interviewMode.value = null
  coachingMessage.value = 'I\'ll help you improve your experience. What would you like to work on?'
}

function backToBulletPicker() {
  currentView.value = 'bullet-picker'
  selectedBulletIndex.value = null
  coachingMessage.value = 'Great! Pick the achievement bullet you want to improve.'
}

function backToResponsibilityPicker() {
  currentView.value = 'responsibility-picker'
  interviewMode.value = null
  coachingMessage.value = 'What kind of help do you need with this role?'
}

function onEnhancerConfirm(improvedBullet: string) {
  if (selectedBulletIndex.value === null) return
  emit('confirm', selectedBulletIndex.value, improvedBullet)
  currentView.value = 'picker'
  selectedBulletIndex.value = null
  coachingMessage.value = 'I\'ll help you improve your experience. What would you like to work on?'
}

function onEnhancerDiscard() {
  backToBulletPicker()
}

function onInterviewSaved() {
  currentView.value = 'picker'
  interviewMode.value = null
  coachingMessage.value = 'I\'ll help you improve your experience. What would you like to work on?'
}

function onInterviewApplySummary(summary: string) {
  emit('applySummary', summary)
  currentView.value = 'picker'
  interviewMode.value = null
  coachingMessage.value = 'I\'ll help you improve your experience. What would you like to work on?'
}
</script>

<template>
  <div class="h-full flex flex-col space-y-4">
    <!-- AI Coaching Header -->
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

    <!-- Picker View -->
    <div v-if="currentView === 'picker'" class="flex-1">
      <div class="grid grid-cols-2 gap-4">
        <button
          v-for="section in sections"
          :key="section.id"
          type="button"
          :disabled="!section.available"
          :class="[
            'p-5 rounded-lg border-2 transition-all duration-200 text-left',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
            section.available
              ? 'border-primary-300 dark:border-primary-600 bg-white dark:bg-gray-800 hover:border-primary-500 hover:shadow-md cursor-pointer'
              : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 opacity-60 cursor-not-allowed'
          ]"
          @click="selectSection(section.id)"
        >
          <div class="flex flex-col gap-2">
            <UIcon
              :name="section.icon"
              class="w-7 h-7"
              :class="section.available ? 'text-primary-600 dark:text-primary-400' : 'text-muted'"
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
            <div v-if="!section.available" class="mt-1">
              <UBadge
                color="neutral"
                variant="subtle"
                size="sm"
              >
                Coming Soon
              </UBadge>
            </div>
          </div>
        </button>
      </div>
    </div>

    <!-- Bullet Picker View -->
    <div v-else-if="currentView === 'bullet-picker'" class="flex-1 space-y-3">
      <button
        type="button"
        class="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
        @click="backToPicker"
      >
        <UIcon
          name="i-lucide-arrow-left"
          class="w-4 h-4"
        />
        Back
      </button>

      <div
        v-if="experience.highlights.length === 0"
        class="text-sm text-muted italic"
      >
        No achievements added yet. Save some bullets first.
      </div>

      <div class="space-y-2">
        <button
          v-for="(bullet, idx) in experience.highlights"
          :key="idx"
          type="button"
          :disabled="!bullet.trim()"
          :class="[
            'w-full p-4 rounded-lg border-2 text-left transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
            bullet.trim()
              ? 'border-primary-200 dark:border-primary-700 bg-white dark:bg-gray-800 hover:border-primary-500 hover:shadow-md cursor-pointer'
              : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 opacity-50 cursor-not-allowed'
          ]"
          @click="selectBullet(idx)"
        >
          <div class="flex items-start gap-3">
            <div class="shrink-0 p-1.5 rounded-md bg-primary-50 dark:bg-primary-900/30 mt-0.5">
              <UIcon
                name="i-lucide-sparkles"
                class="w-4 h-4 text-primary-600 dark:text-primary-400"
              />
            </div>
            <p class="text-sm flex-1 whitespace-pre-wrap">
              {{ bullet || '(empty)' }}
            </p>
            <UIcon
              name="i-lucide-chevron-right"
              class="w-4 h-4 text-muted shrink-0 mt-0.5"
            />
          </div>
        </button>
      </div>
    </div>

    <!-- Enhancer View -->
    <div
      v-else-if="currentView === 'enhancing'"
      class="flex-1 flex flex-col"
    >
      <button
        type="button"
        class="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors mb-4"
        @click="backToBulletPicker"
      >
        <UIcon
          name="i-lucide-arrow-left"
          class="w-4 h-4"
        />
        Back to bullets
      </button>

      <ProfileSageAchievementEnhancer
        :key="`${experience.id}-${selectedBulletIndex}`"
        :experience="experience"
        :bullet="selectedBullet"
        :experience-id="experience.id"
        :profile-id="profileId"
        @confirm="onEnhancerConfirm"
        @discard="onEnhancerDiscard"
      />
    </div>

    <!-- Responsibility Mode Picker -->
    <div
      v-else-if="currentView === 'responsibility-picker'"
      class="flex-1 space-y-3"
    >
      <button
        type="button"
        class="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
        @click="backToPicker"
      >
        <UIcon
          name="i-lucide-arrow-left"
          class="w-4 h-4"
        />
        Back
      </button>

      <div class="grid grid-cols-1 gap-3">
        <button
          v-for="mode in responsibilityModes"
          :key="mode.id"
          type="button"
          :class="[
            'p-5 rounded-lg border-2 transition-all duration-200 text-left',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
            'border-primary-200 dark:border-primary-700 bg-white dark:bg-gray-800 hover:border-primary-500 hover:shadow-md cursor-pointer'
          ]"
          @click="selectInterviewMode(mode.id)"
        >
          <div class="flex items-start gap-4">
            <div class="shrink-0 p-2 rounded-lg bg-primary-50 dark:bg-primary-900/30">
              <UIcon
                :name="mode.icon"
                class="w-5 h-5 text-primary-600 dark:text-primary-400"
              />
            </div>
            <div class="flex-1">
              <h3 class="text-base font-semibold">
                {{ mode.label }}
              </h3>
              <p class="text-sm font-medium text-muted">
                {{ mode.description }}
              </p>
              <p class="text-xs text-muted mt-1">
                {{ mode.subtitle }}
              </p>
            </div>
            <UIcon
              name="i-lucide-chevron-right"
              class="w-5 h-5 text-muted shrink-0 mt-1"
            />
          </div>
        </button>
      </div>
    </div>

    <!-- Interview View -->
    <div
      v-else-if="currentView === 'interviewing' && interviewMode"
      class="flex-1 flex flex-col min-h-0"
    >
      <button
        type="button"
        class="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors mb-4 shrink-0"
        @click="backToResponsibilityPicker"
      >
        <UIcon
          name="i-lucide-arrow-left"
          class="w-4 h-4"
        />
        Back
      </button>

      <ProfileSageInterviewPanel
        :key="`${experience.id}-${interviewMode}`"
        :mode="interviewMode"
        :experience="experience"
        :experience-id="experience.id"
        :profile-id="profileId"
        class="flex-1 min-h-0"
        @saved="onInterviewSaved"
        @apply-summary="onInterviewApplySummary"
        @close="emit('close')"
      />
    </div>
  </div>
</template>
