<script setup lang="ts">
import type { Experience } from '#shared/types/careerId'
import { vMaska } from 'maska/vue'
import { validateRequired, validateUrl, validateMonthYear, validateDateRange } from '~/utils/validation'

const careerIDStore = useCareerIDStore()
const sageAIStore = useSageAIStore()
const accountStore = useAccountStore()
const toast = useToast()
const router = useRouter()
const route = useRoute()

/**
 * Convert date from YYYY-MM-DD to MM/YYYY format for UI display
 */
function formatDateForUI(dateString: string | null | undefined): string {
  if (!dateString) return ''
  
  // If already in MM/YYYY format, return as-is
  if (/^\d{2}\/\d{4}$/.test(dateString)) return dateString
  
  // Parse YYYY-MM-DD and convert to MM/YYYY
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString
  
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  
  return `${month}/${year}`
}

/**
 * Convert date from MM/YYYY to YYYY-MM-DD format for API
 */
function formatDateForAPI(dateString: string | undefined): string | undefined {
  if (!dateString || !dateString.trim()) return undefined
  
  // If already in YYYY-MM-DD format, return as-is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString
  
  // Parse MM/YYYY and convert to YYYY-MM-DD
  const match = dateString.match(/^(\d{2})\/(\d{4})$/)
  if (!match) return dateString
  
  const [, month, year] = match
  return `${year}-${month}-01`
}

// Loading and saving states
const isLoading = computed(() => careerIDStore.isLoading)
const isSaving = computed(() => careerIDStore.isSaving)

// Experience data from store
const experiences = computed(() => {
  // Sort by start date, most recent first
  return [...careerIDStore.experience].sort((a, b) => {
    return new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  })
})

// Form states
const isAddingExperience = ref(false)
const editingExperienceId = ref<number | null>(null)

// Form data
interface ExperienceFormData {
  employmentType: 'full_time' | 'part_time' | 'contract' | 'freelance' | 'internship'
  employer: string
  title: string
  location: string
  locationType: 'on_site' | 'remote' | 'hybrid'
  url: string
  startDate: string
  endDate: string
  currentPosition: boolean
  summary: string
  contextNotes: string
  highlights: string[]
}

const formData = ref<Partial<ExperienceFormData>>({
  employmentType: 'full_time',
  locationType: 'on_site',
  currentPosition: false,
  highlights: ['']
})
const formErrors = ref<Record<string, string>>({})

const sageSessionOpen = ref(false)
const sageSessionExperienceId = ref<number | null>(null)
const startingHeroExperienceId = ref<number | null>(null)

type HeroNudgeLoadingState = { loading: true }
type HeroNudgeEmptyState = { loading: false, nudge: false }
type HeroNudgeActiveState = {
  loading: false
  nudge: true
  id: string
  experienceId: number
  contentHash: string
  signal: string
  context: string
  status: 'active' | 'accepted' | 'declined' | 'converted' | 'stale'
  heroStoryId: string | null
  discoverySessionId: number | null
  acceptedAt: string | null
  declinedAt: string | null
}
type HeroNudgeState = HeroNudgeLoadingState | HeroNudgeEmptyState | HeroNudgeActiveState

const heroNudgesByExperienceId = ref<Record<number, HeroNudgeState>>({})
const expandedHeroNudgeIds = ref<Set<number>>(new Set())

const sageSessionExperience = computed(() =>
  sageSessionExperienceId.value !== null
    ? experiences.value.find(e => e.id === sageSessionExperienceId.value) ?? null
    : null
)

function openSageSession(experienceId: number) {
  sageSessionExperienceId.value = experienceId
  sageSessionOpen.value = true
}

function closeSageSession() {
  sageSessionOpen.value = false
  sageSessionExperienceId.value = null
}

function heroNudgeFor(experienceId: number): HeroNudgeState | null {
  return heroNudgesByExperienceId.value[experienceId] ?? null
}

function activeHeroNudgeFor(experienceId: number) {
  const nudge = heroNudgeFor(experienceId)
  return nudge?.loading === false && nudge.nudge === true && nudge.status === 'active'
    ? nudge
    : null
}

function isHeroNudgeExpanded(experienceId: number) {
  return expandedHeroNudgeIds.value.has(experienceId)
}

function expandHeroNudge(experienceId: number) {
  expandedHeroNudgeIds.value = new Set([...expandedHeroNudgeIds.value, experienceId])
}

function collapseHeroNudge(experienceId: number) {
  const next = new Set(expandedHeroNudgeIds.value)
  next.delete(experienceId)
  expandedHeroNudgeIds.value = next
}

function setHeroNudgeState(nudge: Omit<HeroNudgeActiveState, 'loading'>, expanded = false, profileId?: string) {
  heroNudgesByExperienceId.value = {
    ...heroNudgesByExperienceId.value,
    [nudge.experienceId]: {
      loading: false,
      nudge: true,
      id: nudge.id,
      experienceId: nudge.experienceId,
      contentHash: nudge.contentHash,
      signal: nudge.signal,
      context: nudge.context,
      status: nudge.status,
      heroStoryId: nudge.heroStoryId,
      discoverySessionId: nudge.discoverySessionId,
      acceptedAt: nudge.acceptedAt,
      declinedAt: nudge.declinedAt
    }
  }

  if (expanded) {
    expandHeroNudge(nudge.experienceId)
  }

  if (profileId) {
    sageAIStore.setHeroNudge(profileId, nudge)
  }
}

async function loadPersistedHeroNudges(profileId: string) {
  const nudges = await sageAIStore.loadHeroNudgesForProfile(profileId)
  for (const nudge of nudges) {
    setHeroNudgeState(nudge, false)
  }
}

async function checkHeroNudgeForExperience(experience: Experience) {
  const hasSignalContent = Boolean(
    experience.summary?.trim()
    || experience.contextNotes?.trim()
    || experience.highlights.some(highlight => highlight.trim())
  )
  if (!hasSignalContent) {
    heroNudgesByExperienceId.value = {
      ...heroNudgesByExperienceId.value,
      [experience.id]: { loading: false, nudge: false }
    }
    return
  }

  heroNudgesByExperienceId.value = {
    ...heroNudgesByExperienceId.value,
    [experience.id]: { loading: true }
  }

  try {
    const profileId = careerIDStore.profile?.id || careerIDStore.profileId || accountStore.profileId
    if (!profileId) return
    const sageNotes = sageAIStore.experienceSageNotesFor(profileId, experience.id)?.content ?? null

    const response = await $fetch<{
      success: boolean
      data: { nudge: false } | Omit<HeroNudgeActiveState, 'loading'>
    }>('/api/ai/experience/hero-nudge', {
      method: 'POST',
      body: {
        profileId,
        experienceId: experience.id,
        experience: {
          id: experience.id,
          title: experience.title,
          employer: experience.employer,
          highlights: experience.highlights,
          summary: experience.summary ?? null,
          contextNotes: experience.contextNotes ?? null,
          sageNotes
        }
      }
    })

    if (response.data.nudge) {
      setHeroNudgeState(response.data, true, profileId)
    } else {
      heroNudgesByExperienceId.value = {
        ...heroNudgesByExperienceId.value,
        [experience.id]: { loading: false, nudge: false }
      }
      sageAIStore.clearHeroNudge(profileId, experience.id)
    }
  } catch (error) {
    console.error('HERO nudge check failed', error)
    heroNudgesByExperienceId.value = {
      ...heroNudgesByExperienceId.value,
      [experience.id]: { loading: false, nudge: false }
    }
  }
}

async function dismissHeroNudge(experienceId: number) {
  const existing = heroNudgesByExperienceId.value[experienceId]
  if (existing?.loading === false && existing.nudge === true) {
    try {
      await $fetch(`/api/ai/experience/hero-nudge/${existing.id}/decline`, {
        method: 'POST'
      })
      heroNudgesByExperienceId.value = {
        ...heroNudgesByExperienceId.value,
        [experienceId]: {
          ...existing,
          status: 'declined',
          declinedAt: new Date().toISOString()
        }
      }
      const profileId = careerIDStore.profile?.id || careerIDStore.profileId || accountStore.profileId
      if (profileId) {
        sageAIStore.setHeroNudge(profileId, {
          ...existing,
          status: 'declined',
          declinedAt: new Date().toISOString()
        })
      }
      collapseHeroNudge(experienceId)
    } catch (error) {
      console.error('Failed to decline HERO nudge', error)
    }
  }
}

async function startHeroInterview(experienceId: number) {
  if (startingHeroExperienceId.value !== null) return

  const experience = careerIDStore.experience.find(exp => exp.id === experienceId)
  const profileId = careerIDStore.profile?.id || careerIDStore.profileId || accountStore.profileId
  const nudge = activeHeroNudgeFor(experienceId)
  if (!experience || !profileId || !nudge) return

  startingHeroExperienceId.value = experienceId

  try {
    const result = await sageAIStore.startNudgeDiscoverySession({
      profileId,
      nudgeId: nudge.id,
      experience
    })

    await router.push({
      path: '/profile/hero',
      query: {
        highlightStoryId: result.heroStoryId
      }
    })
  } catch (error) {
    console.error('Failed to start HERO story session', error)
    toast.add({
      title: 'Could not start HERO interview',
      description: 'Please try again from the HERO page.',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  } finally {
    startingHeroExperienceId.value = null
  }
}

async function onSageSessionConfirm(bulletIndex: number, improvedBullet: string) {
  const expId = sageSessionExperienceId.value
  if (expId === null) return
  const exp = careerIDStore.experience.find(e => e.id === expId)
  if (!exp) return
  const highlights = editingExperienceId.value === expId && Array.isArray(formData.value.highlights)
    ? [...formData.value.highlights]
    : [...exp.highlights]
  if (bulletIndex < 0 || bulletIndex >= highlights.length) return
  highlights[bulletIndex] = improvedBullet
  try {
    await careerIDStore.updateExperience(expId, {
      highlights,
      lastEnhancedAt: new Date().toISOString()
    })
    if (editingExperienceId.value === expId && Array.isArray(formData.value.highlights)) {
      const next = [...formData.value.highlights]
      if (next[bulletIndex] !== undefined) {
        next[bulletIndex] = improvedBullet
        formData.value.highlights = next
      }
    }
    toast.add({
      title: 'Achievement updated',
      description: 'Your improved bullet has been saved.',
      icon: 'i-lucide-check',
      color: 'success'
    })
    const updatedExperience = careerIDStore.experience.find(e => e.id === expId)
    if (updatedExperience) {
      void checkHeroNudgeForExperience(updatedExperience)
    }
    closeSageSession()
  } catch (err: unknown) {
    const e = err as { message?: string }
    toast.add({
      title: 'Save failed',
      description: e?.message || 'Could not save the improved bullet.',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  }
}

function onSageSessionApplySummary(summary: string) {
  const expId = sageSessionExperienceId.value
  if (expId === null) return

  const exp = careerIDStore.experience.find(e => e.id === expId)
  if (!exp) return

  if (editingExperienceId.value !== expId) {
    startEditingExperience(exp)
  }

  formData.value.summary = summary
  toast.add({
    title: 'Summary copied',
    description: 'Review it in the open experience card, then save your changes.',
    icon: 'i-lucide-check',
    color: 'success'
  })
  closeSageSession()
}

function onSageSessionApplyContextNotes(notes: string) {
  const expId = sageSessionExperienceId.value
  if (expId === null) return

  const exp = careerIDStore.experience.find(e => e.id === expId)
  if (!exp) return

  if (editingExperienceId.value !== expId) {
    startEditingExperience(exp)
  }

  const existingNotes = formData.value.contextNotes?.trim() ?? ''
  formData.value.contextNotes = existingNotes
    ? existingNotes.includes(notes) ? existingNotes : `${existingNotes}\n\n${notes}`
    : notes

  toast.add({
    title: 'Copied to My Notes',
    description: 'Review it in the open experience card, then save your changes.',
    icon: 'i-lucide-check',
    color: 'success'
  })
  closeSageSession()
}

// Employment type options
const employmentTypes = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'internship', label: 'Internship' }
]

// Location type options
const locationTypes = [
  { value: 'on_site', label: 'On-site' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' }
]

// Start adding new experience
function startAddingExperience() {
  formData.value = {
    employmentType: 'full_time',
    employer: '',
    title: '',
    location: '',
    locationType: 'on_site',
    url: '',
    startDate: '',
    endDate: '',
    currentPosition: false,
    summary: '',
    contextNotes: '',
    highlights: ['']
  }
  formErrors.value = {}
  isAddingExperience.value = true
}

// Start editing existing experience
function startEditingExperience(experience: Experience) {
  editingExperienceId.value = experience.id
  formData.value = {
    employmentType: experience.employmentType,
    employer: experience.employer,
    title: experience.title,
    location: experience.location || '',
    locationType: experience.locationType,
    url: experience.url || '',
    startDate: formatDateForUI(experience.startDate),
    endDate: formatDateForUI(experience.endDate),
    currentPosition: experience.currentPosition,
    summary: experience.summary || '',
    contextNotes: experience.contextNotes || '',
    highlights: experience.highlights.length > 0 ? [...experience.highlights] : ['']
  }
  formErrors.value = {}
}

// Cancel editing
function cancelEdit() {
  isAddingExperience.value = false
  editingExperienceId.value = null
  formData.value = {}
  formErrors.value = {}
}

// Add highlight field
function addHighlight() {
  if (!formData.value.highlights) {
    formData.value.highlights = []
  }
  formData.value.highlights.push('')
}

// Remove highlight field
function removeHighlight(index: number) {
  if (formData.value.highlights) {
    formData.value.highlights.splice(index, 1)
  }
}

// Watch currentPosition checkbox to clear endDate
watch(() => formData.value.currentPosition, (isCurrent) => {
  if (isCurrent) {
    formData.value.endDate = ''
  }
})

// Validate form
function validateForm(): boolean {
  const errors: Record<string, string> = {}
  
  // Required fields
  const employerError = validateRequired(formData.value.employer, 'Company/Employer')
  if (employerError) errors.employer = employerError
  
  const titleError = validateRequired(formData.value.title, 'Job Title')
  if (titleError) errors.title = titleError
  
  // Validate start date
  const startDateError = validateMonthYear(formData.value.startDate, true)
  if (startDateError) errors.startDate = startDateError
  
  // Validate end date (if not current position)
  if (!formData.value.currentPosition && formData.value.endDate) {
    const endDateError = validateMonthYear(formData.value.endDate, false)
    if (endDateError) errors.endDate = endDateError
    else if (formData.value.startDate) {
      // Validate date range
      const rangeError = validateDateRange(formData.value.startDate, formData.value.endDate, 'End Date')
      if (rangeError) errors.endDate = rangeError
    }
  }
  
  // Validate URL if provided
  if (formData.value.url && formData.value.url.trim()) {
    const urlError = validateUrl(formData.value.url, false)
    if (urlError) errors.url = urlError
  }
  
  // Validate at least one highlight
  const nonEmptyHighlights = formData.value.highlights?.filter(h => h.trim()) || []
  if (nonEmptyHighlights.length === 0) {
    errors.highlights = 'At least one highlight is required'
  }
  
  formErrors.value = errors
  return Object.keys(errors).length === 0
}

// Add experience
async function addExperience() {
  if (!validateForm()) {
    toast.add({
      title: 'Validation Error',
      description: 'Please fix the errors in the form',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
    return
  }
  
  try {
    // Filter out empty highlights
    const highlights = formData.value.highlights?.filter(h => h.trim()) || []
    
    const createdExperience = await careerIDStore.addExperience({
      employmentType: formData.value.employmentType!,
      employer: formData.value.employer!,
      title: formData.value.title!,
      location: formData.value.location || undefined,
      locationType: formData.value.locationType!,
      url: formData.value.url || undefined,
      startDate: formatDateForAPI(formData.value.startDate)!,
      endDate: formData.value.currentPosition ? undefined : formatDateForAPI(formData.value.endDate),
      currentPosition: formData.value.currentPosition || false,
      summary: formData.value.summary || undefined,
      contextNotes: formData.value.contextNotes ?? null,
      highlights,
      displayOrder: experiences.value.length + 1
    })
    
    toast.add({
      title: 'Success',
      description: 'Work experience added successfully',
      icon: 'i-lucide-check',
      color: 'success'
    })

    cancelEdit()
    void checkHeroNudgeForExperience(createdExperience)
  } catch (err: any) {
    toast.add({
      title: 'Error',
      description: err?.message || 'Failed to add work experience',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  }
}

// Update experience
async function updateExperience() {
  if (!validateForm()) {
    toast.add({
      title: 'Validation Error',
      description: 'Please fix the errors in the form',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
    return
  }
  
  try {
    // Filter out empty highlights
    const highlights = formData.value.highlights?.filter(h => h.trim()) || []
    
    const updatedExperience = await careerIDStore.updateExperience(editingExperienceId.value!, {
      employmentType: formData.value.employmentType!,
      employer: formData.value.employer!,
      title: formData.value.title!,
      location: formData.value.location || undefined,
      locationType: formData.value.locationType!,
      url: formData.value.url || undefined,
      startDate: formatDateForAPI(formData.value.startDate)!,
      endDate: formData.value.currentPosition ? undefined : formatDateForAPI(formData.value.endDate),
      currentPosition: formData.value.currentPosition || false,
      summary: formData.value.summary || undefined,
      contextNotes: formData.value.contextNotes ?? null,
      highlights
    })
    
    toast.add({
      title: 'Success',
      description: 'Work experience updated successfully',
      icon: 'i-lucide-check',
      color: 'success'
    })

    cancelEdit()
    void checkHeroNudgeForExperience(updatedExperience)
  } catch (err: any) {
    toast.add({
      title: 'Error',
      description: err?.message || 'Failed to update work experience',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  }
}

// Delete experience
async function deleteExperience(id: number) {
  if (!confirm('Are you sure you want to delete this work experience?')) {
    return
  }
  
  try {
    await careerIDStore.deleteExperience(id)
    
    toast.add({
      title: 'Success',
      description: 'Work experience deleted successfully',
      icon: 'i-lucide-check',
      color: 'success'
    })
  } catch (err: any) {
    toast.add({
      title: 'Error',
      description: err?.message || 'Failed to delete work experience',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  }
}

// Format date for display
function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'Present'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

// Fetch profile data on mount
// State to track if profile doesn't exist (for empty state)
const showEmptyState = ref(false)

onMounted(async () => {
  const profileId = careerIDStore.profileId || accountStore.profileId

  // If no profileId is set, show empty state immediately
  if (!profileId) {
    showEmptyState.value = true
    return
  }

  try {
    if (!careerIDStore.isProfileLoaded) {
      await careerIDStore.fetchProfile(profileId)
    }

    // If no profile found after fetch, show empty state
    if (!careerIDStore.profile) {
      showEmptyState.value = true
    } else {
      const experienceIds = careerIDStore.experience.map(e => e.id)
      await sageAIStore.loadSageNotesForProfileExperiences(profileId, experienceIds)
      await loadPersistedHeroNudges(profileId)
    }
  } catch (err: any) {
    // Check if it's a 404 or profile not found error
    const is404 = err?.status === 404 || err?.statusCode === 404 || 
                  err?.message?.includes('not found') || 
                  err?.message?.includes('No profile')
    
    if (is404) {
      // Profile doesn't exist - show empty state instead of error
      showEmptyState.value = true
      // Clear the error from the store since we're handling it gracefully
      careerIDStore.error = null
    } else {
      // Other errors - log but still show empty state
      console.error('Failed to load profile:', err)
      showEmptyState.value = true
    }
  }

  await scrollToHashedExperience()
})

// Deep links such as /profile/experience#experience-12 arrive before the list renders
async function scrollToHashedExperience() {
  const hash = route.hash
  if (!hash.startsWith('#experience-')) return

  await nextTick()
  document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <!-- Loading State -->
  <div v-if="isLoading" class="space-y-4">
    <USkeleton class="h-32 w-full" />
    <USkeleton class="h-64 w-full" />
  </div>

  <!-- Empty State - No Profile Found -->
  <div v-else-if="showEmptyState">
    <UPageCard
      title="No Profile Yet"
      variant="subtle"
    >
      <div class="flex flex-col items-center justify-center py-12 gap-6 max-w-md mx-auto text-center">
        <UIcon name="i-lucide-briefcase" class="w-20 h-20 text-primary" />
        <div class="space-y-2">
          <h3 class="text-xl font-semibold">Create Your Profile First</h3>
          <p class="text-muted text-base">
            You need to complete your profile onboarding before you can manage your work experience.
          </p>
        </div>
        <UButton
          label="Start Onboarding"
          icon="i-lucide-rocket"
          size="lg"
          color="primary"
          @click="$router.push('/profile/onboarding')"
        />
      </div>
    </UPageCard>
  </div>

  <!-- Experience Content -->
  <div v-else class="space-y-4">
    <!-- Page Header -->
    <UPageCard
      title="Professional Experience"
      description="Your professional work history and accomplishments"
      variant="naked"
      orientation="horizontal"
      class="mb-4"
    >
      <UButton
        v-if="!isAddingExperience && !editingExperienceId"
        label="Add Experience"
        color="primary"
        variant="outline"
        icon="i-lucide-plus"
        class="cursor-pointer w-fit lg:ms-auto"
        @click="startAddingExperience"
      />
    </UPageCard>

    <!-- Add Experience Form -->
    <UPageCard v-if="isAddingExperience" variant="subtle" class="mb-4">
      <div class="space-y-4">
        <h3 class="text-lg font-semibold">Add Work Experience</h3>
        
        <!-- Employment Type and Company -->
        <div class="flex gap-4 max-sm:flex-col">
          <div class="flex-1">
            <label class="block text-sm font-medium mb-1">Employment Type <span class="text-error">*</span></label>
            <USelectMenu
              v-model="formData.employmentType"
              :items="employmentTypes"
              value-key="value"
              label-key="label"
              class="w-full"
            />
          </div>
          <div class="flex-1">
            <label class="block text-sm font-medium mb-1">Company/Employer <span class="text-error">*</span></label>
            <UInput
              v-model="formData.employer"
              placeholder="e.g. Google, Microsoft"
              class="w-full"
              :error="!!formErrors.employer"
            />
            <p v-if="formErrors.employer" class="text-sm text-error mt-1">{{ formErrors.employer }}</p>
          </div>
        </div>

        <!-- Job Title -->
        <div>
          <label class="block text-sm font-medium mb-1">Job Title <span class="text-error">*</span></label>
          <UInput
            v-model="formData.title"
            placeholder="e.g. Senior Software Engineer"
            class="w-full"
            :error="!!formErrors.title"
          />
          <p v-if="formErrors.title" class="text-sm text-error mt-1">{{ formErrors.title }}</p>
        </div>

        <!-- Location and Location Type -->
        <div class="flex gap-4 max-sm:flex-col">
          <div class="flex-1">
            <label class="block text-sm font-medium mb-1">Location</label>
            <UInput
              v-model="formData.location"
              placeholder="e.g. San Francisco, CA"
              class="w-full"
            />
          </div>
          <div class="flex-1">
            <label class="block text-sm font-medium mb-1">Location Type</label>
            <USelectMenu
              v-model="formData.locationType"
              :items="locationTypes"
              value-key="value"
              label-key="label"
              class="w-full"
            />
          </div>
        </div>

        <!-- Company Website -->
        <div>
          <label class="block text-sm font-medium mb-1">Company Website</label>
          <UInput
            v-model="formData.url"
            placeholder="https://company.com"
            class="w-full"
            :error="!!formErrors.url"
          >
            <template #leading>
              <UIcon name="i-lucide-link" class="w-4 h-4 text-muted" />
            </template>
          </UInput>
          <p v-if="formErrors.url" class="text-sm text-error mt-1">{{ formErrors.url }}</p>
        </div>

        <!-- Start Date, End Date, Current Position -->
        <div class="flex gap-4 max-sm:flex-col">
          <div class="flex-1">
            <label class="block text-sm font-medium mb-1">Start Date <span class="text-error">*</span></label>
            <UInput
              v-model="formData.startDate"
              v-maska="'##/####'"
              placeholder="MM/YYYY"
              class="w-full"
              :error="!!formErrors.startDate"
            />
            <p v-if="formErrors.startDate" class="text-sm text-error mt-1">{{ formErrors.startDate }}</p>
          </div>
          <div class="flex-1">
            <label class="block text-sm font-medium mb-1">End Date <span v-if="!formData.currentPosition" class="text-error">*</span></label>
            <UInput
              v-model="formData.endDate"
              v-maska="'##/####'"
              placeholder="MM/YYYY"
              class="w-full"
              :disabled="formData.currentPosition"
              :error="!!formErrors.endDate"
            />
            <p v-if="formErrors.endDate" class="text-sm text-error mt-1">{{ formErrors.endDate }}</p>
          </div>
        </div>

        <!-- Current Position Checkbox -->
        <div class="flex items-center gap-2">
          <USwitch v-model="formData.currentPosition" />
          <label class="text-sm">I currently work here</label>
        </div>

        <!-- Summary -->
        <div>
          <label class="block text-sm font-medium mb-1">Summary</label>
          <UTextarea
            v-model="formData.summary"
            placeholder="Brief description of your role and responsibilities..."
            :rows="3"
            autoresize
            class="w-full"
          />
        </div>

        <!-- My Notes -->
        <div>
          <label class="block text-sm font-medium mb-1">My Notes</label>
          <UTextarea
            v-model="formData.contextNotes"
            placeholder="Private context you want to remember about this role..."
            :rows="4"
            autoresize
            class="w-full"
          />
        </div>

        <!-- Highlights -->
        <div>
          <label class="block text-sm font-medium mb-1">Key Achievements <span class="text-error">*</span></label>
          <div class="space-y-2">
            <div v-for="(highlight, index) in formData.highlights" :key="index" class="flex gap-2">
              <UInput
                v-model="formData.highlights![index]"
                placeholder="e.g. Led team of 5 engineers to deliver..."
                class="flex-1 w-full"
              />
              <UButton
                v-if="formData.highlights!.length > 1"
                icon="i-lucide-x"
                color="neutral"
                variant="ghost"
                class="cursor-pointer"
                @click="removeHighlight(index)"
              />
            </div>
            <p v-if="formErrors.highlights" class="text-sm text-error">{{ formErrors.highlights }}</p>
            <UButton
              label="Add Achievement"
              icon="i-lucide-plus"
              color="neutral"
              variant="outline"
              size="sm"
              class="cursor-pointer"
              @click="addHighlight"
            />
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-2 justify-end pt-4">
          <UButton
            label="Cancel"
            color="neutral"
            variant="ghost"
            class="cursor-pointer"
            @click="cancelEdit"
            :disabled="isSaving"
          />
          <UButton
            label="Save Experience"
            color="primary"
            icon="i-lucide-check"
            class="cursor-pointer"
            :loading="isSaving"
            @click="addExperience"
          />
        </div>
      </div>
    </UPageCard>

    <!-- Experience List -->
    <div v-if="experiences.length > 0 && !isAddingExperience" class="space-y-4">
      <div
        v-for="experience in experiences"
        :id="`experience-${experience.id}`"
        :key="experience.id"
        :class="[
          'border rounded-lg transition-colors scroll-mt-24',
          sageSessionOpen && sageSessionExperienceId === experience.id
            ? 'border-teal-500 ring-2 ring-teal-500'
            : 'border-default'
        ]"
      >
        <!-- View Mode -->
        <UPageCard v-if="editingExperienceId !== experience.id" variant="subtle">
          <div class="flex justify-between items-start gap-4">
            <div class="flex-1">
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1">
                  <h3 class="text-lg font-semibold">{{ experience.title }}</h3>
                  <p class="text-base font-medium text-muted">{{ experience.employer }}</p>
                  <div class="flex flex-wrap gap-2 mt-2 text-sm text-muted">
                    <span>{{ formatDate(experience.startDate) }} - {{ formatDate(experience.endDate) }}</span>
                    <span v-if="experience.location">• {{ experience.location }}</span>
                    <span>• {{ locationTypes.find(t => t.value === experience.locationType)?.label }}</span>
                    <span>• {{ employmentTypes.find(t => t.value === experience.employmentType)?.label }}</span>
                  </div>
                </div>
                <div class="flex gap-2">
                  <UButton
                    icon="i-lucide-pencil"
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    class="cursor-pointer"
                    @click="startEditingExperience(experience)"
                  />
                  <UButton
                    icon="i-lucide-trash-2"
                    color="error"
                    variant="ghost"
                    size="sm"
                    class="cursor-pointer"
                    @click="deleteExperience(experience.id)"
                    :loading="isSaving"
                  />
                </div>
              </div>

              <div v-if="experience.summary" class="mt-3">
                <p class="text-sm">
                  {{ experience.summary }}
                </p>
              </div>

              <div v-if="experience.contextNotes" class="mt-3 rounded-lg border border-default bg-default/40 p-3">
                <p class="text-xs font-medium text-muted uppercase tracking-wide mb-1">
                  My Notes
                </p>
                <p class="text-sm whitespace-pre-wrap">
                  {{ experience.contextNotes }}
                </p>
              </div>

              <div v-if="activeHeroNudgeFor(experience.id)" class="mt-3">
                <ProfileSageHeroNudge
                  v-if="isHeroNudgeExpanded(experience.id)"
                  :signal="activeHeroNudgeFor(experience.id)!.signal"
                  :context="activeHeroNudgeFor(experience.id)!.context"
                  :experience-id="experience.id"
                  :is-loading="startingHeroExperienceId === experience.id"
                  @start="startHeroInterview"
                  @dismiss="dismissHeroNudge"
                />
                <UButton
                  v-else
                  color="primary"
                  variant="soft"
                  size="xs"
                  icon="i-lucide-zap"
                  class="cursor-pointer"
                  @click="expandHeroNudge(experience.id)"
                >
                  Possible HERO story
                </UButton>
              </div>

              <div v-if="experience.url" class="mt-3">
                <a
                  :href="experience.url"
                  target="_blank"
                  rel="noopener"
                  class="text-sm text-primary hover:underline inline-flex items-center gap-1"
                >
                  <UIcon name="i-lucide-external-link" class="w-3 h-3" />
                  Company Website
                </a>
              </div>
            </div>
          </div>
        </UPageCard>

        <!-- Edit Mode -->
        <UPageCard v-else variant="subtle">
          <div class="space-y-4">
            <div class="flex items-center justify-between gap-4">
              <h3 class="text-lg font-semibold">Edit Work Experience</h3>
              <div class="flex items-center gap-2">
                <UBadge
                  v-if="experience.lastEnhancedAt"
                  color="success"
                  variant="soft"
                  size="sm"
                >
                  <UIcon name="i-lucide-sparkles" class="w-3 h-3 mr-1" />
                  Enhanced
                </UBadge>
                <UButton
                  label="Get AI Help"
                  icon="i-lucide-sparkles"
                  color="primary"
                  variant="ghost"
                  size="sm"
                  class="cursor-pointer"
                  @click="openSageSession(experience.id)"
                />
              </div>
            </div>
            
            <!-- Employment Type and Company -->
            <div class="flex gap-4 max-sm:flex-col">
              <div class="flex-1">
                <label class="block text-sm font-medium mb-1">Employment Type <span class="text-error">*</span></label>
                <USelectMenu
                  v-model="formData.employmentType"
                  :items="employmentTypes"
                  value-key="value"
                  label-key="label"
                  class="w-full"
                />
              </div>
              <div class="flex-1">
                <label class="block text-sm font-medium mb-1">Company/Employer <span class="text-error">*</span></label>
                <UInput
                  v-model="formData.employer"
                  placeholder="e.g. Google, Microsoft"
                  class="w-full"
                  :error="!!formErrors.employer"
                />
                <p v-if="formErrors.employer" class="text-sm text-error mt-1">{{ formErrors.employer }}</p>
              </div>
            </div>

            <!-- Job Title -->
            <div>
              <label class="block text-sm font-medium mb-1">Job Title <span class="text-error">*</span></label>
              <UInput
                v-model="formData.title"
                placeholder="e.g. Senior Software Engineer"
                class="w-full"
                :error="!!formErrors.title"
              />
              <p v-if="formErrors.title" class="text-sm text-error mt-1">{{ formErrors.title }}</p>
            </div>

            <!-- Location and Location Type -->
            <div class="flex gap-4 max-sm:flex-col">
              <div class="flex-1">
                <label class="block text-sm font-medium mb-1">Location</label>
                <UInput
                  v-model="formData.location"
                  placeholder="e.g. San Francisco, CA"
                  class="w-full"
                />
              </div>
              <div class="flex-1">
                <label class="block text-sm font-medium mb-1">Location Type</label>
                <USelectMenu
                  v-model="formData.locationType"
                  :items="locationTypes"
                  value-key="value"
                  label-key="label"
                  class="w-full"
                />
              </div>
            </div>

            <!-- Company Website -->
            <div>
              <label class="block text-sm font-medium mb-1">Company Website</label>
              <UInput
                v-model="formData.url"
                placeholder="https://company.com"
                class="w-full"
                :error="!!formErrors.url"
              >
                <template #leading>
                  <UIcon name="i-lucide-link" class="w-4 h-4 text-muted" />
                </template>
              </UInput>
              <p v-if="formErrors.url" class="text-sm text-error mt-1">{{ formErrors.url }}</p>
            </div>

            <!-- Start Date, End Date, Current Position -->
            <div class="flex gap-4 max-sm:flex-col">
              <div class="flex-1">
                <label class="block text-sm font-medium mb-1">Start Date <span class="text-error">*</span></label>
                <UInput
                  v-model="formData.startDate"
                  v-maska="'##/####'"
                  placeholder="MM/YYYY"
                  class="w-full"
                  :error="!!formErrors.startDate"
                />
                <p v-if="formErrors.startDate" class="text-sm text-error mt-1">{{ formErrors.startDate }}</p>
              </div>
              <div class="flex-1">
                <label class="block text-sm font-medium mb-1">End Date <span v-if="!formData.currentPosition" class="text-error">*</span></label>
                <UInput
                  v-model="formData.endDate"
                  v-maska="'##/####'"
                  placeholder="MM/YYYY"
                  class="w-full"
                  :disabled="formData.currentPosition"
                  :error="!!formErrors.endDate"
                />
                <p v-if="formErrors.endDate" class="text-sm text-error mt-1">{{ formErrors.endDate }}</p>
              </div>
            </div>

            <!-- Current Position Checkbox -->
            <div class="flex items-center gap-2">
              <USwitch v-model="formData.currentPosition" />
              <label class="text-sm">I currently work here</label>
            </div>

            <!-- Summary -->
            <div>
              <label class="block text-sm font-medium mb-1">Summary</label>
              <UTextarea
                v-model="formData.summary"
                placeholder="Brief description of your role and responsibilities..."
                :rows="3"
                autoresize
                class="w-full"
              />
            </div>

            <!-- My Notes -->
            <div>
              <label class="block text-sm font-medium mb-1">My Notes</label>
              <UTextarea
                v-model="formData.contextNotes"
                placeholder="Private context you want to remember about this role..."
                :rows="4"
                autoresize
                class="w-full"
              />
            </div>

            <!-- Highlights -->
            <div>
              <label class="block text-sm font-medium mb-1">Key Achievements <span class="text-error">*</span></label>
              <div class="space-y-2">
                <div
                  v-for="(highlight, index) in formData.highlights"
                  :key="index"
                  class="flex gap-2 items-start"
                >
                  <UTextarea
                    v-model="formData.highlights![index]"
                    placeholder="Describe a key achievement or responsibility..."
                    autoresize
                    :rows="2"
                    class="flex-1"
                  />
                  <UButton
                    v-if="formData.highlights!.length > 1"
                    icon="i-lucide-x"
                    color="neutral"
                    variant="ghost"
                    class="cursor-pointer shrink-0"
                    @click="removeHighlight(index)"
                  />
                </div>
                <p v-if="formErrors.highlights" class="text-sm text-error">{{ formErrors.highlights }}</p>
                <UButton
                  label="Add Achievement"
                  icon="i-lucide-plus"
                  color="neutral"
                  variant="outline"
                  size="sm"
                  class="cursor-pointer"
                  @click="addHighlight"
                />
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-2 justify-end pt-4">
              <UButton
                label="Cancel"
                color="neutral"
                variant="ghost"
                class="cursor-pointer"
                @click="cancelEdit"
                :disabled="isSaving"
              />
              <UButton
                label="Save Changes"
                color="primary"
                icon="i-lucide-check"
                class="cursor-pointer"
                :loading="isSaving"
                @click="updateExperience"
              />
            </div>
          </div>
        </UPageCard>
      </div>
    </div>

    <!-- Empty State -->
    <UPageCard v-if="experiences.length === 0 && !isAddingExperience" variant="subtle">
      <div class="text-center py-12">
        <UIcon name="i-lucide-briefcase" class="w-16 h-16 text-muted mx-auto mb-4" />
        <h3 class="text-lg font-semibold mb-2">No Work Experience Added</h3>
        <p class="text-muted mb-6">Add your professional work history to showcase your career journey.</p>
        <UButton
          label="Add Your First Experience"
          color="primary"
          icon="i-lucide-plus"
          class="cursor-pointer"
          @click="startAddingExperience"
        />
      </div>
    </UPageCard>
  </div>

  <!-- Sage AI Session Slideover -->
  <USlideover
    v-model:open="sageSessionOpen"
    side="right"
    :overlay="false"
    :dismissible="true"
    :modal="false"
    :inset="true"
    :ui="{ content: 'max-w-2xl w-full' }"
    @update:open="(open) => { if (!open) closeSageSession() }"
  >
    <template #header="{ close }">
      <div class="w-full flex items-start justify-between gap-4">
        <div class="flex-1">
          <h2 class="text-lg font-semibold">
            Get AI Help
          </h2>
          <p class="text-sm text-muted mt-1">
            AI-guided experience enhancement
          </p>
        </div>
        <UButton
          icon="i-lucide-x"
          color="neutral"
          variant="ghost"
          size="md"
          class="cursor-pointer"
          @click="close"
        />
      </div>
    </template>
    <template #body>
      <div class="h-full p-4">
        <ProfileSageExperienceSession
          v-if="sageSessionExperience"
          :key="sageSessionExperience.id"
          :experience="sageSessionExperience"
          :profile-id="sageSessionExperience.profileId"
          @confirm="onSageSessionConfirm"
          @apply-summary="onSageSessionApplySummary"
          @apply-context-notes="onSageSessionApplyContextNotes"
          @close="closeSageSession"
        />
      </div>
    </template>
    <template #footer>
      <div class="flex items-center justify-end w-full">
        <UButton
          label="Close"
          color="neutral"
          variant="ghost"
          class="cursor-pointer"
          @click="closeSageSession"
        />
      </div>
    </template>
  </USlideover>
</template>
