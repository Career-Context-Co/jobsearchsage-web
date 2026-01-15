<script setup lang="ts">
import { vMaska } from 'maska/vue'
import type { ContactInfo } from '#shared/types/careerId'
import { validateEmail, validatePhone, validateRequired, validateUrls, validateLength, validateUrl } from '~/utils/validation'

const careerIDStore = useCareerIDStore()
const toast = useToast()
const router = useRouter()


// Loading state from store
const isLoading = computed(() => careerIDStore.isLoading)
const isSaving = computed(() => careerIDStore.isSaving)
const error = computed(() => careerIDStore.error)

// Contact info from store
const contactInfo = computed(() => careerIDStore.contactInfo)
const socialLinks = computed(() => careerIDStore.profileSocialLinks)

// Form state
const isEditingContact = ref(false)
const isEditingSummary = ref(false)
const isAddingSocialLink = ref(false)
const editingSocialLinkId = ref<number | null>(null)

// Form data - initialized when editing starts (extends ContactInfo with phone split)
const formData = ref<Partial<ContactInfo> & { 
  phoneCountryCode?: string
  phoneNumber?: string 
}>({})
const formErrors = ref<Record<string, string>>({})

// Social link form data
const socialLinkForm = ref<{
  platformId: number | undefined
  url: string
}>({
  platformId: undefined,
  url: ''
})
const socialLinkErrors = ref<Record<string, string>>({})

// Hardcoded social platforms with icons and base URLs
const socialPlatforms = ref<Array<{
  id: number
  platform_name: string
  display_name: string
  icon?: string
  base_url?: string
}>>([
  { id: 1, platform_name: 'linkedin', display_name: 'LinkedIn', base_url: 'https://linkedin.com/in/', icon: 'i-lucide-linkedin' },
  { id: 2, platform_name: 'github', display_name: 'GitHub', base_url: 'https://github.com/', icon: 'i-lucide-github' },
  { id: 3, platform_name: 'twitter', display_name: 'Twitter/X', base_url: 'https://twitter.com/', icon: 'i-lucide-twitter' },
  { id: 4, platform_name: 'instagram', display_name: 'Instagram', base_url: 'https://instagram.com/', icon: 'i-lucide-instagram' },
  { id: 5, platform_name: 'facebook', display_name: 'Facebook', base_url: 'https://facebook.com/', icon: 'i-lucide-facebook' },
  { id: 6, platform_name: 'youtube', display_name: 'YouTube', base_url: 'https://youtube.com/@', icon: 'i-lucide-youtube' },
  { id: 7, platform_name: 'dribbble', display_name: 'Dribbble', base_url: 'https://dribbble.com/', icon: 'i-lucide-dribbble' },
  { id: 8, platform_name: 'behance', display_name: 'Behance', base_url: 'https://behance.net/', icon: 'i-lucide-behance' },
  { id: 9, platform_name: 'medium', display_name: 'Medium', base_url: 'https://medium.com/@', icon: 'i-lucide-medium' },
  { id: 10, platform_name: 'devto', display_name: 'Dev.to', base_url: 'https://dev.to/', icon: 'i-lucide-code' },
  { id: 11, platform_name: 'stackoverflow', display_name: 'Stack Overflow', base_url: 'https://stackoverflow.com/users/', icon: 'i-lucide-stack-overflow' },
  { id: 12, platform_name: 'portfolio', display_name: 'Portfolio', base_url: 'https://', icon: 'i-lucide-globe' },
  { id: 13, platform_name: 'other', display_name: 'Other', base_url: 'https://', icon: 'i-lucide-link' }
])

// Helper to get platform details by platformId
function getPlatformById(platformId: number) {
  return socialPlatforms.value.find(p => p.id === platformId)
}

// Helper to parse phone number into country code and number
function parsePhone(phone: string | null | undefined): { countryCode: string; number: string } {
  if (!phone) return { countryCode: '1', number: '' }
  
  // Remove + and any formatting
  const cleaned = phone.replace(/[^\d]/g, '')
  
  // Try to extract country code (1-3 digits)
  if (cleaned.length >= 10) {
    // Try 1 digit country code first (US/Canada is most common)
    if (cleaned.startsWith('1') && cleaned.length === 11) {
      return { countryCode: '1', number: cleaned.slice(1) }
    }
    // Try 2 digit country code
    if (cleaned.length >= 11) {
      return { countryCode: cleaned.slice(0, 2), number: cleaned.slice(2) }
    }
    // Try 3 digit country code
    if (cleaned.length >= 12) {
      return { countryCode: cleaned.slice(0, 3), number: cleaned.slice(3) }
    }
  }
  
  return { countryCode: '1', number: cleaned }
}

// Helper to format phone number for display in view mode
function formatPhoneForDisplay(phone: string | null | undefined): string | null {
  if (!phone) return null
  
  const parsed = parsePhone(phone)
  const cleaned = parsed.number.replace(/[^\d]/g, '')
  
  // Format based on length (assuming North American format for 10 digits)
  if (cleaned.length === 10) {
    const areaCode = cleaned.slice(0, 3)
    const prefix = cleaned.slice(3, 6)
    const line = cleaned.slice(6, 10)
    return `+${parsed.countryCode} (${areaCode}) ${prefix}-${line}`
  }
  
  // For other formats, just return with country code
  return `+${parsed.countryCode} ${cleaned}`
}

// Helper to combine country code and number for save
function combinePhone(countryCode: string, number: string): string | null {
  if (!number || !number.trim()) return null
  const cleanCode = countryCode.replace(/[^\d]/g, '')
  const cleanNumber = number.replace(/[^\d]/g, '')
  if (!cleanCode || !cleanNumber) return null
  return `+${cleanCode}${cleanNumber}`
}

// Watch for platform selection changes and prefill URL
watch(() => socialLinkForm.value.platformId, (newPlatformId) => {
  if (newPlatformId) {
    const platform = getPlatformById(newPlatformId)
    if (platform?.base_url) {
      socialLinkForm.value.url = platform.base_url
    }
  }
})

// Initialize form data from store
function startEditingContact() {
  if (!contactInfo.value) return
  
  const parsed = parsePhone(contactInfo.value.phone)
  formData.value = {
    firstName: contactInfo.value.firstName,
    lastName: contactInfo.value.lastName,
    jobTitle: contactInfo.value.jobTitle,
    email: contactInfo.value.email,
    phoneCountryCode: parsed.countryCode,
    phoneNumber: parsed.number,
    websites: [...(contactInfo.value.websites || [])],
    city: contactInfo.value.city,
    stateRegion: contactInfo.value.stateRegion,
    country: contactInfo.value.country,
    postalCode: contactInfo.value.postalCode,
    willingToRelocate: contactInfo.value.willingToRelocate
  }
  formErrors.value = {}
  isEditingContact.value = true
}

function startEditingSummary() {
  if (!contactInfo.value) return
  
  formData.value = {
    summary: contactInfo.value.summary || ''
  }
  formErrors.value = {}
  isEditingSummary.value = true
}

function cancelEdit() {
  isEditingContact.value = false
  isEditingSummary.value = false
  formData.value = {}
  formErrors.value = {}
}

// Add/remove website fields
function addWebsite() {
  if (!formData.value.websites) {
    formData.value.websites = []
  }
  formData.value.websites.push('')
}

function removeWebsite(index: number) {
  if (formData.value.websites) {
    formData.value.websites.splice(index, 1)
  }
}

// Validate contact form
function validateContactForm(): boolean {
  const errors: Record<string, string> = {}
  
  // Required fields
  const firstNameError = validateRequired(formData.value.firstName, 'First name')
  if (firstNameError) errors.firstName = firstNameError
  
  const lastNameError = validateRequired(formData.value.lastName, 'Last name')
  if (lastNameError) errors.lastName = lastNameError
  
  const jobTitleError = validateRequired(formData.value.jobTitle, 'Job title')
  if (jobTitleError) errors.jobTitle = jobTitleError
  
  const emailError = validateEmail(formData.value.email, true)
  if (emailError) errors.email = emailError

  // Validate phone (combine country code + number)
  const combined = combinePhone(formData.value.phoneCountryCode || '', formData.value.phoneNumber || '')
  const phoneError = validatePhone(combined || '', true)
  if (phoneError) errors.phone = phoneError
  
  const cityError = validateRequired(formData.value.city, 'City')
  if (cityError) errors.city = cityError
  
  const stateError = validateRequired(formData.value.stateRegion, 'State/Region')
  if (stateError) errors.stateRegion = stateError
  
  const countryError = validateRequired(formData.value.country, 'Country')
  if (countryError) errors.country = countryError
  
  const postalError = validateRequired(formData.value.postalCode, 'Postal code')
  if (postalError) errors.postalCode = postalError
  
  // Validate websites (URLs)
  if (formData.value.websites && formData.value.websites.length > 0) {
    const urlErrors = validateUrls(formData.value.websites)
    if (urlErrors) {
      Object.entries(urlErrors).forEach(([index, error]) => {
        errors[`website_${index}`] = error
      })
    }
  }
  
  formErrors.value = errors
  return Object.keys(errors).length === 0
}

// Validate summary form
function validateSummaryForm(): boolean {
  const errors: Record<string, string> = {}
  
  const summaryError = validateRequired(formData.value.summary, 'Professional summary')
  if (summaryError) errors.summary = summaryError
  
  const lengthError = validateLength(formData.value.summary || '', 'Professional summary', undefined, 5000)
  if (lengthError) errors.summary = lengthError
  
  formErrors.value = errors
  return Object.keys(errors).length === 0
}

// Save contact info
async function saveContactInfo() {
  if (!validateContactForm()) {
    toast.add({
      title: 'Validation Error',
      description: 'Please fix the errors in the form',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
    return
  }
  
  try {
    await careerIDStore.updateContactInfo(contactInfo.value!.id, {
      firstName: formData.value.firstName!,
      lastName: formData.value.lastName!,
      jobTitle: formData.value.jobTitle!,
      email: formData.value.email!,
      phone: combinePhone(formData.value.phoneCountryCode || '', formData.value.phoneNumber || ''),
      websites: formData.value.websites || [],
      city: formData.value.city || null,
      stateRegion: formData.value.stateRegion || null,
      country: formData.value.country || null,
      postalCode: formData.value.postalCode || null,
      willingToRelocate: formData.value.willingToRelocate || false
    })
    
    toast.add({
      title: 'Success',
      description: 'Contact information updated successfully',
      icon: 'i-lucide-check',
      color: 'success'
    })
    
    isEditingContact.value = false
    formData.value = {}
    formErrors.value = {}
  } catch (err: any) {
    toast.add({
      title: 'Error',
      description: err?.message || 'Failed to update contact information',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  }
}

// Save professional summary
async function saveSummary() {
  if (!validateSummaryForm()) {
    toast.add({
      title: 'Validation Error',
      description: 'Please fix the errors in the form',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
    return
  }
  
  try {
    await careerIDStore.updateContactInfo(
      contactInfo.value!.id,
      { summary: formData.value.summary }
    )
    
    toast.add({
      title: 'Success',
      description: 'Professional summary updated successfully',
      icon: 'i-lucide-check',
      color: 'success'
    })
    
    isEditingSummary.value = false
    formData.value = {}
    formErrors.value = {}
  } catch (err: any) {
    toast.add({
      title: 'Error',
      description: err?.message || 'Failed to update professional summary',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  }
}

// Character count for summary
const summaryCharCount = computed(() => {
  return formData.value.summary?.length || 0
})

// Social link management functions
function startAddingSocialLink() {
  // Set default platform (LinkedIn) and prefill URL
  const defaultPlatform = socialPlatforms.value[0]
  socialLinkForm.value = {
    platformId: defaultPlatform?.id || undefined,
    url: defaultPlatform?.base_url || ''
  }
  socialLinkErrors.value = {}
  isAddingSocialLink.value = true
}

function startEditingSocialLink(linkId: number, currentUrl: string) {
  editingSocialLinkId.value = linkId
  socialLinkForm.value = {
    platformId: undefined, // Not needed for edit
    url: currentUrl
  }
  socialLinkErrors.value = {}
}

function cancelSocialLinkEdit() {
  isAddingSocialLink.value = false
  editingSocialLinkId.value = null
  socialLinkForm.value = { platformId: undefined, url: '' }
  socialLinkErrors.value = {}
}

function validateSocialLinkForm(isEdit = false): boolean {
  const errors: Record<string, string> = {}
  
  if (!isEdit) {
    const platformError = validateRequired(socialLinkForm.value.platformId, 'Platform')
    if (platformError) errors.platformId = platformError
  }
  
  const urlError = validateUrl(socialLinkForm.value.url, true)
  if (urlError) errors.url = urlError
  
  socialLinkErrors.value = errors
  return Object.keys(errors).length === 0
}

async function addSocialLink() {
  if (!validateSocialLinkForm(false)) {
    toast.add({
      title: 'Validation Error',
      description: 'Please fix the errors in the form',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
    return
  }
  
  try {
    await careerIDStore.addSocialLinks([{
      platformId: socialLinkForm.value.platformId!,
      url: socialLinkForm.value.url,
      displayOrder: (socialLinks.value?.length || 0) + 1
    }])
    
    toast.add({
      title: 'Success',
      description: 'Social link added successfully',
      icon: 'i-lucide-check',
      color: 'success'
    })
    
    cancelSocialLinkEdit()
  } catch (err: any) {
    toast.add({
      title: 'Error',
      description: err?.message || 'Failed to add social link',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  }
}

async function updateSocialLink(linkId: number) {
  if (!validateSocialLinkForm(true)) {
    toast.add({
      title: 'Validation Error',
      description: 'Please fix the errors in the form',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
    return
  }
  
  try {
    await careerIDStore.updateSocialLink(linkId, {
      url: socialLinkForm.value.url
    })
    
    toast.add({
      title: 'Success',
      description: 'Social link updated successfully',
      icon: 'i-lucide-check',
      color: 'success'
    })
    
    cancelSocialLinkEdit()
  } catch (err: any) {
    toast.add({
      title: 'Error',
      description: err?.message || 'Failed to update social link',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  }
}

async function deleteSocialLink(linkId: number) {
  try {
    await careerIDStore.deleteSocialLink(linkId)

    toast.add({
      title: 'Success',
      description: 'Social link deleted successfully',
      icon: 'i-lucide-check',
      color: 'success'
    })
  } catch (err: any) {
    toast.add({
      title: 'Error',
      description: err?.message || 'Failed to delete social link',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  }
}

// State to track if profile doesn't exist (for empty state)
const showEmptyState = ref(false)

// Fetch profile data on mount
onMounted(async () => {
  const profileId = careerIDStore.profileId

  // If no profileId is set, show empty state immediately
  if (!profileId) {
    showEmptyState.value = true
    return
  }

  // If profile is already loaded (e.g., from onboarding), clear any stale errors
  if (careerIDStore.isProfileLoaded && careerIDStore.contactInfo) {
    careerIDStore.clearError()
    return
  }

  try {
    // Only fetch if not already loaded
    if (!careerIDStore.isProfileLoaded) {
      await careerIDStore.fetchProfile(profileId)
    }

    // If no profile found after fetch, show empty state
    if (!careerIDStore.profile) {
      showEmptyState.value = true
    }
    
    // Social platforms are hardcoded, no need to fetch
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
      // Other errors - log but still show empty state with option to retry
      console.error('Failed to load profile:', err)
      showEmptyState.value = true
    }
  }
})
</script>

<template>
  <!-- Loading State -->
  <div v-if="isLoading" class="space-y-4">
    <USkeleton class="h-32 w-full" />
    <USkeleton class="h-64 w-full" />
    <USkeleton class="h-48 w-full" />
  </div>

  <!-- Empty State - No Profile Found -->
  <div v-else-if="showEmptyState">
    <UPageCard
      title="Welcome to Your Profile"
      variant="subtle"
    >
      <div class="flex flex-col items-center justify-center py-12 gap-6 max-w-md mx-auto text-center">
        <UIcon name="i-lucide-user-circle" class="w-20 h-20 text-primary" />
        <div class="space-y-2">
          <h3 class="text-xl font-semibold">No Profile Yet</h3>
          <p class="text-muted text-base">
            You haven't created your professional profile yet. Let's get started by completing your onboarding!
          </p>
        </div>
        <div class="space-y-3 w-full">
          <UButton
            label="Start Onboarding"
            icon="i-lucide-rocket"
            size="lg"
            color="primary"
            block
            @click="router.push('/profile/onboarding')"
          />
          <p class="text-sm text-muted">
            It only takes a few minutes to set up your profile
          </p>
        </div>
        <UDivider class="my-4" />
        <div class="text-left w-full space-y-2">
          <p class="text-sm font-medium">What you'll add:</p>
          <ul class="space-y-2 text-sm text-muted">
            <li class="flex items-center gap-2">
              <UIcon name="i-lucide-check-circle" class="w-4 h-4 text-success" />
              Contact information & professional summary
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-lucide-check-circle" class="w-4 h-4 text-success" />
              Work experience & education
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-lucide-check-circle" class="w-4 h-4 text-success" />
              Skills & certifications
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-lucide-check-circle" class="w-4 h-4 text-success" />
              Social links & portfolio
            </li>
          </ul>
        </div>
      </div>
    </UPageCard>
  </div>

  <!-- Error State (for non-404 errors) -->
  <div v-else-if="error && !showEmptyState">
    <UPageCard
      title="Error Loading Profile"
      variant="subtle"
    >
      <div class="flex flex-col items-center justify-center py-8 gap-4">
        <UIcon name="i-lucide-alert-circle" class="w-12 h-12 text-error" />
        <p class="text-muted">{{ error }}</p>
        <UButton
          label="Retry"
          color="primary"
          @click="router.push('/profile/onboarding')"
        />
      </div>
    </UPageCard>
  </div>

  <!-- Profile Content -->
  <div v-else-if="contactInfo" class="space-y-4">
    <!-- Contact Information Section -->
    <UPageCard
      title="Contact Information"
      description="Your personal and professional contact details"
      variant="naked"
      orientation="horizontal"
      class="mb-4"
    >
      <UButton
        v-if="!isEditingContact"
        label="Edit"
        color="neutral"
        variant="outline"
        icon="i-lucide-pencil"
        class="cursor-pointer w-fit lg:ms-auto"
        @click="startEditingContact"
      />
      <div v-else class="flex gap-2 w-fit lg:ms-auto">
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
          class="cursor-pointer"
          icon="i-lucide-check"
          :loading="isSaving"
          @click="saveContactInfo"
        />
      </div>
    </UPageCard>

    <UPageCard variant="subtle">
      <!-- View Mode -->
      <template v-if="!isEditingContact">
        <!-- Name -->
        <div class="flex max-sm:flex-col justify-between items-start gap-4">
          <div class="flex-1">
            <label class="block text-sm font-medium mb-1">Name</label>
            <p class="text-base">{{ contactInfo.firstName }} {{ contactInfo.lastName }}</p>
          </div>
        </div>
        
        <USeparator />

        <!-- Job Title -->
        <div class="flex max-sm:flex-col justify-between items-start gap-4">
          <div class="flex-1">
            <label class="block text-sm font-medium mb-1">Job Title</label>
            <p class="text-base">{{ contactInfo.jobTitle || 'Not specified' }}</p>
          </div>
        </div>

        <USeparator />

        <!-- Email -->
        <div class="flex max-sm:flex-col justify-between items-start gap-4">
          <div class="flex-1">
            <label class="block text-sm font-medium mb-1">Email</label>
            <p class="text-base">{{ contactInfo.email }}</p>
          </div>
        </div>

        <USeparator />

        <!-- Phone -->
        <div class="flex max-sm:flex-col justify-between items-start gap-4">
          <div class="flex-1">
            <label class="block text-sm font-medium mb-1">Phone</label>
            <p class="text-base">{{ formatPhoneForDisplay(contactInfo.phone) || 'Not specified' }}</p>
          </div>
        </div>

        <USeparator />

        <!-- Location -->
        <div class="flex max-sm:flex-col justify-between items-start gap-4">
          <div class="flex-1">
            <label class="block text-sm font-medium mb-1">Location</label>
            <p class="text-base">
              <template v-if="contactInfo.city || contactInfo.stateRegion || contactInfo.country">
                {{ [contactInfo.city, contactInfo.stateRegion, contactInfo.country].filter(Boolean).join(', ') }}
              </template>
              <template v-else>
                Not specified
              </template>
            </p>
          </div>
        </div>

        <USeparator />

        <!-- Websites -->
        <div v-if="contactInfo.websites?.length" class="flex max-sm:flex-col justify-between items-start gap-4">
          <div class="flex-1">
            <label class="block text-sm font-medium mb-1">Websites</label>
            <ul class="space-y-1">
              <li v-for="(website, index) in contactInfo.websites" :key="index">
                <a :href="website" target="_blank" rel="noopener" class="text-primary hover:underline">
                  {{ website }}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <USeparator v-if="contactInfo.websites?.length" />

        <!-- Willing to Relocate -->
        <div class="flex max-sm:flex-col justify-between items-start gap-4">
          <div class="flex-1">
            <label class="block text-sm font-medium mb-1">Willing to Relocate</label>
            <p class="text-base">{{ contactInfo.willingToRelocate ? 'Yes' : 'No' }}</p>
          </div>
        </div>
      </template>

      <!-- Edit Mode -->
      <template v-else>
        <!-- First Name -->
        <div class="flex max-sm:flex-col justify-between items-start gap-4">
          <div class="flex-1">
            <label class="block text-sm font-medium mb-1">First Name <span class="text-error">*</span></label>
            <UInput
              class="w-full"
              v-model="formData.firstName"
              placeholder="Enter your first name"
              :error="!!formErrors.firstName"
            />
            <p v-if="formErrors.firstName" class="text-sm text-error mt-1">{{ formErrors.firstName }}</p>
          </div>
        </div>
        
        <USeparator />

        <!-- Last Name -->
        <div class="flex max-sm:flex-col justify-between items-start gap-4">
          <div class="flex-1">
            <label class="block text-sm font-medium mb-1">Last Name <span class="text-error">*</span></label>
            <UInput
              class="w-full"
              v-model="formData.lastName"
              placeholder="Enter your last name"
              :error="!!formErrors.lastName"
            />
            <p v-if="formErrors.lastName" class="text-sm text-error mt-1">{{ formErrors.lastName }}</p>
          </div>
        </div>

        <USeparator />

        <!-- Job Title -->
        <div class="flex max-sm:flex-col justify-between items-start gap-4">
          <div class="flex-1">
            <label class="block text-sm font-medium mb-1">Job Title <span class="text-error">*</span></label>
            <UInput
              class="w-full"
              v-model="formData.jobTitle"
              placeholder="e.g. Senior Software Engineer"
              :error="!!formErrors.jobTitle"
            />
            <p v-if="formErrors.jobTitle" class="text-sm text-error mt-1">{{ formErrors.jobTitle }}</p>
          </div>
        </div>

        <USeparator />

        <!-- Email -->
        <div class="flex max-sm:flex-col justify-between items-start gap-4">
          <div class="flex-1">
            <label class="block text-sm font-medium mb-1">Email <span class="text-error">*</span></label>
            <UInput
              class="w-full"
              v-model="formData.email"
              type="email"
              placeholder="your.email@example.com"
              :error="!!formErrors.email"
            />
            <p v-if="formErrors.email" class="text-sm text-error mt-1">{{ formErrors.email }}</p>
          </div>
        </div>

        <USeparator />

        <!-- Phone -->
        <div class="flex max-sm:flex-col justify-between items-start gap-4">
          <div class="flex-1">
            <label class="block text-sm font-medium mb-1">Phone <span class="text-error">*</span></label>
            <div class="flex gap-2">
              <!-- Country Code -->
              <div class="w-24">
                <UInput
                  class="rounded"
                  v-model="formData.phoneCountryCode"
                  v-maska="'###'"
                  type="tel"
                  placeholder="1"
                  :error="!!formErrors.phone"
                >
                  <template #leading>
                    <span class="text-muted">+</span>
                  </template>
                </UInput>
              </div>
              <!-- Phone Number (with mask for formatting) -->
              <div class="flex-1">
                <UInput
                  class="rounded"
                  v-model="formData.phoneNumber"
                  v-maska="'(###) ###-####'"
                  type="tel"
                  placeholder="(555) 123-4567"
                  :error="!!formErrors.phone"
                />
              </div>
            </div>
            <p v-if="formErrors.phone" class="text-sm text-error mt-1">{{ formErrors.phone }}</p>
          </div>
        </div>

        <USeparator />

        <!-- City -->
        <div class="flex max-sm:flex-col justify-between items-start gap-4">
          <div class="flex-1">
            <label class="block text-sm font-medium mb-1">City <span class="text-error">*</span></label>
            <UInput
              class="w-full"
              v-model="formData.city"
              placeholder="Enter your city"
              :error="!!formErrors.city"
            />
            <p v-if="formErrors.city" class="text-sm text-error mt-1">{{ formErrors.city }}</p>
          </div>
        </div>

        <USeparator />

        <!-- State/Region -->
        <div class="flex max-sm:flex-col justify-between items-start gap-4">
          <div class="flex-1">
            <label class="block text-sm font-medium mb-1">State/Region <span class="text-error">*</span></label>
            <UInput
              class="w-full"
              v-model="formData.stateRegion"
              placeholder="e.g. California, Ontario"
              :error="!!formErrors.stateRegion"
            />
            <p v-if="formErrors.stateRegion" class="text-sm text-error mt-1">{{ formErrors.stateRegion }}</p>
          </div>
        </div>

        <USeparator />

        <!-- Country -->
        <div class="flex max-sm:flex-col justify-between items-start gap-4">
          <div class="flex-1">
            <label class="block text-sm font-medium mb-1">Country <span class="text-error">*</span></label>
            <UInput
              class="w-full"
              v-model="formData.country"
              placeholder="e.g. United States, Canada"
              :error="!!formErrors.country"
            />
            <p v-if="formErrors.country" class="text-sm text-error mt-1">{{ formErrors.country }}</p>
          </div>
        </div>

        <USeparator />

        <!-- Postal Code -->
        <div class="flex max-sm:flex-col justify-between items-start gap-4">
          <div class="flex-1">
            <label class="block text-sm font-medium mb-1">Postal Code <span class="text-error">*</span></label>
            <UInput
              class="w-full"
              v-model="formData.postalCode"
              placeholder="e.g. 12345"
              :error="!!formErrors.postalCode"
            />
            <p v-if="formErrors.postalCode" class="text-sm text-error mt-1">{{ formErrors.postalCode }}</p>
          </div>
        </div>

        <USeparator />

        <!-- Websites -->
        <div class="flex max-sm:flex-col justify-between items-start gap-4">
          <div class="flex-1">
            <label class="block text-sm font-medium mb-1">Websites</label>
            <div class="space-y-2">
              <div v-for="(website, index) in formData.websites" :key="index" class="flex gap-2">
                <UInput
                  v-model="formData.websites![index]"
                  placeholder="https://example.com"
                  class="flex-1"
                  :error="!!formErrors[`website_${index}`]"
                />
                <UButton
                  class="cursor-pointer"
                  icon="i-lucide-x"
                  color="neutral"
                  variant="ghost"
                  @click="removeWebsite(index)"
                />
              </div>
              <p v-if="formErrors[`website_${formData.websites?.length || 0}`]" class="text-sm text-error">
                {{ formErrors[`website_${formData.websites?.length || 0}`] }}
              </p>
              <UButton
                label="Add Website"
                icon="i-lucide-plus"
                color="neutral"
                variant="outline"
                size="sm"
                @click="addWebsite"
              />
            </div>
          </div>
        </div>

        <USeparator />

        <!-- Willing to Relocate -->
        <div class="flex max-sm:flex-col justify-between items-start gap-4">
          <div class="flex-1">
            <label class="block text-sm font-medium mb-1">Willing to Relocate</label>
            <div class="flex items-center gap-2">
              <USwitch v-model="formData.willingToRelocate" />
              <span class="text-md">{{ formData.willingToRelocate ? 'Yes' : 'No' }}</span>
            </div>
          </div>
        </div>
      </template>
    </UPageCard>

    <!-- Professional Summary Section -->
    <UPageCard
      title="Professional Summary"
      description="Brief overview of your professional experience and goals"
      variant="naked"
      orientation="horizontal"
      class="mt-8 mb-4"
    >
      <UButton
        v-if="!isEditingSummary"
        label="Edit"
        color="neutral"
        variant="outline"
        icon="i-lucide-pencil"
        class="cursor-pointer w-fit lg:ms-auto"
        @click="startEditingSummary"
      />
      <div v-else class="flex gap-2 w-fit lg:ms-auto">
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
          class="cursor-pointer"
          icon="i-lucide-check"
          :loading="isSaving"
          @click="saveSummary"
        />
      </div>
    </UPageCard>

    <UPageCard variant="subtle">
      <!-- View Mode -->
      <div v-if="!isEditingSummary" class="prose prose-sm max-w-none">
        <p v-if="contactInfo.summary" class="whitespace-pre-wrap">{{ contactInfo.summary }}</p>
        <p v-else class="text-muted italic">No professional summary added yet.</p>
      </div>

      <!-- Edit Mode -->
      <div v-else>
        <label class="block text-sm font-medium mb-2">Professional Summary <span class="text-error">*</span></label>
        <UTextarea
          v-model="formData.summary"
          placeholder="Write a brief overview of your professional experience, key skills, and career goals..."
          :rows="8"
          :error="!!formErrors.summary"
          autoresize
          class="w-full"
        />
        <div class="flex justify-between items-center mt-2">
          <p v-if="formErrors.summary" class="text-sm text-error">{{ formErrors.summary }}</p>
          <p class="text-sm text-muted ml-auto">{{ summaryCharCount }} / 5000 characters</p>
        </div>
      </div>
    </UPageCard>

    <!-- Social Links Section -->
    <UPageCard
      title="Social Profiles"
      description="Your professional social media profiles"
      variant="naked"
      orientation="horizontal"
      class="mt-8 mb-4"
    >
      <UButton
        label="Add Social"
        color="neutral"
        variant="outline"
        icon="i-lucide-plus"
        class="cursor-pointer w-fit lg:ms-auto"
        @click="startAddingSocialLink"
        :disabled="isAddingSocialLink"
      />
    </UPageCard>

    <UPageCard variant="subtle">
      <!-- Existing Social Links -->
      <div v-if="socialLinks?.length" class="space-y-3">
        <div
          v-for="link in socialLinks"
          :key="link.id"
          class="flex items-center justify-between gap-4 p-3 rounded-lg border border-default hover:bg-muted/50 transition-colors"
        >
          <!-- View Mode -->
          <template v-if="editingSocialLinkId !== link.id">
            <div class="flex items-center gap-3 flex-1">
              <UIcon 
                v-if="getPlatformById(link.platformId)?.icon" 
                :name="getPlatformById(link.platformId)!.icon!" 
                class="w-5 h-5 text-muted shrink-0" 
              />
              <UIcon v-else name="i-lucide-link" class="w-5 h-5 text-muted shrink-0" />
              <div>
                <p class="font-medium">{{ link.platformNameCache }}</p>
                <a :href="link.url" target="_blank" rel="noopener" class="text-sm text-primary hover:underline">
                  {{ link.url }}
                </a>
              </div>
            </div>
            <div class="flex gap-2">
              <UButton
                class="cursor-pointer"
                icon="i-lucide-pencil"
                color="neutral"
                variant="ghost"
                size="sm"
                @click="startEditingSocialLink(link.id, link.url)"
              />
              <UButton
                class="cursor-pointer"
                icon="i-lucide-trash-2"
                color="error"
                variant="ghost"
                size="sm"
                @click="deleteSocialLink(link.id)"
                :loading="isSaving"
              />
            </div>
          </template>

          <!-- Edit Mode -->
          <template v-else>
            <div class="flex-1 space-y-2">
              <div class="flex items-center gap-2">
                <UIcon 
                  v-if="getPlatformById(link.platformId)?.icon" 
                  :name="getPlatformById(link.platformId)!.icon!" 
                  class="w-5 h-5 text-muted shrink-0" 
                />
                <UIcon v-else name="i-lucide-link" class="w-5 h-5 text-muted shrink-0" />
                <p class="font-medium text-sm">{{ link.platformNameCache }}</p>
              </div>
              <UInput
                v-model="socialLinkForm.url"
                :placeholder="getPlatformById(link.platformId)?.base_url ? `${getPlatformById(link.platformId)!.base_url}your-username` : 'https://example.com/your-profile'"
                :error="!!socialLinkErrors.url"
                class="flex-1"
              >
                <template #leading>
                  <UIcon name="i-lucide-link" class="w-4 h-4 text-muted" />
                </template>
              </UInput>
              <p v-if="socialLinkErrors.url" class="text-sm text-error">{{ socialLinkErrors.url }}</p>
            </div>
            <div class="flex gap-2">
              <UButton
                label="Cancel"
                color="neutral"
                variant="ghost"
                size="sm"
                @click="cancelSocialLinkEdit"
                :disabled="isSaving"
              />
              <UButton
                label="Save"
                color="primary"
                size="sm"
                icon="i-lucide-check"
                @click="updateSocialLink(link.id)"
                :loading="isSaving"
              />
            </div>
          </template>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="!isAddingSocialLink" class="text-center py-8">
        <UIcon name="i-lucide-link" class="w-12 h-12 text-muted mx-auto mb-3" />
        <p class="text-muted mb-4">No social links added yet.</p>
        <UButton
          label="Add Your First Link"
          color="primary"
          variant="outline"
          icon="i-lucide-plus"
          @click="startAddingSocialLink"
        />
      </div>

      <!-- Add New Social Link Form -->
      <div v-if="isAddingSocialLink" class="mt-4 p-4 border border-default rounded-lg space-y-4">
        <h4 class="font-medium">Add Social Link</h4>
        
        <!-- Platform Selector -->
        <div>
          <label class="block text-sm font-medium mb-1">Platform <span class="text-error">*</span></label>
          <USelectMenu
            class="w-full"
            v-model="socialLinkForm.platformId"
            :items="socialPlatforms"
            label-key="display_name"
            value-key="id"
            placeholder="Select a platform"
            :error="!!socialLinkErrors.platformId"
          >
            <template #leading>
              <UIcon 
                v-if="socialLinkForm.platformId && getPlatformById(socialLinkForm.platformId)?.icon"
                :name="getPlatformById(socialLinkForm.platformId)!.icon!" 
                class="w-4 h-4 text-muted" 
              />
              <UIcon v-else name="i-lucide-share-2" class="w-4 h-4 text-muted" />
            </template>
          </USelectMenu>
          <p v-if="socialLinkErrors.platformId" class="text-sm text-error mt-1">{{ socialLinkErrors.platformId }}</p>
        </div>

        <!-- URL Input -->
        <div>
          <label class="block text-sm font-medium mb-1">Profile URL <span class="text-error">*</span></label>
          <UInput
            class="w-full"
            v-model="socialLinkForm.url"
            :placeholder="socialLinkForm.platformId && getPlatformById(socialLinkForm.platformId)?.base_url ? `${getPlatformById(socialLinkForm.platformId)!.base_url}your-username` : 'Select a platform first'"
            :error="!!socialLinkErrors.url"
          >
            <template #leading>
              <UIcon name="i-lucide-link" class="w-4 h-4 text-muted" />
            </template>
          </UInput>
          <p v-if="socialLinkErrors.url" class="text-sm text-error mt-1">{{ socialLinkErrors.url }}</p>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-2 justify-end">
          <UButton
            label="Cancel"
            color="neutral"
            variant="ghost"
            @click="cancelSocialLinkEdit"
            :disabled="isSaving"
          />
          <UButton
            label="Add Link"
            color="primary"
            icon="i-lucide-check"
            @click="addSocialLink"
            :loading="isSaving"
          />
        </div>
      </div>
    </UPageCard>
  </div>

  <!-- No Profile State -->
  <div v-else>
    <UPageCard variant="subtle">
      <div class="flex flex-col items-center justify-center py-12 gap-4">
        <UIcon name="i-lucide-user" class="w-16 h-16 text-muted" />
        <h3 class="text-lg font-semibold">No Profile Found</h3>
        <p class="text-muted text-center max-w-md">
          It looks like you haven't created your profile yet. Complete onboarding to get started.
        </p>
        
        <ProfileOnboardingContinueOnboardingModal />
      </div>
    </UPageCard>
  </div>
</template>
