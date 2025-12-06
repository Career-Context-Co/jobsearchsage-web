<script setup lang="ts">
import type { StepperItem } from '@nuxt/ui'
import { ref, useTemplateRef, onMounted, computed } from 'vue'
import { useCareerIDStore } from '~/stores/careerIDStore'

const stepper = useTemplateRef('stepper')
const activeStep = ref('contact')

const steps: StepperItem[] = [
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
    
  } catch (error) {
    console.error('Failed to save contact section:', error)
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
  } catch (error) {
    console.error('Failed to save experience:', error)
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
    
  } catch (error) {
    console.error('Failed to save experience section:', error)
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
  } catch (error) {
    console.error('Failed to save education:', error)
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
    
  } catch (error) {
    console.error('Failed to save education section:', error)
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
  } catch (error) {
    console.error('Failed to save certification:', error)
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
  } catch (error) {
    console.error('Failed to save additional information:', error)
  }
}

async function handleDeleteCertification(index: number) {
  try {
    const certification = careerIDStore.certifications[index]
    if (certification?.id) {
      await careerIDStore.deleteCertification(certification.id)
    }
  } catch (error) {
    console.error('Failed to delete certification:', error)
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
  } catch (error) {
    console.error('Failed to save skill group:', error)
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
  } catch (error) {
    console.error('Failed to delete skill group:', error)
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
          <!-- ContactSection - single save event with all data -->
          <ProfileContactSection 
            v-show="activeStep === 'contact'"
            :contact-info="careerIDStore.contactInfo"
            :profile-social-links="careerIDStore.profileSocialLinks"
            @save="handleSaveContact"
          />
          
          <!-- ExperienceSection - props down, events up -->
          <ProfileExperienceSection 
            v-show="activeStep === 'experience'"
            :experience="careerIDStore.experience"
            @save="handleSaveExperience"
            @save-all="handleSaveAllExperiences"
          />
          
          <!-- EducationSection - props down, events up -->
          <ProfileEducationSection 
            v-show="activeStep === 'education'"
            :education="careerIDStore.education"
            @save="handleSaveEducation"
            @save-all="handleSaveAllEducations"
          />
          
          <!-- AdditionalSection - props down, events up -->
          <ProfileAdditionalSection 
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
            @click="stepper?.prev()"
          />
          
          <div class="flex gap-2">
            <UButton
              v-if="stepper?.hasNext"
              class="cursor-pointer"
              size="xl"
              label="Continue"
              trailing-icon="i-lucide-chevron-right"
              color="primary"
              @click="stepper?.next()"
            />
            <UButton
              v-else
              class="cursor-pointer"
              size="xl"
              label="Complete Profile"
              trailing-icon="i-lucide-check"
              color="success"
            />
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
