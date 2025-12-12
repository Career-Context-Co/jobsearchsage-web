<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  uploadComplete: []
}>()

const selectedFile = ref<File | null>(null)
const isUploading = ref(false)
const uploadError = ref<string | null>(null)

// File validation configuration
const acceptedFileTypes = '.pdf,.docx,.doc,.jpg,.jpeg,.png'
const maxFileSize = 10 * 1024 * 1024 // 10MB in bytes

// Clear error when file is selected
watch(selectedFile, () => {
  if (selectedFile.value) {
    uploadError.value = null
  }
})

// Handle file validation errors from UFileUpload
function handleFileError(error: any) {
  console.error('File validation error:', error)
  
  if (error?.message?.includes('size')) {
    uploadError.value = 'File is too large. Maximum size is 10MB.'
  } else if (error?.message?.includes('type')) {
    uploadError.value = 'File format not supported. Please upload PDF, Word, JPG, or PNG.'
  } else {
    uploadError.value = 'Invalid file. Please try again.'
  }
}

// Handle file upload
async function handleUpload() {
  if (!selectedFile.value) return
  
  isUploading.value = true
  uploadError.value = null
  
  try {
    // Create FormData for multipart upload
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    
    // Call the API endpoint
    const response = await $fetch('/api/career-id/resume/extract', {
      method: 'POST',
      body: formData
    })
    
    console.log('Upload successful:', response)
    
    // TODO: In USER STORY 3, extract and store the resume data
    // For now, just advance to next step
    emit('uploadComplete')
  } catch (error: any) {
    console.error('Upload failed:', error)
    
    // Extract error message from API response
    const errorMessage = error?.data?.error?.message || error?.message
    
    // Handle specific error codes
    if (error?.data?.error?.code === 'FILE_TOO_LARGE') {
      uploadError.value = errorMessage || 'File is too large. Maximum size is 10MB.'
    } else if (error?.data?.error?.code === 'INVALID_EXTENSION') {
      uploadError.value = errorMessage || 'File format not supported. Please upload PDF, Word, JPG, or PNG.'
    } else if (error?.data?.error?.code === 'INVALID_MIME_TYPE') {
      uploadError.value = errorMessage || 'Invalid file type. Please upload a valid resume file.'
    } else {
      uploadError.value = 'We couldn\'t read this resume. Can you try uploading another version (PDF, Word, or a screenshot)?'
    }
  } finally {
    isUploading.value = false
  }
}

// Handle skip button
function handleSkip() {
  emit('uploadComplete')
}

// Handle retry after error
function handleRetry() {
  selectedFile.value = null
  uploadError.value = null
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
        :accept="acceptedFileTypes"
        :max-size="maxFileSize"
        :multiple="false"
        :dropzone="true"
        v-model="selectedFile"
        @error="handleFileError"
      >
        <template #default="{ open }">
          <div 
            class="flex flex-col items-center justify-center gap-4 p-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg hover:border-primary-500 dark:hover:border-primary-400 transition-colors cursor-pointer"
            @click="open()"
          >
            <UIcon name="i-lucide-upload-cloud" class="w-12 h-12 text-gray-400" />
            <div class="text-center">
              <p class="text-sm font-medium text-gray-700 dark:text-gray-300">
                Drop your resume here or click to browse
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Supported formats: PDF, DOCX, DOC, JPG, PNG (max 10MB)
              </p>
            </div>
          </div>
        </template>
      </UFileUpload>

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
            Extracting your career information... This may take 10-15 seconds.
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
      <div class="flex gap-3 mt-4">
        <UButton
          v-if="selectedFile && !isUploading"
          class="cursor-pointer"
          label="Extract Information"
          size="xl"
          color="primary"
          leading-icon="i-lucide-sparkles"
          @click="handleUpload"
        />
        <UButton
          class="cursor-pointer"
          label="Skip"
          size="xl"
          color="neutral"
          variant="subtle"
          :disabled="isUploading"
          @click="handleSkip"
        />
      </div>
    </div>

  </div>
</template>
