<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCareerIDStore } from '~/stores/careerIDStore'

const emit = defineEmits<{
  uploadComplete: [extracted: boolean]
}>()

const store = useCareerIDStore()
const selectedFile = ref<File | null>(null)

// File validation configuration
const acceptedFileTypes = '.pdf,.txt,.md'
const maxFileSize = 10 * 1024 * 1024 // 10MB in bytes

// Use store state
const isUploading = computed(() => store.isExtracting)
const hasPerformedExtraction = computed(() => store.hasPerformedExtraction)
const uploadError = computed(() => store.extractionError)

// Clear error when file is selected
watch(selectedFile, () => {
  if (selectedFile.value) {
    store.extractionError = null
  }
})

// Handle file validation errors from UFileUpload
function handleFileError(error: any) {
  console.error('File validation error:', error)
  
  if (error?.message?.includes('size')) {
    store.extractionError = 'File is too large. Maximum size is 10MB.'
  } else if (error?.message?.includes('type')) {
    store.extractionError = 'File format not supported. Please upload a PDF, Txt, or Markdown file.'
  } else {
    store.extractionError = 'Invalid file. Please try again.'
  }
}

// Handle file upload
async function handleUpload() {
  if (!selectedFile.value) return
  
  try {
    // Extract resume data via store action
    const response = await store.extractResumeData(selectedFile.value)
    
    console.log('Extraction successful:', response)
    
    // Apply extraction to profile (always merges, with isExtracted flag for visual indicators)
    store.applyExtractionToProfile()
    
    // Emit success with extracted flag
    emit('uploadComplete', true)
  } catch (error: any) {
    console.error('Extraction failed:', error)
    
    // Error is already set in store, but handle specific error codes for better UX
    const errorCode = error?.data?.error?.code
    
    if (errorCode === 'FILE_TOO_LARGE') {
      store.extractionError = error?.data?.error?.message || 'File is too large. Maximum size is 10MB.'
    } else if (errorCode === 'INVALID_EXTENSION') {
      store.extractionError = error?.data?.error?.message || 'File format not supported. Please upload PDF, Txt, or Markdown file.'
    } else if (errorCode === 'INVALID_MIME_TYPE') {
      store.extractionError = error?.data?.error?.message || 'Invalid file type. Please upload a valid resume file.'
    } else if (errorCode === 'EXTRACTION_TIMEOUT') {
      store.extractionError = 'Extraction timed out. Please try again or use a smaller file.'
    } else if (errorCode === 'SERVICE_UNAVAILABLE') {
      store.extractionError = 'AI service is temporarily unavailable. Please try again in a moment.'
    } else if (!store.extractionError) {
      // Only set generic message if no error message was set by store
      store.extractionError = 'We couldn\'t read this resume. Can you try uploading another version (PDF, Txt, or Markdown)?'
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
        :accept="acceptedFileTypes"
        :max-size="maxFileSize"
        :multiple="false"
        highlight
        icon="i-lucide-upload-cloud"
        label="Drop your resume here or click to browse"
        description="Supported formats: PDF, Txt, Markdown (max 10MB)"
        :preview="false"
        class="cursor-pointer"
        @error="handleFileError"
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
        @close="uploadError = null"
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
