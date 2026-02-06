<script setup lang="ts">
import { useSageAIStore } from '@/stores/sageAIStore'
import { useCareerIDStore } from '@/stores/careerIDStore'
import type { Experience } from '#shared/types/careerId'

interface StructuredQuestion {
  id: string
  text: string
  field: string
  options: Array<{
    id: string
    label: string
    emoji?: string
    allowCustom?: boolean
  }>
}

interface Props {
  storyId: string
  profileId: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'accept-suggestions': [section: string, suggestions: Record<string, string>]
  'close': []
}>()

const sageAIStore = useSageAIStore()
const careerIDStore = useCareerIDStore()

// State to hold the linked experience
const linkedExperience = ref<Experience | null>(null)

// Section configurations
const sections = [
  {
    id: 'hurdle',
    label: 'Hurdle',
    description: 'The Challenge',
    subtitle: 'What problem did you face?',
    icon: 'i-lucide-mountain',
    available: true
  },
  {
    id: 'expectation',
    label: 'Expectation',
    description: 'The Plan',
    subtitle: 'What were you trying to achieve?',
    icon: 'i-lucide-target',
    available: false
  },
  {
    id: 'response',
    label: 'Response',
    description: 'The Action',
    subtitle: 'What steps did you take?',
    icon: 'i-lucide-zap',
    available: false
  },
  {
    id: 'outcome',
    label: 'Outcome',
    description: 'The Result',
    subtitle: 'What was the impact?',
    icon: 'i-lucide-trophy',
    available: false
  }
]

// Field mapping for Hurdle section
const fieldMapping: Record<string, string> = {
  problem: 'hurdleProblem',
  scope: 'hurdleScope',
  stakes: 'hurdleStakes'
}

// Hurdle field configurations
const hurdleFields = [
  {
    id: 'problem',
    label: 'Problem',
    description: 'The Specific Challenge',
    subtitle: 'What was the problem or opportunity you identified?',
    icon: 'i-lucide-alert-circle'
  },
  {
    id: 'scope',
    label: 'Scope',
    description: 'Size & Scale',
    subtitle: 'How big was the problem? Who was affected?',
    icon: 'i-lucide-maximize-2'
  },
  {
    id: 'stakes',
    label: 'Stakes',
    description: 'Why It Mattered',
    subtitle: 'What was at risk? Why did this matter?',
    icon: 'i-lucide-flame'
  }
]

// State management
const currentView = ref<'picker' | 'field-picker' | 'questions' | 'field-complete'>('picker')
const selectedSection = ref<'hurdle' | 'expectation' | 'response' | 'outcome' | null>(null)
const selectedField = ref<'problem' | 'scope' | 'stakes' | null>(null)
const sessionId = ref<number | null>(null)
const coachingMessage = ref<string>('I\'ll help you craft a compelling HERO story. Which section would you like to work on?')
const currentQuestion = ref<StructuredQuestion | null>(null)
const questionHistory = ref<Array<{ question: StructuredQuestion, answer: string }>>([])
const isLoading = ref<boolean>(false)
const error = ref<string | null>(null)
const currentFieldSuggestion = ref<string | null>(null)
const editableSuggestion = ref<string>('')
const regenerateNotes = ref<string>('')

// Hurdle field sessions (for tracking 3 fields: problem, scope, stakes)
const hurdleFieldSessions = ref<Record<string, {
  completed: boolean
  suggestion: string | null
  sessionId: number | null
}>>({
  problem: { completed: false, suggestion: null, sessionId: null },
  scope: { completed: false, suggestion: null, sessionId: null },
  stakes: { completed: false, suggestion: null, sessionId: null }
})

// Computed
// Format the selected field name for display (e.g., "problem" -> "Problem")
const formattedFieldName = computed(() => {
  if (!selectedField.value) return ''
  return selectedField.value.charAt(0).toUpperCase() + selectedField.value.slice(1)
})

// Interface for next step options
interface NextStepOption {
  id: string
  label: string
  description: string
  icon: string
  action: 'continue-field' | 'back-to-picker'
}

// Get next step options for field-complete view
const nextStepOptions = computed<NextStepOption[]>(() => {
  const options: NextStepOption[] = []

  // Check if there are remaining incomplete fields in current section (Hurdle)
  const incompleteFields = ['problem', 'scope', 'stakes'].filter(
    field => !hurdleFieldSessions.value[field]?.completed
  )

  if (incompleteFields.length > 0) {
    options.push({
      id: 'continue-hurdle',
      label: 'Continue with Hurdle',
      description: `${incompleteFields.length} more aspect${incompleteFields.length > 1 ? 's' : ''} to complete`,
      icon: 'i-lucide-arrow-right',
      action: 'continue-field'
    })
  }

  // Always show option to work on other sections (coming soon)
  options.push({
    id: 'other-section',
    label: 'Work on Another Section',
    description: 'Expectation, Response, or Outcome',
    icon: 'i-lucide-list',
    action: 'back-to-picker'
  })

  return options
})

// Select section and show field picker
function selectSection(sectionId: string) {
  if (!sections.find(s => s.id === sectionId)?.available) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  selectedSection.value = sectionId as any
  error.value = null

  if (sectionId === 'hurdle') {
    // Show field picker to let user choose which field to work on
    currentView.value = 'field-picker'
    coachingMessage.value = 'Great choice! Which aspect of the Hurdle would you like to work on?'
  }
}

// Select a specific field within a section and start the session
async function selectField(fieldId: string) {
  const field = fieldId as 'problem' | 'scope' | 'stakes'
  selectedField.value = field
  questionHistory.value = []
  currentFieldSuggestion.value = null
  regenerateNotes.value = ''
  await startFieldSession(field)
}

// Go back to field picker from questions view
function backToFieldPicker() {
  currentView.value = 'field-picker'
  selectedField.value = null
  currentQuestion.value = null
  questionHistory.value = []
  currentFieldSuggestion.value = null
  regenerateNotes.value = ''
  coachingMessage.value = 'Which aspect of the Hurdle would you like to work on?'
}

// Fetch linked experience from the hero story
async function fetchLinkedExperience() {
  try {
    // If storyId is 'create', check if there's a sourceExperienceId in the form data
    if (props.storyId === 'create') {
      // For create mode, we don't have a story yet
      // The experience would need to be passed differently (future enhancement)
      return
    }

    // Ensure stories are loaded
    if (careerIDStore.heroStories.length === 0) {
      await careerIDStore.fetchStories(props.profileId)
    }

    // Fetch the story to get its sourceExperienceId
    const story = careerIDStore.heroStories.find(s => s.id === props.storyId)
    
    if (!story || !story.sourceExperienceId) {
      console.log('[HeroStorySession] No linked experience found for story')
      return
    }

    // Ensure experiences are loaded
    if (careerIDStore.experience.length === 0) {
      await careerIDStore.fetchProfile(props.profileId)
    }

    // Fetch the linked experience
    const experienceId = typeof story.sourceExperienceId === 'string' 
      ? parseInt(story.sourceExperienceId, 10) 
      : story.sourceExperienceId

    linkedExperience.value = careerIDStore.experience.find(exp => exp.id === experienceId) || null

    if (linkedExperience.value) {
      console.log('[HeroStorySession] Linked experience found:', {
        id: linkedExperience.value.id,
        title: linkedExperience.value.title,
        employer: linkedExperience.value.employer
      })
    } else {
      console.log('[HeroStorySession] Experience not found in store for ID:', experienceId)
    }
  } catch (err) {
    console.error('[HeroStorySession] Failed to fetch linked experience:', err)
    // Don't throw - just continue without the experience context
  }
}

// Start a field session (problem, scope, or stakes)
async function startFieldSession(field: 'problem' | 'scope' | 'stakes') {
  try {
    isLoading.value = true
    error.value = null
    currentView.value = 'questions'

    // Get previous field results for context
    const previousResults: Record<string, string> = {}
    if (field === 'scope' && hurdleFieldSessions.value.problem?.suggestion) {
      previousResults.problem = hurdleFieldSessions.value.problem.suggestion
    }
    if (field === 'stakes') {
      if (hurdleFieldSessions.value.problem?.suggestion) {
        previousResults.problem = hurdleFieldSessions.value.problem.suggestion
      }
      if (hurdleFieldSessions.value.scope?.suggestion) {
        previousResults.scope = hurdleFieldSessions.value.scope.suggestion
      }
    }

    coachingMessage.value = `Let's work on the ${field} for your Hurdle section.`

    // Prepare the options object with experience context
    const sessionOptions: {
      field: string
      previousFieldResults: Record<string, string>
      sourceExperience?: Experience
    } = {
      field,
      previousFieldResults: previousResults
    }

    // Add the linked experience if available
    if (linkedExperience.value) {
      sessionOptions.sourceExperience = linkedExperience.value
      console.log('[HeroStorySession] Starting session with experience context:', {
        experienceId: linkedExperience.value.id,
        experienceTitle: linkedExperience.value.title
      })
    }

    const response = await sageAIStore.startHeroEnhancementSession(
      props.profileId,
      props.storyId,
      'hurdle',
      { field1: '', field2: '', field3: '' },
      sessionOptions
    )

    sessionId.value = response.session_id
    if (hurdleFieldSessions.value[field]) {
      hurdleFieldSessions.value[field].sessionId = response.session_id
    }
    currentQuestion.value = response.current_question || null

    if (response.current_question) {
      coachingMessage.value = response.ai_message || coachingMessage.value
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error('Failed to start field session:', err)
    error.value = 'Failed to start session. Please try again.'
  } finally {
    isLoading.value = false
  }
}

// Handle option selected
async function handleOptionSelected(data: { optionId: string, customText?: string }) {
  if (!currentQuestion.value || !selectedField.value) return

  try {
    isLoading.value = true
    error.value = null

    // Find the selected option's label for display in history
    const selectedOption = currentQuestion.value.options.find(opt => opt.id === data.optionId)
    const answerDisplay = data.customText || selectedOption?.label || data.optionId

    // Store current question and answer in history
    questionHistory.value.push({
      question: currentQuestion.value,
      answer: answerDisplay
    })

    // Clear current question immediately after adding to history
    // This prevents showing a "ghost" question while loading
    currentQuestion.value = null

    const response = await sageAIStore.continueHeroEnhancementSession(
      sessionId.value!,
      {
        selectedOption: data.optionId,
        customText: data.customText
      }
    )

    if (response.is_complete && response.final_output && selectedField.value) {
      // Field complete - show preview and options
      const currentField = selectedField.value
      const dbFieldName = fieldMapping[currentField]
      const suggestion = dbFieldName ? response.final_output[dbFieldName] : null
      const fieldSession = hurdleFieldSessions.value[currentField]

      if (suggestion && fieldSession) {
        fieldSession.completed = true
        fieldSession.suggestion = suggestion
        currentFieldSuggestion.value = suggestion
        editableSuggestion.value = suggestion
      }

      // Show field complete view with preview and options
      currentView.value = 'field-complete'
      coachingMessage.value = `Great! Here's what I've crafted for the ${currentField} section.`
    } else if (response.current_question) {
      // More questions remain
      currentQuestion.value = response.current_question
      coachingMessage.value = response.ai_message || coachingMessage.value
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error('Failed to continue session:', err)
    error.value = 'Failed to process your answer. Please try again.'
  } finally {
    isLoading.value = false
  }
}

// Accept all suggestions
function acceptAllSuggestions() {
  const suggestions: Record<string, string> = {}

  Object.entries(hurdleFieldSessions.value).forEach(([field, session]) => {
    if (session.suggestion) {
      suggestions[field] = session.suggestion
    }
  })

  emit('accept-suggestions', 'hurdle', suggestions)
}

// Save current field and end
function saveAndEnd() {
  if (!selectedField.value || !editableSuggestion.value) return

  const currentField = selectedField.value
  const fieldSession = hurdleFieldSessions.value[currentField]

  // Update the field with edited suggestion
  if (fieldSession) {
    fieldSession.suggestion = editableSuggestion.value
  }

  const suggestions: Record<string, string> = {
    [currentField]: editableSuggestion.value
  }

  emit('accept-suggestions', 'hurdle', suggestions)
}

// Handle next step choice from field-complete view
async function handleNextStepChoice(option: NextStepOption) {
  if (option.action === 'continue-field') {
    // Go back to field picker to let user choose
    backToFieldPicker()
  } else if (option.action === 'back-to-picker') {
    backToPicker()
  }
}

// Regenerate with notes (Coming Soon - prefixed with _ to mark as intentionally unused)
async function _regenerateWithNotes() {
  // TODO: Implement regeneration with user notes
  // This would call a new API endpoint to regenerate based on current suggestion + notes
  console.log('Regenerate with notes:', regenerateNotes.value)
}

// Back to section picker
function backToPicker() {
  currentView.value = 'picker'
  selectedSection.value = null
  selectedField.value = null
  currentQuestion.value = null
  questionHistory.value = []
  currentFieldSuggestion.value = null
  regenerateNotes.value = ''
  coachingMessage.value = 'I\'ll help you craft a compelling HERO story. Which section would you like to work on?'
}

// Fetch linked experience on mount
onMounted(async () => {
  await fetchLinkedExperience()
})
</script>

<template>
  <div class="h-full flex flex-col space-y-4">
    <!-- Error Display -->
    <div v-if="error">
      <UAlert
        color="error"
        variant="subtle"
        :title="error"
        :close-button="{ icon: 'i-lucide-x', color: 'error', variant: 'ghost' }"
        @close="error = null"
      />
    </div>

    <!-- AI Coaching Header -->
    <div class="bg-primary-500/10 border border-primary-200/70 dark:border-primary-700/60 rounded-2xl p-4">
      <div class="flex gap-3 items-start">
        <UIcon name="i-lucide-sparkles" class="w-6 h-6 text-primary-600 dark:text-primary-400 shrink-0 mt-0.5" />
        <div class="flex-1">
          <p class="text-base font-medium text-primary-950 dark:text-primary-200">
            {{ coachingMessage }}
          </p>
        </div>
      </div>
    </div>

    <!-- Section Picker View -->
    <div v-if="currentView === 'picker'" class="flex-1">
      <div class="grid grid-cols-2 gap-4">
        <button
          v-for="section in sections"
          :key="section.id"
          type="button"
          :disabled="!section.available"
          :class="[
            'p-6 rounded-lg border-2 transition-all duration-200 text-left',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
            section.available
              ? 'border-primary-300 dark:border-primary-600 bg-white dark:bg-gray-800 hover:border-primary-500 hover:shadow-md cursor-pointer'
              : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 opacity-60 cursor-not-allowed'
          ]"
          @click="selectSection(section.id)"
        >
          <div class="flex flex-col gap-2">
            <UIcon :name="section.icon" class="w-8 h-8" :class="section.available ? 'text-primary-600 dark:text-primary-400' : 'text-muted'" />
            <h3 class="text-lg font-semibold">
              {{ section.label }}
            </h3>
            <p class="text-sm font-medium text-muted">
              {{ section.description }}
            </p>
            <p class="text-xs text-muted">
              {{ section.subtitle }}
            </p>
            <div v-if="!section.available" class="mt-2">
              <UBadge color="neutral" variant="subtle" size="sm">
                Coming Soon
              </UBadge>
            </div>
          </div>
        </button>
      </div>
    </div>

    <!-- Field Picker View (for Hurdle section) -->
    <div v-else-if="currentView === 'field-picker'" class="flex-1 space-y-4">
      <!-- Back button -->
      <button
        type="button"
        class="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
        @click="backToPicker"
      >
        <UIcon name="i-lucide-arrow-left" class="w-4 h-4" />
        Back to sections
      </button>

      <!-- Section header -->
      <div class="flex items-center gap-3">
        <UIcon name="i-lucide-mountain" class="w-6 h-6 text-primary-600 dark:text-primary-400" />
        <h2 class="text-xl font-bold text-default">Hurdle</h2>
      </div>

      <!-- Field options -->
      <div class="grid grid-cols-1 gap-3">
        <button
          v-for="field in hurdleFields"
          :key="field.id"
          type="button"
          :class="[
            'p-5 rounded-lg border-2 transition-all duration-200 text-left',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
            'border-primary-200 dark:border-primary-700 bg-white dark:bg-gray-800 hover:border-primary-500 hover:shadow-md cursor-pointer'
          ]"
          @click="selectField(field.id)"
        >
          <div class="flex items-start gap-4">
            <div class="shrink-0 p-2 rounded-lg bg-primary-50 dark:bg-primary-900/30">
              <UIcon :name="field.icon" class="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <h3 class="text-base font-semibold">
                  {{ field.label }}
                </h3>
                <UBadge
                  v-if="hurdleFieldSessions[field.id]?.completed"
                  color="success"
                  variant="subtle"
                  size="xs"
                >
                  Done
                </UBadge>
              </div>
              <p class="text-sm font-medium text-muted">
                {{ field.description }}
              </p>
              <p class="text-xs text-muted mt-1">
                {{ field.subtitle }}
              </p>
            </div>
            <UIcon name="i-lucide-chevron-right" class="w-5 h-5 text-muted shrink-0" />
          </div>
        </button>
      </div>
    </div>

    <!-- Questions View -->
    <div v-else-if="currentView === 'questions'" class="flex-1 space-y-4 overflow-y-auto">
      <!-- Section Header -->
      <div class="">
        <h2 class="text-xl font-bold text-default">
          {{ formattedFieldName }}
        </h2>
      </div>

      <!-- Question History (previous questions) -->
      <div v-for="(item, index) in questionHistory" :key="`history-${index}`" class="opacity-60">
        <h3 class="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
          Question {{ index + 1 }}
        </h3>
        <div class="bg-muted/30 border border-default rounded-lg p-4">
          <p class="text-sm font-medium mb-2">
            {{ item.question.text }}
          </p>
          <p class="text-sm text-muted">
            Your answer: {{ item.answer }}
          </p>
        </div>
      </div>

      <!-- Current Question -->
      <div v-if="currentQuestion">
        <h3 class="text-xs font-semibold text-muted uppercase tracking-wide px-1 mb-3">
          Question {{ questionHistory.length + 1 }}
        </h3>
        <ProfileHeroStructuredQuestionView
          :question="currentQuestion"
          :is-loading="isLoading"
          :progress="formattedFieldName"
          :can-go-back="false"
          @select-option="handleOptionSelected"
        />
      </div>

      <!-- Loading State (when processing answer) -->
      <div v-else-if="isLoading" class="flex items-center gap-3 p-4 bg-muted/30 border border-default rounded-lg">
        <UIcon name="i-lucide-loader-2" class="w-5 h-5 text-primary-500 animate-spin" />
        <p class="text-sm text-muted">
          Processing your answer...
        </p>
      </div>
    </div>

    <!-- Field Complete View (after answering questions for one field) -->
    <div v-else-if="currentView === 'field-complete'" class="flex-1 flex flex-col space-y-4 overflow-y-auto">
      <!-- Section Header -->
      <div class="border-b border-gray-200 dark:border-gray-700 pb-2 opacity-60">
        <h2 class="text-xl font-bold text-default">
          {{ formattedFieldName }}
        </h2>
      </div>

      <!-- Question History (faded) -->
      <div v-for="(item, index) in questionHistory" :key="`history-complete-${index}`" class="opacity-50">
        <h3 class="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
          Question {{ index + 1 }}
        </h3>
        <div class="bg-muted/30 border border-default rounded-lg p-4">
          <p class="text-sm font-medium mb-2">
            {{ item.question.text }}
          </p>
          <p class="text-sm text-muted">
            Your answer: {{ item.answer }}
          </p>
        </div>
      </div>

      <!-- Suggestion Section -->
      <div class="bg-emerald-500/10 border border-emerald-200/70 dark:border-emerald-700/60 rounded-3xl p-5 flex flex-col gap-4">
        <!-- Header -->
        <div class="flex gap-3">
          <UIcon name="i-lucide-check-circle" class="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <p class="font-medium text-sm text-emerald-950 dark:text-emerald-200">
            {{ formattedFieldName }} Complete
          </p>
        </div>

        <!-- Editable Suggestion -->
        <div class="space-y-2">
          <label class="text-sm font-medium text-default">
            Review and edit the suggestion:
          </label>
          <UTextarea
            v-model="editableSuggestion"
            :rows="6"
            placeholder="AI-generated suggestion..."
            class="w-full"
          />
        </div>

        <!-- Regenerate Section (Coming Soon) -->
        <div class="space-y-2 pt-2 border-t border-emerald-200/50 dark:border-emerald-700/50">
          <label class="text-sm font-medium text-muted">
            Want to regenerate? (Coming Soon)
          </label>
          <div class="flex gap-2">
            <UInput
              v-model="regenerateNotes"
              placeholder="Add notes for a different focus..."
              :disabled="true"
              class="flex-1"
            />
            <UButton
              size="md"
              variant="outline"
              icon="i-lucide-refresh-cw"
              :disabled="true"
            >
              Regenerate
            </UButton>
          </div>
        </div>

        <!-- Save Action -->
        <div class="flex justify-end pt-2">
          <UButton
            color="primary"
            icon="i-lucide-check"
            @click="saveAndEnd"
          >
            Save & Apply to Form
          </UButton>
        </div>
      </div>

      <!-- Next Steps Section -->
      <div class="space-y-3">
        <p class="text-sm font-medium text-default">
          Ready to work on the next aspect?
        </p>
        <div class="grid grid-cols-1 gap-3">
          <button
            v-for="option in nextStepOptions"
            :key="option.id"
            class="flex items-center gap-3 p-4 border border-default rounded-lg hover:border-primary-500 hover:bg-primary-500/5 transition-colors text-left"
            @click="handleNextStepChoice(option)"
          >
            <UIcon :name="option.icon" class="w-5 h-5 text-primary-500 shrink-0" />
            <div class="flex-1">
              <p class="font-medium text-sm">
                {{ option.label }}
              </p>
              <p class="text-xs text-muted">
                {{ option.description }}
              </p>
            </div>
            <UIcon name="i-lucide-chevron-right" class="w-4 h-4 text-muted" />
          </button>
        </div>
      </div>
    </div>

    <!-- Suggestion View (old - for all complete) -->
    <div v-else-if="currentView === 'suggestion'" class="flex-1 space-y-4 overflow-y-auto">
      <div v-for="(fieldData, fieldKey) in hurdleFieldSessions" :key="fieldKey">
        <div v-if="fieldData.completed && fieldData.suggestion" class="bg-emerald-500/10 border border-emerald-200/70 dark:border-emerald-700/60 rounded-lg p-4">
          <div class="flex items-start justify-between gap-4 mb-2">
            <div class="flex gap-3">
              <UIcon name="i-lucide-check-circle" class="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <p class="font-medium text-sm text-emerald-950 dark:text-emerald-200">
                {{ fieldKey.charAt(0).toUpperCase() + fieldKey.slice(1) }} - AI Suggestion
              </p>
            </div>
          </div>
          <p class="text-sm text-foreground mt-2">
            {{ fieldData.suggestion }}
          </p>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-3 justify-end pt-4">
        <UButton
          color="neutral"
          variant="ghost"
          @click="backToPicker"
        >
          Try Another Section
        </UButton>
        <UButton
          color="primary"
          icon="i-lucide-arrow-left"
          @click="acceptAllSuggestions"
        >
          Accept Suggestions
        </UButton>
      </div>
    </div>
  </div>
</template>
