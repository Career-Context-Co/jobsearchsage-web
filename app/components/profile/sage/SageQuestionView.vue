<script setup lang="ts">
import type { SageQuestion } from '#shared/types/enhancement'

const props = withDefaults(defineProps<{
  question: SageQuestion
  progress?: string
  isLoading?: boolean
  initialAnswer?: string | string[]
  canGoBack?: boolean
}>(), {
  progress: '',
  isLoading: false,
  initialAnswer: undefined,
  canGoBack: false
})

const emit = defineEmits<{
  answer: [questionId: string, value: string | string[], questionText: string]
  back: []
}>()

const freeFormAnswer = ref('')
const selectedOptionIds = ref<string[]>([])
const customText = ref('')

const selectedCustomOption = computed(() =>
  (props.question.options ?? []).find(option => option.allowCustom && selectedOptionIds.value.includes(option.id))
)

const canSubmitFreeForm = computed(() =>
  freeFormAnswer.value.trim().length > 0 && !props.isLoading
)

const canSubmitMultiChoice = computed(() =>
  selectedOptionIds.value.length > 0
  && !props.isLoading
  && (!selectedCustomOption.value || customText.value.trim().length > 0)
)

const canSubmitSingleChoice = computed(() =>
  selectedOptionIds.value.length === 1
  && !props.isLoading
  && (!selectedCustomOption.value || customText.value.trim().length > 0)
)

const questionTypeHint = computed(() => {
  if (props.question.type === 'single_choice') {
    return 'Choose one'
  }

  if (props.question.type === 'multi_choice') {
    return 'Select all that apply'
  }

  return 'Write your answer'
})

function resetLocalState() {
  freeFormAnswer.value = ''
  selectedOptionIds.value = []
  customText.value = ''

  if (props.initialAnswer === undefined) return

  if (props.question.type === 'free_form') {
    freeFormAnswer.value = typeof props.initialAnswer === 'string' ? props.initialAnswer : props.initialAnswer.join(', ')
    return
  }

  const answerValues = Array.isArray(props.initialAnswer)
    ? props.initialAnswer
    : [props.initialAnswer]
  const optionIds: string[] = []
  let customAnswer = ''

  answerValues.forEach((answer) => {
    const matchingOption = props.question.options?.find(option => option.label === answer)
    if (matchingOption) {
      optionIds.push(matchingOption.id)
      return
    }

    const customOption = props.question.options?.find(option => option.allowCustom)
    if (customOption) {
      optionIds.push(customOption.id)
      customAnswer = answer
    }
  })

  selectedOptionIds.value = props.question.type === 'single_choice'
    ? optionIds.slice(0, 1)
    : optionIds
  customText.value = customAnswer
}

function selectSingleChoice(optionId: string) {
  if (props.isLoading) return

  const option = props.question.options?.find(item => item.id === optionId)
  if (!option) return

  selectedOptionIds.value = [optionId]
  if (!option.allowCustom) customText.value = ''
}

function toggleMultiChoice(optionId: string) {
  if (props.isLoading) return

  selectedOptionIds.value = selectedOptionIds.value.includes(optionId)
    ? selectedOptionIds.value.filter(id => id !== optionId)
    : [...selectedOptionIds.value, optionId]
}

function submitFreeForm() {
  if (!canSubmitFreeForm.value) return
  emit('answer', props.question.id, freeFormAnswer.value.trim(), props.question.text)
}

function submitSingleChoice() {
  if (!canSubmitSingleChoice.value) return

  const option = props.question.options?.find(item => item.id === selectedOptionIds.value[0])
  if (!option) return

  emit(
    'answer',
    props.question.id,
    option.allowCustom ? customText.value.trim() : option.label,
    props.question.text
  )
}

function submitMultiChoice() {
  if (!canSubmitMultiChoice.value) return

  const selectedLabels = selectedOptionIds.value
    .map((optionId) => {
      const option = props.question.options?.find(item => item.id === optionId)
      if (!option) return null
      return option.allowCustom ? customText.value.trim() : option.label
    })
    .filter((label): label is string => !!label)

  emit('answer', props.question.id, selectedLabels, props.question.text)
}

watch(
  () => [props.question.id, props.initialAnswer] as const,
  resetLocalState,
  { immediate: true }
)
</script>

<template>
  <div class="flex flex-col gap-4">
    <p
      v-if="progress"
      class="text-xs font-semibold text-muted uppercase tracking-wide"
    >
      {{ progress }}
    </p>

    <div
      v-if="question.type === 'free_form'"
      class="space-y-4"
    >
      <div class="space-y-2">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {{ question.text }}
        </h3>
        <p class="text-sm text-muted">
          {{ questionTypeHint }}
        </p>
      </div>
      <UTextarea
        v-model="freeFormAnswer"
        autoresize
        :rows="4"
        :placeholder="question.placeholder || 'Share a few details...'"
        :disabled="isLoading"
        class="w-full"
      />
      <div class="flex justify-between">
        <UButton
          v-if="canGoBack"
          label="Back"
          color="neutral"
          variant="ghost"
          icon="i-lucide-arrow-left"
          class="cursor-pointer"
          :disabled="isLoading"
          @click="emit('back')"
        />
        <div v-else />
        <UButton
          label="Continue"
          color="primary"
          class="cursor-pointer"
          :disabled="!canSubmitFreeForm"
          :loading="isLoading"
          @click="submitFreeForm"
        />
      </div>
    </div>

    <div
      v-else
      class="space-y-4"
    >
      <div class="space-y-2">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {{ question.text }}
        </h3>
        <p class="text-sm text-muted">
          {{ questionTypeHint }}
        </p>
      </div>

      <div class="flex flex-col gap-3">
        <button
          v-for="option in question.options"
          :key="option.id"
          type="button"
          :disabled="isLoading"
          :class="[
            'w-full p-4 rounded-2xl border-2 transition-all duration-200 text-left',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
            selectedOptionIds.includes(option.id)
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 shadow-md'
              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary-300 dark:hover:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20',
            isLoading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
          ]"
          @click="question.type === 'single_choice' ? selectSingleChoice(option.id) : toggleMultiChoice(option.id)"
        >
          {{ option.label }}
        </button>
      </div>

      <UTextarea
        v-if="selectedCustomOption"
        v-model="customText"
        placeholder="Please specify..."
        :rows="3"
        autofocus
        :disabled="isLoading"
        class="w-full"
      />

      <div class="flex justify-between">
        <UButton
          v-if="canGoBack"
          label="Back"
          color="neutral"
          variant="ghost"
          icon="i-lucide-arrow-left"
          class="cursor-pointer"
          :disabled="isLoading"
          @click="emit('back')"
        />
        <div v-else />
        <UButton
          label="Continue"
          color="primary"
          class="cursor-pointer"
          :disabled="question.type === 'single_choice' ? !canSubmitSingleChoice : !canSubmitMultiChoice"
          :loading="isLoading"
          @click="question.type === 'single_choice' ? submitSingleChoice() : submitMultiChoice()"
        />
      </div>
    </div>
  </div>
</template>
