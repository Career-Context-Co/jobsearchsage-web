<script setup lang="ts">
const router = useRouter()
const careerIDStore = useCareerIDStore()
const accountStore = useAccountStore()
const docsStore = useDocsStore()

const isCreating = ref(false)
const loadError = ref(false)
const noProfile = ref(false)
const confirmingDeleteId = ref<string | null>(null)
const deleteError = ref<string | null>(null)

const resumes = computed(() => docsStore.resumes)
const isLoading = computed(() => docsStore.isLoading)

onMounted(async () => {
  const profileId = careerIDStore.profileId || accountStore.profileId

  if (!profileId) {
    noProfile.value = true
    return
  }

  try {
    if (!careerIDStore.isProfileLoaded) {
      await careerIDStore.fetchProfile(profileId)
    }

    if (!careerIDStore.profile) {
      noProfile.value = true
      return
    }
  } catch (err: unknown) {
    const e = err as Record<string, unknown>
    const is404 = e?.status === 404 || e?.statusCode === 404
      || (typeof e?.message === 'string' && (e.message.includes('not found') || e.message.includes('No profile')))

    noProfile.value = true
    if (!is404) console.error('Failed to load profile:', err)
    return
  }

  await loadResumes()
})

async function loadResumes() {
  loadError.value = false
  try {
    await docsStore.listResumes()
  } catch {
    loadError.value = true
  }
}

// Build a full content snapshot from careerIDStore with everything selected.
// This is sent on creation so the editor opens with a fully-populated resume.
function buildSnapshot() {
  const contact = careerIDStore.contactInfo

  function formatEmploymentType(type: string) {
    const map: Record<string, string> = {
      full_time: 'Full-time', part_time: 'Part-time',
      contract: 'Contract', freelance: 'Freelance', internship: 'Internship'
    }
    return map[type] || type
  }

  function formatLocationType(type: string) {
    const map: Record<string, string> = {
      on_site: 'On-site', remote: 'Remote', hybrid: 'Hybrid'
    }
    return map[type] || type
  }

  return {
    summary: {
      text: contact?.summary || '',
      enabled: !!(contact?.summary)
    },
    workExperience: careerIDStore.experience.map(exp => ({
      id: exp.id,
      employer: exp.employer,
      jobTitle: exp.title,
      employmentType: formatEmploymentType(exp.employmentType),
      locationType: exp.locationType === 'remote'
        ? 'Remote'
        : (exp.location || formatLocationType(exp.locationType)),
      startDate: exp.startDate,
      endDate: exp.endDate,
      currentPosition: exp.currentPosition,
      highlights: (exp.highlights || []).map((h, i) => ({
        id: `${exp.id}-h${i}`,
        text: h,
        selected: true
      })),
      selected: true
    })),
    education: careerIDStore.education.map(edu => ({
      id: edu.id,
      institution: edu.institution,
      degree: edu.degreeType,
      areaOfStudy: edu.areaOfStudy || '',
      startDate: edu.startDate,
      endDate: edu.endDate,
      selected: true
    })),
    skills: careerIDStore.profileSkills.map(skill => ({
      id: skill.name,
      name: skill.name,
      group: skill.group || 'Skills',
      selected: true
    })),
    certifications: careerIDStore.certifications.map(cert => ({
      id: cert.id,
      name: cert.name,
      issuer: cert.issuer || '',
      issueDate: cert.issueDate || '',
      selected: true
    }))
  }
}

async function createNewResume() {
  if (isCreating.value) return
  isCreating.value = true
  try {
    const contact = careerIDStore.contactInfo
    const resume = await docsStore.createResume({
      firstName: contact?.firstName || '',
      lastName: contact?.lastName || '',
      content: buildSnapshot(),
      designSettings: { accentColor: '#0d9488' }
    })
    await router.push(`/docs/resumes/${resume.id}`)
  } catch (err) {
    loadError.value = true
    console.error('Failed to create resume:', err)
  } finally {
    isCreating.value = false
  }
}

async function deleteResume(id: string) {
  deleteError.value = null
  try {
    await docsStore.deleteResume(id)
    confirmingDeleteId.value = null
  } catch {
    deleteError.value = 'Failed to delete resume. Please try again.'
  }
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })
}
</script>

<template>
  <!-- Loading state -->
  <div v-if="isLoading" class="flex justify-center py-16">
    <UIcon name="i-lucide-loader-circle" class="w-8 h-8 text-muted animate-spin" />
  </div>

  <!-- No profile state -->
  <div v-else-if="noProfile">
    <UPageCard
      title="No Profile Yet"
      variant="subtle"
    >
      <div class="flex flex-col items-center justify-center py-12 gap-6 max-w-md mx-auto text-center">
        <UIcon name="i-lucide-file-text" class="w-20 h-20 text-primary" />
        <div class="space-y-2">
          <h3 class="text-xl font-semibold">
            Set Up Your Profile First
          </h3>
          <p class="text-muted text-base">
            Resumes are built from your profile data. Complete your profile onboarding and then come back to create your first resume.
          </p>
        </div>
        <UButton
          class="cursor-pointer"
          label="Start Onboarding"
          icon="i-lucide-rocket"
          size="lg"
          color="primary"
          @click="router.push('/profile/onboarding')"
        />
      </div>
    </UPageCard>
  </div>

  <!-- Error state -->
  <div v-else-if="loadError" class="flex flex-col items-center justify-center gap-4 text-center py-16">
    <UIcon name="i-lucide-circle-alert" class="w-10 h-10 text-red-500" />
    <p class="text-muted text-sm">
      Failed to load resumes.
    </p>
    <UButton
      label="Retry"
      color="neutral"
      variant="outline"
      size="sm"
      @click="loadResumes"
    />
  </div>

  <!-- Resume list -->
  <div v-else-if="resumes.length > 0">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-lg font-semibold">
        My Resumes
      </h2>
      <UButton
        label="New Resume"
        icon="i-lucide-plus"
        color="primary"
        size="sm"
        :loading="isCreating"
        @click="createNewResume"
      />
    </div>
    <p v-if="deleteError" class="text-sm text-red-500 mb-4">
      {{ deleteError }}
    </p>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <UCard
        v-for="resume in resumes"
        :key="resume.id"
        variant="subtle"
        class="group transition-all"
        :class="confirmingDeleteId !== resume.id && 'cursor-pointer hover:ring-1 hover:ring-primary/50'"
        @click="confirmingDeleteId !== resume.id && router.push(`/docs/resumes/${resume.id}`)"
      >
        <div class="flex flex-col gap-3">
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-2 min-w-0">
              <UIcon name="i-lucide-file-text" class="w-5 h-5 text-primary shrink-0" />
              <h3 class="font-semibold truncate">
                {{ resume.title }}
              </h3>
            </div>
            <div class="flex items-center gap-1 shrink-0">
              <UButton
                v-if="confirmingDeleteId !== resume.id"
                icon="i-lucide-trash-2"
                color="error"
                variant="ghost"
                size="xs"
                class="opacity-0 group-hover:opacity-100 transition-opacity"
                @click.stop="confirmingDeleteId = resume.id; deleteError = null"
              />
              <UButton
                v-if="confirmingDeleteId !== resume.id"
                icon="i-lucide-arrow-right"
                color="neutral"
                variant="ghost"
                size="xs"
                class="opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </div>
          </div>

          <!-- Inline delete confirmation -->
          <div
            v-if="confirmingDeleteId === resume.id"
            class="flex items-center justify-between gap-2 pt-1 border-t border-default"
            @click.stop
          >
            <p class="text-sm text-muted">
              Delete this resume?
            </p>
            <div class="flex gap-2">
              <UButton
                label="Cancel"
                color="neutral"
                variant="ghost"
                size="xs"
                @click="confirmingDeleteId = null"
              />
              <UButton
                label="Delete"
                color="error"
                variant="solid"
                size="xs"
                :loading="docsStore.isSaving"
                @click="deleteResume(resume.id)"
              />
            </div>
          </div>

          <div v-else class="space-y-1 text-xs text-muted">
            <p v-if="resume.createdAt">
              Created {{ formatDate(resume.createdAt) }}
            </p>
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
      <h3 class="text-xl font-semibold">
        No resumes yet
      </h3>
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
