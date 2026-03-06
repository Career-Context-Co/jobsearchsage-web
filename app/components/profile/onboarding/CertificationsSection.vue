<script setup lang="ts">
import type { Certification } from '#shared/types/careerId'
import { vMaska } from 'maska/vue'
import { validateRequired, validateUrl, validateMonthYear } from '~/utils/validation'

const careerIDStore = useCareerIDStore()
const toast = useToast()

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

// Props - receive Certification array from parent (store via onboarding)
const props = defineProps<{
  certifications: Certification[]
}>()

// Certifications data sorted by issue date (most recent first)
const certificationsList = computed(() => {
  return [...props.certifications].sort((a, b) => {
    return new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()
  })
})

// Form states - using INDEX-based tracking (not ID-based) to handle extracted items
const isAddingCertification = ref(false)
const editingCertificationIndex = ref<number | null>(null)
const isSavingCertification = ref(false)

// Form data
interface CertificationFormData {
  name: string
  issuer: string
  issueDate: string
  expirationDate: string
  url: string
}

const formData = ref<Partial<CertificationFormData>>({})
const formErrors = ref<Record<string, string>>({})

// Start adding new certification
function startAddingCertification() {
  formData.value = {
    name: '',
    issuer: '',
    issueDate: '',
    expirationDate: '',
    url: ''
  }
  formErrors.value = {}
  isAddingCertification.value = true
}

// Track which certification object we're editing (to handle extracted items)
const editingCertificationRef = ref<Certification | null>(null)

// Start editing existing certification - accepts INDEX not object
function startEditingCertification(certIndex: number) {
  const certification = certificationsList.value[certIndex]
  if (!certification) return
  
  editingCertificationIndex.value = certIndex
  editingCertificationRef.value = certification // Store reference to the actual object
  formData.value = {
    name: certification.name,
    issuer: certification.issuer,
    issueDate: formatDateForUI(certification.issueDate),
    expirationDate: formatDateForUI(certification.expirationDate),
    url: certification.url || ''
  }
  formErrors.value = {}
}

// Cancel editing
function cancelEdit() {
  isAddingCertification.value = false
  editingCertificationIndex.value = null
  editingCertificationRef.value = null
  formData.value = {}
  formErrors.value = {}
}

// Validate form
function validateForm(): boolean {
  const errors: Record<string, string> = {}
  
  // Required fields
  const nameError = validateRequired(formData.value.name, 'Certification Name')
  if (nameError) errors.name = nameError
  
  const issuerError = validateRequired(formData.value.issuer, 'Issuing Organization')
  if (issuerError) errors.issuer = issuerError
  
  // Validate issue date (required)
  const issueDateError = validateMonthYear(formData.value.issueDate, true)
  if (issueDateError) errors.issueDate = issueDateError
  
  // Validate expiration date (optional - only validate format if provided)
  if (formData.value.expirationDate && formData.value.expirationDate.trim()) {
    const expirationDateError = validateMonthYear(formData.value.expirationDate, false)
    if (expirationDateError) errors.expirationDate = expirationDateError
  }
  
  // Validate URL if provided
  if (formData.value.url && formData.value.url.trim()) {
    const urlError = validateUrl(formData.value.url, false)
    if (urlError) errors.url = urlError
  }
  
  formErrors.value = errors
  return Object.keys(errors).length === 0
}

// Save certification (add or update). Pass silent=true to suppress per-item toasts (used during bulk save).
async function saveCertification(silent = false): Promise<boolean> {
  if (!validateForm()) {
    if (!silent) {
      toast.add({
        title: 'Validation Error',
        description: 'Please fix the errors in the form',
        icon: 'i-lucide-alert-circle',
        color: 'error'
      })
    }
    return false
  }
  
  isSavingCertification.value = true
  
  try {
    const certificationData = {
      name: formData.value.name!,
      issuer: formData.value.issuer!,
      issueDate: formatDateForAPI(formData.value.issueDate)!,
      expirationDate: formatDateForAPI(formData.value.expirationDate),
      url: formData.value.url || undefined
    }
    
    const isUpdating = editingCertificationIndex.value !== null && certificationsList.value[editingCertificationIndex.value]?.id
    
    if (isUpdating) {
      const certification = certificationsList.value[editingCertificationIndex.value!]
      if (!certification?.id) {
        throw new Error('Cannot update certification without ID')
      }
      await careerIDStore.updateCertification(certification.id, certificationData)
      
      if (!silent) {
        toast.add({
          title: 'Success',
          description: 'Certification updated successfully',
          icon: 'i-lucide-check',
          color: 'success'
        })
      }
    } else {
      await careerIDStore.addCertification({
        ...certificationData,
        displayOrder: certificationsList.value.length + 1
      })
      
      if (editingCertificationRef.value && !editingCertificationRef.value.id && editingCertificationRef.value.isExtracted) {
        careerIDStore.certifications = careerIDStore.certifications.filter(
          cert => cert !== editingCertificationRef.value
        )
      }
      
      if (!silent) {
        toast.add({
          title: 'Success',
          description: 'Certification added successfully',
          icon: 'i-lucide-check',
          color: 'success'
        })
      }
    }
    
    cancelEdit()
    return true
  } catch (err: any) {
    toast.add({
      title: 'Error',
      description: getApiErrorMessage(err, 'Failed to save certification'),
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
    return false
  } finally {
    isSavingCertification.value = false
  }
}

// Delete certification - accepts OBJECT to handle extracted items without IDs
async function deleteCertification(certificationToDelete: Certification) {
  if (!confirm('Are you sure you want to delete this certification?')) {
    return
  }
  
  try {
    // If certification has an ID, it's saved in DB - call API to delete
    if (certificationToDelete.id) {
      await careerIDStore.deleteCertification(certificationToDelete.id)
    } else {
      // If no ID, it's extracted but not saved - just remove from store array
      careerIDStore.certifications = careerIDStore.certifications.filter(
        cert => cert !== certificationToDelete
      )
    }
    
    toast.add({
      title: 'Success',
      description: 'Certification deleted successfully',
      icon: 'i-lucide-check',
      color: 'success'
    })
  } catch (err: any) {
    toast.add({
      title: 'Error',
      description: getApiErrorMessage(err, 'Failed to delete certification'),
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  }
}

// Format date for display
function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

// Exposed methods for compatibility with onboarding.vue
async function triggerSave() {
  // Auto-save if in edit mode or adding mode
  if (isAddingCertification.value || editingCertificationIndex.value !== null) {
    await saveCertification()
  }
}

// Save any open form + all unsaved extracted items. Shows a single summary toast.
async function saveAllUnsaved(): Promise<boolean> {
  let savedCount = 0

  // Step 1: If user has an open form (adding or editing), save it first
  if (isAddingCertification.value || editingCertificationIndex.value !== null) {
    const formSuccess = await saveCertification(true)
    if (!formSuccess) return false
    savedCount++
  }

  // Step 2: Save remaining unsaved extracted items (no ID)
  const unsavedCertifications = certificationsList.value.filter(cert => !cert.id)
  for (const certification of unsavedCertifications) {
    const index = certificationsList.value.indexOf(certification)
    startEditingCertification(index)

    const success = await saveCertification(true)
    if (!success) return false
    savedCount++
  }

  if (savedCount > 0) {
    toast.add({
      title: 'Saved',
      description: `${savedCount} certification${savedCount > 1 ? 's' : ''} saved successfully`,
      icon: 'i-lucide-check',
      color: 'success'
    })
  }

  return true
}

function revertChanges() {
  // Cancel any active edits
  cancelEdit()
}

function handleApiError(error: any) {
  toast.add({
    title: 'Error',
    description: error?.data?.error?.message || error?.message || 'An error occurred',
    icon: 'i-lucide-alert-circle',
    color: 'error'
  })
}

// Expose methods for parent component
defineExpose({
  triggerSave,
  saveAllUnsaved,
  revertChanges,
  handleApiError
})
</script>

<template>
  <div class="space-y-4">
    <!-- Page Header -->
    <UPageCard
      title="Certifications"
      description="Your professional certifications and credentials"
      variant="naked"
      orientation="horizontal"
      class="mb-4"
    >
      <UButton
        v-if="!isAddingCertification && editingCertificationIndex === null"
        label="Add Certification"
        color="primary"
        variant="outline"
        icon="i-lucide-plus"
        class="cursor-pointer w-fit lg:ms-auto"
        @click="startAddingCertification"
      />
    </UPageCard>

    <!-- Add Certification Form -->
    <UPageCard v-if="isAddingCertification" variant="subtle" class="mb-4">
      <div class="space-y-4">
        <h3 class="text-lg font-semibold">Add Certification</h3>
        
        <!-- Certification Name -->
        <div>
          <label class="block text-sm font-medium mb-1">Certification Name <span class="text-error">*</span></label>
          <UInput
            v-model="formData.name"
            placeholder="e.g. AWS Certified Solutions Architect"
            class="w-full"
            :error="!!formErrors.name"
          />
          <p v-if="formErrors.name" class="text-sm text-error mt-1">{{ formErrors.name }}</p>
        </div>

        <!-- Issuer -->
        <div>
          <label class="block text-sm font-medium mb-1">Issuing Organization <span class="text-error">*</span></label>
          <UInput
            v-model="formData.issuer"
            placeholder="e.g. Amazon Web Services"
            class="w-full"
            :error="!!formErrors.issuer"
          />
          <p v-if="formErrors.issuer" class="text-sm text-error mt-1">{{ formErrors.issuer }}</p>
        </div>

        <!-- Dates -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">Issue Date <span class="text-error">*</span></label>
            <UInput
              v-model="formData.issueDate"
              v-maska="'##/####'"
              placeholder="MM/YYYY"
              class="w-full"
              :error="!!formErrors.issueDate"
            />
            <p v-if="formErrors.issueDate" class="text-sm text-error mt-1">{{ formErrors.issueDate }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">
              Expiration Date 
              <span class="text-muted text-xs">(optional if no expiration)</span>
            </label>
            <UInput
              v-model="formData.expirationDate"
              v-maska="'##/####'"
              placeholder="MM/YYYY"
              class="w-full"
              :error="!!formErrors.expirationDate"
            />
            <p v-if="formErrors.expirationDate" class="text-sm text-error mt-1">{{ formErrors.expirationDate }}</p>
          </div>
        </div>

        <!-- Certificate URL -->
        <div>
          <label class="block text-sm font-medium mb-1">Certificate URL</label>
          <UInput
            v-model="formData.url"
            placeholder="https://example.com/certificate"
            class="w-full"
            :error="!!formErrors.url"
          >
            <template #leading>
              <UIcon name="i-lucide-link" class="w-4 h-4 text-muted" />
            </template>
          </UInput>
          <p v-if="formErrors.url" class="text-sm text-error mt-1">{{ formErrors.url }}</p>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-2 justify-end pt-4">
          <UButton
            label="Cancel"
            color="neutral"
            variant="ghost"
            class="cursor-pointer"
            @click="cancelEdit"
            :disabled="isSavingCertification"
          />
          <UButton
            label="Save Certification"
            color="primary"
            icon="i-lucide-check"
            class="cursor-pointer"
            :loading="isSavingCertification"
            @click="saveCertification"
          />
        </div>
      </div>
    </UPageCard>

    <!-- Certifications List -->
    <div v-if="certificationsList.length > 0 && !isAddingCertification" class="space-y-4">
      <div
        v-for="(certification, certIndex) in certificationsList"
        :key="certification.id || certIndex"
        class="border border-default rounded-lg"
        :class="{ 'ring-1 ring-cyan-500 dark:ring-cyan-400': certification.isExtracted }"
      >
        <!-- View Mode -->
        <UPageCard v-if="editingCertificationIndex !== certIndex" variant="subtle">
          <div class="flex justify-between items-start gap-4">
            <div class="flex-1">
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <h3 class="text-lg font-semibold">{{ certification.name }}</h3>
                    <UBadge
                      v-if="certification.isExtracted"
                      color="neutral"
                      class="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300"
                    >
                      <div class="flex items-center gap-1">
                        <UIcon name="i-lucide-sparkles" class="w-3 h-3" />
                        <span>Extracted</span>
                      </div>
                    </UBadge>
                  </div>
                  <p class="text-base font-medium text-muted">{{ certification.issuer }}</p>
                  <div class="flex flex-wrap gap-2 mt-2 text-sm text-muted">
                    <span>Issued {{ formatDate(certification.issueDate) }}</span>
                    <span v-if="certification.expirationDate">• Expires {{ formatDate(certification.expirationDate) }}</span>
                  </div>
                </div>
                <div class="flex gap-2">
                  <UButton
                    icon="i-lucide-pencil"
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    class="cursor-pointer"
                    @click="startEditingCertification(certIndex)"
                  />
                  <UButton
                    icon="i-lucide-trash-2"
                    color="error"
                    variant="ghost"
                    size="sm"
                    class="cursor-pointer"
                    @click="deleteCertification(certification)"
                  />
                </div>
              </div>

              <div v-if="certification.url" class="mt-3">
                <a
                  :href="certification.url"
                  target="_blank"
                  rel="noopener"
                  class="text-sm text-primary hover:underline inline-flex items-center gap-1"
                >
                  <UIcon name="i-lucide-external-link" class="w-3 h-3" />
                  View Certificate
                </a>
              </div>
            </div>
          </div>
        </UPageCard>

        <!-- Edit Mode -->
        <UPageCard v-else variant="subtle">
          <div class="space-y-4">
            <h3 class="text-lg font-semibold">Edit Certification</h3>
            
            <!-- Certification Name -->
            <div>
              <label class="block text-sm font-medium mb-1">Certification Name <span class="text-error">*</span></label>
              <UInput
                v-model="formData.name"
                placeholder="e.g. AWS Certified Solutions Architect"
                class="w-full"
                :error="!!formErrors.name"
              />
              <p v-if="formErrors.name" class="text-sm text-error mt-1">{{ formErrors.name }}</p>
            </div>

            <!-- Issuer -->
            <div>
              <label class="block text-sm font-medium mb-1">Issuing Organization <span class="text-error">*</span></label>
              <UInput
                v-model="formData.issuer"
                placeholder="e.g. Amazon Web Services"
                class="w-full"
                :error="!!formErrors.issuer"
              />
              <p v-if="formErrors.issuer" class="text-sm text-error mt-1">{{ formErrors.issuer }}</p>
            </div>

            <!-- Dates -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1">Issue Date <span class="text-error">*</span></label>
                <UInput
                  v-model="formData.issueDate"
                  v-maska="'##/####'"
                  placeholder="MM/YYYY"
                  class="w-full"
                  :error="!!formErrors.issueDate"
                />
                <p v-if="formErrors.issueDate" class="text-sm text-error mt-1">{{ formErrors.issueDate }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">
                  Expiration Date 
                  <span class="text-muted text-xs">(optional if no expiration)</span>
                </label>
                <UInput
                  v-model="formData.expirationDate"
                  v-maska="'##/####'"
                  placeholder="MM/YYYY"
                  class="w-full"
                  :error="!!formErrors.expirationDate"
                />
                <p v-if="formErrors.expirationDate" class="text-sm text-error mt-1">{{ formErrors.expirationDate }}</p>
              </div>
            </div>

            <!-- Certificate URL -->
            <div>
              <label class="block text-sm font-medium mb-1">Certificate URL</label>
              <UInput
                v-model="formData.url"
                placeholder="https://example.com/certificate"
                class="w-full"
                :error="!!formErrors.url"
              >
                <template #leading>
                  <UIcon name="i-lucide-link" class="w-4 h-4 text-muted" />
                </template>
              </UInput>
              <p v-if="formErrors.url" class="text-sm text-error mt-1">{{ formErrors.url }}</p>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-2 justify-end pt-4">
              <UButton
                label="Cancel"
                color="neutral"
                variant="ghost"
                class="cursor-pointer"
                @click="cancelEdit"
                :disabled="isSavingCertification"
              />
              <UButton
                label="Save Changes"
                color="primary"
                icon="i-lucide-check"
                class="cursor-pointer"
                :loading="isSavingCertification"
                @click="saveCertification"
              />
            </div>
          </div>
        </UPageCard>
      </div>
    </div>

    <!-- Empty State -->
    <UPageCard v-if="certificationsList.length === 0 && !isAddingCertification" variant="subtle">
      <div class="text-center py-12">
        <UIcon name="i-lucide-award" class="w-16 h-16 text-muted mx-auto mb-4" />
        <h3 class="text-lg font-semibold mb-2">No Certifications Added</h3>
        <p class="text-muted mb-6">Add your professional certifications to showcase your credentials.</p>
        <UButton
          label="Add Your First Certification"
          color="primary"
          icon="i-lucide-plus"
          class="cursor-pointer"
          @click="startAddingCertification"
        />
      </div>
    </UPageCard>
  </div>
</template>
