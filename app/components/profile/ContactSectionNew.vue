<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { vMaska } from 'maska/vue'
import type { ContactInfo, ProfileSocialLink } from '~/shared/types/careerId'
import { validateEmail, validatePhone, validateUrl, validateRequired, validateLength } from '~/utils/validation'

const careerIDStore = useCareerIDStore()
const toast = useToast()

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
  phoneCountryCode?: string
  phoneNumber?: string
  city?: string | null
  stateRegion?: string | null
  country?: string | null
  postalCode?: string | null
  summary?: string | null
  websites?: string[]
  willingToRelocate?: boolean
}

interface Props {
  contactInfo: ContactInfo
  profileSocialLinks?: ProfileSocialLink[]
}

const props = withDefaults(defineProps<Props>(), {
  profileSocialLinks: () => []
})

const emit = defineEmits<{
  save: [data: { 
    contactInfo: ContactInfoFormData, 
    socialLinks: { id?: number, platformId: number, url: string }[],
    deletedLinkIds: number[]
  }]
}>()

// Social platforms
const socialPlatforms = ref<SocialPlatform[]>([
  { id: 1, platform_name: 'linkedin', display_name: 'LinkedIn', base_url: 'https://linkedin.com/in/', icon: 'i-lucide-linkedin' },
  { id: 2, platform_name: 'github', display_name: 'GitHub', base_url: 'https://github.com/', icon: 'i-lucide-github' },
  { id: 3, platform_name: 'twitter', display_name: 'Twitter/X', base_url: 'https://twitter.com/', icon: 'i-lucide-twitter' },
  { id: 4, platform_name: 'instagram', display_name: 'Instagram', base_url: 'https://instagram.com/', icon: 'i-lucide-instagram' },
  { id: 5, platform_name: 'facebook', display_name: 'Facebook', base_url: 'https://facebook.com/', icon: 'i-lucide-facebook' }
])

// Section edit states
const isEditingContact = ref(false)
const isEditingWebsites = ref(false)
const isEditingSocialLinks = ref(false)
const isEditingSummary = ref(false)
const isAddingSocialLink = ref(false)
const editingSocialLinkIndex = ref<number | null>(null)

// Loading states for save operations
const isSavingContact = ref(false)
const isSavingWebsites = ref(false)
const isSavingSocialLinks = ref(false)
const isSavingSummary = ref(false)

// Temporary form data (only populated during edit)
const formData = ref<Partial<ContactInfo>>({})
const formErrors = ref<Record<string, string>>({})

// Social link management
const socialLinkForm = ref<{ platformId?: number, url: string }>({ platformId: undefined, url: '' })
const socialLinkErrors = ref<Record<string, string>>({})

// Local copy of social links for modification
const localSocialLinks = ref<ProfileSocialLink[]>([])

// Track deleted social links for batch save
const deletedLinkIds = ref<number[]>([])

// Get extraction flags directly from contactInfo (set by store)
const extractedFields = computed(() => props.contactInfo?.extractedFields || {})

// Computed flags for section badges
const hasExtractedContactInfo = computed(() => {
  const fields = extractedFields.value
  return !!(fields.firstName || 
            fields.lastName || 
            fields.email || 
            fields.phone || 
            fields.jobTitle || 
            fields.city || 
            fields.stateRegion || 
            fields.country || 
            fields.postalCode)
})

const hasExtractedWebsites = computed(() => !!extractedFields.value.websites)

const hasExtractedSocialLinks = computed(() => {
  return localSocialLinks.value.some((link: ProfileSocialLink) => link.isExtracted)
})

const hasExtractedSummary = computed(() => !!extractedFields.value.summary)

// Initialize local social links from props
watch(() => props.profileSocialLinks, (newLinks) => {
  if (!isEditingContact.value && !isEditingWebsites.value && !isEditingSocialLinks.value && !isEditingSummary.value) {
    localSocialLinks.value = (newLinks || []).map(link => ({ ...link }))
  }
}, { immediate: true, deep: true })

// Helper to get platform details by platformId
function getPlatformById(platformId: number) {
  return socialPlatforms.value.find(p => p.id === platformId)
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

// Note: Contact info section starts in view mode (closed) by default
// Users can click "Edit" to open it when needed

// Helper to parse phone number into country code and number
function parsePhone(phone: string | null | undefined): { countryCode: string; number: string } {
  if (!phone) return { countryCode: '1', number: '' }
  
  // Remove + and any formatting
  const cleaned = phone.replace(/[^\d]/g, '')
  
  // Try to extract country code (1-3 digits)
  // Common patterns: 1 (US/Canada), 44 (UK), 86 (China), 351 (Portugal)
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
  
  // Default: assume it's just a number without country code
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

// ============================================
// CONTACT INFORMATION SECTION
// ============================================

function startEditingContact() {
  if (props.contactInfo) {
    // Existing contact info - populate form with current values
    const parsed = parsePhone(props.contactInfo.phone)
    formData.value = {
      firstName: props.contactInfo.firstName,
      lastName: props.contactInfo.lastName,
      email: props.contactInfo.email,
      jobTitle: props.contactInfo.jobTitle,
      phoneCountryCode: parsed.countryCode,
      phoneNumber: parsed.number,
      city: props.contactInfo.city,
      stateRegion: props.contactInfo.stateRegion,
      country: props.contactInfo.country,
      postalCode: props.contactInfo.postalCode,
      willingToRelocate: props.contactInfo.willingToRelocate
    }
  } else {
    // New user - initialize with empty form
    formData.value = {
      firstName: '',
      lastName: '',
      email: '',
      jobTitle: '',
      phoneCountryCode: '1',
      phoneNumber: '',
      city: '',
      stateRegion: '',
      country: '',
      postalCode: '',
      willingToRelocate: false
    }
  }
  formErrors.value = {}
  isEditingContact.value = true
}

function cancelContactEdit() {
  isEditingContact.value = false
  formData.value = {}
  formErrors.value = {}
}

function validateContactForm(): boolean {
  const errors: Record<string, string> = {}
  
  const firstNameError = validateRequired(formData.value.firstName, 'First name')
  if (firstNameError) errors.firstName = firstNameError
  
  const lastNameError = validateRequired(formData.value.lastName, 'Last name')
  if (lastNameError) errors.lastName = lastNameError
  
  const emailError = validateEmail(formData.value.email, true)
  if (emailError) errors.email = emailError
  
  // Validate phone (if either part is provided)
  if (formData.value.phoneNumber || formData.value.phoneCountryCode) {
    const combined = combinePhone(formData.value.phoneCountryCode || '', formData.value.phoneNumber || '')
    const phoneError = validatePhone(combined || '', false)
    if (phoneError) errors.phone = phoneError
  }
  
  formErrors.value = errors
  return Object.keys(errors).length === 0
}

async function saveContactInfo(): Promise<boolean> {
  if (!validateContactForm()) {
    toast.add({
      title: 'Validation Error',
      description: 'Please fix the errors in the form',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
    return false
  }

  isSavingContact.value = true

  try {
    const combinedPhone = combinePhone(formData.value.phoneCountryCode || '', formData.value.phoneNumber || '')
    
    const contactData = {
      firstName: formData.value.firstName,
      lastName: formData.value.lastName,
      email: formData.value.email,
      jobTitle: formData.value.jobTitle,
      phone: combinedPhone,
      city: formData.value.city,
      stateRegion: formData.value.stateRegion,
      country: formData.value.country,
      postalCode: formData.value.postalCode,
      willingToRelocate: formData.value.willingToRelocate,
      // Include websites and summary from props (not edited in contact form)
      websites: props.contactInfo?.websites || [],
      summary: props.contactInfo?.summary || null
    }

    // Store handles POST (no ID) vs PATCH (has ID)
    if (props.contactInfo?.id) {
      await careerIDStore.updateContactInfo(props.contactInfo.id, contactData)
    } else {
      await careerIDStore.createContactInfo(contactData)
    }

    // Clear isExtracted flags after successful save
    if (props.contactInfo) {
      props.contactInfo.isExtracted = false
      props.contactInfo.extractedFields = undefined
    }

    toast.add({
      title: 'Success',
      description: 'Contact information saved successfully',
      icon: 'i-lucide-check',
      color: 'success'
    })

    isEditingContact.value = false
    formData.value = {}
    formErrors.value = {}
    return true
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error?.message || 'Failed to save contact information',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
    return false
  } finally {
    isSavingContact.value = false
  }
}

// ============================================
// WEBSITES SECTION
// ============================================

function startEditingWebsites() {
  if (props.contactInfo) {
    formData.value = {
      websites: [...(props.contactInfo.websites || [])]
    }
  } else {
    // New user - start with empty array
    formData.value = {
      websites: []
    }
  }
  formErrors.value = {}
  isEditingWebsites.value = true
}

function cancelWebsitesEdit() {
  isEditingWebsites.value = false
  formData.value = {}
  formErrors.value = {}
}

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

function validateWebsitesForm(): boolean {
  const errors: Record<string, string> = {}
  
  if (formData.value.websites && formData.value.websites.length > 0) {
    formData.value.websites.forEach((website: string, index: number) => {
      if (website && website.trim()) {
        const urlError = validateUrl(website, false)
        if (urlError) {
          errors[`website_${index}`] = urlError
        }
      }
    })
  }
  
  formErrors.value = errors
  return Object.keys(errors).length === 0
}

async function saveWebsites(): Promise<boolean> {
  if (!validateWebsitesForm()) {
    toast.add({
      title: 'Validation Error',
      description: 'Please fix the errors in the form',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
    return false
  }

  if (!props.contactInfo?.id) {
    toast.add({
      title: 'Error',
      description: 'Please save contact information first',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
    return false
  }

  isSavingWebsites.value = true

  try {
    // Store handles UPDATE
    await careerIDStore.updateContactInfo(props.contactInfo.id, {
      websites: formData.value.websites?.filter((w: string) => w && w.trim()) || []
    })

    // Clear extracted flag for websites
    if (props.contactInfo?.extractedFields) {
      props.contactInfo.extractedFields.websites = false
      const hasAnyExtracted = Object.entries(props.contactInfo.extractedFields)
        .some(([key, value]) => key !== 'websites' && value === true)
      if (!hasAnyExtracted) {
        props.contactInfo.isExtracted = false
        props.contactInfo.extractedFields = undefined
      }
    }

    toast.add({
      title: 'Success',
      description: 'Websites updated successfully',
      icon: 'i-lucide-check',
      color: 'success'
    })

    isEditingWebsites.value = false
    formData.value = {}
    formErrors.value = {}
    return true
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error?.message || 'Failed to update websites',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
    return false
  } finally {
    isSavingWebsites.value = false
  }
}

// ============================================
// SOCIAL LINKS SECTION
// ============================================

function startEditingSocialLinks() {
  socialLinkErrors.value = {}
  isEditingSocialLinks.value = true
}

function cancelSocialLinksEdit() {
  isEditingSocialLinks.value = false
  isAddingSocialLink.value = false
  editingSocialLinkIndex.value = null
  socialLinkForm.value = { platformId: undefined, url: '' }
  socialLinkErrors.value = {}
  
  // Reset local social links to props
  localSocialLinks.value = (props.profileSocialLinks || []).map(link => ({ ...link }))
  
  // Clear deleted IDs
  deletedLinkIds.value = []
}

async function saveSocialLinks(): Promise<boolean> {
  // Validate that no URLs are empty or invalid
  const errors: Record<string, string> = {}

  localSocialLinks.value.forEach((link: ProfileSocialLink, index: number) => {
    const urlError = validateUrl(link.url, true)
    if (urlError) {
      errors[`social_${index}`] = urlError
    }
  })
  
  // Check for duplicate platforms
  const platformCounts: Record<number, number[]> = {}
  localSocialLinks.value.forEach((link: ProfileSocialLink, index: number) => {
    if (!platformCounts[link.platformId]) {
      platformCounts[link.platformId] = []
    }
    platformCounts[link.platformId]!.push(index)
  })
  
  // Flag duplicates
  Object.entries(platformCounts).forEach(([platformId, indices]) => {
    if (indices.length > 1) {
      const platform = getPlatformById(Number(platformId))
      indices.forEach(index => {
        errors[`social_${index}`] = `Duplicate ${platform?.display_name || 'platform'}. You can only have one link per platform.`
      })
    }
  })

  socialLinkErrors.value = errors
  if (Object.keys(errors).length > 0) {
    toast.add({
      title: 'Validation Error',
      description: 'Please fix the errors in the social links section before continuing',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
    return false
  }

  isSavingSocialLinks.value = true

  try {
    // Handle deletions
    for (const deletedId of deletedLinkIds.value) {
      try {
        await careerIDStore.deleteSocialLink(deletedId)
      } catch (deleteError: any) {
        console.error('Failed to delete social link:', deletedId, deleteError)
      }
    }

    // Handle updates (links with IDs that changed)
    const existingLinks = props.profileSocialLinks || []
    for (const link of localSocialLinks.value) {
      if (link.id) {
        const existing = existingLinks.find(l => l.id === link.id)
        if (existing && existing.url !== link.url) {
          await careerIDStore.updateSocialLink(link.id, { url: link.url })
        }
      }
    }

    // Handle new links (no id)
    const linksToAdd = localSocialLinks.value.filter(l => !l.id)
    if (linksToAdd.length > 0) {
      const addedLinks = await careerIDStore.addSocialLinks(linksToAdd.map((l, i) => ({
        platformId: l.platformId,
        url: l.url,
        displayOrder: (props.profileSocialLinks?.length || 0) + i
      })))
      
      // Update localSocialLinks with the newly created links (which now have IDs)
      // Remove the dummy links without IDs
      localSocialLinks.value = localSocialLinks.value.filter(l => l.id)
      // Add the new links with IDs from the response
      if (addedLinks && Array.isArray(addedLinks)) {
        localSocialLinks.value.push(...addedLinks)
      }
    }

    // Clear isExtracted flags after successful save
    localSocialLinks.value.forEach((link: ProfileSocialLink) => {
      link.isExtracted = false
    })

    toast.add({
      title: 'Success',
      description: 'Social links saved successfully',
      icon: 'i-lucide-check',
      color: 'success'
    })

    // Clear deleted IDs after successful save
    deletedLinkIds.value = []

    isEditingSocialLinks.value = false
    isAddingSocialLink.value = false
    editingSocialLinkIndex.value = null
    socialLinkForm.value = { platformId: undefined, url: '' }
    socialLinkErrors.value = {}
    return true
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error?.message || 'Failed to save social links',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
    
    // Handle API errors (e.g., duplicate platforms)
    handleApiError(error)
    return false
  } finally {
    isSavingSocialLinks.value = false
  }
}


function startAddingSocialLink() {
  const defaultPlatform = socialPlatforms.value[0]
  socialLinkForm.value = {
    platformId: defaultPlatform?.id || undefined,
    url: defaultPlatform?.base_url || ''
  }
  socialLinkErrors.value = {}
  isAddingSocialLink.value = true
}

function startEditingSocialLink(linkIndex: number, currentUrl: string) {
  editingSocialLinkIndex.value = linkIndex
  socialLinkForm.value = {
    platformId: undefined,
    url: currentUrl
  }
  socialLinkErrors.value = {}
}

function cancelSocialLinkEdit() {
  isAddingSocialLink.value = false
  editingSocialLinkIndex.value = null
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
  
  // Check for duplicate platforms when adding
  if (!isEdit && socialLinkForm.value.platformId) {
    const existingPlatform = localSocialLinks.value.find(
      (link: ProfileSocialLink) => link.platformId === socialLinkForm.value.platformId
    )
    if (existingPlatform) {
      const platform = getPlatformById(socialLinkForm.value.platformId)
      errors.platformId = `You already have a ${platform?.display_name || 'link'} for this platform`
    }
  }
  
  socialLinkErrors.value = errors
  return Object.keys(errors).length === 0
}

function addSocialLink() {
  if (!validateSocialLinkForm(false)) return
  
  const platform = getPlatformById(socialLinkForm.value.platformId!)
  
  localSocialLinks.value.push({
    platformId: socialLinkForm.value.platformId!,
    url: socialLinkForm.value.url,
    platformNameCache: platform?.display_name || '',
    displayOrder: localSocialLinks.value.length + 1
  } as ProfileSocialLink)
  
  cancelSocialLinkEdit()
}

function updateSocialLink(linkIndex: number) {
  if (!validateSocialLinkForm(true)) return
  
  if (linkIndex !== -1 && linkIndex < localSocialLinks.value.length) {
    localSocialLinks.value[linkIndex].url = socialLinkForm.value.url
  }
  
  cancelSocialLinkEdit()
}

function deleteSocialLink(linkIndex: number) {
  if (linkIndex >= 0 && linkIndex < localSocialLinks.value.length) {
    const link = localSocialLinks.value[linkIndex]
    // If the link has an ID (exists in database), track it for deletion
    if (link.id !== undefined) {
      deletedLinkIds.value.push(link.id)
    }
    localSocialLinks.value.splice(linkIndex, 1)
  }
}

// ============================================
// PROFESSIONAL SUMMARY SECTION
// ============================================

function startEditingSummary() {
  if (props.contactInfo) {
    formData.value = {
      summary: props.contactInfo.summary || ''
    }
  } else {
    // New user - start with empty
    formData.value = {
      summary: ''
    }
  }
  formErrors.value = {}
  isEditingSummary.value = true
}

function cancelSummaryEdit() {
  isEditingSummary.value = false
  formData.value = {}
  formErrors.value = {}
}

function validateSummaryForm(): boolean {
  const errors: Record<string, string> = {}
  
  const lengthError = validateLength(formData.value.summary || '', 'Professional summary', undefined, 5000)
  if (lengthError) errors.summary = lengthError
  
  formErrors.value = errors
  return Object.keys(errors).length === 0
}

// Internal save function that returns boolean for validation flow
async function saveSummary(): Promise<boolean> {
  if (!validateSummaryForm()) {
    toast.add({
      title: 'Validation Error',
      description: 'Please fix the errors in the form',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
    return false
  }

  if (!props.contactInfo?.id) {
    toast.add({
      title: 'Error',
      description: 'Please save contact information first',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
    return false
  }

  isSavingSummary.value = true

  try {
    // Store handles UPDATE
    await careerIDStore.updateContactInfo(props.contactInfo.id, {
      summary: formData.value.summary || null
    })

    // Clear isExtracted flag after successful save
    if (props.contactInfo?.extractedFields) {
      props.contactInfo.extractedFields.summary = false
      const hasAnyExtracted = Object.entries(props.contactInfo.extractedFields)
        .some(([key, value]) => key !== 'summary' && value === true)
      if (!hasAnyExtracted) {
        props.contactInfo.isExtracted = false
        props.contactInfo.extractedFields = undefined
      }
    }

    toast.add({
      title: 'Success',
      description: 'Professional summary updated successfully',
      icon: 'i-lucide-check',
      color: 'success'
    })

    isEditingSummary.value = false
    formData.value = {}
    formErrors.value = {}
    return true
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error?.message || 'Failed to update professional summary',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
    return false
  } finally {
    isSavingSummary.value = false
  }
}

const summaryCharCount = computed(() => {
  return formData.value.summary?.length || 0
})

// ============================================
// EXPOSED METHODS FOR PARENT COMPONENT
// ============================================

async function triggerSave() {
  // Since each section now saves independently when user clicks "Save Changes",
  // this method only needs to handle any unsaved changes in currently open edit modes
  
  try {
    if (isEditingContact.value) {
      await saveContactInfo()
    }
    
    if (isEditingWebsites.value) {
      await saveWebsites()
    }
    
    if (isEditingSocialLinks.value) {
      await saveSocialLinks()
    }
    
    if (isEditingSummary.value) {
      await saveSummary()
    }
    
    // No need to emit save event anymore since we handle API calls directly
  } catch (error) {
    console.error('Failed to autosave:', error)
    // Errors are already shown by individual save functions
  }
}

function revertChanges() {
  // Cancel all edit modes and reset form data
  isEditingContact.value = false
  isEditingWebsites.value = false
  isEditingSocialLinks.value = false
  isEditingSummary.value = false
  isAddingSocialLink.value = false
  editingSocialLinkIndex.value = null
  formData.value = {}
  formErrors.value = {}
  socialLinkForm.value = { platformId: undefined, url: '' }
  socialLinkErrors.value = {}
  deletedLinkIds.value = []
  
  // Reset local social links to props
  localSocialLinks.value = (props.profileSocialLinks || []).map(link => ({ ...link }))
}

// Save all unsaved items (for contact section, just trigger save on any active edits)
async function saveAllUnsaved(): Promise<boolean> {
  // If any section is currently being edited, save it first
  if (isEditingContact.value || isEditingWebsites.value || isEditingSocialLinks.value || isEditingSummary.value) {
    await triggerSave()
    // Check if there were validation errors
    if (Object.keys(formErrors.value).length > 0) {
      return false
    }
  }
  
  // Check if contact info needs to be saved (extracted or no ID yet)
  const needsSave = props.contactInfo?.isExtracted || !props.contactInfo?.id
  
  if (needsSave && props.contactInfo) {
    // Validate required contact fields
    const firstNameError = validateRequired(props.contactInfo.firstName, 'First name')
    const lastNameError = validateRequired(props.contactInfo.lastName, 'Last name')
    const emailError = validateEmail(props.contactInfo.email, true)
    
    if (firstNameError || lastNameError || emailError) {
      toast.add({
        title: 'Validation Error',
        description: 'Please ensure name and email are filled in',
        icon: 'i-lucide-alert-circle',
        color: 'error'
      })
      return false
    }
    
    // Save ALL contact info in one call (store handles POST vs PATCH based on ID)
    try {
      // Parse and format phone to E.164 if it exists
      let formattedPhone = props.contactInfo.phone
      if (formattedPhone) {
        // If phone doesn't start with +, assume US and add +1
        if (!formattedPhone.startsWith('+')) {
          const cleaned = formattedPhone.replace(/[^\d]/g, '')
          formattedPhone = `+1${cleaned}`
        }
      }
      
      const contactData = {
        firstName: props.contactInfo.firstName,
        lastName: props.contactInfo.lastName,
        email: props.contactInfo.email,
        phone: formattedPhone,
        jobTitle: props.contactInfo.jobTitle,
        city: props.contactInfo.city,
        stateRegion: props.contactInfo.stateRegion,
        country: props.contactInfo.country,
        postalCode: props.contactInfo.postalCode,
        willingToRelocate: props.contactInfo.willingToRelocate,
        websites: props.contactInfo.websites || [],
        summary: props.contactInfo.summary || null
      }
      
      // Store handles POST (no ID) vs PATCH (has ID)
      if (props.contactInfo.id) {
        await careerIDStore.updateContactInfo(props.contactInfo.id, contactData)
      } else {
        await careerIDStore.createContactInfo(contactData)
      }
      
      // Clear isExtracted flags after successful save
      if (props.contactInfo) {
        props.contactInfo.isExtracted = false
        props.contactInfo.extractedFields = undefined
      }
    } catch (error: any) {
      toast.add({
        title: 'Error',
        description: error?.message || 'Failed to save contact information',
        icon: 'i-lucide-alert-circle',
        color: 'error'
      })
      return false
    }
  }
  
  // Check if there are extracted social links that need to be saved
  const hasExtractedSocialLinks = localSocialLinks.value.some((link: ProfileSocialLink) => link.isExtracted)
  if (hasExtractedSocialLinks) {
    // Validate for duplicates first
    const errors: Record<string, string> = {}
    const platformCounts: Record<number, number[]> = {}
    
    localSocialLinks.value.forEach((link: ProfileSocialLink, index: number) => {
      if (!platformCounts[link.platformId]) {
        platformCounts[link.platformId] = []
      }
      platformCounts[link.platformId]!.push(index)
    })
    
    Object.entries(platformCounts).forEach(([platformId, indices]) => {
      if (indices.length > 1) {
        const platform = getPlatformById(Number(platformId))
        indices.forEach(index => {
          errors[`social_${index}`] = `Duplicate ${platform?.display_name || 'platform'}. You can only have one link per platform.`
        })
      }
    })
    
    if (Object.keys(errors).length > 0) {
      socialLinkErrors.value = errors
      toast.add({
        title: 'Validation Error',
        description: 'Please fix duplicate social platform links',
        icon: 'i-lucide-alert-circle',
        color: 'error'
      })
      return false
    }
    
    // Save extracted social links
    const success = await saveSocialLinks()
    if (!success) return false
  }
  
  return true
}

function handleApiError(error: any) {
  if (error?.data?.error?.code === 'PLATFORMS_ALREADY_EXIST') {
    const existingPlatformIds = error.data.error.details?.existing || []
    const errors: Record<string, string> = {}
    
    localSocialLinks.value.forEach((link: ProfileSocialLink, index: number) => {
      if (existingPlatformIds.includes(link.platformId)) {
        const platform = getPlatformById(link.platformId)
        errors[`social_${index}`] = `Duplicate ${platform?.display_name || 'platform'}. You can only have one link per platform.`
      }
    })
    
    if (Object.keys(errors).length > 0) {
      socialLinkErrors.value = errors
    }
  }
}

defineExpose({
  triggerSave,
  saveAllUnsaved,
  revertChanges,
  handleApiError
})
</script>

<template>
  <div class="space-y-8">



    <!-- ============================================ -->
    <!-- CONTACT INFORMATION SECTION -->
    <!-- ============================================ -->
    <div>
      <UPageCard
        title="Contact Information"
        description="Your personal and professional contact details"
        variant="naked"
        orientation="horizontal"
        class="mb-4"
      >
        <template #title>
          <div class="flex items-center gap-2">
            <span>Contact Information</span>
            <UBadge 
              v-if="hasExtractedContactInfo"
              color="neutral"
              class="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300"
            >
              <div class="flex items-center gap-1">
                <UIcon name="i-lucide-sparkles" class="w-3 h-3" />
                <span>Extracted</span>
              </div>
            </UBadge>
          </div>
        </template>
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
            :disabled="isSavingContact"
            @click="cancelContactEdit"
          />
          <UButton
            label="Save Changes"
            color="primary"
            class="cursor-pointer"
            icon="i-lucide-check"
            :loading="isSavingContact"
            @click="saveContactInfo"
          />
        </div>
      </UPageCard>

      <UPageCard variant="subtle">
        <!-- VIEW MODE (always show field labels) -->
        <template v-if="!isEditingContact">
          <!-- Name -->
          <div class="flex max-sm:flex-col justify-between items-start gap-4">
            <div class="flex-1">
              <label class="block text-sm font-medium mb-1">Name</label>
              <p v-if="contactInfo" class="text-base">{{ contactInfo.firstName }} {{ contactInfo.lastName }}</p>
              <p v-else class="text-base text-muted italic">Not specified</p>
            </div>
          </div>
          
          <USeparator />

          <!-- Job Title -->
          <div class="flex max-sm:flex-col justify-between items-start gap-4">
            <div class="flex-1">
              <label class="block text-sm font-medium mb-1">Job Title</label>
              <p v-if="contactInfo" class="text-base">{{ contactInfo.jobTitle || 'Not specified' }}</p>
              <p v-else class="text-base text-muted italic">Not specified</p>
            </div>
          </div>

          <USeparator />

          <!-- Email -->
          <div class="flex max-sm:flex-col justify-between items-start gap-4">
            <div class="flex-1">
              <label class="block text-sm font-medium mb-1">Email</label>
              <p v-if="contactInfo" class="text-base">{{ contactInfo.email }}</p>
              <p v-else class="text-base text-muted italic">Not specified</p>
            </div>
          </div>

          <USeparator />

          <!-- Phone -->
          <div class="flex max-sm:flex-col justify-between items-start gap-4">
            <div class="flex-1">
              <label class="block text-sm font-medium mb-1">Phone</label>
              <p v-if="contactInfo && contactInfo.phone" class="text-base">{{ formatPhoneForDisplay(contactInfo.phone) }}</p>
              <p v-else class="text-base text-muted italic">Not specified</p>
            </div>
          </div>

          <USeparator />

          <!-- Location -->
          <div class="flex max-sm:flex-col justify-between items-start gap-4">
            <div class="flex-1">
              <label class="block text-sm font-medium mb-1">Location</label>
              <p v-if="contactInfo" class="text-base">
                <template v-if="contactInfo.city || contactInfo.stateRegion || contactInfo.country">
                  {{ [contactInfo.city, contactInfo.stateRegion, contactInfo.postalCode, contactInfo.country].filter(Boolean).join(', ') }}
                </template>
                <template v-else>
                  Not specified
                </template>
              </p>
              <p v-else class="text-base text-muted italic">Not specified</p>
            </div>
          </div>

          <USeparator />

          <!-- Willing to Relocate -->
          <div class="flex max-sm:flex-col justify-between items-start gap-4">
            <div class="flex-1">
              <label class="block text-sm font-medium mb-1">Willing to Relocate</label>
              <p v-if="contactInfo" class="text-base">{{ contactInfo.willingToRelocate ? 'Yes' : 'No' }}</p>
              <p v-else class="text-base text-muted italic">Not specified</p>
            </div>
          </div>
        </template>

        <!-- EDIT MODE -->
        <template v-else>
          <!-- First Name -->
          <div class="flex max-sm:flex-col justify-between items-start gap-4">
            <div class="flex-1">
              <label class="block text-sm font-medium mb-1">First Name <span class="text-error">*</span></label>
              <UInput
                class="w-full rounded"
                :class="{ 'ring-1 ring-cyan-500 dark:ring-cyan-400': extractedFields.firstName }"
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
                class="w-full rounded"
                :class="{ 'ring-1 ring-cyan-500 dark:ring-cyan-400': extractedFields.lastName }"
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
              <label class="block text-sm font-medium mb-1">Job Title</label>
              <UInput
                class="w-full rounded"
                :class="{ 'ring-1 ring-cyan-500 dark:ring-cyan-400': extractedFields.jobTitle }"
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
                class="w-full rounded"
                :class="{ 'ring-1 ring-cyan-500 dark:ring-cyan-400': extractedFields.email }"
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
              <label class="block text-sm font-medium mb-1">Phone</label>
              <div class="flex gap-2">
                <!-- Country Code -->
                <div class="w-24">
                  <UInput
                    class="rounded"
                    :class="{ 'ring-1 ring-cyan-500 dark:ring-cyan-400': extractedFields.phone }"
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
                    :class="{ 'ring-1 ring-cyan-500 dark:ring-cyan-400': extractedFields.phone }"
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
              <label class="block text-sm font-medium mb-1">City</label>
              <UInput
                class="w-full rounded"
                :class="{ 'ring-1 ring-cyan-500 dark:ring-cyan-400': extractedFields.city }"
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
              <label class="block text-sm font-medium mb-1">State/Region</label>
              <UInput
                class="w-full rounded"
                :class="{ 'ring-1 ring-cyan-500 dark:ring-cyan-400': extractedFields.stateRegion }"
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
              <label class="block text-sm font-medium mb-1">Country</label>
              <UInput
                class="w-full rounded"
                :class="{ 'ring-1 ring-cyan-500 dark:ring-cyan-400': extractedFields.country }"
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
              <label class="block text-sm font-medium mb-1">Postal Code</label>
              <UInput
                class="w-full rounded"
                :class="{ 'ring-1 ring-cyan-500 dark:ring-cyan-400': extractedFields.postalCode }"
                v-model="formData.postalCode"
                placeholder="e.g. 12345"
                :error="!!formErrors.postalCode"
              />
              <p v-if="formErrors.postalCode" class="text-sm text-error mt-1">{{ formErrors.postalCode }}</p>
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
    </div>

        <!-- ============================================ -->
    <!-- PROFESSIONAL SUMMARY SECTION -->
    <!-- ============================================ -->
    <div>
      <UPageCard
        title="Professional Summary"
        description="Brief overview of your professional experience and goals"
        variant="naked"
        orientation="horizontal"
        class="mb-4"
      >
        <template #title>
          <div class="flex items-center gap-2">
            <span>Professional Summary</span>
            <UBadge 
              v-if="hasExtractedSummary"
              color="neutral"
              class="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300"
            >
              <div class="flex items-center gap-1">
                <UIcon name="i-lucide-sparkles" class="w-3 h-3" />
                <span>Extracted</span>
              </div>
            </UBadge>
          </div>
        </template>
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
            :disabled="isSavingSummary"
            @click="cancelSummaryEdit"
          />
          <UButton
            label="Save Changes"
            color="primary"
            class="cursor-pointer"
            icon="i-lucide-check"
            :loading="isSavingSummary"
            @click="saveSummary"
          />
        </div>
      </UPageCard>

      <UPageCard variant="subtle">
        <!-- VIEW MODE (always show) -->
        <div v-if="!isEditingSummary" class="prose prose-sm max-w-none">
          <p v-if="contactInfo?.summary" class="whitespace-pre-wrap">{{ contactInfo.summary }}</p>
          <p v-else class="text-muted italic">Click "Edit" to add your professional summary</p>
        </div>

        <!-- EDIT MODE -->
        <div v-else>
          <label class="block text-sm font-medium mb-2">Professional Summary</label>
          <UTextarea
            v-model="formData.summary"
            :class="{ 'ring-1 ring-cyan-500 dark:ring-cyan-400': extractedFields.summary }"
            placeholder="Write a brief overview of your professional experience, key skills, and career goals..."
            :rows="8"
            :error="!!formErrors.summary"
            autoresize
            class="rounded w-full"
          />
          <div class="flex justify-between items-center mt-2">
            <p v-if="formErrors.summary" class="text-sm text-error">{{ formErrors.summary }}</p>
            <p class="text-sm text-muted ml-auto">{{ summaryCharCount }} / 5000 characters</p>
          </div>
        </div>
      </UPageCard>
    </div>

    <!-- ============================================ -->
    <!-- WEBSITES SECTION -->
    <!-- ============================================ -->
    <div>
      <UPageCard
        title="Websites"
        description="Your personal or portfolio websites"
        variant="naked"
        orientation="horizontal"
        class="mb-4"
      >
        <template #title>
          <div class="flex items-center gap-2">
            <span>Websites</span>
            <UBadge 
              v-if="hasExtractedWebsites"
              color="neutral"
              class="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300"
            >
              <div class="flex items-center gap-1">
                <UIcon name="i-lucide-sparkles" class="w-3 h-3" />
                <span>Extracted</span>
              </div>
            </UBadge>
          </div>
        </template>
        <UButton
          v-if="!isEditingWebsites"
          label="Edit"
          color="neutral"
          variant="outline"
          icon="i-lucide-pencil"
          class="cursor-pointer w-fit lg:ms-auto"
          @click="startEditingWebsites"
        />
        <div v-else class="flex gap-2 w-fit lg:ms-auto">
          <UButton
            label="Cancel"
            color="neutral"
            variant="ghost"
            class="cursor-pointer"
            :disabled="isSavingWebsites"
            @click="cancelWebsitesEdit"
          />
          <UButton
            label="Save Changes"
            color="primary"
            class="cursor-pointer"
            icon="i-lucide-check"
            :loading="isSavingWebsites"
            @click="saveWebsites"
          />
        </div>
      </UPageCard>

      <UPageCard variant="subtle">
        <!-- VIEW MODE (always show) -->
        <template v-if="!isEditingWebsites">
          <div v-if="contactInfo?.websites?.length" class="flex max-sm:flex-col justify-between items-start gap-4">
            <div class="flex-1">
              <ul class="space-y-1">
                <li v-for="(website, index) in contactInfo.websites" :key="index">
                  <a :href="website" target="_blank" rel="noopener" class="text-primary hover:underline">
                    {{ website }}
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div v-else class="text-center py-8">
            <UIcon name="i-lucide-globe" class="w-12 h-12 text-muted mx-auto mb-3" />
            <p class="text-muted">Click "Edit" to add your websites</p>
          </div>
        </template>

        <!-- EDIT MODE -->
        <template v-else>
          <div class="space-y-3">
            <div v-if="formData.websites && formData.websites.length > 0" class="space-y-2">
              <div v-for="(website, index) in formData.websites" :key="index" class="flex gap-2">
                <UInput
                  v-model="formData.websites[index]"
                  :class="{ 'ring-1 ring-cyan-500 dark:ring-cyan-400': extractedFields.websites }"
                  placeholder="https://example.com"
                  class="flex-1 rounded"
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
            </div>
            <UButton
              label="Add Website"
              icon="i-lucide-plus"
              color="neutral"
              variant="outline"
              size="sm"
              class="cursor-pointer"
              @click="addWebsite"
            />
          </div>
        </template>
      </UPageCard>
    </div>

    <!-- ============================================ -->
    <!-- SOCIAL LINKS SECTION -->
    <!-- ============================================ -->
    <div>
      <UPageCard
        title="Social Profiles"
        description="Your professional social media profiles"
        variant="naked"
        orientation="horizontal"
        class="mb-4"
      >
        <template #title>
          <div class="flex items-center gap-2">
            <span>Social Profiles</span>
            <UBadge 
              v-if="hasExtractedSocialLinks"
              color="neutral"
              class="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300"
            >
              <div class="flex items-center gap-1">
                <UIcon name="i-lucide-sparkles" class="w-3 h-3" />
                <span>Extracted</span>
              </div>
            </UBadge>
          </div>
        </template>
        <UButton
          v-if="!isEditingSocialLinks"
          label="Edit"
          color="neutral"
          variant="outline"
          icon="i-lucide-pencil"
          class="cursor-pointer w-fit lg:ms-auto"
          @click="startEditingSocialLinks"
        />
        <div v-else class="flex gap-2 w-fit lg:ms-auto">
          <UButton
            label="Cancel"
            color="neutral"
            variant="ghost"
            class="cursor-pointer"
            :disabled="isSavingSocialLinks"
            @click="cancelSocialLinksEdit"
          />
          <UButton
            label="Save Changes"
            color="primary"
            class="cursor-pointer"
            icon="i-lucide-check"
            :loading="isSavingSocialLinks"
            @click="saveSocialLinks"
          />
        </div>
      </UPageCard>

      <UPageCard variant="subtle">
        <!-- VIEW MODE -->
        <template v-if="!isEditingSocialLinks">
          <div v-if="localSocialLinks.length" class="space-y-3">
            <div
              v-for="(link, linkIndex) in localSocialLinks"
              :key="linkIndex"
              class="flex items-center gap-4 p-3 rounded-lg border border-default"
              :class="{ 'ring-1 ring-cyan-500 dark:ring-cyan-400': link?.isExtracted }"
            >
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
            </div>
          </div>
          <div v-else class="text-center py-8">
            <UIcon name="i-lucide-link" class="w-12 h-12 text-muted mx-auto mb-3" />
            <p class="text-muted">Click "Edit" to add your social profiles</p>
          </div>
        </template>

        <!-- EDIT MODE -->
        <template v-else>
          <div class="space-y-3">
            <!-- Existing Social Links -->
            <div v-if="localSocialLinks.length > 0" class="space-y-3">
              <div
                v-for="(link, linkIndex) in localSocialLinks"
                :key="link.id || linkIndex"
                class="space-y-2 rounded"
                :class="{ 'ring-1 ring-cyan-500 dark:ring-cyan-400': link?.isExtracted }"
              >
                <!-- Individual Link Edit Mode -->
                <template v-if="editingSocialLinkIndex === linkIndex">
                  <div class="p-3 border border-default rounded-lg space-y-2" >
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
                      class="w-full"
                    >
                      <template #leading>
                        <UIcon name="i-lucide-link" class="w-4 h-4 text-muted" />
                      </template>
                    </UInput>
                    <p v-if="socialLinkErrors.url" class="text-sm text-error">{{ socialLinkErrors.url }}</p>
                    <div class="flex gap-2 justify-end">
                      <UButton
                        label="Cancel"
                        color="neutral"
                        variant="ghost"
                        size="sm"
                        class="cursor-pointer"
                        @click="cancelSocialLinkEdit"
                      />
                      <UButton
                        label="Update"
                        color="primary"
                        size="sm"
                        icon="i-lucide-check"
                        class="cursor-pointer"
                        @click="updateSocialLink(linkIndex)"
                      />
                    </div>
                  </div>
                </template>

                <!-- Link Display in Edit Mode -->
                <template v-else>
                  <div class="flex items-center justify-between gap-4 p-3 rounded-lg border border-default hover:bg-muted/50 transition-colors">
                    <div class="flex items-center gap-3 flex-1">
                      <UIcon 
                        v-if="getPlatformById(link.platformId)?.icon" 
                        :name="getPlatformById(link.platformId)!.icon!" 
                        class="w-5 h-5 text-muted shrink-0" 
                      />
                      <UIcon v-else name="i-lucide-link" class="w-5 h-5 text-muted shrink-0" />
                      <div>
                        <p class="font-medium">{{ link.platformNameCache }}</p>
                        <p class="text-sm text-muted">{{ link.url }}</p>
                      </div>
                    </div>
                    <div class="flex gap-2">
                      <UButton
                        class="cursor-pointer"
                        icon="i-lucide-pencil"
                        color="neutral"
                        variant="ghost"
                        size="sm"
                        @click="startEditingSocialLink(linkIndex, link.url)"
                      />
                      <UButton
                        class="cursor-pointer"
                        icon="i-lucide-trash-2"
                        color="error"
                        variant="ghost"
                        size="sm"
                        @click="deleteSocialLink(linkIndex)"
                      />
                    </div>
                  </div>
                  <p v-if="socialLinkErrors[`social_${linkIndex}`]" class="text-sm text-error ml-3">
                    {{ socialLinkErrors[`social_${linkIndex}`] }}
                  </p>
                </template>
              </div>
            </div>

            <!-- Add New Social Link Form -->
            <div v-if="isAddingSocialLink" class="p-4 border border-default rounded-lg space-y-4">
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
                  class="cursor-pointer"
                  @click="cancelSocialLinkEdit"
                />
                <UButton
                  label="Add Link"
                  color="primary"
                  icon="i-lucide-check"
                  class="cursor-pointer"
                  @click="addSocialLink"
                />
              </div>
            </div>

            <!-- Add Social Link Button (shown when not adding) -->
            <UButton
              v-if="!isAddingSocialLink"
              label="Add Social Link"
              icon="i-lucide-plus"
              color="neutral"
              variant="outline"
              size="sm"
              class="cursor-pointer"
              @click="startAddingSocialLink"
            />
          </div>
        </template>
      </UPageCard>
    </div>


  </div>
</template>
