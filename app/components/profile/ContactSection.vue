<script setup lang="ts">
import { onMounted } from 'vue'
import { vMaska } from 'maska/vue'
import type { ContactInfo, ProfileSocialLink } from '~/shared/types/careerId'
import { validateEmail, validatePhone, validateUrl, validateUrls, validateRequired } from '~/utils/validation'

interface SocialPlatform {
  id: number
  platform_name: string
  display_name: string
  base_url: string
  icon: string
}

interface ContactInfoFormData {
  firstName: string
  lastName: string
  email: string
  jobTitle?: string | null
  phone?: string | null
  city?: string | null
  stateRegion?: string | null
  country?: string | null
  postalCode?: string | null
  summary?: string | null
  websites?: string[]
  willingToRelocate?: boolean
}

interface ContactInfoErrors {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  jobTitle?: string
  websites?: string
  socialLinks?: Record<number, string>
}

interface Props {
  contactInfo: ContactInfo
  profileSocialLinks?: ProfileSocialLink[]
}

const props = withDefaults(defineProps<Props>(), {
  profileSocialLinks: () => []
})

const socialPlatforms = ref<SocialPlatform[]>([
  { id: 1, platform_name: 'linkedin', display_name: 'LinkedIn', base_url: 'https://linkedin.com/in/', icon: 'i-lucide-linkedin' },
  { id: 2, platform_name: 'github', display_name: 'GitHub', base_url: 'https://github.com/', icon: 'i-lucide-github' },
  { id: 3, platform_name: 'twitter', display_name: 'Twitter/X', base_url: 'https://twitter.com/', icon: 'i-lucide-twitter' },
  { id: 4, platform_name: 'instagram', display_name: 'Instagram', base_url: 'https://instagram.com/', icon: 'i-lucide-instagram' },
  { id: 5, platform_name: 'facebook', display_name: 'Facebook', base_url: 'https://facebook.com/', icon: 'i-lucide-facebook' }
])

// Single emit on save - parent diffs against store to determine API calls
const emit = defineEmits<{
  save: [data: { 
    contactInfo: ContactInfoFormData, 
    socialLinks: { id?: number, platformId: number, url: string }[],
    deletedLinkIds: number[]
  }]
}>()

// Initialize local state from props (format phone if needed)
function initializeContactInfo() {
  // Deep clone to avoid shared references with store
  const initial = { 
    ...props.contactInfo,
    websites: props.contactInfo.websites ? [...props.contactInfo.websites] : []
  }
  // Convert E.164 phone format to display format
  if (initial.phone && initial.phone.startsWith('+1')) {
    const digits = initial.phone.replace(/\D/g, '')
    if (digits.length === 11 && digits.startsWith('1')) {
      const areaCode = digits.slice(1, 4)
      const prefix = digits.slice(4, 7)
      const line = digits.slice(7, 11)
      initial.phone = `+1 (${areaCode}) ${prefix}-${line}`
    }
  }
  return initial
}

// Local reactive copy for two-way binding (source of truth)
const contactInfo = ref<ContactInfo>(initializeContactInfo())
// Deep clone social links to avoid shared object references with store
const socialLinks = ref<ProfileSocialLink[]>(
  (props.profileSocialLinks || []).map(link => ({ ...link }))
)

// Track if data has been modified
const hasChanges = ref(false)

// Validation errors
const validationErrors = ref<ContactInfoErrors>({})

// Social links management
const deletedLinkIds = ref<number[]>([]) // Track IDs of deleted links for explicit DELETE calls
const showAddSocialForm = ref(socialLinks.value.length === 0) // Show form by default only if no links
const selectedSocialPlatformId = ref<number>(socialPlatforms.value?.[0]?.id || 1)
const socialLinkUrl = ref(socialPlatforms.value?.[0]?.base_url || '')

// Computed property to get the full platform object based on selected ID
const selectedSocialPlatform = computed(() => {
  return socialPlatforms.value.find(p => p.id === selectedSocialPlatformId.value)
})

// Watch local copies for user changes
watch(contactInfo, () => {
  hasChanges.value = true
}, { deep: true })

watch(socialLinks, () => {
  hasChanges.value = true
}, { deep: true })

// Reset hasChanges after component mounts
onMounted(() => {
  hasChanges.value = false
})

// Helper to get platform details by platformId
function getPlatformById(platformId: number) {
  return socialPlatforms.value.find(p => p.id === platformId)
}

// Watch for platform changes and auto-update URL
watch(selectedSocialPlatformId, (newPlatformId) => {
  const platform = socialPlatforms.value.find(p => p.id === newPlatformId)
  if (platform?.base_url) {
    socialLinkUrl.value = platform.base_url
  }
})

function addWebsite() {
  if (!contactInfo.value.websites) {
    contactInfo.value.websites = []
  }
  contactInfo.value.websites.push('')
}

function removeWebsite(index: number) {
  if (contactInfo.value.websites) {
    contactInfo.value.websites.splice(index, 1)
  }
}

// All changes are local until save
function addSocialLink() {
  if (!selectedSocialPlatform.value || !socialLinkUrl.value.trim()) {
    return
  }
  
  // Don't add if URL is just the base URL (not customized)
  if (socialLinkUrl.value === selectedSocialPlatform.value.base_url) {
    return
  }
  
  // Add to local state (no id = new link)
  socialLinks.value.push({
    platformId: selectedSocialPlatformId.value,
    url: socialLinkUrl.value
  } as ProfileSocialLink)
  
  // Reset form
  selectedSocialPlatformId.value = socialPlatforms.value?.[0]?.id || 1
  socialLinkUrl.value = socialPlatforms.value?.[0]?.base_url || ''
  showAddSocialForm.value = false
}

function updateSocialLinkUrl(index: number, url: string) {
  if (socialLinks.value[index]) {
    socialLinks.value[index].url = url
  }
}

function removeSocialLink(index: number) {
  const link = socialLinks.value[index]
  // If the link has an ID (exists in database), track it for deletion
  if (link?.id !== undefined) {
    deletedLinkIds.value.push(link.id)
  }
  socialLinks.value.splice(index, 1)
  hasChanges.value = true
}

// Validate contact info before saving
function validateContactInfo(): boolean {
  validationErrors.value = {}
  let isValid = true
  
  // Validate required fields
  const firstNameError = validateRequired(contactInfo.value.firstName, 'First name')
  if (firstNameError) {
    validationErrors.value.firstName = firstNameError
    isValid = false
  }
  
  const lastNameError = validateRequired(contactInfo.value.lastName, 'Last name')
  if (lastNameError) {
    validationErrors.value.lastName = lastNameError
    isValid = false
  }
  
  // Validate email
  const emailError = validateEmail(contactInfo.value.email, true)
  if (emailError) {
    validationErrors.value.email = emailError
    isValid = false
  }
  
  // Validate phone (optional but if provided, must be valid)
  const phoneError = validatePhone(contactInfo.value.phone, false)
  if (phoneError) {
    validationErrors.value.phone = phoneError
    isValid = false
  }
  
  // Validate websites
  if (contactInfo.value.websites && contactInfo.value.websites.length > 0) {
    const websiteErrors = validateUrls(contactInfo.value.websites.filter((w: string) => w && w.trim()))
    if (websiteErrors) {
      validationErrors.value.websites = websiteErrors
      isValid = false
    }
  }
  
  // Validate social links
  const socialLinkErrors: Record<number, string> = {}
  
  // Check for duplicate platforms
  const platformCounts = new Map<number, number[]>()
  socialLinks.value.forEach((link: ProfileSocialLink, index: number) => {
    if (!platformCounts.has(link.platformId)) {
      platformCounts.set(link.platformId, [])
    }
    platformCounts.get(link.platformId)!.push(index)
  })
  
  // Mark duplicates
  platformCounts.forEach((indices, platformId) => {
    if (indices.length > 1) {
      const platform = getPlatformById(platformId)
      indices.forEach(index => {
        socialLinkErrors[index] = `Duplicate ${platform?.display_name || 'platform'}. You can only have one link per platform. Please remove one.`
        isValid = false
      })
    }
  })
  
  // Validate URLs
  socialLinks.value.forEach((link: ProfileSocialLink, index: number) => {
    // Skip URL validation if already marked as duplicate
    if (!socialLinkErrors[index] && link.url && link.url.trim()) {
      const urlError = validateUrl(link.url, false)
      if (urlError) {
        socialLinkErrors[index] = urlError
        isValid = false
      }
    }
  })
  
  if (Object.keys(socialLinkErrors).length > 0) {
    validationErrors.value.socialLinks = socialLinkErrors
  }
  
  return isValid
}

// Emit everything on save - parent diffs against store
function saveContactInfo() {
  // Only emit if there are actual changes
  if (!hasChanges.value) {
    return
  }
  
  // Validate before saving
  if (!validateContactInfo()) {
    return // Stop if validation fails
  }
  
  // Create a clean copy of contactInfo, converting phone to E.164 format
  const cleanContactInfo = {
    ...contactInfo.value,
    phone: contactInfo.value.phone ? `+1${contactInfo.value.phone.replace(/\D/g, '')}` : null // Convert to E.164 format (+1XXXXXXXXXX)
  }

  emit('save', {
    contactInfo: cleanContactInfo as ContactInfoFormData,
    socialLinks: socialLinks.value.map((link: ProfileSocialLink) => ({
      id: link.id,
      platformId: link.platformId,
      url: link.url
    })),
    deletedLinkIds: [...deletedLinkIds.value] // Send copy of deleted IDs
  })
  
  // Reset change tracking, errors, and deleted IDs after save
  hasChanges.value = false
  validationErrors.value = {}
  deletedLinkIds.value = [] // Clear deleted IDs after successful save
}

// Handle API error response (e.g., duplicate platform error from backend)
function handleApiError(error: any) {
  if (error?.data?.error?.code === 'PLATFORMS_ALREADY_EXIST') {
    // Highlight the duplicate platforms
    const existingPlatformIds = error.data.error.details?.existing || []
    const socialLinkErrors: Record<number, string> = {}
    
    socialLinks.value.forEach((link: ProfileSocialLink, index: number) => {
      if (existingPlatformIds.includes(link.platformId)) {
        const platform = getPlatformById(link.platformId)
        socialLinkErrors[index] = `Duplicate ${platform?.display_name || 'platform'}. You can only have one link per platform. Please remove one.`
      }
    })
    
    if (Object.keys(socialLinkErrors).length > 0) {
      validationErrors.value.socialLinks = socialLinkErrors
    }
  }
}

// Expose save method for autosave functionality and revert for error handling
defineExpose({
  triggerSave: saveContactInfo,
  revertChanges: cancelEdits,
  handleApiError
})

// Reset all changes back to original props values
function cancelEdits() {
  // Reset change tracking and validation errors
  hasChanges.value = false
  validationErrors.value = {}

  // Reset contact info to original props
  contactInfo.value = initializeContactInfo()
  
  // Reset social links to original props (deep clone)
  socialLinks.value = (props.profileSocialLinks || []).map(link => ({ ...link }))
  
  // Reset add social form state
  showAddSocialForm.value = socialLinks.value.length === 0
  selectedSocialPlatformId.value = socialPlatforms.value?.[0]?.id || 1
  socialLinkUrl.value = socialPlatforms.value?.[0]?.base_url || ''
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <h2 class="text-2xl font-semibold text-foreground">Contact Information</h2>
        <UBadge 
          v-if="contactInfo?.isExtracted"
          color="neutral"
          class="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
        >
          <div class="flex items-center gap-1">
            <UIcon name="i-lucide-sparkles" class="w-3 h-3" />
            <span>Extracted</span>
          </div>
        </UBadge>
      </div>
    </div>

    <form @submit.prevent="saveContactInfo" class="space-y-4">
      <!-- First Name -->
      <div>
        <UFormField size="xl" label="First Name" name="firstName">
          <UInput 
            class="w-full rounded" 
            :class="{ 'ring-2 ring-purple-500 dark:ring-purple-400': contactInfo?.isExtracted }"
            v-model="contactInfo.firstName" 
            placeholder="John"
          />
        </UFormField>
        <p v-if="validationErrors.firstName" class="text-sm text-error mt-1">{{ validationErrors.firstName }}</p>
      </div>

      <!-- Last Name -->
      <div>
        <UFormField size="xl" label="Last Name" name="lastName">
          <UInput 
            class="w-full rounded" 
            :class="{ 'ring-2 ring-purple-500 dark:ring-purple-400': contactInfo?.isExtracted }"
            v-model="contactInfo.lastName" 
            placeholder="Doe"
          />
        </UFormField>
        <p v-if="validationErrors.lastName" class="text-sm text-error mt-1">{{ validationErrors.lastName }}</p>
      </div>

      <!-- Job Title -->
      <div>
        <UFormField size="xl" label="Job Title" name="jobTitle">
          <UInput 
            class="w-full rounded" 
            :class="{ 'ring-2 ring-purple-500 dark:ring-purple-400': contactInfo?.isExtracted }"
            v-model="contactInfo.jobTitle" 
            placeholder="e.g., Software Engineer, Product Manager"
          />
        </UFormField>
        <p v-if="validationErrors.jobTitle" class="text-sm text-error mt-1">{{ validationErrors.jobTitle }}</p>
      </div>

      <!-- Email -->
      <div>
        <UFormField size="xl" label="Email Address" name="email">
          <UInput 
            class="w-full rounded"
            :class="{ 'ring-2 ring-purple-500 dark:ring-purple-400': contactInfo?.isExtracted }"
            v-model="contactInfo.email" 
            type="email"
            placeholder="john.doe@example.com"
          />
        </UFormField>
        <p v-if="validationErrors.email" class="text-sm text-error mt-1">{{ validationErrors.email }}</p>
      </div>

      <!-- Phone -->
      <div>
        <UFormField size="xl" label="Phone" name="phone">
          <UInput
            class="w-full rounded"
            :class="{ 'ring-2 ring-purple-500 dark:ring-purple-400': contactInfo?.isExtracted }"
            v-model="contactInfo.phone"
            v-maska="'+# (###) ###-####'"
            type="tel"
            placeholder="+1 (555) 123-4567"
          />
        </UFormField>
        <p v-if="validationErrors.phone" class="text-sm text-error mt-1">{{ validationErrors.phone }}</p>
      </div>

      <!-- Location Fields -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <UFormField size="xl" label="City" name="city">
            <UInput 
              class="w-full rounded" 
              :class="{ 'ring-2 ring-purple-500 dark:ring-purple-400': contactInfo?.isExtracted }"
              v-model="contactInfo.city" 
              placeholder="San Francisco"
            />
          </UFormField>
        </div>
        <div>
          <UFormField size="xl" label="State/Region" name="stateRegion">
            <UInput 
              class="w-full rounded" 
              :class="{ 'ring-2 ring-purple-500 dark:ring-purple-400': contactInfo?.isExtracted }"
              v-model="contactInfo.stateRegion" 
              placeholder="CA"
            />
          </UFormField>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <UFormField size="xl" label="Postal Code" name="postalCode">
            <UInput 
              class="w-full rounded" 
              :class="{ 'ring-2 ring-purple-500 dark:ring-purple-400': contactInfo?.isExtracted }"
              v-model="contactInfo.postalCode" 
              placeholder="94102"
            />
          </UFormField>
        </div>
        <div>
          <UFormField size="xl" label="Country" name="country">
            <UInput 
              class="w-full rounded" 
              :class="{ 'ring-2 ring-purple-500 dark:ring-purple-400': contactInfo?.isExtracted }"
              v-model="contactInfo.country" 
              placeholder="United States"
            />
          </UFormField>
        </div>
      </div>

      <!-- Websites -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label class="text-lg font-medium text-foreground">Websites</label>
          <UButton 
            class="cursor-pointer" 
            icon="i-lucide-plus" 
            color="primary" 
            variant="outline" 
            size="xs"
            @click="addWebsite"
          >
            Add Website
          </UButton>
        </div>
        
        <div v-if="contactInfo.websites && contactInfo.websites.length > 0" class="space-y-2">
          <div v-for="(website, index) in contactInfo.websites" :key="index" class="flex gap-2">
            <UInput
              class="flex-1 rounded"
              :class="{ 'ring-2 ring-purple-500 dark:ring-purple-400': contactInfo?.isExtracted }"
              v-model="contactInfo.websites[index]"
              placeholder="https://example.com"
              size="lg"
            />
            <UButton 
              class="cursor-pointer" 
              icon="i-lucide-trash-2" 
              color="error" 
              variant="ghost" 
              size="lg"
              @click="removeWebsite(index)"
            />
          </div>
        </div>
        <p v-if="validationErrors.websites" class="text-sm text-error mt-1">{{ validationErrors.websites }}</p>
      </div>

      <!-- Social Links -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label class="text-lg font-medium text-foreground">Social Links</label>
        </div>
        
        <!-- Existing Social Links List -->
        <div v-if="socialLinks.length > 0" class="space-y-3">
          <div v-for="(link, linkIndex) in socialLinks" :key="linkIndex" class="space-y-1">
            <div class="flex gap-2 items-start">
              <div class="flex items-center flex-1">
                <div class="flex items-center gap-2 min-w-[120px] text-sm font-medium text-foreground">
                  <UIcon v-if="getPlatformById(link.platformId)?.icon" :name="getPlatformById(link.platformId)!.icon!" class="w-4 h-4 shrink-0" />
                  <span class="truncate">{{ getPlatformById(link.platformId)?.display_name || link.platformNameCache }}</span>
                </div>
                <UInput
                  class="flex-2 rounded"
                  :class="{
                    'ring-2 ring-purple-500 dark:ring-purple-400': link?.isExtracted && !validationErrors.socialLinks?.[linkIndex],
                    'ring-2 ring-red-500 dark:ring-red-400': validationErrors.socialLinks?.[linkIndex]
                  }"
                  :model-value="link.url"
                  @update:model-value="(val: string) => updateSocialLinkUrl(linkIndex, val)"
                  placeholder="https://..."
                  size="lg"
                />
              </div>
              <UButton 
                class="cursor-pointer" 
                icon="i-lucide-trash-2" 
                color="error" 
                variant="ghost" 
                size="lg"
                @click="removeSocialLink(linkIndex)"
              />
            </div>
            <p v-if="validationErrors.socialLinks?.[linkIndex]" class="text-sm text-red-600 dark:text-red-400 ml-[120px]">
              {{ validationErrors.socialLinks[linkIndex] }}
            </p>
          </div>
        </div>
        
        <!-- Add New Social Link Form -->
        <div v-if="showAddSocialForm" class="space-y-2">
          <div class="flex gap-2 items-end">
            <div class="w-full sm:w-[200px]">
              <UFormField size="lg" label="Platform" name="platform">
                <USelect
                  class="w-full rounded"
                  v-model="selectedSocialPlatformId"
                  :items="socialPlatforms"
                  label-key="display_name"
                  value-key="id"
                  size="lg"
                >
                  <template #leading>
                    <UIcon v-if="selectedSocialPlatform?.icon" :name="selectedSocialPlatform.icon" class="w-4 h-4" />
                  </template>
                </USelect>
              </UFormField>
            </div>
            <div class="flex-1 w-full">
              <UFormField size="lg" label="URL" name="url">
                <UInput
                  class="w-full"
                  v-model="socialLinkUrl"
                  placeholder="https://..."
                  size="lg"
                />
              </UFormField>
            </div>
            <div class="flex gap-2 items-end pb-1">
              <UButton 
                class="cursor-pointer" 
                icon="i-lucide-check" 
                color="primary" 
                size="lg"
                @click="addSocialLink"
              />
              <UButton 
                class="cursor-pointer" 
                icon="i-lucide-x" 
                color="neutral" 
                variant="ghost" 
                size="lg"
                @click="showAddSocialForm = false"
              />
            </div>
          </div>
        </div>
        
        <!-- Show Add Button when form is hidden -->
        <UButton 
          v-if="!showAddSocialForm"
          class="cursor-pointer" 
          icon="i-lucide-plus" 
          color="primary" 
          variant="outline" 
          size="xs"
          @click="showAddSocialForm = true"
        >
          Add Social Link
        </UButton>
      </div>

      <!-- Summary -->
      <div>
        <UFormField size="xl" label="Professional Summary" name="summary">
          <UTextarea
            class="w-full rounded"
            :class="{ 'ring-2 ring-purple-500 dark:ring-purple-400': contactInfo?.isExtracted }"
            v-model="contactInfo.summary"
            :rows="7"
            autoresize
            placeholder="Brief professional summary..."
          />
        </UFormField>
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-2 justify-end">
        <UButton 
          class="cursor-pointer" 
          type="submit" 
          color="primary" 
          size="xl"
          :disabled="!hasChanges"
        >
          Save Contact Information
        </UButton>
        <UButton
          v-if="hasChanges"
          class="cursor-pointer" 
          size="xl" 
          color="neutral" 
          variant="outline"
          @click="cancelEdits"
        >
          Cancel Edits
        </UButton>
      </div>
    </form>
  </div>
</template>
