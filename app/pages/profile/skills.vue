<script setup lang="ts">
import type { ProfileSkill } from '#shared/types/careerId'
import { validateRequired } from '~/utils/validation'

const careerIDStore = useCareerIDStore()
const toast = useToast()

// Get current user
const user = ref({ id: 'mock-user-id' }) // TODO: Replace with real Supabase user

// Loading and saving states
const isLoading = computed(() => careerIDStore.isLoading)
const isSaving = computed(() => careerIDStore.isSaving)

// Proficiency level options
const proficiencyLevels = [
  'beginner',
  'intermediate',
  'advanced',
  'expert'
]

// Skill group interface
interface SkillItem {
  id?: number
  name: string
  proficiencyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  yearsExperience: string
}

interface SkillGroupFormData {
  category: string
  originalCategory?: string
  skills: SkillItem[]
  isOpen: boolean // If open, it's in edit mode
  isDeletable?: boolean
}

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
      proficiencyLevel: skill.proficiencyLevel,
      yearsExperience: skill.yearsExperience?.toString() || ''
    })
  })
  
  // Convert to SkillGroupFormData array
  const groups = Array.from(grouped.entries()).map(([category, skills]) => ({
    category,
    originalCategory: category,
    skills,
    isOpen: false,
    isDeletable: category !== 'No Group'
  }))
  
  // Ensure "No Group" is always present, even if empty
  if (!groups.some(g => g.category === 'No Group')) {
    groups.push({
      category: 'No Group',
      originalCategory: 'No Group',
      skills: [],
      isOpen: false,
      isDeletable: false
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
const skillGroups = ref<SkillGroupFormData[]>(
  transformSkillsToGroups(careerIDStore.profileSkills)
)

// Track which groups have been edited
const editedSkillGroups = ref<Set<number>>(new Set())
const isUpdatingFromProps = ref(false)

// Validation errors
const skillGroupErrors = ref<Record<number, { category?: string, skills?: string }>>({})

// No need for delete confirmation - all changes are local until Save

// No search needed - just simple text input

// Watch for changes
watch(skillGroups, () => {
  if (isUpdatingFromProps.value) return
  
  skillGroups.value.forEach((_, index) => {
    editedSkillGroups.value.add(index)
  })
}, { deep: true })

// Watch for external prop changes
watch(() => careerIDStore.profileSkills, (newValue) => {
  isUpdatingFromProps.value = true
  skillGroups.value = transformSkillsToGroups(newValue)
  editedSkillGroups.value.clear()
  isUpdatingFromProps.value = false
}, { deep: true })

// Removed search functionality - using simple text input

// Create blank skill group
function createBlankSkillGroup(): SkillGroupFormData {
  return {
    category: 'New Group',
    skills: [{
      name: 'New Skill',
      proficiencyLevel: 'intermediate',
      yearsExperience: '1'
    }],
    isOpen: true, // Open means edit mode
    isDeletable: true
  }
}

// Toggle group open/close
function toggleGroup(groupIndex: number) {
  const group = skillGroups.value[groupIndex]
  if (!group) return
  group.isOpen = !group.isOpen
}

// No longer needed - we edit all skills at once

// Start adding a new skill to group
function startAddingSkillToGroup(groupIndex: number) {
  const group = skillGroups.value[groupIndex]
  if (!group) return
  
  group.skills.push({
    name: 'New Skill',
    proficiencyLevel: 'intermediate',
    yearsExperience: '1'
  })
}

// Add new skill group
function addNewSkillGroup() {
  skillGroups.value.push(createBlankSkillGroup())
}

// Add skill to group
function addSkillToGroup(groupIndex: number) {
  const group = skillGroups.value[groupIndex]
  if (!group) return
  
  group.skills.push({
    name: 'New Skill',
    proficiencyLevel: 'intermediate',
    yearsExperience: '1'
  })
}

// Remove skill from group (local only, no API call)
function removeSkillFromGroup(groupIndex: number, skillIndex: number) {
  const group = skillGroups.value[groupIndex]
  if (!group) return
  
  group.skills.splice(skillIndex, 1)
}

// Validate skill group
function validateSkillGroup(group: SkillGroupFormData, index: number): boolean {
  if (skillGroupErrors.value[index]) {
    delete skillGroupErrors.value[index]
  }
  
  const errors: { category?: string, skills?: string } = {}
  let isValid = true
  
  // Validate group name (required if not "No Group")
  if (group.category !== 'No Group' && !group.category.trim()) {
    errors.category = 'Group name is required'
    isValid = false
  }
  
  // Validate that at least one skill has a name (only if group has skills)
  if (group.skills.length > 0) {
    const hasSkillWithName = group.skills.some(s => s.name.trim())
    if (!hasSkillWithName) {
      errors.skills = 'At least one skill name is required'
      isValid = false
    }
  }
  
  // Validate years for each skill that has a value
  for (const skill of group.skills) {
    if (skill.yearsExperience && skill.yearsExperience.trim()) {
      const years = parseInt(skill.yearsExperience)
      if (isNaN(years) || years < 0 || years > 100) {
        errors.skills = 'Years of experience must be between 0 and 100'
        isValid = false
        break
      }
    }
  }
  
  if (!isValid) {
    skillGroupErrors.value[index] = errors
  }
  
  return isValid
}

// Save skill group
async function saveSkillGroup(index: number) {
  const group = skillGroups.value[index]
  if (!group) return
  
  // Validate before saving
  if (!validateSkillGroup(group, index)) {
    toast.add({
      title: 'Validation Error',
      description: 'Please fix the errors in the form',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
    return
  }
  
  try {
    // Filter out skills without names
    const validSkills = group.skills.filter(s => s.name.trim())
    
    // Convert to API format
    const categoryValue = group.category === 'No Group' ? null : group.category
    const originalCategoryValue = group.originalCategory === 'No Group' ? null : group.originalCategory
    
    // Prepare skills for API
    const skillsToSave = validSkills.map((skill, idx) => ({
      id: skill.id,
      name: skill.name.trim(),
      group: categoryValue,
      proficiencyLevel: skill.proficiencyLevel,
      yearsExperience: skill.yearsExperience ? parseInt(skill.yearsExperience) : undefined,
      displayOrder: idx + 1
    }))
    
    // If this is a new group or category changed, add all skills
    if (!group.originalCategory || group.category !== group.originalCategory) {
      // Add new skills
      const newSkills = skillsToSave.filter(s => !s.id).map(s => {
        const { id, ...rest } = s
        return rest
      })
      if (newSkills.length > 0) {
        await careerIDStore.addSkills(newSkills)
      }
      
      // Update existing skills with new category
      const existingSkills = skillsToSave.filter(s => s.id).map(s => ({ ...s, id: s.id! }))
      if (existingSkills.length > 0) {
        await careerIDStore.updateSkills(existingSkills)
      }
      
      // Delete skills that were in the old category but not in the new list
      if (group.originalCategory && group.originalCategory !== group.category) {
        const originalSkills = careerIDStore.profileSkills.filter(
          s => (s.group || 'No Group') === group.originalCategory
        )
        const deletedSkillIds = originalSkills
          .filter(os => !skillsToSave.some(ns => ns.id === os.id))
          .map(s => s.id)
        
        if (deletedSkillIds.length > 0) {
          await careerIDStore.deleteSkills(deletedSkillIds)
        }
      }
    } else {
      // Category unchanged - update/add/delete as needed
      const existingSkillIds = new Set(skillsToSave.filter(s => s.id).map(s => s.id!))
      
      // Find skills to delete (were in original but not in current)
      const originalCategorySkills = careerIDStore.profileSkills.filter(
        s => (s.group || 'No Group') === group.originalCategory
      )
      const deletedSkillIds = originalCategorySkills
        .filter(s => !existingSkillIds.has(s.id))
        .map(s => s.id)
      
      // Delete removed skills
      if (deletedSkillIds.length > 0) {
        await careerIDStore.deleteSkills(deletedSkillIds)
      }
      
      // Add new skills
      const newSkills = skillsToSave.filter(s => !s.id).map(s => {
        const { id, ...rest } = s
        return rest
      })
      if (newSkills.length > 0) {
        await careerIDStore.addSkills(newSkills)
      }
      
      // Update existing skills
      const existingSkills = skillsToSave.filter(s => s.id).map(s => ({ ...s, id: s.id! }))
      if (existingSkills.length > 0) {
        await careerIDStore.updateSkills(existingSkills)
      }
    }
    
    toast.add({
      title: 'Success',
      description: 'Skills saved successfully',
      icon: 'i-lucide-check',
      color: 'success'
    })
    
    // Update the group after successful save
    group.originalCategory = group.category
    group.isOpen = true // Keep group open after save for adding more skills
    editedSkillGroups.value.delete(index)
    
    // Clear validation errors
    if (skillGroupErrors.value[index]) {
      delete skillGroupErrors.value[index]
    }
  } catch (err: any) {
    toast.add({
      title: 'Error',
      description: err?.message || 'Failed to save skills',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  }
}

// Open group for editing (clicking edit button)
function editGroup(index: number) {
  const group = skillGroups.value[index]
  if (!group) return
  group.isOpen = true
}

// Delete skill group (local only, no API call until Save)
async function deleteSkillGroup(index: number) {
  const group = skillGroups.value[index]
  if (!group || !group.isDeletable) return
  
  if (!confirm('Delete this skill group?')) return
  
  // Just remove from local array - will be saved when user clicks Save
  skillGroups.value.splice(index, 1)
}

// Cancel edit skill group
function cancelEditSkillGroup(index: number) {
  const group = skillGroups.value[index]
  if (!group) return
  
  // If new unsaved group, remove it
  if (!group.originalCategory || (!group.category && group.skills.length === 0)) {
    if (group.isDeletable) {
      skillGroups.value.splice(index, 1)
      editedSkillGroups.value.delete(index)
      return
    }
  }
  
  // Reset to original values from store
  const originalCategoryValue = group.originalCategory === 'No Group' ? null : group.originalCategory
  const originalSkills = careerIDStore.profileSkills
    .filter(skill => (skill.group || 'No Group') === group.originalCategory)
    .map(skill => ({
      id: skill.id,
      name: skill.name,
      proficiencyLevel: skill.proficiencyLevel,
      yearsExperience: skill.yearsExperience?.toString() || ''
    }))
  
  group.category = group.originalCategory || ''
  group.skills = originalSkills.length > 0 ? originalSkills : []
  group.isOpen = false // Close group on cancel
  editedSkillGroups.value.delete(index)
}

// Remove this function - deletion happens inline without confirmation

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

  <!-- Skills Content -->
  <div v-else class="space-y-4">
    <!-- Page Header -->
    <div class="mb-8 space-y-2">
      <h1 class="text-2xl sm:text-3xl font-semibold">Skills</h1>
      <p class="text-sm text-muted">
        Organize your professional skills by group with proficiency levels and years of experience.
      </p>
    </div>

    <!-- Skill Groups -->
    <div class="flex flex-col gap-4">
      <div
        v-for="(group, groupIndex) in skillGroups"
        :key="groupIndex"
        class="border border-default rounded-lg overflow-hidden"
      >
        <!-- Collapsed State - Show Badges -->
        <div v-if="!group.isOpen" class="p-4 cursor-pointer hover:bg-muted/5" @click="toggleGroup(groupIndex)">
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1">
              <h3 class="text-lg font-semibold mb-2">{{ group.category || 'Untitled Group' }}</h3>
              <div v-if="group.skills.length > 0" class="flex flex-wrap gap-2">
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
            <UIcon name="i-lucide-chevron-down" class="w-5 h-5 text-muted" />
          </div>
        </div>

        <!-- Expanded State - Show Clean List or Edit Mode -->
        <div v-else class="p-4">
          <!-- Header -->
          <div class="flex items-start justify-between gap-4 mb-4">
            <div class="flex-1 cursor-pointer" @click="toggleGroup(groupIndex)">
              <div class="flex items-center gap-2">
                <h3 class="text-lg font-semibold">{{ group.category || 'Untitled Group' }}</h3>
                <UIcon name="i-lucide-chevron-up" class="w-5 h-5 text-muted" />
              </div>
            </div>
            <div class="flex gap-2">
              <UButton
                icon="i-lucide-pencil"
                color="neutral"
                variant="ghost"
                size="sm"
                class="cursor-pointer"
                @click="editGroup(groupIndex)"
              />
              <UButton
                v-if="group.isDeletable && group.category !== 'No Group'"
                icon="i-lucide-trash-2"
                color="error"
                variant="ghost"
                size="sm"
                class="cursor-pointer"
                @click="deleteSkillGroup(groupIndex)"
              />
            </div>
          </div>

          <!-- Group Name Input (always shown when open) -->
          <div class="mb-4">
            <USeparator class="mb-4" />
            <div>
              <label class="block text-sm font-medium mb-1">Group Name <span class="text-error">*</span></label>
              <UInput
                v-model="group.category"
                placeholder="e.g., Programming Languages, Frameworks, Tools"
                class="w-full"
                :disabled="group.category === 'No Group' && !group.isDeletable"
                :error="!!skillGroupErrors[groupIndex]?.category"
              />
              <p v-if="skillGroupErrors[groupIndex]?.category" class="text-sm text-error mt-1">
                {{ skillGroupErrors[groupIndex].category }}
              </p>
            </div>
            <USeparator class="mt-4" />
          </div>

          <!-- Skills List -->
          <div class="space-y-2">
            <p v-if="group.skills.length === 0" class="text-sm text-muted py-4">
              No skills added yet. Click "Add Skill" to get started.
            </p>
            <div
              v-for="(skill, skillIndex) in group.skills"
              :key="skillIndex"
              class="border border-default rounded-lg p-3"
            >
              <!-- Always show edit inputs when group is open -->
              <div class="space-y-3">
                <div class="flex gap-3 items-start">
                  <!-- Skill Name -->
                  <div class="flex-1 max-w-sm">
                    <label class="block text-xs font-medium mb-1 text-muted">Skill Name</label>
                    <UInput
                      v-model="skill.name"
                      placeholder="e.g., JavaScript, React, Python"
                      class="w-full"
                    />
                  </div>

                    <!-- Proficiency Level -->
                    <div class="w-40">
                      <label class="block text-xs font-medium mb-1 text-muted">Proficiency Level</label>
                      <USelectMenu
                        v-model="skill.proficiencyLevel"
                        :items="proficiencyLevels"
                        placeholder="Select level"
                        class="w-full capitalize"
                      />
                    </div>

                  <!-- Years of Experience -->
                  <div class="w-24">
                    <label class="block text-xs font-medium mb-1 text-muted">Years</label>
                    <UInput
                      v-model="skill.yearsExperience"
                      type="number"
                      placeholder="0"
                      class="w-full"
                      min="0"
                      max="100"
                    />
                  </div>
                  
                  <!-- Remove Button -->
                  <div class="pt-5">
                    <UButton
                      icon="i-lucide-trash-2"
                      color="error"
                      variant="ghost"
                      size="sm"
                      class="cursor-pointer"
                      @click="removeSkillFromGroup(groupIndex, skillIndex)"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Add Skill Button -->
            <UButton
              label="Add Skill"
              icon="i-lucide-plus"
              color="neutral"
              variant="outline"
              size="sm"
              class="cursor-pointer w-full"
              @click="startAddingSkillToGroup(groupIndex)"
            />

            <p v-if="skillGroupErrors[groupIndex]?.skills" class="text-sm text-error mt-2">
              {{ skillGroupErrors[groupIndex].skills }}
            </p>
          </div>

          <!-- Save/Cancel Buttons at Bottom (always shown when group is open) -->
          <div class="flex gap-2 pt-4 border-t border-default mt-4">
            <UButton
              label="Save Changes"
              icon="i-lucide-check"
              color="primary"
              class="cursor-pointer"
              :loading="isSaving"
              @click="saveSkillGroup(groupIndex)"
            />
            <UButton
              label="Cancel"
              color="neutral"
              variant="ghost"
              class="cursor-pointer"
              @click="cancelEditSkillGroup(groupIndex)"
              :disabled="isSaving"
            />
          </div>
        </div>
      </div>

      <!-- Add Group Button -->
      <UButton
        label="Add Skill Group"
        icon="i-lucide-plus"
        color="primary"
        variant="ghost"
        class="cursor-pointer"
        @click="addNewSkillGroup"
      />
    </div>

    <!-- Empty State -->
    <UPageCard v-if="skillGroups.length === 0" variant="subtle">
      <div class="text-center py-12">
        <UIcon name="i-lucide-lightbulb" class="w-16 h-16 text-muted mx-auto mb-4" />
        <h3 class="text-lg font-semibold mb-2">No Skills Added</h3>
        <p class="text-muted mb-6">Add your professional skills organized by group.</p>
        <UButton
          label="Add Your First Group"
          color="primary"
          icon="i-lucide-plus"
          class="cursor-pointer"
          @click="addNewSkillGroup"
        />
      </div>
    </UPageCard>
  </div>
</template>
