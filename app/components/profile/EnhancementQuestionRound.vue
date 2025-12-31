<script setup lang="ts">
import type { QuestionGroup, ContextStory } from '#shared/types/enhancement'

interface Props {
  round: 1 | 2
  questionGroups?: QuestionGroup[]
  storyNotes?: ContextStory[]
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  questionGroups: () => [],
  storyNotes: () => [],
  isLoading: false
})

const emit = defineEmits<{
  proceed: [{ round: number; answers: Array<{ id: string; answer: string }> }]
  back: []
  cancel: []
}>()

// Track expanded questions and their answers
const expandedQuestions = ref<Set<string>>(new Set())
const answers = ref<Map<string, string>>(new Map())
const skipped = ref<Set<string>>(new Set())
const expandedGroups = ref<Set<string>>(new Set())

// Validation state
const validationError = ref('')

// Round labels and descriptions
const roundConfig = {
  1: {
    title: 'Initial Questions',
    description: 'Help us understand your achievements with some initial questions'
  },
  2: {
    title: 'Follow-up Questions',
    description: 'Based on your previous answers, here are some follow-up questions'
  }
}

function toggleQuestion(questionId: string) {
  if (expandedQuestions.value.has(questionId)) {
    expandedQuestions.value.delete(questionId)
  } else {
    expandedQuestions.value.add(questionId)
  }
}

function toggleGroup(groupIndex: number) {
  const key = `group-${groupIndex}`
  if (expandedGroups.value.has(key)) {
    expandedGroups.value.delete(key)
  } else {
    expandedGroups.value.add(key)
  }
}

function updateAnswer(questionId: string, value: string) {
  answers.value.set(questionId, value)
  // Remove from skipped if user starts typing
  if (value.trim()) {
    skipped.value.delete(questionId)
  }
}

function skipQuestion(questionId: string) {
  expandedQuestions.value.delete(questionId)
  answers.value.delete(questionId)
  skipped.value.add(questionId)
  validationError.value = ''
}

function getQuestionStatus(questionId: string): 'answered' | 'skipped' | 'unanswered' {
  if (skipped.value.has(questionId)) return 'skipped'
  if (answers.value.has(questionId) && answers.value.get(questionId)?.trim()) return 'answered'
  return 'unanswered'
}

function handleProceed() {
  // Validate: at least one question must be answered
  const answeredCount = Array.from(answers.value.values()).filter(v => v.trim()).length
  if (answeredCount === 0) {
    validationError.value = 'Please answer at least one question to proceed'
    return
  }

  validationError.value = ''
  const answeredQuestions = Array.from(answers.value.entries()).map(([id, answer]) => ({
    id,
    answer
  }))

  emit('proceed', {
    round: props.round,
    answers: answeredQuestions
  })
}

function handleBack() {
  emit('back')
}

function handleCancel() {
  emit('cancel')
}

// Expand all groups by default
onMounted(() => {
  props.questionGroups?.forEach((_, index) => {
    expandedGroups.value.add(`group-${index}`)
  })
})
</script>

<template>
  <div class="space-y-6">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="text-center">
        <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
        <p class="text-sm text-muted">Generating questions...</p>
      </div>
    </div>

    <template v-else>
      <!-- Process Explanation Banner -->
      <div class="bg-primary-50 border border-primary-200 rounded-lg p-4">
        <div class="flex gap-3">
          <UIcon name="i-lucide-info" class="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
          <div class="text-sm text-primary-900">
            <p v-if="round === 1" class="font-medium mb-1">Answer these questions to build your achievement story</p>
            <p v-else class="font-medium mb-1">Review your responses and answer follow-up questions</p>
            <p class="text-muted text-xs">Your answers help us craft compelling achievement statements for your resume.</p>
          </div>
        </div>
      </div>

      <!-- Story Notes Section -->
      <div class="space-y-3">
        <!-- Story Notes Header -->
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wide flex items-center gap-2">
            <UIcon name="i-lucide-sparkles" class="w-5 h-5 text-teal-500" />
            Your Context Stories
          </h3>
          <span v-if="round === 1" class="text-xs text-gray-500">{{ storyNotes?.length || 0 }} captured</span>
        </div>

        <!-- Round 1: Empty State or Growing List -->
        <div v-if="round === 1" class="border-l-4 border-teal-500 bg-teal-50 p-4 rounded">
          <div v-if="storyNotes && storyNotes.length > 0" class="space-y-2">
           
            <ul class="space-y-2">
              <li v-for="note in storyNotes" :key="note.title" class="flex gap-2 text-sm text-gray-700">
                <span class="text-primary shrink-0">•</span>
                <span>{{ note.text }}</span>
              </li>
            </ul>
          </div>
          <div v-else class="flex items-start gap-3">
            <UIcon name="i-lucide-lightbulb" class="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
            <div class="text-sm text-gray-600">
              <p class="font-medium mb-1">No notes yet</p>
              <p class="text-xs text-gray-500">As you answer questions, key insights will appear here.</p>
            </div>
          </div>
        </div>

        <!-- Round 2: Full Story Notes Display -->
        <div v-else-if="round === 2 && storyNotes && storyNotes.length > 0" class="border-l-4 border-teal-500 bg-teal-50 p-4 rounded">
          <ul class="space-y-2">
            <li v-for="note in storyNotes" :key="note.title" class="flex gap-2 text-sm text-gray-700">
              <span class="text-teal-500 shrink-0">•</span>
              <span>{{ note.text }}</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Validation Error -->
      <div v-if="validationError" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
        {{ validationError }}
      </div>

      <!-- Question Groups -->
      <div class="space-y-4">
        <div v-for="(group, groupIndex) in questionGroups" :key="`group-${groupIndex}`" class="space-y-3 border border-gray-200 rounded-lg overflow-hidden">
          <!-- Group Header (Collapsible) -->
          <button
            @click="toggleGroup(groupIndex)"
            class="w-full cursor-pointer flex items-center justify-between px-4 py-3 rounded-lg hover:bg-teal-50 transition-colors"
          >
            <div class="flex items-center gap-3 text-left">
              <UIcon
                :name="expandedGroups.has(`group-${groupIndex}`) ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
                class="w-5 h-5 text-gray-600"
              />
              <span class="font-semibold text-gray-900">{{ group.category }}</span>
            </div>
            <span class="text-xs text-gray-500">{{ group.questions?.length || 0 }} questions</span>
          </button>

          <!-- Questions (Expanded) -->
          <div v-if="expandedGroups.has(`group-${groupIndex}`)" class="space-y-3 pl-4 pr-2">
            <div
              v-for="question in group.questions"
              :key="question.id"
              class="border border-gray-200 rounded-lg overflow-hidden"
            >
              <!-- Question Header -->
              <button
                @click="toggleQuestion(question.id)"
                class="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-teal-50 transition-colors text-left cursor-pointer"
              >
                <div class="flex items-center gap-3 flex-1">
                  <UIcon
                    :name="expandedQuestions.has(question.id) ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
                    class="w-4 h-4 text-gray-500 shrink-0"
                  />
                  <span class="text-sm text-gray-500 uppercase tracking-wider">{{ question.id }}.</span>
                  <p class="text-sm text-gray-900">{{ question.text }}</p>
                </div>

                <!-- Status Badge -->
                <div class="ml-2 shrink-0">
                  <UBadge
                    v-if="getQuestionStatus(question.id) === 'answered'"
                    color="success"
                    variant="soft"
                    size="sm"
                  >
                    Answered
                  </UBadge>
                  <UBadge
                    v-else-if="getQuestionStatus(question.id) === 'skipped'"
                    color="neutral"
                    variant="soft"
                    size="sm"
                  >
                    Skipped
                  </UBadge>
                </div>
              </button>

              <!-- Question Content (Expanded) -->
              <div
                v-if="expandedQuestions.has(question.id)"
                class="p-3 border-t border-gray-200 space-y-3"
              >
                <!-- Textarea Input -->
                <UTextarea
                  :model-value="answers.get(question.id) || ''"
                  @update:model-value="(value: string) => updateAnswer(question.id, value)"
                  placeholder="Type your answer here..."
                  :rows="3"
                  class="w-full"
                />

                <!-- Skip Button -->
                <div class="flex justify-end">
                  <button
                    @click="skipQuestion(question.id)"
                    class="text-xs text-neutral hover:text-warning font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <span>Skip</span>
                    <UIcon name="i-lucide-arrow-right" class="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

