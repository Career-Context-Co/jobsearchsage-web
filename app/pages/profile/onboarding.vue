<script setup lang="ts">
import type { StepperItem } from '@nuxt/ui'
import { ref, useTemplateRef, onMounted, computed } from 'vue'
import { useCareerIDStore } from '~/stores/careerIDStore'

const stepper = useTemplateRef('stepper')
const activeStep = ref('upload')

// Template refs for section components (for autosave)
const uploadSectionRef = useTemplateRef('uploadSection')
const contactSectionRef = useTemplateRef('contactSection')
const experienceSectionRef = useTemplateRef('experienceSection')
const educationSectionRef = useTemplateRef('educationSection')
const additionalSectionRef = useTemplateRef('additionalSection')

const steps: StepperItem[] = [
  { 
    title: 'Upload', 
    icon: 'i-lucide-upload',
    value: 'upload'
  },
  { 
    title: 'Contact', 
    icon: 'i-lucide-user',
    value: 'contact'
  },
  { 
    title: 'Experience', 
    icon: 'i-lucide-briefcase',
    value: 'experience'
  },
  { 
    title: 'Education', 
    icon: 'i-lucide-graduation-cap',
    value: 'education'
  },
  { 
    title: 'Additional', 
    icon: 'i-lucide-award',
    value: 'additional'
  }
]

const careerIDStore = useCareerIDStore()
const toast = useToast()

// Handle save from ContactSection - diffs against store to determine API calls
async function handleSaveContact(payload: { contactInfo: any, socialLinks: { id?: number, platformId: number, url: string }[] }) {
  try {
    const { contactInfo, socialLinks } = payload
    
    // 1. Save contact info
    if (careerIDStore.contactInfo?.id) {
      await careerIDStore.updateContactInfo(careerIDStore.contactInfo.id, contactInfo)
    } else {
      await careerIDStore.createContactInfo(contactInfo)
    }
    
    // 2. Diff social links against store
    const existingLinks = careerIDStore.profileSocialLinks
    const existingIds = new Set(existingLinks.map(l => l.id))
    const newIds = new Set(socialLinks.filter(l => l.id).map(l => l.id))
    
    // Find links to add (no id)
    const linksToAdd = socialLinks.filter(l => !l.id)
    if (linksToAdd.length > 0) {
      await careerIDStore.addSocialLinks(linksToAdd.map((l, i) => ({
        platformId: l.platformId,
        url: l.url,
        displayOrder: existingLinks.length + i
      })))
    }
    
    // Find links to update (id exists, check if url changed)
    for (const link of socialLinks) {
      if (link.id) {
        const existing = existingLinks.find(l => l.id === link.id)
        if (existing && existing.url !== link.url) {
          await careerIDStore.updateSocialLink(link.id, { url: link.url })
        }
      }
    }
    
    // Note: Delete is handled separately via explicit delete handler, never during save
    
    // Show success toast
    toast.add({
      title: 'Saved',
      description: 'Contact information saved successfully',
      color: 'success'
    })
  } catch (error: any) {
    console.error('Failed to save contact section:', error)
    
    // Show error toast
    toast.add({
      title: 'Save Failed',
      description: error?.data?.error?.message || 'Failed to save contact information',
      color: 'error'
    })
    
    // Revert changes in child component
    contactSectionRef.value?.revertChanges()
  }
}

// 5.15.4 Event handler for ExperienceSection - single experience save (POST or PATCH)
async function handleSaveExperience(experience: any) {
  try {
    if (experience.id) {
      // Update existing experience (PATCH)
      await careerIDStore.updateExperience(experience.id, experience)
    } else {
      // Add new experience (POST)
      await careerIDStore.addExperience(experience)
    }
    
    toast.add({
      title: 'Saved',
      description: 'Experience saved successfully',
      color: 'success'
    })
  } catch (error: any) {
    console.error('Failed to save experience:', error)
    
    toast.add({
      title: 'Save Failed',
      description: error?.data?.error?.message || 'Failed to save experience',
      color: 'error'
    })
    
    // Revert changes in child component
    experienceSectionRef.value?.revertChanges()
  }
}

// Bulk save handler - saves all experiences
// DELETE is handled separately via explicit delete handler, never during save
async function handleSaveAllExperiences(experiences: any[]) {
  try {
    // Just POST for new items (no id) and PATCH for existing items (has id)
    // No delete logic - delete only happens when user explicitly clicks delete button
    
    for (const exp of experiences) {
      if (exp.id) {
        // Update existing experience
        await careerIDStore.updateExperience(exp.id, exp)
      } else {
        // Add new experience
        await careerIDStore.addExperience(exp)
      }
    }
    
    toast.add({
      title: 'Saved',
      description: 'Work experience saved successfully',
      color: 'success'
    })
  } catch (error: any) {
    console.error('Failed to save experience section:', error)
    
    toast.add({
      title: 'Save Failed',
      description: error?.data?.error?.message || 'Failed to save work experience',
      color: 'error'
    })
    
    // Revert changes in child component
    experienceSectionRef.value?.revertChanges()
  }
}

// 5.15.5 Event handler for EducationSection - single education save (POST or PATCH)
async function handleSaveEducation(education: any) {
  try {
    if (education.id) {
      // Update existing education (PATCH)
      await careerIDStore.updateEducation(education.id, education)
    } else {
      // Add new education (POST)
      await careerIDStore.addEducation(education)
    }
    
    toast.add({
      title: 'Saved',
      description: 'Education saved successfully',
      color: 'success'
    })
  } catch (error: any) {
    console.error('Failed to save education:', error)
    
    toast.add({
      title: 'Save Failed',
      description: error?.data?.error?.message || 'Failed to save education',
      color: 'error'
    })
    
    // Revert changes in child component
    educationSectionRef.value?.revertChanges()
  }
}

// Bulk save handler - only saves edited/new items (child filters for us)
// DELETE is handled separately via explicit delete handler, never during save
async function handleSaveAllEducations(educations: any[]) {
  try {
    // Child component only sends edited or new educations
    // Just POST for new items (no id) and PATCH for existing items (has id)
    
    for (const edu of educations) {
      if (edu.id) {
        // Update existing education
        await careerIDStore.updateEducation(edu.id, edu)
      } else {
        // Add new education
        await careerIDStore.addEducation(edu)
      }
    }
    
    toast.add({
      title: 'Saved',
      description: 'Education saved successfully',
      color: 'success'
    })
  } catch (error: any) {
    console.error('Failed to save education section:', error)
    
    toast.add({
      title: 'Save Failed',
      description: error?.data?.error?.message || 'Failed to save education',
      color: 'error'
    })
    
    // Revert changes in child component
    educationSectionRef.value?.revertChanges()
  }
}

// 5.15.6 Event handlers for AdditionalSection - single certification save
async function handleSaveCertification(data: any) {
  try {
    if (data.id) {
      // Update existing certification (PATCH)
      await careerIDStore.updateCertification(data.id, data)
    } else {
      // Add new certification (POST)
      await careerIDStore.addCertification(data)
    }
    
    toast.add({
      title: 'Saved',
      description: 'Certification saved successfully',
      color: 'success'
    })
  } catch (error: any) {
    console.error('Failed to save certification:', error)
    
    toast.add({
      title: 'Save Failed',
      description: error?.data?.error?.message || 'Failed to save certification',
      color: 'error'
    })
    
    // Revert changes in child component
    additionalSectionRef.value?.revertChanges()
  }
}

// Bulk save handler for all additional information (certifications and skills)
async function handleSaveAllAdditional(payload: { certifications: any[], skillGroups: any[] }) {
  try {
    // 1. Save certifications - POST for new, PATCH for existing
    for (const cert of payload.certifications) {
      if (cert.id) {
        await careerIDStore.updateCertification(cert.id, cert)
      } else {
        await careerIDStore.addCertification(cert)
      }
    }
    
    // 2. Save skills - handle add/update/delete for each group
    for (const group of payload.skillGroups) {
      const originalGroupValue = group.originalGroup
      
      // Get existing skills in the ORIGINAL group (before any name change)
      const existingSkillsInGroup = careerIDStore.profileSkills.filter(
        skill => skill.group === originalGroupValue
      )
      
      const existingIds = new Set(existingSkillsInGroup.map(s => s.id))
      const currentIds = new Set(group.skills.filter((s: any) => s.id).map((s: any) => s.id))
      
      // 1. Handle group name change - update all existing skills in this group
      if (group.group !== originalGroupValue) {
        const skillsToUpdateGroup = existingSkillsInGroup.map(skill => ({
          id: skill.id,
          group: group.group
        }))
        
        if (skillsToUpdateGroup.length > 0) {
          await careerIDStore.updateSkills(skillsToUpdateGroup)
        }
      }
      
      // 2. Find skills to add (no id)
      const skillsToAdd = group.skills
        .filter((skill: any) => !skill.id)
        .map((skill: any) => ({
          name: skill.name,
          group: group.group,
          proficiencyLevel: 'intermediate' as const,
          yearsExperience: 2,
          displayOrder: 0
        }))
      
      if (skillsToAdd.length > 0) {
        await careerIDStore.addSkills(skillsToAdd)
      }
      
      // 3. Find skills to update (has id, name might have changed)
      const skillsToUpdate = group.skills
        .filter((skill: any) => skill.id)
        .map((skill: any) => {
          const existing = existingSkillsInGroup.find(s => s.id === skill.id)
          if (existing && existing.name !== skill.name) {
            return { id: skill.id, name: skill.name, group: group.group }
          }
          return null
        })
        .filter(Boolean)
      
      if (skillsToUpdate.length > 0) {
        await careerIDStore.updateSkills(skillsToUpdate)
      }
      
      // 4. Find skills to delete (in store but not in current group)
      const skillsToDelete = existingSkillsInGroup
        .filter(existing => !currentIds.has(existing.id))
        .map(s => s.id)
      
      if (skillsToDelete.length > 0) {
        await careerIDStore.deleteSkills(skillsToDelete)
      }
    }
    
    toast.add({
      title: 'Saved',
      description: 'Additional information saved successfully',
      color: 'success'
    })
  } catch (error: any) {
    console.error('Failed to save additional information:', error)
    
    toast.add({
      title: 'Save Failed',
      description: error?.data?.error?.message || 'Failed to save additional information',
      color: 'error'
    })
    
    // Revert changes in child component
    additionalSectionRef.value?.revertChanges()
  }
}

async function handleDeleteExperience(id: number) {
  try {
    await careerIDStore.deleteExperience(id)
    
    toast.add({
      title: 'Deleted',
      description: 'Experience deleted successfully',
      color: 'success'
    })
  } catch (error: any) {
    console.error('Failed to delete experience:', error)
    
    toast.add({
      title: 'Delete Failed',
      description: error?.data?.error?.message || 'Failed to delete experience',
      color: 'error'
    })
    
    // Revert changes in child component
    experienceSectionRef.value?.revertChanges()
  }
}

async function handleDeleteEducation(id: number) {
  try {
    await careerIDStore.deleteEducation(id)
    
    toast.add({
      title: 'Deleted',
      description: 'Education deleted successfully',
      color: 'success'
    })
  } catch (error: any) {
    console.error('Failed to delete education:', error)
    
    toast.add({
      title: 'Delete Failed',
      description: error?.data?.error?.message || 'Failed to delete education',
      color: 'error'
    })
    
    // Revert changes in child component
    educationSectionRef.value?.revertChanges()
  }
}

async function handleDeleteCertification(id: number) {
  try {
    await careerIDStore.deleteCertification(id)
    
    toast.add({
      title: 'Deleted',
      description: 'Certification deleted successfully',
      color: 'success'
    })
  } catch (error: any) {
    console.error('Failed to delete certification:', error)
    
    toast.add({
      title: 'Delete Failed',
      description: error?.data?.error?.message || 'Failed to delete certification',
      color: 'error'
    })
    
    // Revert changes in child component
    additionalSectionRef.value?.revertChanges()
  }
}

// 5.15.7 Event handlers for AdditionalSection skills
async function handleSaveSkillGroup(index: number, groupData: any) {
  try {
    const originalGroupName = groupData.originalGroup
    
    // Get existing skills in the ORIGINAL group (before any name change)
    const existingSkillsInGroup = careerIDStore.profileSkills.filter(
      skill => skill.group === originalGroupName
    )
    
    const existingIds = new Set(existingSkillsInGroup.map(s => s.id))
    const currentIds = new Set(groupData.skills.filter((s: any) => s.id).map((s: any) => s.id))
    
    // 1. Handle group name change - update all existing skills in this group
    if (groupData.group !== originalGroupName) {
      const skillsToUpdateGroup = existingSkillsInGroup.map(skill => ({
        id: skill.id,
        group: groupData.group
      }))
      
      if (skillsToUpdateGroup.length > 0) {
        await careerIDStore.updateSkills(skillsToUpdateGroup)
      }
    }
    
    // 2. Find skills to add (no id)
    const skillsToAdd = groupData.skills
      .filter((skill: any) => !skill.id)
      .map((skill: any) => ({
        name: skill.name,
        group: groupData.group,
        proficiencyLevel: 'intermediate' as const,
        yearsExperience: 2,
        displayOrder: 0
      }))
    
    if (skillsToAdd.length > 0) {
      await careerIDStore.addSkills(skillsToAdd)
    }
    
    // 3. Find skills to update (has id, name might have changed)
    const skillsToUpdate = groupData.skills
      .filter((skill: any) => skill.id)
      .map((skill: any) => {
        const existing = existingSkillsInGroup.find(s => s.id === skill.id)
        if (existing && existing.name !== skill.name) {
          return { id: skill.id, name: skill.name, group: groupData.group }
        }
        return null
      })
      .filter(Boolean)
    
    if (skillsToUpdate.length > 0) {
      await careerIDStore.updateSkills(skillsToUpdate)
    }
    
    // 4. Find skills to delete (in store but not in current group)
    const skillsToDelete = existingSkillsInGroup
      .filter(existing => !currentIds.has(existing.id))
      .map(s => s.id)
    
    if (skillsToDelete.length > 0) {
      await careerIDStore.deleteSkills(skillsToDelete)
    }
    
    toast.add({
      title: 'Saved',
      description: 'Skill group saved successfully',
      color: 'success'
    })
  } catch (error: any) {
    console.error('Failed to save skill group:', error)
    
    toast.add({
      title: 'Save Failed',
      description: error?.data?.error?.message || 'Failed to save skill group',
      color: 'error'
    })
    
    // Revert changes in child component
    additionalSectionRef.value?.revertChanges()
  }
}

async function handleDeleteSkillGroup(groupValue: string | null) {
  try {
    // Get all skills in this group
    const skillsInGroup = careerIDStore.profileSkills.filter(
      skill => skill.group === groupValue
    )
    
    if (skillsInGroup.length === 0) return
    
    // Move all skills to null group
    const skillsToUpdate = skillsInGroup.map(skill => ({
      id: skill.id,
      group: null
    }))
    
    await careerIDStore.updateSkills(skillsToUpdate)
    
    toast.add({
      title: 'Deleted',
      description: 'Skill group deleted successfully',
      color: 'success'
    })
  } catch (error: any) {
    console.error('Failed to delete skill group:', error)
    
    toast.add({
      title: 'Delete Failed',
      description: error?.data?.error?.message || 'Failed to delete skill group',
      color: 'error'
    })
    
    // Revert changes in child component
    additionalSectionRef.value?.revertChanges()
  }
}

// Handle skip or successful upload from ResumeUploadSection
function handleUploadComplete() {
  // Advance to Contact step
  stepper.value?.next()
}

// Autosave current step before navigation
async function autosaveCurrentStep() {
  try {
    switch (activeStep.value) {
      case 'upload':
        // No autosave needed for upload step
        break
      case 'contact':
        await contactSectionRef.value?.triggerSave()
        break
      case 'experience':
        await experienceSectionRef.value?.triggerSave()
        break
      case 'education':
        await educationSectionRef.value?.triggerSave()
        break
      case 'additional':
        await additionalSectionRef.value?.triggerSave()
        break
    }
  } catch (error) {
    console.error('Failed to autosave current step:', error)
  }
}

// Fetch profile on mount
onMounted(async () => {
  try {
    // For demo purposes, fetch a profile
    // In production, you'd get the profile ID from auth/route
    const profileId = 'prof_myf2i85se9xri4e4wgsxxim7'

    if (!careerIDStore.profile) {
      await careerIDStore.fetchProfile(profileId)
    }
  } catch (error) {
    console.error('Failed to initialize profile:', error)
  }
})

</script>

<template>
  <UDashboardPanel id="profile-onboarding">
    <template #header>
      <UDashboardNavbar title="Profile Onboarding">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-col gap-6 sm:gap-8 w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        <!-- Stepper Component-->
        <UStepper

          ref="stepper"
          size="lg"
          v-model="activeStep"
          :items="steps"
          orientation="horizontal"
          class="w-full"
        />

        <!-- Content Area with Dynamic Components -->
        <div class="p-6 sm:p-8">
          <!-- ResumeUploadSection - optional first step -->
          <ProfileResumeUploadSection 
            ref="uploadSection"
            v-show="activeStep === 'upload'"
            @upload-complete="handleUploadComplete"
          />
          
          <!-- ContactSection - single save event with all data -->
          <ProfileContactSection 
            ref="contactSection"
            v-show="activeStep === 'contact'"
            :contact-info="careerIDStore.contactInfo"
            :profile-social-links="careerIDStore.profileSocialLinks"
            @save="handleSaveContact"
          />
          
          <!-- ExperienceSection - props down, events up -->
          <ProfileExperienceSection 
            ref="experienceSection"
            v-show="activeStep === 'experience'"
            :experience="careerIDStore.experience"
            @save="handleSaveExperience"
            @save-all="handleSaveAllExperiences"
            @delete="handleDeleteExperience"
          />
          
          <!-- EducationSection - props down, events up -->
          <ProfileEducationSection 
            ref="educationSection"
            v-show="activeStep === 'education'"
            :education="careerIDStore.education"
            @save="handleSaveEducation"
            @save-all="handleSaveAllEducations"
            @delete="handleDeleteEducation"
          />
          
          <!-- AdditionalSection - props down, events up -->
          <ProfileAdditionalSection 
            ref="additionalSection"
            v-show="activeStep === 'additional'"
            :skill-groups="careerIDStore.profileSkills"
            :certifications="careerIDStore.certifications"
            @save-skill-group="handleSaveSkillGroup"
            @delete-skill-group="handleDeleteSkillGroup"
            @save-certification="handleSaveCertification"
            @save-all="handleSaveAllAdditional"
            @delete-certification="handleDeleteCertification"
          />   
        </div>

        <!-- Navigation Buttons -->
        <div class="flex justify-between items-center gap-4">
          <UButton
            label="Back"
            class="cursor-pointer"
            size="xl"
            leading-icon="i-lucide-chevron-left"
            color="neutral"
            variant="subtle"
            :disabled="!stepper?.hasPrev"
            @click="async () => {
              await autosaveCurrentStep()
              stepper?.prev()
            }"
          />
          
          <div class="flex gap-2">
            <UButton
              v-if="stepper?.hasNext"
              class="cursor-pointer"
              size="xl"
              label="Continue"
              trailing-icon="i-lucide-chevron-right"
              color="primary"
              @click="async () => {
                await autosaveCurrentStep()
                stepper?.next()
              }"
            />
            <UButton
              v-else
              class="cursor-pointer"
              size="xl"
              label="Complete Profile"
              trailing-icon="i-lucide-check"
              color="success"
              @click="async () => {
                await autosaveCurrentStep()
              }"
            />
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
