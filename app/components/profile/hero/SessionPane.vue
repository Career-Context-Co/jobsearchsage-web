<script setup lang="ts">

interface Props {
  storyId: string
  initialSectionType?: 'hurdle' | 'expectation' | 'response' | 'outcome'
}

const props = withDefaults(defineProps<Props>(), {
  initialSectionType: 'hurdle'
})

const emit = defineEmits<{
  close: []
  accept: [suggestions: Record<string, Record<string, string>>]
}>()

// Reference to the current step pane component
const stepPaneRef = ref<any>()

// Panel state - all managed internally
const currentStep = ref<1 | 2 | 3 | 4>(1)
const allStepAnswers = ref<Record<string, Record<string, string>>>({
  hurdle: {},
  expectation: {},
  response: {},
  outcome: {}
})
const allStepSuggestions = ref<Record<string, Record<string, string>> | null>(null)
const isGeneratingSuggestions = ref(false)
const error = ref<string | null>(null)

// Step configuration
const stepConfig = {
  1: { sectionType: 'hurdle' as const, label: 'Hurdle - The Challenge' },
  2: { sectionType: 'expectation' as const, label: 'Expectation - Your Role & Goals' },
  3: { sectionType: 'response' as const, label: 'Response - Your Actions' },
  4: { sectionType: 'outcome' as const, label: 'Outcome - The Results' }
}

// Computed properties
const currentConfig = computed(() => stepConfig[currentStep.value])
const stepText = computed(() => `Step ${currentStep.value} of 4: ${currentConfig.value.label}`)
const canGoBack = computed(() => currentStep.value > 1)
const canGoNext = computed(() => currentStep.value < 4)
const isLastStep = computed(() => currentStep.value === 4)

// Initialize panel when mounted
onMounted(() => {
  // Map initial section type to step number
  const sectionToStep: Record<string, 1 | 2 | 3 | 4> = {
    hurdle: 1,
    expectation: 2,
    response: 3,
    outcome: 4
  }
  currentStep.value = sectionToStep[props.initialSectionType] || 1
})

// Handle next button click (navigation only)
function handleNext() {
  if (!canGoNext.value) return

  // Validate current step has at least one answer
  const currentSectionType = currentConfig.value.sectionType
  const currentAnswers = allStepAnswers.value[currentSectionType]

  if (!currentAnswers || Object.keys(currentAnswers).length === 0) {
    error.value = 'Please answer at least one question before proceeding'
    return
  }

  currentStep.value = (currentStep.value + 1) as 1 | 2 | 3 | 4
}

// Handle back button click
function handleBack() {
  if (canGoBack.value) {
    currentStep.value = (currentStep.value - 1) as 1 | 2 | 3 | 4
    error.value = null
  }
}

// Handle accept button click (only on last step)
async function handleAccept() {
  if (!isLastStep.value) return
  
  // Validate last step has at least one answer
  const currentSectionType = currentConfig.value.sectionType
  const currentAnswers = allStepAnswers.value[currentSectionType]
  
  if (!currentAnswers || Object.keys(currentAnswers).length === 0) {
    error.value = 'Please answer at least one question before accepting'
    return
  }
  
  // Generate final suggestions for last step
  await generateSuggestionsForCurrentStep()
  
  // Emit accept event with all collected suggestions
  if (!error.value && allStepSuggestions.value) {
    emit('accept', allStepSuggestions.value)
  }
}

async function handleSubmitAnswers() {
  const currentSectionType = currentConfig.value.sectionType
  const currentAnswers = allStepAnswers.value[currentSectionType]

  if (!currentAnswers || Object.keys(currentAnswers).length === 0) {
    error.value = 'Please answer at least one question before submitting'
    return
  }

  await generateSuggestionsForCurrentStep()
}

// Handle dismiss button click
function handleDismiss() {
  emit('close')
}

// Handle step answers update from child pane
function handleStepAnswersUpdate(answers: Record<string, string>) {
  const currentSectionType = currentConfig.value.sectionType
  allStepAnswers.value[currentSectionType] = answers
}

// Generate AI suggestions for current step
async function generateSuggestionsForCurrentStep() {
  const currentSectionType = currentConfig.value.sectionType
  const currentAnswers = allStepAnswers.value[currentSectionType]
  
  if (!currentAnswers || Object.keys(currentAnswers).length === 0) {
    return
  }
  
  try {
    isGeneratingSuggestions.value = true
    error.value = null
    
    // TODO: Replace with actual API call to /api/ai/hero-session/start or continue
    // For now, simulate AI response
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Mock suggestions (replace with actual API response)
    const mockSuggestions: Record<string, string> = {}
    Object.keys(currentAnswers).forEach((key) => {
      mockSuggestions[key] = `AI-generated suggestion based on: ${currentAnswers[key]}`
    })
    
    if (!allStepSuggestions.value) {
      allStepSuggestions.value = {
        hurdle: {},
        expectation: {},
        response: {},
        outcome: {}
      }
    }
    
    allStepSuggestions.value[currentSectionType] = mockSuggestions
    
  } catch (err: any) {
    console.error('Failed to generate suggestions:', err)
    error.value = 'Failed to generate AI suggestions. Please try again.'
  } finally {
    isGeneratingSuggestions.value = false
  }
}

defineExpose({
  canGoBack,
  isLastStep,
  currentStep,
  isGeneratingSuggestions,
  handleNext,
  handleBack,
  handleDismiss,
  handleAccept
})
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Body: Error + Conditional Step Rendering -->
    <div class="flex-1 overflow-y-auto space-y-4">
      <div v-if="error" class="mb-2">
        <UAlert
          color="error"
          variant="subtle"
          :title="error"
          :close-button="{ icon: 'i-lucide-x', color: 'error', variant: 'ghost' }"
          @close="error = null"
        />
      </div>

      <!-- Step 1: Hurdle -->
      <div v-if="currentStep === 1" class="space-y-4">
        <ProfileHeroSessionPaneHurdleStep
          ref="stepPaneRef"
          :answers="allStepAnswers.hurdle"
          :suggestions="allStepSuggestions?.hurdle"
          :is-loading="isGeneratingSuggestions"
          @update:answers="handleStepAnswersUpdate"
          @submit="handleSubmitAnswers"
        />
      </div>

      <!-- Step 2: Expectation -->
      <div v-else-if="currentStep === 2" class="space-y-4">
        <div class="p-8 text-center text-muted">
          <p>Expectation pane coming soon...</p>
        </div>
      </div>

      <!-- Step 3: Response -->
      <div v-else-if="currentStep === 3" class="space-y-4">
        <div class="p-8 text-center text-muted">
          <p>Response pane coming soon...</p>
        </div>
      </div>

      <!-- Step 4: Outcome -->
      <div v-else-if="currentStep === 4" class="space-y-4">
        <div class="p-8 text-center text-muted">
          <p>Outcome pane coming soon...</p>
        </div>
      </div>
    </div>

  </div>
</template>
