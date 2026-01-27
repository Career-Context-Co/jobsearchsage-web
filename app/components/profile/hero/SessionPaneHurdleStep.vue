<script setup lang="ts">
interface Props {
  answers?: Record<string, string>
  suggestions?: Record<string, string>
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  answers: () => ({}),
  suggestions: undefined,
  isLoading: false
})

const emit = defineEmits<{
  'update:answers': [answers: Record<string, string>]
  submit: []
}>()

// Question groups configuration
const questionGroups = [
  {
    id: 'problem',
    label: 'Problem',
    title: 'The Specific Challenge',
    question: 'Tell us about the problem you faced',
    placeholder: 'What was the specific problem or opportunity you identified?'
  },
  {
    id: 'scope',
    label: 'Scope',
    title: 'Size & Scale',
    question: 'Define the scope and size of the problem',
    placeholder: 'How big was the problem? Who or what was affected?'
  },
  {
    id: 'stakes',
    label: 'Stakes',
    title: 'Why It Mattered',
    question: 'What were the stakes? Why did it matter?',
    placeholder: 'What was at risk? Why did this matter to the business or team?'
  }
]

// Track expanded groups and local answers
const expandedGroups = ref<Set<string>>(new Set())
const localAnswers = ref<Record<string, string>>({ ...props.answers })
const skipped = ref<Set<string>>(new Set())
const hasAnyAnswer = computed(() => {
  return Object.values(localAnswers.value).some(value => value?.trim())
})

// Get question status
function getQuestionStatus(questionId: string): 'answered' | 'skipped' | 'unanswered' {
  if (skipped.value.has(questionId)) return 'skipped'
  if (localAnswers.value[questionId]?.trim()) return 'answered'
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

// Update answer in real-time
function updateAnswer(questionId: string, value: string) {
  localAnswers.value[questionId] = value
  // Remove from skipped if user starts typing
  if (value.trim()) {
    skipped.value.delete(questionId)
  }
  // Emit to parent
  emit('update:answers', { ...localAnswers.value })
}

// Skip question
function skipQuestion(questionId: string) {
  delete localAnswers.value[questionId]
  skipped.value.add(questionId)
  emit('update:answers', { ...localAnswers.value })
}

// Save question (collapse after saving)
function saveQuestion(questionId: string) {
  const group = questionGroups.find(g => g.id === questionId)
  if (group) {
    expandedGroups.value.delete(group.id)
  }
}

// Expand all groups by default
onMounted(() => {
  questionGroups.forEach((group) => {
    expandedGroups.value.add(group.id)
  })
})

// Watch for prop changes
watch(() => props.answers, (newAnswers) => {
  localAnswers.value = { ...newAnswers }
}, { deep: true })
</script>

<template>
  <div class="space-y-6">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="text-center">
        <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
        <p class="text-sm text-muted">Generating suggestions...</p>
      </div>
    </div>

    <div class="flex items-start gap-3 p-4 rounded-lg border border-emerald-200/70 dark:border-emerald-700/60 bg-emerald-500/10 dark:bg-emerald-900/20">
      <UIcon name="i-lucide-info" class="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
      <div class="text-sm text-emerald-950 dark:text-emerald-200">
        <p class="font-medium mb-1">Hurdle step: define the challenge clearly</p>
        <p class="text-emerald-900/80 dark:text-emerald-200/80">
          Focus on the specific problem, who or what it impacted, and why it mattered. Concrete scope and stakes help us craft a stronger HERO story.
        </p>
      </div>
    </div>

    <!-- AI Suggestions (Read-only) - Shown after generation -->
    <div v-if="suggestions && Object.keys(suggestions).length > 0" class="space-y-4">
      <div class="bg-emerald-500/10 border border-emerald-200/70 dark:border-emerald-700/60 rounded-lg p-4">
        <div class="flex gap-3 mb-3">
          <UIcon name="i-lucide-sparkles" class="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div class="text-sm">
            <p class="font-medium text-emerald-950 dark:text-emerald-200 mb-1">AI Suggestions Generated</p>
            <p class="text-muted text-xs">Review the suggestions below. You can edit them before accepting.</p>
          </div>
        </div>
      </div>

      <div v-for="group in questionGroups" :key="group.id" class="space-y-2">
        <label class="block text-sm font-medium text-foreground">{{ group.title }}</label>
        <div class="bg-base border border-default rounded-lg p-3 text-sm text-foreground">
          {{ suggestions[group.id] || 'No suggestion provided' }}
        </div>
      </div>
    </div>

    <!-- Question Groups (Input mode) -->
    <div v-else class="space-y-4">
      <!-- Question Groups -->
      <div class="space-y-3">
        <div
          v-for="group in questionGroups"
          :key="group.id"
          class="border border-default rounded-lg overflow-hidden"
        >
          <!-- Group Header (Collapsible) -->
          <button
            @click="toggleGroup(group.id)"
            class="w-full cursor-pointer flex items-center justify-between px-4 py-3 bg-base hover:bg-muted/50 transition-colors"
          >
            <div class="flex items-center gap-3 text-left">
              <UIcon
                :name="expandedGroups.has(group.id) ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
                class="w-5 h-5 text-muted"
              />
              <div>
                <span class="font-semibold text-foreground">{{ group.label }}</span>
                <span class="text-xs text-muted ml-2">- {{ group.title }}</span>
              </div>
            </div>

            <!-- Status Badge -->
            <div class="ml-2 shrink-0">
              <UBadge
                v-if="getQuestionStatus(group.id) === 'answered'"
                color="success"
                variant="soft"
                size="sm"
              >
                Answered
              </UBadge>
              <UBadge
                v-else-if="getQuestionStatus(group.id) === 'skipped'"
                color="neutral"
                variant="soft"
                size="sm"
              >
                Skipped
              </UBadge>
              <UBadge
                v-else
                color="neutral"
                variant="subtle"
                size="sm"
              >
                Unanswered
              </UBadge>
            </div>
          </button>

          <!-- Question Content (Expanded) -->
          <div
            v-if="expandedGroups.has(group.id)"
            class="p-4 border-t border-default space-y-3 bg-muted/20"
          >
            <!-- Question Text -->
            <p class="text-sm font-medium text-foreground">{{ group.question }}</p>

            <!-- Textarea Input -->
            <UTextarea
              :model-value="localAnswers[group.id] || ''"
              @update:model-value="(value: string) => updateAnswer(group.id, value)"
              :placeholder="group.placeholder"
              :rows="3"
              autoresize
              class="w-full"
            />

            <!-- Skip and Save Buttons -->
            <div class="flex justify-end gap-4">
              <button
                @click="skipQuestion(group.id)"
                class="text-xs text-neutral hover:text-foreground font-medium flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Skip</span>
              </button>
              <button
                @click="saveQuestion(group.id)"
                class="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1 cursor-pointer transition-colors"
                :disabled="!localAnswers[group.id]?.trim()"
              >
                <span>Save</span>
                <UIcon name="i-lucide-check" class="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="flex justify-end">
        <UButton
          label="Submit Answers"
          icon="i-lucide-sparkles"
          color="primary"
          class="cursor-pointer"
          :disabled="!hasAnyAnswer"
          @click="emit('submit')"
        />
      </div>
    </div>
  </div>
</template>
