<script setup lang="ts">
import type { ContactInfo, ProfileSocialLink } from '~/shared/types/careerId'
import { validateEmail, validatePhone, validateUrl, validateUrls, validateRequired } from '~/utils/validation'

interface SocialPlatform {
  id: number
  platform_name: string
  display_name: string
  icon?: string
  base_url?: string
}

// Form data type (without server-managed fields)
interface ContactInfoFormData {
  firstName: string
  lastName: string
  jobTitle: string
  email: string
  phone: string
  websites: string[]
  summary: string
  city: string
  stateRegion: string
  country: string
  postalCode: string
  willingToRelocate: boolean
}

// Error type matching form data structure
interface ContactInfoErrors {
  firstName?: string
  lastName?: string
  jobTitle?: string
  email?: string
  phone?: string
  websites?: Record<number, string>
  summary?: string
  city?: string
  stateRegion?: string
  country?: string
  postalCode?: string
  socialLinks?: Record<number, string>
}

const props = defineProps<{
  contactInfo: ContactInfo
  profileSocialLinks: ProfileSocialLink[]
}>()

console.log('props.contactInfo', props.contactInfo)
console.log('props.profileSocialLinks', props.profileSocialLinks)

const socialPlatforms = ref<SocialPlatform[]>([
  { id: 1, platform_name: 'linkedin', display_name: 'LinkedIn', base_url: 'https://linkedin.com/in/', icon: 'i-lucide-linkedin' },
  { id: 2, platform_name: 'github', display_name: 'GitHub', base_url: 'https://github.com/', icon: 'i-lucide-github' },
  { id: 3, platform_name: 'twitter', display_name: 'Twitter/X', base_url: 'https://twitter.com/', icon: 'i-lucide-twitter' },
  { id: 4, platform_name: 'instagram', display_name: 'Instagram', base_url: 'https://instagram.com/', icon: 'i-lucide-instagram' },
  { id: 5, platform_name: 'facebook', display_name: 'Facebook', base_url: 'https://facebook.com/', icon: 'i-lucide-facebook' }
])

// Single emit on save - parent diffs against store to determine API calls
const emit = defineEmits<{
  save: [data: { contactInfo: ContactInfoFormData, socialLinks: { id?: number, platformId: number, url: string }[] }]
}>()

// Local reactive copy for two-way binding
const contactInfo = ref<ContactInfo>({ ...props.contactInfo })

// Track if data has been modified
const hasChanges = ref(false)

// Validation errors
const validationErrors = ref<ContactInfoErrors>({})

// Social links management
const socialLinks = ref<ProfileSocialLink[]>([...props.profileSocialLinks || []])
const showAddSocialForm = ref(socialLinks.value.length === 0) // Show form by default only if no links
const selectedSocialPlatform = ref<SocialPlatform | undefined>(socialPlatforms.value?.[0])
const socialLinkUrl = ref(selectedSocialPlatform.value?.base_url || '')

// Watch for changes - will not fire on initial setup (immediate: false by default)
watch(contactInfo, () => {
  hasChanges.value = true
}, { deep: true })

watch(socialLinks, () => {
  hasChanges.value = true
}, { deep: true })

// Helper to get platform details by platformId
function getPlatformById(platformId: number) {
  return socialPlatforms.value.find(p => p.id === platformId)
}

// Watch for platform changes and auto-update URL
watch(selectedSocialPlatform, (newPlatform) => {
  if (newPlatform?.base_url) {
    socialLinkUrl.value = newPlatform.base_url
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
    platformId: selectedSocialPlatform.value.id,
    url: socialLinkUrl.value
  } as ProfileSocialLink)
  
  // Reset form
  selectedSocialPlatform.value = socialPlatforms.value?.[0]
  socialLinkUrl.value = selectedSocialPlatform.value?.base_url || ''
  showAddSocialForm.value = false
}

function updateSocialLinkUrl(index: number, url: string) {
  if (socialLinks.value[index]) {
    socialLinks.value[index].url = url
  }
}

function removeSocialLink(index: number) {
  socialLinks.value.splice(index, 1)
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
  socialLinks.value.forEach((link: ProfileSocialLink, index: number) => {
    if (link.url && link.url.trim()) {
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
  
  emit('save', {
    contactInfo: contactInfo.value as ContactInfoFormData,
    socialLinks: socialLinks.value.map((link: ProfileSocialLink) => ({
      id: link.id,
      platformId: link.platformId,
      url: link.url
    }))
  })
  
  // Reset change tracking and errors after save
  hasChanges.value = false
  validationErrors.value = {}
}

// Expose save method for autosave functionality and revert for error handling
defineExpose({
  triggerSave: saveContactInfo,
  revertChanges: cancelEdits
})

// Reset all changes back to original props values
function cancelEdits() {
  // Reset contact info to original props
  contactInfo.value = { ...props.contactInfo }
  
  // Reset social links to original props
  socialLinks.value = [...props.profileSocialLinks || []]
  
  // Reset add social form state
  showAddSocialForm.value = socialLinks.value.length === 0
  selectedSocialPlatform.value = socialPlatforms.value?.[0]
  socialLinkUrl.value = selectedSocialPlatform.value?.base_url || ''
  
  // Reset change tracking and validation errors
  hasChanges.value = false
  validationErrors.value = {}
}
</script>

<template>
  <div class="max-w-xl mx-auto space-y-4">
    <!-- Section Title and Description -->
    <div class="mb-8 space-y-2">
      <h1 class="text-2xl sm:text-3xl font-semibold text-foreground">Let employers know who you are</h1>
      <p class="text-sm text-muted">
        Include your full name and an email for employers to contact you.
      </p>
    </div>

    <UForm :state="contactInfo" class="space-y-4">
      <!-- First Name and Last Name -->
      <div class="flex items-center justify-center gap-2 w-full">
        <div class="flex-1">
          <UFormField class="w-full" size="xl" label="First Name" name="firstName">
            <UInput 
              class="w-full"
              v-model="contactInfo.firstName" 
              placeholder="John"
            />
          </UFormField>
          <p v-if="validationErrors.firstName" class="text-sm text-error mt-1">{{ validationErrors.firstName }}</p>
        </div>

        <div class="flex-1">
          <UFormField class="w-full" size="xl" label="Last Name" name="lastName">
            <UInput 
              class="w-full"
              v-model="contactInfo.lastName" 
              placeholder="Doe"
            />
          </UFormField>
          <p v-if="validationErrors.lastName" class="text-sm text-error mt-1">{{ validationErrors.lastName }}</p>
        </div>
      </div>

      <!-- Current Job Title -->
      <div>
        <UFormField size="xl" label="Current Title" name="jobTitle">
          <UInput 
            class="w-full"
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
            class="w-full"
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
            class="w-full"
            v-model="contactInfo.phone" 
            type="tel"
            placeholder="(555) 123-4567"
          />
        </UFormField>
        <p v-if="validationErrors.phone" class="text-sm text-error mt-1">{{ validationErrors.phone }}</p>
      </div>

      <!-- Social Links -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label class="text-sm font-medium text-foreground">Social Links</label>
        </div>
        
        <!-- Existing Social Links List -->
        <div v-if="socialLinks.length > 0" class="space-y-2">
          <div v-for="(link, linkIndex) in socialLinks" :key="linkIndex" class="flex gap-2 items-start">
            <div class="flex items-center flex-1/2">
              <div class="flex items-center gap-2 min-w-[120px] text-sm font-medium text-foreground">
                <UIcon v-if="getPlatformById(link.platformId)?.icon" :name="getPlatformById(link.platformId)!.icon!" class="w-4 h-4 shrink-0" />
                <span class="truncate">{{ getPlatformById(link.platformId)?.display_name || link.platformNameCache }}</span>
              </div>
              <UInput 
                class="flex-2"
                :model-value="link.url"
                @update:model-value="(val: string) => updateSocialLinkUrl(linkIndex, val)"
                placeholder="https://..."
                size="lg"
              />
            </div>
            <p v-if="validationErrors.socialLinks?.[linkIndex]" class="text-sm text-error mt-1">{{ validationErrors.socialLinks[linkIndex] }}</p>
            <UButton 
              class="cursor-pointer" 
              icon="i-lucide-trash-2" 
              color="error" 
              variant="ghost" 
              size="lg"
              @click="removeSocialLink(linkIndex)"
            />
          </div>
        </div>
        
        <!-- Add New Social Link Form -->
        <div v-if="showAddSocialForm" class="space-y-2">
          <div class="flex gap-2 items-start">
            <div class="w-[200px]">
              <USelectMenu
                v-model="selectedSocialPlatform"
                :items="socialPlatforms"
                label-key="display_name"
                placeholder="Select platform"
                size="lg"
              >
                <template #leading>
                  <UIcon name="i-lucide-share-2" class="w-4 h-4 text-muted" />
                </template>
              </USelectMenu>
            </div>
            
            <UInput 
              class="flex-2"
              v-model="socialLinkUrl"
              :placeholder="selectedSocialPlatform?.base_url ? `${selectedSocialPlatform.base_url}your-username` : 'Select a platform first'"
              size="lg"
            >
              <template #leading>
                <UIcon name="i-lucide-link" class="w-4 h-4 text-muted" />
              </template>
            </UInput>
          </div>
          <div class="flex gap-2">
            <UButton
              class="cursor-pointer" 
              icon="i-lucide-check" 
              color="primary" 
              variant="solid" 
              size="sm"
              @click="addSocialLink"
            >
              Add
            </UButton>
            <UButton
              class="cursor-pointer" 
              icon="i-lucide-x" 
              color="neutral" 
              variant="ghost" 
              size="sm"
              @click="showAddSocialForm = false"
            >
              Cancel
            </UButton>
          </div>
        </div>
        
        <!-- Show "Add Social" button when form is hidden -->
        <UButton
          v-if="!showAddSocialForm"
          class="cursor-pointer" 
          icon="i-lucide-plus" 
          color="primary" 
          variant="ghost" 
          size="sm"
          @click="showAddSocialForm = true"
        >
          Add Social
        </UButton>
      </div>

      <!-- Website Links -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label class="text-sm font-medium text-foreground">Website</label>
        </div>
        <div v-if="contactInfo.websites && contactInfo.websites.length > 0" class="space-y-2">
          <div v-for="(website, websiteIndex) in contactInfo.websites" :key="websiteIndex" class="space-y-1">
            <div class="flex gap-2 items-start">
              <div class="flex items-center gap-2 flex-1">
                <UIcon name="i-lucide-link" class="w-4 h-4 text-muted shrink-0" />
                <UInput 
                  class="flex-1"
                  v-model="contactInfo.websites[websiteIndex]" 
                  placeholder="e.g. online-profile.com"
                  size="lg"
                />
              </div>
              <UButton 
                class="cursor-pointer" 
                icon="i-lucide-trash-2" 
                color="error" 
                variant="ghost" 
                size="lg"
                @click="removeWebsite(websiteIndex)"
              />
            </div>
            <p v-if="validationErrors.websites?.[websiteIndex]" class="text-sm text-error ml-6">{{ validationErrors.websites[websiteIndex] }}</p>
          </div>
        </div>
        <UButton 
          class="cursor-pointer" 
          icon="i-lucide-plus" 
          color="primary" 
          variant="ghost" 
          size="sm"
          @click="addWebsite"
        >
          Add Link
        </UButton>
      </div>

      <!-- Summary -->
      <div>
        <UFormField size="xl" label="Summary" name="summary">
          <UTextarea 
            class="w-full"
            v-model="contactInfo.summary" 
            :rows="6"
            autoresize
            placeholder="Brief professional summary..."
          />
        </UFormField>
        <p v-if="validationErrors.summary" class="text-sm text-error mt-1">{{ validationErrors.summary }}</p>
      </div>

      <!-- Address Section -->
      <div class="pt-4 ">
        <h3 class="text-lg font-semibold text-foreground mb-4">Location</h3>
        
        <!-- City and State/Region -->
        <div class="flex gap-2 w-full mb-4">
          <div class="flex-1">
            <UFormField class="w-full" size="xl" label="City" name="city">
              <UInput 
                class="w-full"
                v-model="contactInfo.city" 
                placeholder="e.g., San Francisco"
              />
            </UFormField>
            <p v-if="validationErrors.city" class="text-sm text-error mt-1">{{ validationErrors.city }}</p>
          </div>

          <div class="flex-1">
            <UFormField class="w-full" size="xl" label="State/Region" name="stateRegion">
              <UInput 
                class="w-full"
                v-model="contactInfo.stateRegion" 
                placeholder="e.g., CA"
              />
            </UFormField>
            <p v-if="validationErrors.stateRegion" class="text-sm text-error mt-1">{{ validationErrors.stateRegion }}</p>
          </div>
        </div>

        <!-- Postal Code and Country -->
        <div class="flex gap-2 w-full">
          <div class="flex-1">
            <UFormField class="w-full" size="xl" label="Postal Code" name="postalCode">
              <UInput 
                class="w-full"
                v-model="contactInfo.postalCode" 
                placeholder="e.g., 94102"
              />
            </UFormField>
            <p v-if="validationErrors.postalCode" class="text-sm text-error mt-1">{{ validationErrors.postalCode }}</p>
          </div>

          <div class="flex-1">
            <UFormField class="w-full" size="xl" label="Country" name="country">
              <UInput 
                class="w-full"
                v-model="contactInfo.country" 
                placeholder="e.g., United States"
              />
            </UFormField>
            <p v-if="validationErrors.country" class="text-sm text-error mt-1">{{ validationErrors.country }}</p>
          </div>
        </div>
      </div>

      <!-- Willing to Relocate -->
      <UFormField size="xl" label="Willing to Relocate?" name="willingToRelocate">
        <div class="flex items-center gap-2">
          <USwitch v-model="contactInfo.willingToRelocate" />
          <span class="text-md">{{ contactInfo.willingToRelocate ? 'Yes' : 'No' }}</span>
        </div>
      </UFormField>

      <!-- Action Buttons -->
      <div class="flex gap-2 pt-4">
        <UButton class="cursor-pointer" size="xl" @click="saveContactInfo">
          Save Contact Information
        </UButton>
        <UButton 
          class="cursor-pointer" 
          size="xl" 
          variant="outline" 
          color="neutral"
          @click="cancelEdits"
        >
          Cancel Edits
        </UButton>
      </div>
    </UForm>
  </div>
</template>

