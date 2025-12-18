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

// Get current user
const user = ref({ id: 'prof_myf2i85se9xri4e4wgsxxim7' }) // TODO: Replace with real Supabase user

// Loading and saving states
const isLoading = computed(() => careerIDStore.isLoading)
const isSaving = computed(() => careerIDStore.isSaving)

// Certifications data from store
const certificationsList = computed(() => {
  // Sort by issue date, most recent first
  return [...careerIDStore.certifications].sort((a, b) => {
    return new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()
  })
})

// Form states
const isAddingCertification = ref(false)
const editingCertificationId = ref<number | null>(null)

// Form data
interface CertificationFormData {
  name: string
  issuer: string
  issueDate: string
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
    url: ''
  }
  formErrors.value = {}
  isAddingCertification.value = true
}

// Start editing existing certification
function startEditingCertification(certification: Certification) {
  editingCertificationId.value = certification.id
  formData.value = {
    name: certification.name,
    issuer: certification.issuer,
    issueDate: formatDateForUI(certification.issueDate),
    url: certification.url || ''
  }
  formErrors.value = {}
}

// Cancel editing
function cancelEdit() {
  isAddingCertification.value = false
  editingCertificationId.value = null
  formData.value = {}
  formErrors.value = {}
}

// Validate form
function validateForm(): boolean {
  const errors: Record<string, string> = {}
  
  // Required fields
  const nameError = validateRequired(formData.value.name, 'Certification Name')
  if (nameError) errors.name = nameError
  
  const issuerError = validateRequired(formData.value.issuer, 'Issuer')
  if (issuerError) errors.issuer = issuerError
  
  // Validate issue date
  const issueDateError = validateMonthYear(formData.value.issueDate, true)
  if (issueDateError) errors.issueDate = issueDateError
  
  // Validate URL if provided
  if (formData.value.url && formData.value.url.trim()) {
    const urlError = validateUrl(formData.value.url, false)
    if (urlError) errors.url = urlError
  }
  
  formErrors.value = errors
  return Object.keys(errors).length === 0
}

// Add certification
async function addCertification() {
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
    await careerIDStore.addCertification({
      name: formData.value.name!,
      issuer: formData.value.issuer!,
      issueDate: formatDateForAPI(formData.value.issueDate)!,
      url: formData.value.url || undefined,
      displayOrder: certificationsList.value.length + 1
    })
    
    toast.add({
      title: 'Success',
      description: 'Certification added successfully',
      icon: 'i-lucide-check',
      color: 'success'
    })
    
    cancelEdit()
  } catch (err: any) {
    toast.add({
      title: 'Error',
      description: err?.message || 'Failed to add certification',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  }
}

// Update certification
async function updateCertification() {
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
    await careerIDStore.updateCertification(editingCertificationId.value!, {
      name: formData.value.name!,
      issuer: formData.value.issuer!,
      issueDate: formatDateForAPI(formData.value.issueDate)!,
      url: formData.value.url || undefined
    })
    
    toast.add({
      title: 'Success',
      description: 'Certification updated successfully',
      icon: 'i-lucide-check',
      color: 'success'
    })
    
    cancelEdit()
  } catch (err: any) {
    toast.add({
      title: 'Error',
      description: err?.message || 'Failed to update certification',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  }
}

// Delete certification
async function deleteCertification(id: number) {
  if (!confirm('Are you sure you want to delete this certification?')) {
    return
  }
  
  try {
    await careerIDStore.deleteCertification(id)
    
    toast.add({
      title: 'Success',
      description: 'Certification deleted successfully',
      icon: 'i-lucide-check',
      color: 'success'
    })
  } catch (err: any) {
    toast.add({
      title: 'Error',
      description: err?.message || 'Failed to delete certification',
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

// Fetch profile data on mount
onMounted(async () => {
  if (!user.value?.id) {
    return
  }

  try {
    if (!careerIDStore.isProfileLoaded) {
      await careerIDStore.fetchProfile(user.value.id)
    }
  } catch (err) {
    console.error('Failed to load profile:', err)
  }
})
</script>

<template>
  <!-- Loading State -->
  <div v-if="isLoading" class="space-y-4">
    <USkeleton class="h-32 w-full" />
    <USkeleton class="h-64 w-full" />
  </div>

  <!-- Certifications Content -->
  <div v-else class="space-y-4">
    <!-- Page Header -->
    <UPageCard
      title="Certifications"
      description="Your professional certifications and credentials"
      variant="naked"
      orientation="horizontal"
      class="mb-4"
    >
      <UButton
        v-if="!isAddingCertification && !editingCertificationId"
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

        <!-- Issue Date -->
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
            :disabled="isSaving"
          />
          <UButton
            label="Save Certification"
            color="primary"
            icon="i-lucide-check"
            class="cursor-pointer"
            :loading="isSaving"
            @click="addCertification"
          />
        </div>
      </div>
    </UPageCard>

    <!-- Certifications List -->
    <div v-if="certificationsList.length > 0 && !isAddingCertification" class="space-y-4">
      <div
        v-for="certification in certificationsList"
        :key="certification.id"
        class="border border-default rounded-lg"
      >
        <!-- View Mode -->
        <UPageCard v-if="editingCertificationId !== certification.id" variant="subtle">
          <div class="flex justify-between items-start gap-4">
            <div class="flex-1">
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1">
                  <h3 class="text-lg font-semibold">{{ certification.name }}</h3>
                  <p class="text-base font-medium text-muted">{{ certification.issuer }}</p>
                  <div class="flex flex-wrap gap-2 mt-2 text-sm text-muted">
                    <span>Issued {{ formatDate(certification.issueDate) }}</span>
                  </div>
                </div>
                <div class="flex gap-2">
                  <UButton
                    icon="i-lucide-pencil"
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    class="cursor-pointer"
                    @click="startEditingCertification(certification)"
                  />
                  <UButton
                    icon="i-lucide-trash-2"
                    color="error"
                    variant="ghost"
                    size="sm"
                    class="cursor-pointer"
                    @click="deleteCertification(certification.id)"
                    :loading="isSaving"
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

            <!-- Issue Date -->
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
                :disabled="isSaving"
              />
              <UButton
                label="Update Certification"
                color="primary"
                icon="i-lucide-check"
                class="cursor-pointer"
                :loading="isSaving"
                @click="updateCertification"
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
