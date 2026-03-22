<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCareerIDStore } from '~/stores/careerIDStore'

const emit = defineEmits<{
  uploadComplete: [extracted: boolean]
}>()

const store = useCareerIDStore()
const selectedFile = ref<File | null>(null)

const ALLOWED_EXTENSIONS = ['pdf', 'txt', 'md']
const maxFileSize = 10 * 1024 * 1024 // 10MB in bytes

// Use store state
const isUploading = computed(() => store.isExtracting)
const hasPerformedExtraction = computed(() => store.hasPerformedExtraction)
const uploadError = computed(() => store.extractionError)

// Called by UFileUpload @change — fires after v-model is updated (drag or browse)
function handleFileChange() {
  if (!selectedFile.value) return

  const ext = selectedFile.value.name.toLowerCase().split('.').pop() ?? ''

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    store.extractionError = `"${selectedFile.value.name}" is not a supported file type. Please upload a PDF, TXT, or MD file.`
    selectedFile.value = null
    return
  }

  if (selectedFile.value.size > maxFileSize) {
    store.extractionError = `File is too large (${(selectedFile.value.size / 1024 / 1024).toFixed(1)} MB). Maximum size is 10 MB.`
    selectedFile.value = null
    return
  }

  store.extractionError = null
}

function extractApiErrorCode(error: any): string | null {
  return (
    error?.data?.data?.error?.code ??
    error?.data?.error?.code ??
    null
  )
}

// Handle file upload
async function handleUpload() {
  if (!selectedFile.value) return

  try {
    const response = await store.extractResumeData(selectedFile.value)
    store.applyExtractionToProfile()
    emit('uploadComplete', true)
  } catch (error: any) {
    const errorCode = extractApiErrorCode(error)

    if (errorCode === 'FILE_TOO_LARGE') {
      store.extractionError = 'File is too large. Maximum size is 10 MB.'
    } else if (errorCode === 'INVALID_EXTENSION' || errorCode === 'INVALID_MIME_TYPE') {
      store.extractionError = 'File format not supported. Please upload a PDF, TXT, or MD file.'
    } else if (errorCode === 'EXTRACTION_TIMEOUT') {
      store.extractionError = 'Extraction timed out. Please try again or use a smaller file.'
    } else if (errorCode === 'SERVICE_UNAVAILABLE') {
      store.extractionError = 'AI service is temporarily unavailable. Please try again in a moment.'
    } else if (errorCode === 'EXTRACTION_SERVICE_ERROR' || errorCode === 'EXTRACTION_PARSE_ERROR') {
      store.extractionError = 'We couldn\'t read this resume. Please try a different file format.'
    } else {
      store.extractionError = getApiErrorMessage(error, 'We couldn\'t read this resume. Please try a different file.')
    }
  }
}

// Handle skip button
function handleSkip() {
  emit('uploadComplete', false)
}

// Handle retry after error
function handleRetry() {
  selectedFile.value = null
  store.extractionError = null
}
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-4">
    <!-- Header -->
    <div class="flex flex-col gap-2">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
        Upload Your Resume
      </h2>
      <p class="text-gray-600 dark:text-gray-400">
        <strong>Want to save 15-20 minutes?</strong> Upload your resume and we'll extract your information automagically! 🪄🧙
      </p>
    </div>

    <!-- Help Text -->
    <div class="flex items-start gap-3 p-4 bg-primary-50 dark:bg-primary-950/20 rounded-lg border border-primary-200 dark:border-primary-800">
      <UIcon name="i-lucide-info" class="w-5 h-5 text-primary-600 dark:text-primary-400 shrink-0 mt-0.5" />
      <p class="text-sm text-primary-900 dark:text-primary-200">
        AI extraction isn't perfect — some details may be missing or incorrect, but don't worry, you can review and correct everything in the next steps.
        We don't store your resume and only use it to extract info.
      </p>
    </div>

    <!-- File Upload Area -->
    <div class="flex flex-col gap-4">
      <!-- Upload dropzone — only shown when no file is selected -->
      <UFileUpload
        v-if="!selectedFile"
        v-model="selectedFile"
        :multiple="false"
        highlight
        icon="i-lucide-upload-cloud"
        label="Drop your resume here or click to browse"
        description="Supported formats: PDF, TXT, MD (max 10 MB)"
        :preview="false"
        class="cursor-pointer"
        @change="handleFileChange"
      />

      <!-- File selected — clear confirmation with option to change -->
      <div v-if="selectedFile && !isUploading" class="flex items-center gap-3 p-4  rounded-lg border border-primary-500 dark:border-primary-500">
        <UIcon name="i-lucide-file-check" class="w-6 h-6 text-primary-600 dark:text-primary-400 shrink-0" />
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
            {{ selectedFile.name }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB
          </p>
        </div>
        <UButton
          label="Remove"
          icon="i-lucide-x"
          size="xs"
          color="neutral"
          variant="ghost"
          class="cursor-pointer shrink-0"
          @click="selectedFile = null"
        />
      </div>

      <!-- Upload Progress -->
      <div v-if="isUploading" class="flex flex-col gap-2">
        <div class="flex items-center gap-3">
          <UIcon name="i-lucide-loader-circle" class="w-5 h-5 text-primary-500 animate-spin" />
          <p class="text-sm text-gray-700 dark:text-gray-300">
            Extracting your career information with AI... This may take 10-15 seconds.
          </p>
        </div>
        <UProgress :value="100" animation="carousel" />
      </div>

      <!-- Error Display -->
      <UAlert
        v-if="uploadError"
        color="error"
        icon="i-lucide-alert-circle"
        :title="uploadError"
        :close-button="{ icon: 'i-lucide-x', color: 'error', variant: 'ghost' }"
        @close="store.extractionError = null"
      >
        <template #actions>
          <div class="flex gap-2">
            <UButton
              label="Try Another File"
              size="xs"
              color="error"
              variant="subtle"
              @click="handleRetry"
            />
          </div>
        </template>
      </UAlert>

      <!-- Already extracted banner -->
      <div v-if="hasPerformedExtraction" class="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800 flex items-center gap-2">
        <UIcon name="i-lucide-check-circle" class="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <p class="text-sm text-blue-900 dark:text-blue-200">
          Resume information extracted. Click <strong>Continue</strong> to review the results.
        </p>
      </div>

      <!-- Extract button — full width, prominent CTA -->
      <UButton
        v-if="selectedFile && !isUploading"
        class="cursor-pointer w-full justify-center text-base"
        label="Extract Information"
        size="xl"
        color="primary"
        leading-icon="i-lucide-sparkles"
        :disabled="hasPerformedExtraction"
        @click="handleUpload"
      />
    </div>

    <!-- Hint to skip -->
    <p v-if="!selectedFile && !hasPerformedExtraction" class="text-center text-sm text-gray-400 dark:text-gray-500">
      No resume? No problem — click <strong>Continue</strong> below to enter your info manually.
    </p>
  </div>
</template>
