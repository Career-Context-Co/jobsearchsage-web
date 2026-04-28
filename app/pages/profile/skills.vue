<script setup lang="ts">
import type { ProfileSkill } from '#shared/types/careerId'
import { validateRequired } from '~/utils/validation'

const careerIDStore = useCareerIDStore()
const accountStore = useAccountStore()
const toast = useToast()

const isLoading = computed(() => careerIDStore.isLoading)
const isSaving = computed(() => careerIDStore.isSaving)

const proficiencyLevels = [
  'beginner',
  'intermediate',
  'advanced',
  'expert'
]

interface SkillItem {
  name: string
  proficiencyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  yearsExperience: string
}

interface SkillGroupFormData {
  category: string
  originalCategory?: string
  skills: SkillItem[]
  isOpen: boolean
  isDeletable?: boolean
}

function transformSkillsToGroups(skills: ProfileSkill[]): SkillGroupFormData[] {
  const grouped = new Map<string, SkillItem[]>()

  skills.forEach(skill => {
    const categoryKey = skill.group || 'No Group'
    if (!grouped.has(categoryKey)) grouped.set(categoryKey, [])
    grouped.get(categoryKey)!.push({
      name: skill.name,
      proficiencyLevel: skill.proficiencyLevel,
      yearsExperience: skill.yearsExperience?.toString() || ''
    })
  })

  const groups = Array.from(grouped.entries()).map(([category, skills]) => ({
    category,
    originalCategory: category,
    skills,
    isOpen: false,
    isDeletable: category !== 'No Group'
  }))

  if (!groups.some(g => g.category === 'No Group')) {
    groups.push({ category: 'No Group', originalCategory: 'No Group', skills: [], isOpen: false, isDeletable: false })
  }

  groups.sort((a, b) => {
    if (a.category === 'No Group') return -1
    if (b.category === 'No Group') return 1
    return a.category.localeCompare(b.category)
  })

  return groups
}

const skillGroups = ref<SkillGroupFormData[]>(transformSkillsToGroups(careerIDStore.profileSkills))
const editedSkillGroups = ref<Set<number>>(new Set())
const isUpdatingFromProps = ref(false)
const skillGroupErrors = ref<Record<number, { category?: string, skills?: string }>>({})

// Per-group new skill text input
const newSkillInputs = ref<Record<number, string>>({})

// Inline rename state
const renamingSkill = ref<{ groupIndex: number; skillIndex: number } | null>(null)
const renameInput = ref('')

function startRename(groupIndex: number, skillIndex: number, currentName: string) {
  renamingSkill.value = { groupIndex, skillIndex }
  renameInput.value = currentName
}

function commitRename() {
  if (!renamingSkill.value) return
  const { groupIndex, skillIndex } = renamingSkill.value
  const trimmed = renameInput.value.trim()
  if (trimmed) skillGroups.value[groupIndex].skills[skillIndex].name = trimmed
  renamingSkill.value = null
  renameInput.value = ''
}

function cancelRename() {
  renamingSkill.value = null
  renameInput.value = ''
}

watch(skillGroups, () => {
  if (isUpdatingFromProps.value) return
  skillGroups.value.forEach((_, index) => editedSkillGroups.value.add(index))
}, { deep: true })

watch(() => careerIDStore.profileSkills, (newValue) => {
  isUpdatingFromProps.value = true
  skillGroups.value = transformSkillsToGroups(newValue)
  editedSkillGroups.value.clear()
  isUpdatingFromProps.value = false
}, { deep: true })

function toggleGroup(groupIndex: number) {
  const group = skillGroups.value[groupIndex]
  if (group) group.isOpen = !group.isOpen
}

function addSkillFromInput(groupIndex: number) {
  const input = (newSkillInputs.value[groupIndex] || '').trim()
  if (!input) return
  const group = skillGroups.value[groupIndex]
  if (!group) return
  group.skills.push({ name: input, proficiencyLevel: 'intermediate', yearsExperience: '' })
  newSkillInputs.value[groupIndex] = ''
}

function removeSkillFromGroup(groupIndex: number, skillIndex: number) {
  const group = skillGroups.value[groupIndex]
  if (group) group.skills.splice(skillIndex, 1)
}

function moveSkillToGroup(fromGroupIndex: number, skillIndex: number, toGroupName: string) {
  const fromGroup = skillGroups.value[fromGroupIndex]
  if (!fromGroup) return
  const skill = fromGroup.skills[skillIndex]
  if (!skill) return
  const toGroupIndex = skillGroups.value.findIndex(g => g.category === toGroupName)
  if (toGroupIndex === -1 || toGroupIndex === fromGroupIndex) return
  skillGroups.value[toGroupIndex].skills.push({ ...skill })
  fromGroup.skills.splice(skillIndex, 1)
}

function otherGroupNames(groupIndex: number): string[] {
  return skillGroups.value
    .filter((_, i) => i !== groupIndex)
    .map(g => g.category || 'No Group')
}

function moveGroupUp(groupIndex: number) {
  if (groupIndex <= 0) return
  const groups = skillGroups.value
  const temp = groups[groupIndex - 1]
  groups[groupIndex - 1] = groups[groupIndex]
  groups[groupIndex] = temp
}

function moveGroupDown(groupIndex: number) {
  const groups = skillGroups.value
  if (groupIndex >= groups.length - 1) return
  const temp = groups[groupIndex]
  groups[groupIndex] = groups[groupIndex + 1]
  groups[groupIndex + 1] = temp
}

function addNewSkillGroup() {
  skillGroups.value.push({
    category: 'New Group',
    skills: [],
    isOpen: true,
    isDeletable: true
  })
}

function validateSkillGroup(group: SkillGroupFormData, index: number): boolean {
  if (skillGroupErrors.value[index]) delete skillGroupErrors.value[index]
  const errors: { category?: string, skills?: string } = {}
  let isValid = true

  if (group.category !== 'No Group' && !group.category.trim()) {
    errors.category = 'Group name is required'
    isValid = false
  }

  if (group.skills.length > 0) {
    const hasSkillWithName = group.skills.some(s => s.name.trim())
    if (!hasSkillWithName) {
      errors.skills = 'At least one skill name is required'
      isValid = false
    }
  }

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

  if (!isValid) skillGroupErrors.value[index] = errors
  return isValid
}

// Build the full skills payload and persist to the API
async function persistAllSkills(): Promise<void> {
  let displayCounter = 0
  const allSkills = skillGroups.value.flatMap((g) => {
    const categoryValue = g.category === 'No Group' ? null : g.category
    return g.skills
      .filter(s => s.name.trim())
      .map((skill) => {
        const stored = careerIDStore.profileSkills.find(
          s => s.name.toLowerCase() === skill.name.toLowerCase().trim() &&
               (s.group || null) === categoryValue
        )
        return {
          skillId: stored?.skillId ?? null,
          name: skill.name.trim(),
          group: categoryValue,
          proficiencyLevel: skill.proficiencyLevel,
          yearsExperience: skill.yearsExperience ? parseFloat(skill.yearsExperience) : null,
          displayOrder: ++displayCounter
        }
      })
  })
  await careerIDStore.saveSkills(allSkills)
}

async function saveSkillGroup(index: number) {
  const group = skillGroups.value[index]
  if (!group) return

  if (!validateSkillGroup(group, index)) {
    toast.add({ title: 'Validation Error', description: 'Please fix the errors in the form', icon: 'i-lucide-alert-circle', color: 'error' })
    return
  }

  try {
    await persistAllSkills()
    toast.add({ title: 'Success', description: 'Skills saved successfully', icon: 'i-lucide-check', color: 'success' })
    group.originalCategory = group.category
    group.isOpen = true
    editedSkillGroups.value.delete(index)
    if (skillGroupErrors.value[index]) delete skillGroupErrors.value[index]
  } catch (err: any) {
    toast.add({ title: 'Error', description: err?.message || 'Failed to save skills', icon: 'i-lucide-alert-circle', color: 'error' })
  }
}

function cancelEditSkillGroup(index: number) {
  const group = skillGroups.value[index]
  if (!group) return

  if (!group.originalCategory || (!group.category && group.skills.length === 0)) {
    if (group.isDeletable) {
      skillGroups.value.splice(index, 1)
      editedSkillGroups.value.delete(index)
      return
    }
  }

  const originalSkills = careerIDStore.profileSkills
    .filter(skill => (skill.group || 'No Group') === group.originalCategory)
    .map(skill => ({
      name: skill.name,
      proficiencyLevel: skill.proficiencyLevel,
      yearsExperience: skill.yearsExperience?.toString() || ''
    }))

  group.category = group.originalCategory || ''
  group.skills = originalSkills.length > 0 ? originalSkills : []
  group.isOpen = false
  editedSkillGroups.value.delete(index)
}

async function deleteSkillGroup(index: number) {
  const group = skillGroups.value[index]
  if (!group || !group.isDeletable) return
  if (!confirm('Delete this skill group?')) return

  skillGroups.value.splice(index, 1)

  try {
    await persistAllSkills()
    toast.add({ title: 'Success', description: 'Skill group deleted', icon: 'i-lucide-check', color: 'success' })
  } catch (err: any) {
    toast.add({ title: 'Error', description: err?.message || 'Failed to delete skill group', icon: 'i-lucide-alert-circle', color: 'error' })
  }
}

const showEmptyState = ref(false)

onMounted(async () => {
  const profileId = careerIDStore.profileId || accountStore.profileId
  if (!profileId) { showEmptyState.value = true; return }

  try {
    if (!careerIDStore.isProfileLoaded) await careerIDStore.fetchProfile(profileId)
    if (!careerIDStore.profile) showEmptyState.value = true
  } catch (err: any) {
    const is404 = err?.status === 404 || err?.statusCode === 404 ||
      err?.message?.includes('not found') || err?.message?.includes('No profile')
    if (is404) {
      showEmptyState.value = true
      careerIDStore.error = null
    } else {
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
  </div>

  <!-- Empty State - No Profile Found -->
  <div v-else-if="showEmptyState">
    <UPageCard title="No Profile Yet" variant="subtle">
      <div class="flex flex-col items-center justify-center py-12 gap-6 max-w-md mx-auto text-center">
        <UIcon name="i-lucide-lightbulb" class="w-20 h-20 text-primary" />
        <div class="space-y-2">
          <h3 class="text-xl font-semibold">Create Your Profile First</h3>
          <p class="text-muted text-base">
            You need to complete your profile onboarding before you can manage your skills.
          </p>
        </div>
        <UButton label="Start Onboarding" icon="i-lucide-rocket" size="lg" color="primary" @click="$router.push('/profile/onboarding')" />
      </div>
    </UPageCard>
  </div>

  <!-- Skills Content -->
  <div v-else class="space-y-4">
    <div class="mb-8 space-y-2">
      <h1 class="text-2xl font-semibold">Skills</h1>
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
        <!-- Collapsed State -->
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
                  size="lg"
                >
                  {{ skill.name }}
                </UBadge>
              </div>
              <p v-else class="text-sm text-muted italic">No skills yet</p>
            </div>
            <UIcon name="i-lucide-chevron-down" class="w-5 h-5 text-muted shrink-0 mt-1" />
          </div>
        </div>

        <!-- Expanded State -->
        <div v-else class="p-4">
          <!-- Group Header -->
          <div class="flex items-center justify-between gap-2 mb-4">
            <div class="flex items-center gap-2 flex-1 cursor-pointer min-w-0" @click="toggleGroup(groupIndex)">
              <h3 class="text-lg font-semibold truncate">{{ group.category || 'Untitled Group' }}</h3>
              <UIcon name="i-lucide-chevron-up" class="w-5 h-5 text-muted shrink-0" />
            </div>
            <div class="flex items-center gap-1 shrink-0">
              <!-- Reorder buttons -->
              <UButton
                icon="i-lucide-chevron-up"
                color="neutral"
                variant="ghost"
                size="xs"
                class="cursor-pointer"
                :disabled="groupIndex === 0"
                @click.stop="moveGroupUp(groupIndex)"
              />
              <UButton
                icon="i-lucide-chevron-down"
                color="neutral"
                variant="ghost"
                size="xs"
                class="cursor-pointer"
                :disabled="groupIndex === skillGroups.length - 1"
                @click.stop="moveGroupDown(groupIndex)"
              />
              <!-- Delete button -->
              <UButton
                v-if="group.isDeletable && group.category !== 'No Group'"
                icon="i-lucide-trash-2"
                color="error"
                variant="ghost"
                size="sm"
                class="cursor-pointer"
                @click.stop="deleteSkillGroup(groupIndex)"
              />
            </div>
          </div>

          <USeparator class="mb-4" />

          <!-- Group Name Input -->
          <div class="mb-4">
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

          <!-- Tag-Chip Skill Input -->
          <div class="mb-4">
            <label class="block text-sm font-medium mb-2">Skills</label>
            <div class="flex flex-wrap gap-2 p-3 border border-default rounded-lg min-h-12 bg-default/20 focus-within:ring-1 focus-within:ring-primary/50">
              <!-- Skill chips with popover -->
              <template
                v-for="(skill, skillIndex) in group.skills"
                :key="skillIndex"
              >
                <!-- Rename mode: inline input inside chip -->
                <UBadge
                  v-if="renamingSkill?.groupIndex === groupIndex && renamingSkill?.skillIndex === skillIndex"
                  color="primary"
                  variant="subtle"
                  size="lg"
                  class="flex items-center gap-1"
                >
                  <input
                    :value="renameInput"
                    @input="renameInput = ($event.target as HTMLInputElement).value"
                    @keydown.enter.prevent="commitRename"
                    @keydown.escape="cancelRename"
                    @blur="commitRename"
                    class="bg-transparent outline-none text-sm min-w-12"
                    :style="{ width: `${Math.max(renameInput.length, 4)}ch` }"
                    autofocus
                  />
                </UBadge>

                <!-- Normal mode: chip with popover -->
                <UPopover v-else>
                  <UBadge
                    color="primary"
                    variant="subtle"
                    size="lg"
                    class="cursor-pointer select-none flex items-center gap-1 hover:ring-1 hover:ring-primary/50"
                    title="Click to edit details · Double-click to rename"
                    @dblclick.stop="startRename(groupIndex, skillIndex, skill.name)"
                  >
                    <span>{{ skill.name }}</span>
                    <span
                      role="button"
                      class="ml-1 opacity-50 hover:opacity-100"
                      @click.stop="removeSkillFromGroup(groupIndex, skillIndex)"
                    >
                      <UIcon name="i-lucide-x" class="w-3 h-3" />
                    </span>
                  </UBadge>

                  <template #content>
                    <div class="p-4 space-y-3 min-w-56">
                      <div>
                        <label class="block text-xs text-muted mb-1">Skill name</label>
                        <UInput
                          v-model="skill.name"
                          size="sm"
                          class="w-full"
                          placeholder="Skill name"
                        />
                      </div>
                      <div>
                        <label class="block text-xs text-muted mb-1">Proficiency</label>
                        <USelectMenu
                          v-model="skill.proficiencyLevel"
                          :items="proficiencyLevels"
                          size="sm"
                          class="w-full capitalize"
                        />
                      </div>
                      <div>
                        <label class="block text-xs text-muted mb-1">Years of experience</label>
                        <UInput
                          v-model="skill.yearsExperience"
                          type="number"
                          placeholder="0"
                          size="sm"
                          min="0"
                          max="100"
                          class="w-full"
                        />
                      </div>
                      <div v-if="otherGroupNames(groupIndex).length > 0">
                        <label class="block text-xs text-muted mb-1">Move to group</label>
                        <USelectMenu
                          :items="otherGroupNames(groupIndex)"
                          placeholder="Select group..."
                          size="sm"
                          class="w-full"
                          @update:model-value="moveSkillToGroup(groupIndex, skillIndex, $event as string)"
                        />
                      </div>
                    </div>
                  </template>
                </UPopover>
              </template>

              <!-- Inline text input for adding skills -->
              <input
                v-model="newSkillInputs[groupIndex]"
                :placeholder="group.skills.length === 0 ? 'Type a skill and press Enter...' : 'Add another...'"
                class="flex-1 min-w-32 outline-none text-sm bg-transparent py-0.5 placeholder:text-muted"
                @keydown.enter.prevent="addSkillFromInput(groupIndex)"
              />
            </div>
            <p class="text-xs text-muted mt-1">Type a skill name and press Enter to add. Click a chip to edit proficiency or move it. Double-click to rename.</p>
            <p v-if="skillGroupErrors[groupIndex]?.skills" class="text-sm text-error mt-1">
              {{ skillGroupErrors[groupIndex].skills }}
            </p>
          </div>

          <!-- Save / Cancel -->
          <div class="flex gap-2 pt-4 border-t border-default mt-2">
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
              :disabled="isSaving"
              @click="cancelEditSkillGroup(groupIndex)"
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
