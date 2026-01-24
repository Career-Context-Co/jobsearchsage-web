<script setup lang="ts">
import type { ProfileSkill } from '#shared/types/careerId'
import { validateRequired } from '~/utils/validation'

const careerIDStore = useCareerIDStore()
const toast = useToast()

// Skill group interface (simplified for onboarding - just names, no proficiency/years)
interface SkillItem {
  id?: number
  name: string
  isExtracted?: boolean
}

interface SkillGroupFormData {
  category: string
  originalCategory?: string // Track original for updates
  skills: SkillItem[]
  isEditing: boolean
  isDeletable: boolean
  hasExtractedSkills?: boolean // Flag if any skills in group are extracted
}

// Props - receive ProfileSkill array from parent (store via onboarding)
const props = defineProps<{
  skillGroups: ProfileSkill[]
}>()

// Transform raw ProfileSkill[] into grouped format for display
function transformSkillsToGroups(skills: ProfileSkill[]): SkillGroupFormData[] {
  // Group skills by their group/category field
  const grouped = new Map<string, SkillItem[]>()
  
  skills.forEach(skill => {
    const categoryKey = skill.group || 'No Group'
    if (!grouped.has(categoryKey)) {
      grouped.set(categoryKey, [])
    }
    grouped.get(categoryKey)!.push({
      id: skill.id,
      name: skill.name,
      isExtracted: skill.isExtracted
    })
  })
  
  // Convert to SkillGroupFormData array
  const groups = Array.from(grouped.entries()).map(([category, skills]) => ({
    category,
    originalCategory: category,
    skills,
    isEditing: false,
    isDeletable: category !== 'No Group',
    hasExtractedSkills: skills.some(s => s.isExtracted)
  }))
  
  // Ensure "No Group" is always present, even if empty
  if (!groups.some(g => g.category === 'No Group')) {
    groups.push({
      category: 'No Group',
      originalCategory: 'No Group',
      skills: [],
      isEditing: false,
      isDeletable: false,
      hasExtractedSkills: false
    })
  }
  
  // Sort so "No Group" is always first, then others alphabetically
  groups.sort((a, b) => {
    if (a.category === 'No Group') return -1
    if (b.category === 'No Group') return 1
    return a.category.localeCompare(b.category)
  })
  
  return groups
}

// Local reactive state
const skillGroups = ref<SkillGroupFormData[]>(transformSkillsToGroups(props.skillGroups))

// Track which group is being edited (INDEX-based for extracted groups without IDs)
const editingGroupIndex = ref<number | null>(null)
const isAddingGroup = ref(false)
const isSavingGroup = ref(false)

// New skill input for current group
const newSkillInput = ref('')

// Form errors
const groupErrors = ref<Record<string, string>>({})

// Watch for external prop changes
watch(() => props.skillGroups, (newValue) => {
  skillGroups.value = transformSkillsToGroups(newValue)
}, { deep: true })

// Start adding a new group
function startAddingGroup() {
  skillGroups.value.push({
    category: '',
    skills: [],
    isEditing: true,
    isDeletable: true,
    hasExtractedSkills: false
  })
  editingGroupIndex.value = skillGroups.value.length - 1
  isAddingGroup.value = true
  newSkillInput.value = ''
}

// Start editing an existing group (by INDEX)
function startEditingGroup(groupIndex: number) {
  editingGroupIndex.value = groupIndex
  newSkillInput.value = ''
  groupErrors.value = {}
}

// Cancel editing
function cancelEdit() {
  if (isAddingGroup.value) {
    // Remove the new group that was being added
    skillGroups.value.pop()
    isAddingGroup.value = false
  }
  editingGroupIndex.value = null
  newSkillInput.value = ''
  groupErrors.value = {}
}

// Add skill to current group being edited
function addSkillToGroup() {
  if (!newSkillInput.value.trim()) return
  
  const groupIndex = editingGroupIndex.value
  if (groupIndex === null) return
  
  const group = skillGroups.value[groupIndex]
  if (!group) return
  
  const skillNameLower = newSkillInput.value.trim().toLowerCase()
  
  // Check for duplicate within current group
  const isDuplicateInGroup = group.skills.some(s => 
    s.name.toLowerCase() === skillNameLower
  )
  
  if (isDuplicateInGroup) {
    toast.add({
      title: 'Duplicate Skill',
      description: 'This skill already exists in this group',
      icon: 'i-lucide-alert-circle',
      color: 'warning'
    })
    return
  }
  
  // Check for duplicate across ALL other groups
  const isDuplicateInOtherGroups = skillGroups.value.some((g, idx) => 
    idx !== groupIndex && g.skills.some(s => s.name.toLowerCase() === skillNameLower)
  )
  
  if (isDuplicateInOtherGroups) {
    toast.add({
      title: 'Duplicate Skill',
      description: 'This skill already exists in another group. Each skill can only appear once across all groups.',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
    return
  }
  
  // Add skill to group
  group.skills.push({
    name: newSkillInput.value.trim()
  })
  
  newSkillInput.value = ''
}

// Remove skill from group being edited
function removeSkillFromGroup(groupIndex: number, skillIndex: number) {
  const group = skillGroups.value[groupIndex]
  if (!group) return
  
  group.skills.splice(skillIndex, 1)
}

// Validate group
function validateGroup(group: SkillGroupFormData): boolean {
  const errors: Record<string, string> = {}
  
  // Category required (except "No Group")
  if (group.category !== 'No Group') {
    const categoryError = validateRequired(group.category, 'Category Name')
    if (categoryError) errors.category = categoryError
  }
  
  // At least one skill required
  if (group.skills.length === 0) {
    errors.skills = 'Add at least one skill to this group'
  }
  
  groupErrors.value = errors
  return Object.keys(errors).length === 0
}

// Save group
async function saveGroup(): Promise<boolean> {
  const groupIndex = editingGroupIndex.value
  if (groupIndex === null) return false
  
  const group = skillGroups.value[groupIndex]
  if (!group) return false
  
  if (!validateGroup(group)) {
    toast.add({
      title: 'Validation Error',
      description: 'Please fix the errors in the form',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
    return false // Return false to indicate validation failure
  }
  
  // Check for duplicate skills across ALL groups
  const allExistingSkills = skillGroups.value
    .filter((g, idx) => idx !== groupIndex) // Exclude current group
    .flatMap(g => g.skills.map(s => s.name.toLowerCase()))
  
  const duplicateSkills = group.skills.filter(skill => 
    allExistingSkills.includes(skill.name.toLowerCase())
  )
  
  if (duplicateSkills.length > 0) {
    toast.add({
      title: 'Duplicate Skills',
      description: `The following skills already exist in other groups: ${duplicateSkills.map(s => s.name).join(', ')}. Please remove them or choose different skills.`,
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
    return false // Validation error
  }
  
  isSavingGroup.value = true
  
  try {
    const categoryName = group.category === 'No Group' ? null : group.category
    
    // Separate skills into: to add, to update, to delete
    const skillsToAdd: any[] = []
    const skillsToUpdate: any[] = []
    
    // Find original skills in this group for comparison
    const originalGroup = props.skillGroups.filter(s => 
      (s.group || 'No Group') === group.originalCategory
    )
    
    // Determine which skills to add or update
    group.skills.forEach(skill => {
      if (skill.id) {
        // Existing skill - update it (even if just to ensure it's in correct group)
        skillsToUpdate.push({
          id: skill.id,
          name: skill.name,
          group: categoryName
        })
      } else {
        // New skill - add it
        skillsToAdd.push({
          name: skill.name,
          group: categoryName,
          proficiencyLevel: 'intermediate', // Default for onboarding
          yearsExperience: 1 // Default for onboarding
        })
      }
    })
    
    // Find skills that were removed
    const skillsToDelete = originalGroup
      .filter(originalSkill => 
        !group.skills.some(s => s.id === originalSkill.id)
      )
      .map(s => s.id)
      .filter((id): id is number => id !== undefined)
    
    // Execute API calls
    if (skillsToAdd.length > 0) {
      await careerIDStore.addSkills(skillsToAdd)
    }
    
    if (skillsToUpdate.length > 0) {
      await careerIDStore.updateSkills(skillsToUpdate)
    }
    
    if (skillsToDelete.length > 0) {
      await careerIDStore.deleteSkills(skillsToDelete)
    }
    
    // Remove extracted skills from this group after successful save
    const extractedSkills = group.skills.filter(s => !s.id && s.isExtracted)
    if (extractedSkills.length > 0) {
      careerIDStore.profileSkills = careerIDStore.profileSkills.filter(skill => {
        const matchesGroup = (skill.group || 'No Group') === group.originalCategory
        const isExtractedInGroup = extractedSkills.some(es => 
          es.name.toLowerCase() === skill.name.toLowerCase() && skill.isExtracted
        )
        return !(matchesGroup && isExtractedInGroup)
      })
    }
    
    toast.add({
      title: 'Success',
      description: 'Skills saved successfully',
      icon: 'i-lucide-check',
      color: 'success'
    })
    
    editingGroupIndex.value = null
    isAddingGroup.value = false
    return true // Success
  } catch (err: any) {
    toast.add({
      title: 'Error',
      description: err?.message || 'Failed to save skills',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
    return false // API error
  } finally {
    isSavingGroup.value = false
  }
}

// Delete entire skill group
async function deleteGroup(groupIndex: number) {
  const group = skillGroups.value[groupIndex]
  if (!group) return
  
  if (!confirm(`Are you sure you want to delete the "${group.category}" group and all its skills?`)) {
    return
  }
  
  try {
    // Find all skills in this group that have IDs (saved in DB)
    const skillsToDelete = group.skills
      .map(s => s.id)
      .filter((id): id is number => id !== undefined)
    
    if (skillsToDelete.length > 0) {
      await careerIDStore.deleteSkills(skillsToDelete)
    }
    
    // Remove extracted skills without IDs from store
    const extractedSkills = group.skills.filter(s => !s.id && s.isExtracted)
    if (extractedSkills.length > 0) {
      careerIDStore.profileSkills = careerIDStore.profileSkills.filter(skill => {
        const matchesGroup = (skill.group || 'No Group') === group.category
        const isExtractedInGroup = extractedSkills.some(es => 
          es.name.toLowerCase() === skill.name.toLowerCase() && skill.isExtracted
        )
        return !(matchesGroup && isExtractedInGroup)
      })
    }
    
    toast.add({
      title: 'Success',
      description: 'Skill group deleted successfully',
      icon: 'i-lucide-check',
      color: 'success'
    })
  } catch (err: any) {
    toast.add({
      title: 'Error',
      description: err?.message || 'Failed to delete skill group',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  }
}

// Exposed methods for compatibility with onboarding.vue
async function triggerSave() {
  // Auto-save if in edit mode
  if (editingGroupIndex.value !== null) {
    await saveGroup()
  }
}

// Save all unsaved items (skill groups with skills without IDs)
async function saveAllUnsaved(): Promise<boolean> {
  // Find groups that have skills without IDs
  const groupsWithUnsavedSkills = skillGroups.value.filter(group => 
    group.skills.some(skill => !skill.id)
  )
  
  if (groupsWithUnsavedSkills.length === 0) {
    return true // Nothing to save
  }
  
  for (const group of groupsWithUnsavedSkills) {
    // Start editing this group to trigger validation
    const index = skillGroups.value.indexOf(group)
    startEditingGroup(index)
    
    // Try to save it
    const success = await saveGroup()
    
    if (!success) {
      // Validation or save failed - keep the form open with errors visible
      return false
    }
  }
  
  return true // All saved successfully
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
      title="Skills"
      description="Add your professional skills by category. You can add proficiency levels later in your profile."
      variant="naked"
      orientation="horizontal"
      class="mb-4"
    >
      <UButton
        v-if="editingGroupIndex === null"
        label="Add Skill Group"
        color="primary"
        variant="outline"
        icon="i-lucide-plus"
        class="cursor-pointer w-fit lg:ms-auto"
        @click="startAddingGroup"
      />
    </UPageCard>

    <!-- Skill Groups List -->
    <div v-if="skillGroups.length > 0" class="space-y-4">
      <div
        v-for="(group, groupIndex) in skillGroups"
        :key="groupIndex"
        class="border border-default rounded-lg"
        :class="{ 'ring-1 ring-cyan-400': group.hasExtractedSkills }"
      >
        <!-- View Mode -->
        <UPageCard v-if="editingGroupIndex !== groupIndex" variant="subtle">
          <div class="flex justify-between items-start gap-4">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <h3 class="text-lg font-semibold">{{ group.category }}</h3>
                <UBadge
                  v-if="group.hasExtractedSkills"
                  color="neutral"
                  class="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300"
                >
                  <div class="flex items-center gap-1">
                    <UIcon name="i-lucide-sparkles" class="w-3 h-3" />
                    <span>Extracted</span>
                  </div>
                </UBadge>
              </div>
              
              <!-- Skills as badges -->
              <div v-if="group.skills.length > 0" class="flex flex-wrap gap-2">
                <UBadge
                  v-for="(skill, skillIndex) in group.skills"
                  :key="skillIndex"
                  color="primary"
                  variant="subtle"
                  size="lg"
                  :class="{ 'ring-1 ring-cyan-400': skill.isExtracted,
                    'bg-cyan-500/10 dark:bg-cyan-900/30 text-cyan-500 dark:text-cyan-300': skill.isExtracted
                   }"
                >
                  {{ skill.name }}
                </UBadge>
              </div>
              <p v-else class="text-sm text-muted">No skills in this group</p>
            </div>
            
            <div class="flex gap-2">
              <UButton
                icon="i-lucide-pencil"
                color="neutral"
                variant="ghost"
                size="sm"
                class="cursor-pointer"
                @click="startEditingGroup(groupIndex)"
              />
              <UButton
                v-if="group.isDeletable"
                icon="i-lucide-trash-2"
                color="error"
                variant="ghost"
                size="sm"
                class="cursor-pointer"
                @click="deleteGroup(groupIndex)"
              />
            </div>
          </div>
        </UPageCard>

        <!-- Edit Mode -->
        <UPageCard v-else variant="subtle">
          <div class="space-y-4">
            <h3 class="text-lg font-semibold">{{ isAddingGroup ? 'Add' : 'Edit' }} Skill Group</h3>
            
            <!-- Category Name -->
            <div v-if="group.category !== 'No Group'">
              <label class="block text-sm font-medium mb-1">Group Name <span class="text-error">*</span></label>
              <UInput
                v-model="group.category"
                placeholder="e.g. Programming Languages, Design Tools"
                class="w-full"
                :error="!!groupErrors.category"
              />
              <p v-if="groupErrors.category" class="text-sm text-error mt-1">{{ groupErrors.category }}</p>
            </div>

            <!-- Skills List -->
            <div>
              <label class="block text-sm font-medium mb-1">
                Skills <span class="text-error">*</span>
                <span class="text-muted text-xs ml-2">(Type and press Enter to add)</span>
              </label>
              
              <!-- Skill input -->
              <div class="flex gap-2 mb-3">
                <UInput
                  v-model="newSkillInput"
                  placeholder="Type skill name..."
                  class="flex-1"
                  @keyup.enter="addSkillToGroup"
                />
                <UButton
                  label="Add"
                  icon="i-lucide-plus"
                  color="primary"
                  variant="outline"
                  class="cursor-pointer"
                  @click="addSkillToGroup"
                  :disabled="!newSkillInput.trim()"
                />
              </div>
              
              <!-- Skills as removable badges -->
              <div v-if="group.skills.length > 0" class="flex flex-wrap gap-2">
                <UBadge
                  v-for="(skill, skillIndex) in group.skills"
                  :key="skillIndex"
                  color="primary"
                  variant="subtle"
                  size="lg"
                  class="flex items-center gap-1"
                  :class="{ 'ring-1 ring-cyan-300': skill.isExtracted,
                    'bg-cyan-500/10 dark:bg-cyan-900/30 text-cyan-500 dark:text-cyan-300': skill.isExtracted
                   }"
                >
                  <span>{{ skill.name }}</span>
                  <UButton
                    icon="i-lucide-x"
                    color="neutral"
                    variant="ghost"
                    size="2xs"
                    class="cursor-pointer -mr-1"
                    @click="removeSkillFromGroup(groupIndex, skillIndex)"
                  />
                </UBadge>
              </div>
              <p v-else class="text-sm text-muted">No skills added yet. Type a skill name above and press Enter.</p>
              
              <p v-if="groupErrors.skills" class="text-sm text-error mt-1">{{ groupErrors.skills }}</p>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-2 justify-end pt-4">
              <UButton
                label="Cancel"
                color="neutral"
                variant="ghost"
                class="cursor-pointer"
                @click="cancelEdit"
                :disabled="isSavingGroup"
              />
              <UButton
                label="Save Group"
                color="primary"
                icon="i-lucide-check"
                class="cursor-pointer"
                :loading="isSavingGroup"
                @click="saveGroup"
              />
            </div>
          </div>
        </UPageCard>
      </div>
    </div>

    <!-- Empty State -->
    <UPageCard v-if="skillGroups.length === 0" variant="subtle">
      <div class="text-center py-12">
        <UIcon name="i-lucide-lightbulb" class="w-16 h-16 text-muted mx-auto mb-4" />
        <h3 class="text-lg font-semibold mb-2">No Skills Added</h3>
        <p class="text-muted mb-6">Group your skills for better organization.</p>
        <UButton
          label="Add Your First Skill Group"
          color="primary"
          icon="i-lucide-plus"
          class="cursor-pointer"
          @click="startAddingGroup"
        />
      </div>
    </UPageCard>
  </div>
</template>
