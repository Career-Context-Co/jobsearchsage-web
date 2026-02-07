<script setup lang="ts">
interface QuestionOption {
  id: string
  label: string
  emoji?: string
  allowCustom?: boolean
}

interface StructuredQuestion {
  id: string
  text: string
  field: string
  options: QuestionOption[]
}

interface Props {
  question: StructuredQuestion
  isLoading?: boolean
  progress?: string // e.g. "Question 1 of 3"
  canGoBack?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  progress: '',
  canGoBack: false
})

const emit = defineEmits<{
  'select-option': [{ optionId: string, customText?: string }]
  'back': []
}>()

// Local state
const selectedOption = ref<string | null>(null)
const customText = ref('')
const showCustomInput = ref(false)

// Handle option selection
function selectOption(optionId: string, allowCustom?: boolean) {
  selectedOption.value = optionId

  if (allowCustom) {
    showCustomInput.value = true
    // Don't emit yet - wait for user to enter custom text
  } else {
    showCustomInput.value = false
    customText.value = ''
    // Emit immediately for non-custom options
    emit('select-option', { optionId })
  }
}

// Handle custom text submission
function submitCustomText() {
  if (!selectedOption.value) return

  if (!customText.value.trim()) {
    // Show error or prevent submission
    return
  }

  emit('select-option', {
    optionId: selectedOption.value,
    customText: customText.value.trim()
  })
}

// Handle back button
function goBack() {
  emit('back')
}

// Reset when question changes
watch(() => props.question.id, () => {
  selectedOption.value = null
  customText.value = ''
  showCustomInput.value = false
})
</script>

<template>
  <div class="structured-question-view">
    <!-- Question text -->
    <h3 class="text-lg font-semibold mb-6 text-gray-900 dark:text-gray-100">
      {{ question.text }}
    </h3>

    <!-- Loading state -->
    <div v-if="isLoading" class="flex items-center justify-center py-8">
      <UIcon name="i-lucide-loader-2" class="w-6 h-6 animate-spin text-primary" />
      <span class="ml-2 text-gray-600 dark:text-gray-400">Processing...</span>
    </div>

    <!-- Options grid -->
    <div v-else class="space-y-4">
      <!-- Option buttons -->
      <div class="flex flex-col gap-4">
        <button
          v-for="option in question.options"
          :key="option.id"
          type="button"
          :class="[
            'flex items-center p-4 rounded-2xl border-2 transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
            selectedOption === option.id
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 shadow-md'
              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary-300 dark:hover:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20',
            selectedOption && selectedOption !== option.id ? 'opacity-60' : ''
          ]"
          @click="selectOption(option.id, option.allowCustom)"
        >
          <span v-if="option.emoji" class="text-2xl mr-2">{{ option.emoji }}</span>
          <span class="flex-1 text-left">{{ option.label }}</span>
          <UIcon
            v-if="selectedOption === option.id"
            name="i-lucide-check-circle"
            class="w-5 h-5 text-primary-500"
          />
        </button>
      </div>

      <!-- Custom text input (shown when "Other" is selected) -->
      <div v-if="showCustomInput" class="mt-4 space-y-3">
        <UTextarea
          v-model="customText"
          placeholder="Please specify..."
          :rows="3"
          autofocus
          class="w-full"
        />
        <div class="flex justify-end gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            size="sm"
            @click="showCustomInput = false; selectedOption = null"
          >
            Cancel
          </UButton>
          <UButton
            color="primary"
            size="sm"
            :disabled="!customText.trim()"
            @click="submitCustomText"
          >
            Submit
          </UButton>
        </div>
      </div>

      <!-- Navigation buttons -->
      <div class="flex justify-between mt-6 pt-4 border-gray-200 dark:border-gray-700">
        <UButton
          v-if="canGoBack"
          color="neutral"
          variant="ghost"
          icon="i-lucide-arrow-left"
          @click="goBack"
        >
          Back
        </UButton>
        <div v-else />
      </div>
    </div>
  </div>
</template>
