<script setup lang="ts">
import type { Certification, ProfileSkill } from '~/shared/types/careerId'
import { validateRequired, validateUrl } from '~/utils/validation'

// Form data types (without server-managed fields)
interface SkillItem {
  id?: number // Optional ID for existing skills
  name: string
}

interface SkillGroupFormData {
  name: string
  originalName?: string // Track original group name for updates
  skills: SkillItem[]
  isEditing: boolean
  isDeletable?: boolean // Flag for undeletable groups like "No Group"
}

interface CertificationFormData {
  name: string
  issuer: string
  issueDate: string
  url?: string | null
  isEditing: boolean
}

// Error types matching form data structures
interface CertificationErrors {
  name?: string
  issuer?: string
  issueDate?: string
  url?: string
}

interface SkillGroupErrors {
  name?: string
  skills?: string
}

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

// Props - receive raw skills from store
interface Props {
  skillGroups?: ProfileSkill[]  // Raw skills with group field (null or string)
  certifications?: Certification[]
}

const props = withDefaults(defineProps<Props>(), {
  skillGroups: () => [],
  certifications: () => []
})

// Emits - send raw group values (null or string)
const emit = defineEmits<{
  saveSkillGroup: [index: number, data: { group: string | null, originalGroup: string | null, skills: SkillItem[] }]
  deleteSkillGroup: [groupValue: string | null]
  saveCertification: [data: CertificationFormData & { id?: number }]
  saveAll: [data: { certifications: (CertificationFormData & { id?: number })[], skillGroups: { group: string | null, originalGroup: string | null, skills: SkillItem[] }[] }]
  deleteCertification: [id: number]
}>()

// Transform raw ProfileSkill[] into grouped format for display
// Convert null group to "No Group" for display
function transformSkillsToGroups(skills: ProfileSkill[]): SkillGroupFormData[] {
  // Group skills by their group field
  const grouped = new Map<string, { id: number, name: string }[]>()
  
  skills.forEach(skill => {
    const groupKey = skill.group || 'No Group' // Display null as "No Group"
    if (!grouped.has(groupKey)) {
      grouped.set(groupKey, [])
    }
    grouped.get(groupKey)!.push({
      id: skill.id,
      name: skill.name
    })
  })
  
  // Convert to SkillGroupFormData array
  const groups = Array.from(grouped.entries()).map(([displayName, skills]) => ({
    name: displayName,
    originalName: displayName,
    skills,
    isEditing: false,
    isDeletable: displayName !== 'No Group' // No Group is not deletable
  }))
  
  // Ensure "No Group" is always present, even if empty
  if (!groups.some(g => g.name === 'No Group')) {
    groups.push({
      name: 'No Group',
      originalName: 'No Group',
      skills: [],
      isEditing: false,
      isDeletable: false
    })
  }
  
  // Sort so "No Group" is always first, then others alphabetically
  groups.sort((a, b) => {
    if (a.name === 'No Group') return -1
    if (b.name === 'No Group') return 1
    return a.name.localeCompare(b.name)
  })
  
  return groups
}

// Local reactive copies for two-way binding
const skillGroups = ref<SkillGroupFormData[]>(transformSkillsToGroups(props.skillGroups))

// Transform Certification[] from store into local editable format with id preserved
const certifications = ref<(CertificationFormData & { id?: number })[]>(
  props.certifications.length > 0
    ? props.certifications.map(cert => ({
        id: cert.id,
        name: cert.name,
        issuer: cert.issuer,
        issueDate: formatDateForUI(cert.issueDate),
        url: cert.url,
        isEditing: false
      }))
    : [{
        name: '',
        issuer: '',
        issueDate: '',
        url: '',
        isEditing: true
      }]
)

// Track which items have been edited
const editedSkillGroups = ref<Set<number>>(new Set())
const editedCertifications = ref<Set<number>>(new Set())
// Flags to temporarily disable change tracking during props updates
const isUpdatingSkillsFromProps = ref(false)
const isUpdatingCertificationsFromProps = ref(false)

// Validation errors
const certificationErrors = ref<Record<number, CertificationErrors>>({})
const skillGroupErrors = ref<Record<number, SkillGroupErrors>>({})

// Track delete confirmation states
const certificationDeleteConfirm = ref<Set<number>>(new Set())
const skillGroupDeleteConfirm = ref<Set<number>>(new Set())

// Watch for changes - will not fire on initial setup (immediate: false by default)
watch(skillGroups, () => {
  // Skip if we're updating from props
  if (isUpdatingSkillsFromProps.value) return
  
  // Mark all skill groups as potentially edited when any field changes
  skillGroups.value.forEach((_, index) => {
    editedSkillGroups.value.add(index)
  })
}, { deep: true })

watch(certifications, () => {
  // Skip if we're updating from props
  if (isUpdatingCertificationsFromProps.value) return
  
  // Mark all certifications as potentially edited when any field changes
  certifications.value.forEach((_, index) => {
    editedCertifications.value.add(index)
  })
}, { deep: true })

// Watch for external prop changes
watch(() => props.skillGroups, (newValue) => {
  // Disable change tracking during this update
  isUpdatingSkillsFromProps.value = true
  
  skillGroups.value = transformSkillsToGroups(newValue)
  
  // Clear edited tracking when props update
  editedSkillGroups.value.clear()
  
  // Re-enable change tracking
  isUpdatingSkillsFromProps.value = false
}, { deep: true })

watch(() => props.certifications, (newValue) => {
  // Disable change tracking during this update
  isUpdatingCertificationsFromProps.value = true
  
  certifications.value = newValue.length > 0
    ? newValue.map(cert => ({
        id: cert.id,
        name: cert.name,
        issuer: cert.issuer,
        issueDate: formatDateForUI(cert.issueDate),
        url: cert.url,
        isEditing: false
      }))
    : [{
        name: '',
        issuer: '',
        issueDate: '',
        url: '',
        isEditing: true
      }]
  
  // Clear edited tracking when props update
  editedCertifications.value.clear()
  
  // Re-enable change tracking
  isUpdatingCertificationsFromProps.value = false
}, { deep: true })

// Top-level section visibility
const skillsSectionOpen = ref(true)
const certificationsSectionOpen = ref(false)

// Skill Group Functions
function createBlankSkillGroup(): SkillGroupFormData {
  return {
    name: '',
    skills: [],
    isEditing: true,
    isDeletable: true
  }
}

function addNewSkillGroup() {
  skillGroups.value.push(createBlankSkillGroup())
}

// Update skills for a group when UInputTags changes
function updateSkillsForGroup(groupIndex: number, newSkillNames: string[]) {
  const group = skillGroups.value[groupIndex]
  if (!group) return
  
  // Check for duplicates (case-insensitive comparison)
  const seen = new Set<string>()
  const duplicates: string[] = []
  const uniqueNames: string[] = []
  
  for (const name of newSkillNames) {
    const trimmedLower = name.trim().toLowerCase()
    if (!trimmedLower) continue
    
    if (seen.has(trimmedLower)) {
      duplicates.push(name.trim())
    } else {
      seen.add(trimmedLower)
      uniqueNames.push(name.trim())
    }
  }
  
  // Show error if duplicates were detected
  if (duplicates.length > 0) {
    if (!skillGroupErrors.value[groupIndex]) {
      skillGroupErrors.value[groupIndex] = {}
    }
    skillGroupErrors.value[groupIndex].skills = `You already have "${duplicates[0]}"! Each skill can only be added once. 😅`
  } else {
    // Clear error if no duplicates
    if (skillGroupErrors.value[groupIndex]?.skills) {
      delete skillGroupErrors.value[groupIndex].skills
      // Clean up empty error object
      if (Object.keys(skillGroupErrors.value[groupIndex]).length === 0) {
        delete skillGroupErrors.value[groupIndex]
      }
    }
  }
  
  // Map existing skills by name to preserve IDs (only use unique names)
  const existingSkillsMap = new Map(group.skills.map(s => [s.name.trim().toLowerCase(), s]))
  
  // Update skills array while preserving IDs for existing skills
  group.skills = uniqueNames.map(name => {
    const existing = existingSkillsMap.get(name.toLowerCase())
    if (existing) {
      return { ...existing, name } // Keep existing skill with ID but update name in case of capitalization change
    }
    return { name } // New skill without ID
  })
}

// Validate skill group
function validateSkillGroup(group: SkillGroupFormData, index: number): boolean {
  // Clear previous errors
  if (skillGroupErrors.value[index]) {
    delete skillGroupErrors.value[index]
  }
  
  const errors: SkillGroupErrors = {}
  let isValid = true
  
  // Validate group name (required if not "No Group")
  if (group.name !== 'No Group' && !group.name.trim()) {
    errors.name = 'Group name is required'
    isValid = false
  }
  
  if (!isValid) {
    skillGroupErrors.value[index] = errors
  }
  
  return isValid
}

function saveSkillGroup(index: number) {
  const group = skillGroups.value[index]
  if (!group) return
  
  // Validate before saving
  if (!validateSkillGroup(group, index)) {
    return // Stop if validation fails
  }
  
  // Only save if this group was actually edited or is new (no originalName)
  if (!group.originalName || editedSkillGroups.value.has(index)) {
    // Convert display names back to raw values for API
    // "No Group" -> null, anything else stays as-is
    const groupValue = group.name === 'No Group' ? null : (group.name || null)
    const originalGroupValue = group.originalName === 'No Group' ? null : (group.originalName || null)
    
    emit('saveSkillGroup', index, {
      group: groupValue,
      originalGroup: originalGroupValue ?? null,
      skills: group.skills
    })
    
    // Clear the edited flag after saving
    editedSkillGroups.value.delete(index)
  }
  
  group.isEditing = false
  // Clear validation errors on successful save
  if (skillGroupErrors.value[index]) {
    delete skillGroupErrors.value[index]
  }
}

function editSkillGroup(index: number) {
  const group = skillGroups.value[index]
  if (!group) return
  group.isEditing = true
}

function deleteSkillGroup(index: number) {
  const group = skillGroups.value[index]
  if (!group) return
  
  // Don't allow deleting "No Group"
  if (group.name === 'No Group' || !group.isDeletable) {
    return
  }
  
  // Check if already in confirm state
  if (skillGroupDeleteConfirm.value.has(index)) {
    // Actually delete
    const groupValue: string | null = group.originalName === 'No Group' ? null : (group.originalName || null)
    skillGroups.value.splice(index, 1)
    skillGroupDeleteConfirm.value.delete(index)
    emit('deleteSkillGroup', groupValue)
  } else {
    // First click: enter confirm state
    skillGroupDeleteConfirm.value.add(index)
    // Auto-clear confirmation after 3 seconds
    setTimeout(() => {
      skillGroupDeleteConfirm.value.delete(index)
    }, 3000)
  }
}

function cancelEditSkillGroup(index: number) {
  const group = skillGroups.value[index]
  if (!group) return
  
  // If this is a new unsaved group (no originalName or empty), remove it (unless it's No Group)
  if ((!group.originalName || (!group.name && group.skills.length === 0)) && group.isDeletable) {
    skillGroups.value.splice(index, 1)
    editedSkillGroups.value.delete(index)
    return
  }
  
  // If it has an originalName, reset it back to original values from props
  // Convert "No Group" display name back to null for matching
  const originalGroupValue = group.originalName === 'No Group' ? null : group.originalName
  
  // Find all skills in props that belong to this original group
  const originalSkills = props.skillGroups
    .filter(skill => skill.group === originalGroupValue)
    .map(skill => ({
      id: skill.id,
      name: skill.name
    }))
  
  // Reset group name and skills back to original
  group.name = group.originalName || ''
  group.skills = originalSkills
  
  // Clear the edited flag
  editedSkillGroups.value.delete(index)
  
  // Close edit mode
  group.isEditing = false
}

// Certification Functions
function createBlankCertification(): CertificationFormData {
  return {
    name: '',
    issuer: '',
    issueDate: '',
    url: '',
    isEditing: true
  }
}

function addNewCertification() {
  certifications.value.push(createBlankCertification())
}

// Validate certification
function validateCertification(cert: CertificationFormData & { id?: number }, index: number): boolean {
  // Clear previous errors
  if (certificationErrors.value[index]) {
    delete certificationErrors.value[index]
  }
  
  const errors: CertificationErrors = {}
  let isValid = true
  
  // Validate required fields
  const nameError = validateRequired(cert.name, 'Certification name')
  if (nameError) {
    errors.name = nameError
    isValid = false
  }
  
  const issuerError = validateRequired(cert.issuer, 'Issuer')
  if (issuerError) {
    errors.issuer = issuerError
    isValid = false
  }
  
  // Validate URL if provided
  if (cert.url && cert.url.trim()) {
    const urlError = validateUrl(cert.url, false)
    if (urlError) {
      errors.url = urlError
      isValid = false
    }
  }
  
  if (!isValid) {
    certificationErrors.value[index] = errors
  }
  
  return isValid
}

function saveCertification(index: number) {
  const cert = certifications.value[index]
  if (!cert) return
  
  // Validate before saving
  if (!validateCertification(cert, index)) {
    return // Stop if validation fails
  }
  
  // Only save if this certification was actually edited or is new (no id)
  if (!cert.id || editedCertifications.value.has(index)) {
    const { isEditing, ...certToSave } = cert
    emit('saveCertification', certToSave as CertificationFormData & { id?: number })
    
    // Clear the edited flag after saving
    editedCertifications.value.delete(index)
  }
  
  cert.isEditing = false
  // Clear validation errors on successful save
  if (certificationErrors.value[index]) {
    delete certificationErrors.value[index]
  }
}

function editCertification(index: number) {
  const cert = certifications.value[index]
  if (!cert) return
  cert.isEditing = true
}

function deleteCertification(index: number) {
  const cert = certifications.value[index]
  if (!cert) return
  
  // Check if already in confirm state
  if (certificationDeleteConfirm.value.has(index)) {
    // Actually delete - emit event if it has an id, otherwise just remove from local state
    if (cert.id) {
      emit('deleteCertification', cert.id)
    }
    certifications.value.splice(index, 1)
    certificationDeleteConfirm.value.delete(index)
  } else {
    // First click: enter confirm state
    certificationDeleteConfirm.value.add(index)
    // Auto-clear confirmation after 3 seconds
    setTimeout(() => {
      certificationDeleteConfirm.value.delete(index)
    }, 3000)
  }
}

function cancelEditCertification(index: number) {
  const cert = certifications.value[index]
  if (!cert) return
  
  // If this is a new unsaved certification (no id), remove it
  if (!cert.id) {
    certifications.value.splice(index, 1)
    editedCertifications.value.delete(index)
    return
  }
  
  // If it has an id, reset it back to original values from props
  const original = props.certifications.find(c => c.id === cert.id)
  if (original) {
    cert.name = original.name
    cert.issuer = original.issuer
    cert.issueDate = formatDateForUI(original.issueDate)
    cert.url = original.url
  }
  
  // Clear the edited flag
  editedCertifications.value.delete(index)
  
  cert.isEditing = false
}

// Save all certifications and skills (bulk save)
function saveAll() {
  // Validate all certifications before saving
  let allValid = true
  const certificationsToValidate = certifications.value
    .map((cert, index) => ({ cert, index }))
    .filter(({ cert, index }) => !cert.id || editedCertifications.value.has(index))
  
  for (const { cert, index } of certificationsToValidate) {
    if (!validateCertification(cert, index)) {
      allValid = false
    }
  }
  
  // Validate all skill groups before saving
  const skillGroupsToValidate = skillGroups.value
    .map((group, index) => ({ group, index }))
    .filter(({ group, index }) => !group.originalName || editedSkillGroups.value.has(index))
  
  for (const { group, index } of skillGroupsToValidate) {
    if (!validateSkillGroup(group, index)) {
      allValid = false
    }
  }
  
  if (!allValid) {
    return // Stop if any validation fails
  }
  
  // Only save certifications that were edited or are new (no id)
  const certificationsToSave = certifications.value
    .map((cert, index) => ({ cert, index }))
    .filter(({ cert, index }) => !cert.id || editedCertifications.value.has(index))
    .map(({ cert }) => {
      const { isEditing, ...rest } = cert
      return rest
    })
  
  // Only save skill groups that were edited or are new (no originalName)
  const skillGroupsToSave = skillGroups.value
    .map((group, index) => ({ group, index }))
    .filter(({ group, index }) => !group.originalName || editedSkillGroups.value.has(index))
    .map(({ group }) => ({
      group: group.name === 'No Group' ? null : group.name,
      originalGroup: group.originalName === 'No Group' ? null : group.originalName,
      skills: group.skills
    }))
  
  // Only emit if there are actually changes to save
  if (certificationsToSave.length > 0 || skillGroupsToSave.length > 0) {
    emit('saveAll', {
      certifications: certificationsToSave,
      skillGroups: skillGroupsToSave
    })
    
    // Clear all edited flags and validation errors after saving
    editedCertifications.value.clear()
    editedSkillGroups.value.clear()
    certificationErrors.value = {}
    skillGroupErrors.value = {}
  }
  
  // Close all editing states
  certifications.value.forEach(cert => {
    cert.isEditing = false
  })
  skillGroups.value.forEach(group => {
    group.isEditing = false
  })
}

// Reset all changes back to original props values
function cancelAllEdits() {
  // Reset certifications to original props
  certifications.value = props.certifications.length > 0
    ? props.certifications.map(cert => ({
        id: cert.id,
        name: cert.name,
        issuer: cert.issuer,
        issueDate: formatDateForUI(cert.issueDate),
        url: cert.url,
        isEditing: false
      }))
    : [{
        name: '',
        issuer: '',
        issueDate: '',
        url: '',
        isEditing: true
      }]
  
  // Reset skill groups to original props
  skillGroups.value = transformSkillsToGroups(props.skillGroups)
  
  // Clear all edited flags and validation errors
  editedCertifications.value.clear()
  editedSkillGroups.value.clear()
  certificationErrors.value = {}
  skillGroupErrors.value = {}
}

// Revert all changes (alias for cancelAllEdits for API error handling)
function revertAllChanges() {
  cancelAllEdits()
}

// Expose save method for autosave functionality and revert for error handling
defineExpose({
  triggerSave: saveAll,
  revertChanges: revertAllChanges
})
</script>

<template>
  <div class="max-w-xl mx-auto space-y-4">
    <!-- Section Title and Description -->
    <div class="mb-8 space-y-2">
      <h1 class="text-2xl sm:text-3xl font-semibold text-foreground">Additional Information</h1>
      <p class="text-sm text-muted">
        Add your skills, certifications, and other professional achievements.
      </p>
    </div>

    <!-- TOP LEVEL COLLAPSIBLES -->
    <div class="flex flex-col gap-3">
      
      <!-- SKILLS SECTION -->
      <div class="border border-muted rounded-lg overflow-hidden">
        <div 
          class="cursor-pointer p-4 hover:bg-primary/5 transition-colors"
          @click="skillsSectionOpen = !skillsSectionOpen"
        >
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold text-foreground">Core Skills</h2>
              <p class="text-sm text-muted">Core professional skills</p>
            </div>
            <UIcon 
              :name="skillsSectionOpen ? 'i-lucide-chevron-up' : 'i-lucide-plus'" 
              class="w-5 h-5 text-primary"
            />
          </div>
        </div>

        <div v-show="skillsSectionOpen">
          <div class="p-4 bg-card flex flex-col gap-4">
        <UCollapsible 
          disabled
          v-for="(group, groupIndex) in skillGroups" 
          :key="groupIndex"
          v-model:open="group.isEditing"
          class="flex flex-col gap-2"
        >
          <!-- Collapsed View -->
          <UCard v-if="!group.isEditing">
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1">
                <h3 class="text-md font-semibold text-foreground">{{ group.name || 'Untitled Group' }}</h3>
                <div v-if="group.skills.length > 0" class="flex flex-wrap gap-2 mt-2">
                  <UBadge
                    v-for="(skill, skillIndex) in group.skills"
                    :key="skillIndex"
                    color="primary"
                    variant="subtle"
                    size="sm"
                  >
                    {{ skill.name }}
                  </UBadge>
                </div>
              </div>
              <div class="flex gap-2">
                <UButton 
                  class="cursor-pointer"
                  icon="i-lucide-pencil" 
                  color="neutral" 
                  variant="ghost" 
                  size="sm"
                  @click="editSkillGroup(groupIndex)"
                />
                <UButton 
                  v-if="group.isDeletable && group.name !== 'No Group'"
                  class="cursor-pointer"
                  :icon="skillGroupDeleteConfirm.has(groupIndex) ? 'i-lucide-check' : 'i-lucide-trash-2'"
                  :label="skillGroupDeleteConfirm.has(groupIndex) ? 'Sure?' : undefined"
                  color="error" 
                  :variant="skillGroupDeleteConfirm.has(groupIndex) ? 'solid' : 'ghost'"
                  size="sm"
                  @click="deleteSkillGroup(groupIndex)"
                />
              </div>
            </div>
          </UCard>

          <!-- Expanded Edit Form Header -->
          <UCard v-if="group.isEditing">
            <div class="flex items-center justify-between mb-4">
              <div class="flex-1">
                <h3 class="text-md font-semibold text-foreground">{{ group.name || 'No Group' }}</h3>
              </div>
              <div class="flex gap-2">
                <UButton 
                  class="cursor-pointer"
                  icon="i-lucide-pencil" 
                  color="success" 
                  variant="ghost" 
                  size="sm"
                  @click="group.isEditing = false"
                />
                <UButton 
                  v-if="group.isDeletable && group.name !== 'No Group'"
                  class="cursor-pointer"
                  :icon="skillGroupDeleteConfirm.has(groupIndex) ? 'i-lucide-check' : 'i-lucide-trash-2'"
                  :label="skillGroupDeleteConfirm.has(groupIndex) ? 'Sure?' : undefined"
                  color="error" 
                  :variant="skillGroupDeleteConfirm.has(groupIndex) ? 'solid' : 'ghost'"
                  size="sm"
                  @click="deleteSkillGroup(groupIndex)"
                />
              </div>
            </div>
          </UCard>

          <template #content>
            <UCard>
              <div class="space-y-4">
                <!-- Group Name -->
                <div>
                  <UFormField size="xl" label="Group Name" name="name">
                    <UInput 
                      class="w-full"
                      v-model="group.name" 
                      placeholder="e.g., Core Skills, Programming Languages"
                      :disabled="group.name === 'No Group' && !group.isDeletable"
                    />
                  </UFormField>
                  <p v-if="skillGroupErrors[groupIndex]?.name" class="text-sm text-error mt-1">{{ skillGroupErrors[groupIndex].name }}</p>
                </div>

                <!-- Skills List -->
                <div class="space-y-2">
                  <div>
                    <UFormField size="xl" label="Skills" name="skills">
                      <UInputTags 
                        class="w-full"
                        duplicate="true"
                        :model-value="group.skills.map((s: any) => s.name)"
                        @update:model-value="(values: string[]) => updateSkillsForGroup(groupIndex, values)"
                        placeholder="Press enter to add"
                        size="xl"
                      />
                    </UFormField>
                    <p v-if="skillGroupErrors[groupIndex]?.skills" class="text-sm text-error mt-1">{{ skillGroupErrors[groupIndex].skills }}</p>
                  </div>
                </div>

                <!-- Action Buttons -->
                <div class="flex gap-2 pt-4">
                  <UButton class="cursor-pointer" size="lg" @click="saveSkillGroup(groupIndex)">
                    Save
                  </UButton>
                  <UButton class="cursor-pointer" size="lg" color="neutral" variant="ghost" @click="cancelEditSkillGroup(groupIndex)">
                    Cancel
                  </UButton>
                </div>
              </div>
            </UCard>
          </template>
        </UCollapsible>

            <UButton class="cursor-pointer" icon="i-lucide-plus" color="primary" variant="ghost" size="lg" @click="addNewSkillGroup">
              Add Skill Group
            </UButton>
          </div>
        </div>
      </div>

      <!-- CERTIFICATIONS SECTION -->
      <div class="border border-muted rounded-lg overflow-hidden">
        <div 
          class="cursor-pointer p-4 hover:bg-primary/5 transition-colors"
          @click="certificationsSectionOpen = !certificationsSectionOpen"
        >
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold text-foreground">Certifications</h2>
              <p class="text-sm text-muted">Certifications earned</p>
            </div>
            <UIcon 
              :name="certificationsSectionOpen ? 'i-lucide-chevron-up' : 'i-lucide-plus'" 
              class="w-5 h-5 text-primary"
            />
          </div>
        </div>

        <div v-show="certificationsSectionOpen">
          <div class="p-4 bg-card flex flex-col gap-4">
        <UCollapsible 
          disabled
          v-for="(cert, certIndex) in certifications" 
          :key="certIndex"
          v-model:open="cert.isEditing"
          class="flex flex-col gap-2"
        >
          <!-- Collapsed View -->
          <UCard v-if="!cert.isEditing">
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1">
                <h3 class="text-md font-semibold text-foreground">{{ cert.name || 'Untitled Certification' }}</h3>
                <p class="text-sm text-muted">{{ cert.issuer || 'Unknown Issuer' }}</p>
                <p class="text-sm text-muted" v-if="cert.issueDate">{{ cert.issueDate }}</p>
              </div>
              <div class="flex gap-2">
                <UButton 
                  class="cursor-pointer"
                  icon="i-lucide-pencil" 
                  color="neutral" 
                  variant="ghost" 
                  size="sm"
                  @click="editCertification(certIndex)"
                />
                <UButton 
                  class="cursor-pointer"
                  :icon="certificationDeleteConfirm.has(certIndex) ? 'i-lucide-check' : 'i-lucide-trash-2'"
                  :label="certificationDeleteConfirm.has(certIndex) ? 'Sure?' : undefined"
                  color="error" 
                  :variant="certificationDeleteConfirm.has(certIndex) ? 'solid' : 'ghost'"
                  size="sm"
                  @click="deleteCertification(certIndex)"
                />
              </div>
            </div>
          </UCard>

          <!-- Expanded Edit Form Header -->
          <UCard v-if="cert.isEditing">
            <div class="flex items-center justify-between mb-4">
              <div class="flex-1">
                <h3 class="text-md font-semibold text-foreground">{{ cert.name || 'Untitled Certification' }}</h3>
                <p class="text-sm text-muted">{{ cert.issuer || 'Unknown Issuer' }}</p>
              </div>
              <div class="flex gap-2">
                <UButton 
                  class="cursor-pointer"
                  icon="i-lucide-pencil" 
                  color="success" 
                  variant="ghost" 
                  size="sm"
                  @click="cert.isEditing = false"
                />
                <UButton 
                  class="cursor-pointer"
                  :icon="certificationDeleteConfirm.has(certIndex) ? 'i-lucide-check' : 'i-lucide-trash-2'"
                  :label="certificationDeleteConfirm.has(certIndex) ? 'Sure?' : undefined"
                  color="error" 
                  :variant="certificationDeleteConfirm.has(certIndex) ? 'solid' : 'ghost'"
                  size="sm"
                  @click="deleteCertification(certIndex)"
                />
              </div>
            </div>
          </UCard>

          <template #content>
            <UCard>
              <div class="space-y-4">
                <!-- Certification Name and Issuer -->
                <div class="flex gap-2 w-full">
                  <div class="flex-1">
                    <UFormField class="w-full" size="xl" label="Certification" name="name">
                      <UInput 
                        class="w-full"
                        v-model="cert.name" 
                        placeholder="e.g., AWS Certified Solutions Architect"
                      />
                    </UFormField>
                    <p v-if="certificationErrors[certIndex]?.name" class="text-sm text-error mt-1">{{ certificationErrors[certIndex].name }}</p>
                  </div>

                  <div class="flex-1">
                    <UFormField class="w-full" size="xl" label="Issuer" name="issuer">
                      <UInput 
                        class="w-full"
                        v-model="cert.issuer" 
                        placeholder="e.g., Amazon Web Services"
                      />
                    </UFormField>
                    <p v-if="certificationErrors[certIndex]?.issuer" class="text-sm text-error mt-1">{{ certificationErrors[certIndex].issuer }}</p>
                  </div>
                </div>

                <!-- Issue Date and URL -->
                <div class="flex gap-2 w-full">
                  <div class="flex-1">
                    <UFormField class="w-full" size="xl" label="Issue Date" name="issueDate">
                      <UInput 
                        class="w-full"
                        v-model="cert.issueDate" 
                        placeholder="e.g., Jan 2023"
                      />
                    </UFormField>
                    <p v-if="certificationErrors[certIndex]?.issueDate" class="text-sm text-error mt-1">{{ certificationErrors[certIndex].issueDate }}</p>
                  </div>

                  <div class="flex-1">
                    <UFormField class="w-full" size="xl" label="URL (Optional)" name="url">
                      <UInput 
                        class="w-full"
                        v-model="cert.url" 
                        placeholder="e.g., https://..."
                      />
                    </UFormField>
                    <p v-if="certificationErrors[certIndex]?.url" class="text-sm text-error mt-1">{{ certificationErrors[certIndex].url }}</p>
                  </div>
                </div>

                <!-- Action Buttons -->
                <div class="flex gap-2">
                  <UButton class="cursor-pointer" size="lg" @click="saveCertification(certIndex)">
                    Save
                  </UButton>
                  <UButton class="cursor-pointer" size="lg" color="neutral" variant="ghost" @click="cancelEditCertification(certIndex)">
                    Cancel
                  </UButton>
                </div>
              </div>
            </UCard>
          </template>
        </UCollapsible>

            <UButton class="cursor-pointer" icon="i-lucide-plus" color="primary" variant="ghost" size="lg" @click="addNewCertification">
              Add Certification
            </UButton>
          </div>
        </div>
      </div>

    </div>

    <!-- Bulk Action Buttons -->
    <div class="flex gap-2 pt-6">
      <UButton class="cursor-pointer" size="xl" @click="saveAll">
        Save All Information
      </UButton>
      <UButton 
        class="cursor-pointer" 
        size="xl" 
        variant="outline" 
        color="neutral"
        @click="cancelAllEdits"
      >
        Cancel Edits
      </UButton>
    </div>
  </div>
</template>

