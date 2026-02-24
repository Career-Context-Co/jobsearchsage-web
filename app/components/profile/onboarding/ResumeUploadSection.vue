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

// Extract the most useful message from a $fetch error.
// H3/Nitro wraps createError({ data }) in an envelope: { statusCode, statusMessage, data: {...} }
// so the structured payload lives at error.data.data; we also check the flat shape as fallback.
function extractApiErrorMessage(error: any): string | null {
  return (
    error?.data?.data?.error?.message ??
    error?.data?.data?.message ??
    error?.data?.error?.message ??
    error?.data?.message ??
    null
  )
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
    const serverMessage = extractApiErrorMessage(error)
    const errorCode = extractApiErrorCode(error)

    if (serverMessage) {
      store.extractionError = serverMessage
    } else if (errorCode === 'FILE_TOO_LARGE') {
      store.extractionError = 'File is too large. Maximum size is 10 MB.'
    } else if (errorCode === 'INVALID_EXTENSION' || errorCode === 'INVALID_MIME_TYPE') {
      store.extractionError = 'File format not supported. Please upload a PDF, TXT, or MD file.'
    } else if (errorCode === 'EXTRACTION_TIMEOUT') {
      store.extractionError = 'Extraction timed out. Please try again or use a smaller file.'
    } else if (errorCode === 'SERVICE_UNAVAILABLE') {
      store.extractionError = 'AI service is temporarily unavailable. Please try again in a moment.'
    } else if (!store.extractionError || /":\s*\d{3}\s*$/.test(String(store.extractionError).trim())) {
      store.extractionError = 'We couldn\'t read this resume. Please upload a PDF, TXT, or MD file.'
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
    <div class="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
      <UIcon name="i-lucide-info" class="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
      <p class="text-sm text-green-900 dark:text-green-200">
        We'll extract as much as we can and you can edit it in the later steps. 
        We don't store your resume and only use it to extract info. 
      </p>
    </div>

    <!-- File Upload Area -->
    <div class="flex flex-col gap-4">
      <UFileUpload
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

      <!-- Selected File Display -->
      <div v-if="selectedFile" class="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <UIcon name="i-lucide-file-text" class="w-5 h-5 text-primary-500" />
        <div class="flex-1">
          <p class="text-sm font-medium text-gray-900 dark:text-white">
            {{ selectedFile.name }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB
          </p>
        </div>
        <UButton
          v-if="!isUploading"
          class="cursor-pointer"
          icon="i-lucide-x"
          size="xs"
          color="neutral"
          variant="ghost"
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

      <!-- Extraction Result Display -->
      <div v-if="store.extractionResult" class="flex flex-col gap-2">
        <p class="text-sm text-gray-700 dark:text-gray-300">
          Extraction successful!
        </p>
        <pre class="text-xs text-gray-500 dark:text-gray-400">{{ store.extractionResult }}</pre>
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
            <UButton
              label="Skip to Manual Entry"
              size="xs"
              color="neutral"
              variant="subtle"
              @click="handleSkip"
            />
          </div>
        </template>
      </UAlert>

      <!-- Action Buttons -->
      <div class="flex flex-col gap-3 mt-4">
        <div v-if="hasPerformedExtraction" class="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800 flex items-center gap-2">
          <UIcon name="i-lucide-check-circle" class="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <p class="text-sm text-blue-900 dark:text-blue-200">
            Resume information has already been extracted. Continue to review the results.
          </p>
        </div>

        <div class="flex gap-3">
          <UButton
            v-if="selectedFile && !isUploading"
            class="cursor-pointer"
            label="Extract Information"
            size="xl"
            color="primary"
            leading-icon="i-lucide-sparkles"
            :disabled="hasPerformedExtraction"
            @click="handleUpload"
          />
          <UButton
            class="cursor-pointer"
            :label="hasPerformedExtraction ? 'View Results' : 'Skip'"
            size="xl"
            color="neutral"
            variant="subtle"
            :disabled="isUploading"
            @click="handleSkip"
          />
        </div>
      </div>
    </div>

  </div>
</template>
