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

// Enhancement pane state - all managed internally
const currentRound = ref<1 | 2 | 3>(1)
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
  3: 'Review & Save'
}

// Computed for step text
const stepText = computed(() => `Round ${currentRound.value} of 3: ${roundLabels[currentRound.value]}`)

// Initialize Round 1 when component mounts
onMounted(async () => {
  await initializeRound1()
})

async function initializeRound1() {
  // TODO: Uncomment when ready to use real API
  // try {
  //   const result = await careerIDStore.generateInitialQuestions(props.experience)
  //   questionGroups.value = result.questionGroups
  //   storyNotes.value = result.notes
  // } catch (error: any) {
  //   console.error('Failed to generate initial questions:', error)
  //   // TODO: Show error toast
  // }

  // Temporary: Dummy data for UI development
  isGeneratingQuestions.value = true
  await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API delay
  
  questionGroups.value = [
    {
      category: 'General Role Context',
      questions: [
        { id: 'q1', text: 'What was your primary responsibility in this role?' },
        { id: 'q2', text: 'How many people were on your team or did you manage?' },
        { id: 'q3', text: 'What was the main goal or objective of your position?' }
      ]
    },
    {
      category: 'Key Achievements',
      questions: [
        { id: 'q4', text: 'Can you quantify any improvements you made? (e.g., percentage, dollar amount, time saved)' },
        { id: 'q5', text: 'What specific projects or initiatives did you lead or contribute to?' },
        { id: 'q6', text: 'What tools, technologies, or methodologies did you use?' }
      ]
    }
  ]
  
  storyNotes.value = [
    {
      title: 'Role Overview',
      text: 'Primary responsibility was software development and team collaboration',
      type: 'responsibility'
    }
  ]
  
  isGeneratingQuestions.value = false
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
  if (currentRound.value === 1) {
    // Move to Round 2
    await proceedToRound2()
  } else if (currentRound.value === 2) {
    // Move to Round 3
    await proceedToRound3()
  }
}

async function proceedToRound2() {
  // TODO: Uncomment when ready to use real API
  // // Build context from Round 1 answers
  // const context: ContextObject = {
  //   notes: storyNotes.value,
  //   answeredQuestions: answeredQuestions.value
  // }
  // 
  // try {
  //   const result = await careerIDStore.generateFollowUpQuestions(props.experience, context)
  //   
  //   // If no follow-up questions, skip to Round 3
  //   if (!result.questionGroups || result.questionGroups.length === 0) {
  //     await proceedToRound3()
  //     return
  //   }
  // 
  //   questionGroups.value = result.questionGroups
  //   storyNotes.value = [...storyNotes.value, ...result.notes]
  //   currentRound.value = 2
  // } catch (error: any) {
  //   console.error('Failed to generate follow-up questions:', error)
  //   // TODO: Show error toast
  // }

  // Temporary: Dummy data for UI development
  isGeneratingQuestions.value = true
  await new Promise(resolve => setTimeout(resolve, 800)) // Simulate API delay
  
  // Simulate follow-up questions (or skip to Round 3 if no follow-ups)
  const hasFollowUps = true // Set to false to test auto-skip to Round 3
  
  if (!hasFollowUps) {
    await proceedToRound3()
    return
  }
  
  questionGroups.value = [
    {
      category: 'Metrics & Impact',
      questions: [
        { id: 'q7', text: 'Can you estimate the percentage of time saved or latency reduced?' },
        { id: 'q8', text: 'What was the baseline before this change?' }
      ]
    },
    {
      category: 'Tools & Technologies',
      questions: [
        { id: 'q9', text: 'What specific tools, languages, or libraries did you utilize?' }
      ]
    }
  ]
  
  storyNotes.value = [
    ...storyNotes.value,
    {
      title: 'Project Impact',
      text: 'Implemented caching system to reduce API latency',
      type: 'achievement'
    },
    {
      title: 'Technical Details',
      text: 'Used Redis and Node.js for the implementation',
      type: 'project'
    }
  ]
  
  currentRound.value = 2
  isGeneratingQuestions.value = false
}

async function proceedToRound3() {
  // TODO: Uncomment when ready to use real API
  // try {
  //   const result = await careerIDStore.generateFinalBullets(props.experience, storyNotes.value)
  //   bullets.value = result
  //   currentRound.value = 3
  // } catch (error: any) {
  //   console.error('Failed to generate bullets:', error)
  //   // TODO: Show error toast
  // }

  // Temporary: Dummy data for UI development
  isGeneratingBullets.value = true
  await new Promise(resolve => setTimeout(resolve, 1200)) // Simulate API delay
  
  bullets.value = [
    {
      primary: 'Optimized main e-commerce dashboard for 50,000+ monthly active users, achieving a 1.5s reduction in page load times',
      secondary: 'Improved dashboard performance by implementing Redis caching and optimizing database queries, resulting in 40% faster load times'
    },
    {
      primary: 'Led team of 5 engineers to deliver $2M customer portal, reducing support tickets by 40%',
      secondary: 'Managed cross-functional team using Agile methodologies to build customer self-service portal, improving customer satisfaction scores'
    },
    {
      primary: 'Implemented new caching system reducing API response time by ~20% (approx 200ms) using Redis and Node.js',
      secondary: 'Designed and deployed distributed caching layer using AWS ElastiCache, improving overall system performance and scalability'
    },
    {
      primary: 'Collaborated with product and design teams to launch mobile app feature used by 10,000+ users in first month',
      secondary: 'Worked closely with stakeholders to define requirements and deliver mobile feature on schedule, exceeding user adoption targets'
    }
  ]
  
  currentRound.value = 3
  isGeneratingBullets.value = false
}

// Handle back button click
function handleBack() {
  if (currentRound.value > 1) {
    currentRound.value = (currentRound.value - 1) as 1 | 2 | 3
  }
}

// Handle cancel button click
function handleCancel() {
  emit('close')
}

// Handle save button click (for Round 3)
async function handleSave() {
  if (!bullets.value || bullets.value.length === 0) return

  // TODO: Uncomment when ready to use real API
  // try {
  //   // Extract primary bullets for saving
  //   const highlights = bullets.value.map(bullet => bullet.primary)
  // 
  //   await careerIDStore.updateExperience(props.experience.id, {
  //     highlights,
  //     contextNotes: contextNotes.value,
  //     lastEnhancedAt: new Date().toISOString()
  //   })
  // 
  //   // Close pane after successful save
  //   emit('close')
  // } catch (error: any) {
  //   console.error('Failed to save enhancement:', error)
  //   // TODO: Show error toast
  // }

  // Temporary: Dummy save for UI development
  console.log('Saving enhancement with:', {
    experienceId: props.experience.id,
    highlights: bullets.value.map(bullet => bullet.primary),
    contextNotes: contextNotes.value,
    lastEnhancedAt: new Date().toISOString()
  })
  
  // Simulate save delay
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // Close pane after "successful" save
  emit('close')
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
          :max="3"
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
          :round="currentRound"
          :question-groups="questionGroups"
          :story-notes="storyNotes"
          :is-loading="isLoading"
          @proceed="handleQuestionRoundProceed"
          @back="handleBack"
          @cancel="handleCancel"
        />
      </div>

      <!-- Round 3: Context Review & Save (placeholder until FE-007) -->
      <div v-else-if="currentRound === 3" class="space-y-4">
        <div v-if="isLoading" class="flex items-center justify-center py-12">
          <div class="text-center">
            <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
            <p class="text-sm text-muted">Generating bullets...</p>
          </div>
        </div>
        <div v-else>
          <p class="text-muted mb-4">EnhancementStep3 component will go here</p>
          <p v-if="storyNotes.length > 0" class="text-xs text-muted">
            {{ storyNotes.length }} story notes available
          </p>
          <p v-if="bullets.length > 0" class="text-xs text-muted mt-2">
            {{ bullets.length }} bullets generated
          </p>
        </div>
      </div>
    </div>

    <!-- Footer: Back/Next/Save Draft Buttons -->
    <div class="flex items-center justify-between gap-3 pt-4">
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
          v-if="currentRound < 3"
          :label="currentRound === 1 ? 'Next: Details & Specifics' : 'Next: Review Draft'"
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
          label="Save Draft"
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

