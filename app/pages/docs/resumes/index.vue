<script setup lang="ts">
const router = useRouter()
const careerIDStore = useCareerIDStore()

interface ResumeRecord {
  id: number
  title: string
  createdAt: string
  updatedAt: string
}

// TODO(backend): Replace with real API call — GET /api/docs/resumes
const resumes = ref<ResumeRecord[]>([])
const isLoading = ref(false)
const isCreating = ref(false)

// TODO(backend): Call POST /api/docs/resumes to create a real record, then navigate to /docs/resumes/[id]
async function createNewResume() {
  if (isCreating.value) return
  isCreating.value = true
  try {
    await router.push('/docs/resumes/new')
  } finally {
    isCreating.value = false
  }
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}
</script>

<template>
  <!-- Loading state -->
  <div v-if="isLoading" class="flex justify-center py-16">
    <UIcon name="i-lucide-loader-circle" class="w-8 h-8 text-muted animate-spin" />
  </div>

  <!-- Resume list -->
  <div v-else-if="resumes.length > 0">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-lg font-semibold">My Resumes</h2>
      <UButton
        label="New Resume"
        icon="i-lucide-plus"
        color="primary"
        size="sm"
        :loading="isCreating"
        @click="createNewResume"
      />
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <UCard
        v-for="resume in resumes"
        :key="resume.id"
        variant="subtle"
        class="group cursor-pointer hover:ring-1 hover:ring-primary/50 transition-all"
        @click="router.push(`/docs/resumes/${resume.id}`)"
      >
        <div class="flex flex-col gap-3">
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-2 min-w-0">
              <UIcon name="i-lucide-file-text" class="w-5 h-5 text-primary shrink-0" />
              <h3 class="font-semibold truncate">{{ resume.title }}</h3>
            </div>
            <UButton
              icon="i-lucide-arrow-right"
              color="neutral"
              variant="ghost"
              size="xs"
              class="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </div>
          <div class="space-y-1 text-xs text-muted">
            <p>Created {{ formatDate(resume.createdAt) }}</p>
            <p>Updated {{ formatDate(resume.updatedAt) }}</p>
          </div>
        </div>
      </UCard>
    </div>
  </div>

  <!-- Empty state -->
  <div v-else class="flex flex-col items-center justify-center gap-4 text-center py-16">
    <div class="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
      <UIcon name="i-lucide-file-text" class="w-8 h-8 text-primary" />
    </div>
    <div class="space-y-2">
      <h3 class="text-xl font-semibold">No resumes yet</h3>
      <p class="text-muted text-sm">
        Create your first resume from your profile data. Customize content and design, then export to PDF or Word.
      </p>
    </div>
    <UButton
      label="New Resume"
      icon="i-lucide-plus"
      color="primary"
      size="lg"
      :loading="isCreating"
      @click="createNewResume"
    />
  </div>
</template>
