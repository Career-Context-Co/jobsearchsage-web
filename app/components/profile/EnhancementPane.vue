<script setup lang="ts">
import type { Experience } from '#shared/types/careerId'
import type { QuestionGroup, ContextStory, ResumeBullet, ContextObject } from '#shared/types/enhancement'

interface Props {
  experience: Experience
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

const careerIDStore = useCareerIDStore()

// Reference to question round component to call proceed
const questionRoundRef = ref<any>()

// Enhancement pane state - all managed internally
const currentRound = ref<1 | 2 | 3 | 4>(1)
const questionGroups = ref<QuestionGroup[]>([])
const storyNotes = ref<ContextStory[]>([])
const bullets = ref<ResumeBullet[]>([])
const answeredQuestions = ref<Array<{ id: string; answer: string }>>([])
const contextNotes = ref('')

// TODO: Uncomment when ready to use real API
// const isGeneratingQuestions = computed(() => careerIDStore.isGeneratingQuestions)
// const isGeneratingBullets = computed(() => careerIDStore.isGeneratingBullets)
// const isLoading = computed(() => isGeneratingQuestions.value || isGeneratingBullets.value)

// Temporary: Dummy loading state for UI development
const isGeneratingQuestions = ref(false)
const isGeneratingBullets = ref(false)
const isLoading = computed(() => isGeneratingQuestions.value || isGeneratingBullets.value)

// Round labels for display
const roundLabels = {
  1: 'Initial Questions',
  2: 'Follow-up Questions',
  3: 'Review Context',
  4: 'Select Bullets'
}

// Computed for step text
const stepText = computed(() => `Round ${currentRound.value} of 4: ${roundLabels[currentRound.value]}`)

// Initialize Round 1 when component mounts
onMounted(async () => {
  await initializeRound1()
})

async function initializeRound1() {
  try {
    isGeneratingQuestions.value = true
    const result = await careerIDStore.generateInitialQuestions(props.experience)
    questionGroups.value = result.questionGroups
    storyNotes.value = result.notes
  } catch (error: any) {
    console.error('Failed to generate initial questions:', error)
    // TODO: Show error toast
  } finally {
    isGeneratingQuestions.value = false
  }
}

// Handle question round proceed
async function handleQuestionRoundProceed(event: any) {
  answeredQuestions.value = event.answers
  if (currentRound.value === 1) {
    await proceedToRound2()
  } else if (currentRound.value === 2) {
    await proceedToRound3()
  }
}

// Handle next button click
async function handleNext() {
  if (currentRound.value === 1 || currentRound.value === 2) {
    // For question rounds, call the component's proceed method which will emit the event
    questionRoundRef.value?.handleProceed()
  } else if (currentRound.value === 3) {
    // Move to Round 4 (generate bullets)
    await proceedToRound4()
  }
}

async function proceedToRound2() {
  try {
    isGeneratingQuestions.value = true
    // Build context from Round 1 answers
    const context: ContextObject = {
      notes: storyNotes.value,
      answeredQuestions: answeredQuestions.value
    }
    
    const result = await careerIDStore.generateFollowUpQuestions(props.experience, context)
    
    // If no follow-up questions, skip to Round 3
    if (!result.questionGroups || result.questionGroups.length === 0) {
      await proceedToRound3()
      return
    }
    
    questionGroups.value = result.questionGroups
    storyNotes.value = [...storyNotes.value, ...result.notes]
    currentRound.value = 2
  } catch (error: any) {
    console.error('Failed to generate follow-up questions:', error)
    // TODO: Show error toast
  } finally {
    isGeneratingQuestions.value = false
  }
}

async function proceedToRound3() {
  try {
    isGeneratingQuestions.value = true
    // Build final context from Round 1 + Round 2 answers
    const context: ContextObject = {
      notes: storyNotes.value,
      answeredQuestions: answeredQuestions.value
    }
    
    // Make final API call to generate story notes from accumulated context
    const result = await careerIDStore.generateFollowUpQuestions(props.experience, context)
    
    // Update story notes with final context
    storyNotes.value = result.notes
    currentRound.value = 3
  } catch (error: any) {
    console.error('Failed to generate final context:', error)
    // TODO: Show error toast
  } finally {
    isGeneratingQuestions.value = false
  }
}

async function proceedToRound4() {
  try {
    isGeneratingBullets.value = true
    const result = await careerIDStore.generateFinalBullets(props.experience, storyNotes.value)
    bullets.value = result
    currentRound.value = 4
  } catch (error: any) {
    console.error('Failed to generate bullets:', error)
    // TODO: Show error toast
  } finally {
    isGeneratingBullets.value = false
  }
}

// Handle back button click
function handleBack() {
  if (currentRound.value > 1) {
    currentRound.value = (currentRound.value - 1) as 1 | 2 | 3 | 4
  }
}

// Handle cancel button click
function handleCancel() {
  emit('close')
}

// Handle Step 3 save event (receives context notes from component)
async function handleStep3Save(event: { contextNotes: string }) {
  contextNotes.value = event.contextNotes
  // Move to Round 4 to generate and select bullets
  await proceedToRound4()
}

// Handle Step 4 save event (receives selected bullets from component)
async function handleStep4Save(event: { selectedBullets: string[] }) {
  await performSave(event.selectedBullets)
}

// Handle save button click (for Round 4)
async function handleSave() {
  await performSave()
}

// Perform the actual save operation
async function performSave(selectedBullets?: string[]) {
  const bulletsToSave = selectedBullets || bullets.value.map(b => b.primary)
  if (!bulletsToSave || bulletsToSave.length === 0) return

  try {
    isGeneratingBullets.value = true
    await careerIDStore.updateExperience(props.experience.id, {
      highlights: bulletsToSave,
      contextNotes: contextNotes.value,
      lastEnhancedAt: new Date().toISOString()
    })
    
    // Close pane after successful save
    emit('close')
  } catch (error: any) {
    console.error('Failed to save enhancement:', error)
    // TODO: Show error toast
  } finally {
    isGeneratingBullets.value = false
  }
}
</script>

<template>
  <div class="h-full w-full flex flex-col">
    <!-- Header: Title + Progress + Step Count + Close Button -->
    <div class="flex items-start justify-between pb-4">
      <div class="flex-1 mb-4">
        <h2 class="text-lg font-semibold mb-2">Refine your story</h2>
        <p class="text-sm text-muted mb-1">{{ stepText }}</p>
        <UProgress
          :model-value="currentRound"
          :max="4"
          class="w-full"
        />
      </div>
      <UButton
        icon="i-lucide-x"
        color="neutral"
        variant="ghost"
        size="sm"
        class="cursor-pointer shrink-0 ml-4"
        @click="handleCancel"
      />
    </div>

    <!-- Body: Conditional Step Rendering -->
    <div class="flex-1 overflow-y-auto space-y-4">
      <!-- Round 1 or 2: Question Round -->
      <div v-if="currentRound === 1 || currentRound === 2" class="space-y-4">
        <ProfileEnhancementQuestionRound
          ref="questionRoundRef"
          :round="currentRound"
          :question-groups="questionGroups"
          :story-notes="storyNotes"
          :is-loading="isLoading"
          @proceed="handleQuestionRoundProceed"
          @back="handleBack"
          @cancel="handleCancel"
        />
      </div>

      <!-- Round 3: Context Review -->
      <div v-else-if="currentRound === 3" class="space-y-4">
        <ProfileEnhancementContextReview
          :story-notes="storyNotes"
          :is-loading="isLoading"
          @back="handleBack"
          @save="handleStep3Save"
          @cancel="handleCancel"
        />
      </div>

      <!-- Round 4: Bullet Selection -->
      <div v-else-if="currentRound === 4" class="space-y-4">
        <ProfileEnhancementBulletReview
          :story-notes="storyNotes"
          :bullet-pairs="bullets"
          :is-loading="isLoading"
          @back="handleBack"
          @save="handleStep4Save"
          @cancel="handleCancel"
        />
      </div>
    </div>

    <!-- Footer: Back/Next/Save Draft Buttons -->
    <div v-if="!isLoading" class="flex items-center justify-between gap-3 pt-4">
      <UButton
        v-if="currentRound > 1"
        label="Back"
        icon="i-lucide-arrow-left"
        color="neutral"
        variant="outline"
        class="cursor-pointer"
        :disabled="isLoading"
        @click="handleBack"
      />
      <div v-else class="flex-1" />

      <div class="flex gap-2">
        <UButton
          v-if="currentRound < 4"
          :label="
            currentRound === 1
              ? 'Next: Details & Specifics'
              : currentRound === 2
                ? 'Next: Review Context'
                : 'Next: Select Bullets'
          "
          icon="i-lucide-arrow-right"
          icon-position="leading"
          color="primary"
          class="cursor-pointer"
          :loading="isLoading"
          :disabled="isLoading"
          @click="handleNext"
        />
        <UButton
          v-else
          label="Save Bullets"
          icon="i-lucide-check"
          color="primary"
          class="cursor-pointer"
          :loading="isLoading"
          :disabled="isLoading || bullets.length === 0"
          @click="handleSave"
        />
      </div>
    </div>
  </div>
</template>

