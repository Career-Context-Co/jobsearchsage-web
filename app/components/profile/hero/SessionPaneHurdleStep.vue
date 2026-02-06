<script setup lang="ts">
import { useSageAIStore } from '@/stores/sageAIStore'

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

interface FieldSession {
  sessionId: number | null
  currentQuestion: StructuredQuestion | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  questionHistory: any[]
  isLoading: boolean
  suggestion: string | null
  isComplete: boolean
}

interface Props {
  answers?: Record<string, string>
  suggestions?: Record<string, string>
  isLoading?: boolean
  storyId?: string
  profileId?: string
}

const props = withDefaults(defineProps<Props>(), {
  answers: () => ({}),
  suggestions: undefined,
  isLoading: false,
  storyId: '',
  profileId: ''
})

const emit = defineEmits<{
  'update:answers': [answers: Record<string, string>]
  'submit': []
}>()

// Store
const sageAIStore = useSageAIStore()

// Field groups configuration
const fieldGroups = [
  {
    id: 'problem',
    label: 'Problem',
    title: 'The Specific Challenge',
    description: 'Define what the problem was'
  },
  {
    id: 'scope',
    label: 'Scope',
    title: 'Size & Scale',
    description: 'Define who was affected and how often'
  },
  {
    id: 'stakes',
    label: 'Stakes',
    title: 'Why It Mattered',
    description: 'Define what was at risk'
  }
]

// Session state for each field
const problemSession = ref<FieldSession>({
  sessionId: null,
  currentQuestion: null,
  questionHistory: [],
  isLoading: false,
  suggestion: null,
  isComplete: false
})

const scopeSession = ref<FieldSession>({
  sessionId: null,
  currentQuestion: null,
  questionHistory: [],
  isLoading: false,
  suggestion: null,
  isComplete: false
})

const stakesSession = ref<FieldSession>({
  sessionId: null,
  currentQuestion: null,
  questionHistory: [],
  isLoading: false,
  suggestion: null,
  isComplete: false
})

// Expanded groups tracking
const expandedGroups = ref<Set<string>>(new Set(['problem'])) // Problem expanded by default

// Computed: Can each field be submitted?
const canSubmitScope = computed(() => problemSession.value.isComplete)
const canSubmitStakes = computed(() => scopeSession.value.isComplete)

// Get session for a field
function getSessionForField(field: string): FieldSession {
  switch (field) {
    case 'problem':
      return problemSession.value
    case 'scope':
      return scopeSession.value
    case 'stakes':
      return stakesSession.value
    default:
      throw new Error(`Unknown field: ${field}`)
  }
}

// Get status badge color for a group
function getGroupStatus(field: string): 'answered' | 'loading' | 'disabled' | 'unanswered' {
  const session = getSessionForField(field)

  if (session.isLoading) return 'loading'
  if (session.isComplete) return 'answered'
  if (field === 'scope' && !canSubmitScope.value) return 'disabled'
  if (field === 'stakes' && !canSubmitStakes.value) return 'disabled'

  return 'unanswered'
}

// Toggle group expansion
function toggleGroup(groupId: string) {
  if (expandedGroups.value.has(groupId)) {
    expandedGroups.value.delete(groupId)
  } else {
    expandedGroups.value.add(groupId)
  }
}

// Handle option selection from StructuredQuestionView
async function handleOptionSelected(field: string, data: { optionId: string, customText?: string }) {
  const session = getSessionForField(field)

  if (!session.sessionId) {
    console.error('No session ID for field:', field)
    return
  }

  try {
    session.isLoading = true

    // Call API through store to continue session
    const response = await sageAIStore.continueHeroEnhancementSession(
      session.sessionId,
      {
        selectedOption: data.optionId,
        customText: data.customText
      }
    )

    if (response.is_complete) {
      // Field conversation complete
      session.isComplete = true
      session.currentQuestion = null

      // Extract the field value from final_output
      const fieldMapping: Record<string, string> = {
        problem: 'hurdleProblem',
        scope: 'hurdleScope',
        stakes: 'hurdleStakes'
      }
      const dbFieldName = fieldMapping[field]
      if (dbFieldName && response.final_output) {
        session.suggestion = response.final_output[dbFieldName] || 'No suggestion generated'
      } else {
        session.suggestion = 'No suggestion generated'
      }
    } else {
      // More questions remain
      session.currentQuestion = response.current_question
    }
  } catch (error) {
    console.error('Failed to submit answer:', error)
    // TODO: Show error toast
  } finally {
    session.isLoading = false
  }
}

// Start a field session
async function startFieldSession(field: string) {
  const session = getSessionForField(field)

  if (session.sessionId) {
    // Session already started
    return
  }

  // Validate required props
  if (!props.profileId || !props.storyId) {
    console.error('Missing required props: profileId or storyId', {
      profileId: props.profileId,
      storyId: props.storyId
    })
    return
  }

  try {
    session.isLoading = true

    // Get previous field results for context
    const previousResults: Record<string, string> = {}
    if (field === 'scope' && problemSession.value.suggestion) {
      previousResults.problem = problemSession.value.suggestion
    }
    if (field === 'stakes') {
      if (problemSession.value.suggestion) previousResults.problem = problemSession.value.suggestion
      if (scopeSession.value.suggestion) previousResults.scope = scopeSession.value.suggestion
    }

    console.log('Starting field session:', {
      profileId: props.profileId,
      storyId: props.storyId,
      field,
      previousResults
    })

    // Call API through store to start session
    const response = await sageAIStore.startHeroEnhancementSession(
      props.profileId,
      props.storyId,
      'hurdle',
      { field1: '', field2: '', field3: '' },
      {
        field: field,
        previousFieldResults: previousResults
      }
    )

    console.log('Start field session response:', response)

    session.sessionId = response.session_id
    session.currentQuestion = response.current_question || null
  } catch (error) {
    console.error('Failed to start field session:', error)
    // TODO: Show error toast
  } finally {
    session.isLoading = false
  }
}

// Expand all by default
onMounted(() => {
  expandedGroups.value.add('problem')
})

// Check if all fields are complete
const allFieldsComplete = computed(() => {
  return problemSession.value.isComplete
    && scopeSession.value.isComplete
    && stakesSession.value.isComplete
})

// Watch for completion (no auto-submit in structured mode - user clicks Accept Suggestions)
// watch(allFieldsComplete, (isComplete) => {
//   if (isComplete) {
//     // All fields complete - could emit or show final suggestions
//     emit('submit')
//   }
// })

// Apply individual field suggestion to form
function applyFieldSuggestion(field: string) {
  const session = getSessionForField(field)
  if (!session.suggestion) return

  const suggestions: Record<string, string> = {
    [field]: session.suggestion
  }

  // Emit to parent in the format expected by handleAcceptAISuggestions
  emit('update:answers', suggestions)
}

// Apply all suggestions to form
function applyAllSuggestions() {
  const suggestions: Record<string, string> = {}

  if (problemSession.value.suggestion) {
    suggestions.problem = problemSession.value.suggestion
  }
  if (scopeSession.value.suggestion) {
    suggestions.scope = scopeSession.value.suggestion
  }
  if (stakesSession.value.suggestion) {
    suggestions.stakes = stakesSession.value.suggestion
  }

  // Emit to parent in the format expected by handleAcceptAISuggestions
  emit('update:answers', suggestions)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Info banner -->
    <div class="flex items-start gap-3 p-4 rounded-lg border border-emerald-200/70 dark:border-emerald-700/60 bg-emerald-500/10 dark:bg-emerald-900/20">
      <UIcon name="i-lucide-info" class="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
      <div class="text-sm text-emerald-950 dark:text-emerald-200">
        <p class="font-medium mb-1">
          Answer structured questions for each group
        </p>
        <p class="text-emerald-900/80 dark:text-emerald-200/80">
          Complete Problem first, then Scope, then Stakes. You can start filling out the next group while AI processes the previous one.
        </p>
      </div>
    </div>

    <!-- Field Groups -->
    <div class="space-y-3">
      <div
        v-for="group in fieldGroups"
        :key="group.id"
        class="border border-default rounded-lg overflow-hidden"
      >
        <!-- Group Header -->
        <div
          class="flex items-center justify-between px-4 py-3 bg-base cursor-pointer hover:bg-muted/50 transition-colors"
          @click="toggleGroup(group.id)"
        >
          <div class="flex items-center gap-3 flex-1">
            <UIcon
              :name="expandedGroups.has(group.id) ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
              class="w-5 h-5 text-muted transition-transform"
            />
            <div class="flex-1">
              <div class="font-medium text-sm">
                {{ group.label }} - {{ group.title }}
              </div>
              <div class="text-xs text-muted">
                {{ group.description }}
              </div>
            </div>
          </div>

          <!-- Status Badge -->
          <div class="flex items-center gap-2">
            <UBadge
              v-if="getGroupStatus(group.id) === 'answered'"
              color="success"
              variant="subtle"
            >
              <UIcon name="i-lucide-check-circle" class="w-3 h-3 mr-1" />
              Complete
            </UBadge>
            <UBadge
              v-else-if="getGroupStatus(group.id) === 'loading'"
              color="info"
              variant="subtle"
            >
              <UIcon name="i-lucide-loader-2" class="w-3 h-3 mr-1 animate-spin" />
              Processing
            </UBadge>
            <UBadge
              v-else-if="getGroupStatus(group.id) === 'disabled'"
              color="neutral"
              variant="subtle"
            >
              <UIcon name="i-lucide-lock" class="w-3 h-3 mr-1" />
              Locked
            </UBadge>
            <UBadge
              v-else
              color="neutral"
              variant="subtle"
            >
              Unanswered
            </UBadge>

            <!-- Submit Button -->
            <UButton
              v-if="!getSessionForField(group.id).isComplete"
              size="sm"
              color="primary"
              :disabled="getGroupStatus(group.id) === 'disabled' || getGroupStatus(group.id) === 'loading'"
              @click.stop="startFieldSession(group.id)"
            >
              {{ getSessionForField(group.id).sessionId ? 'Continue' : 'Start' }}
            </UButton>
          </div>
        </div>

        <!-- Group Content (Collapsible) -->
        <div
          v-show="expandedGroups.has(group.id)"
          class="p-4 border-t border-default bg-muted/30"
        >
          <!-- Show current question or suggestion -->
          <div v-if="getSessionForField(group.id).isComplete">
            <!-- Suggestion display -->
            <div class="bg-emerald-500/10 border border-emerald-200/70 dark:border-emerald-700/60 rounded-lg p-4">
              <div class="flex items-start justify-between gap-4 mb-2">
                <div class="flex gap-3">
                  <UIcon name="i-lucide-sparkles" class="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <p class="font-medium text-sm text-emerald-950 dark:text-emerald-200">
                    AI Suggestion
                  </p>
                </div>
                <UButton
                  size="sm"
                  color="primary"
                  icon="i-lucide-arrow-left"
                  @click="applyFieldSuggestion(group.id)"
                >
                  Accept Suggestions
                </UButton>
              </div>
              <p class="text-sm text-foreground mt-2">
                {{ getSessionForField(group.id).suggestion }}
              </p>
            </div>
          </div>

          <div v-else-if="getSessionForField(group.id).currentQuestion">
            <!-- Structured Question View -->
            <ProfileHeroStructuredQuestionView
              :question="getSessionForField(group.id).currentQuestion!"
              :is-loading="getSessionForField(group.id).isLoading"
              :progress="`Question for ${group.label}`"
              :can-go-back="false"
              @select-option="(data) => handleOptionSelected(group.id, data)"
            />
          </div>

          <div v-else-if="getGroupStatus(group.id) === 'disabled'">
            <!-- Disabled state -->
            <div class="flex items-center gap-3 p-4 text-sm text-muted">
              <UIcon name="i-lucide-lock" class="w-5 h-5" />
              <p>Complete the previous group first</p>
            </div>
          </div>

          <div v-else>
            <!-- Not started -->
            <div class="flex items-center gap-3 p-4 text-sm text-muted">
              <UIcon name="i-lucide-circle-help" class="w-5 h-5" />
              <p>Click "Start" to begin answering questions for this group</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- All Complete Message -->
    <div v-if="allFieldsComplete" class="bg-primary-500/10 border border-primary-200/70 dark:border-primary-700/60 rounded-lg p-4">
      <div class="flex items-start justify-between gap-4">
        <div class="flex gap-3">
          <UIcon name="i-lucide-check-circle-2" class="w-5 h-5 text-primary-600 dark:text-primary-400 shrink-0" />
          <div class="text-sm">
            <p class="font-medium text-primary-950 dark:text-primary-200 mb-1">
              All groups complete!
            </p>
            <p class="text-primary-900/80 dark:text-primary-200/80">
              Accept suggestions individually above, or click here to accept all at once.
            </p>
          </div>
        </div>
        <UButton
          size="sm"
          color="primary"
          icon="i-lucide-arrow-left"
          @click="applyAllSuggestions"
        >
          Accept All Suggestions
        </UButton>
      </div>
    </div>
  </div>
</template>
