<script setup lang="ts">
import type { StepperItem } from '@nuxt/ui'
import { ref, useTemplateRef, onMounted } from 'vue'
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
    
    // Find links to delete (in store but not in payload)
    for (const existing of existingLinks) {
      if (!newIds.has(existing.id)) {
        await careerIDStore.deleteSocialLink(existing.id)
      }
    }
    
  } catch (error) {
    console.error('Failed to save contact section:', error)
  }
}

// 5.15.4 Event handlers for ExperienceSection
async function handleSaveExperience(index: number, data: any) {
  try {
    const experience = careerIDStore.experience[index]
    if (experience?.id) {
      // Update existing experience
      await careerIDStore.updateExperience(experience.id, data)
    } else {
      // Add new experience
      await careerIDStore.addExperience(data)
    }
  } catch (error) {
    console.error('Failed to save experience:', error)
  }
}

async function handleDeleteExperience(index: number) {
  try {
    const experience = careerIDStore.experience[index]
    if (experience?.id) {
      await careerIDStore.deleteExperience(experience.id)
    }
  } catch (error) {
    console.error('Failed to delete experience:', error)
  }
}

// 5.15.5 Event handlers for EducationSection
async function handleSaveEducation(index: number, data: any) {
  try {
    const education = careerIDStore.education[index]
    if (education?.id) {
      // Update existing education
      await careerIDStore.updateEducation(education.id, data)
    } else {
      // Add new education
      await careerIDStore.addEducation(data)
    }
  } catch (error) {
    console.error('Failed to save education:', error)
  }
}

async function handleDeleteEducation(index: number) {
  try {
    const education = careerIDStore.education[index]
    if (education?.id) {
      await careerIDStore.deleteEducation(education.id)
    }
  } catch (error) {
    console.error('Failed to delete education:', error)
  }
}

// 5.15.6 Event handlers for AdditionalSection certifications
async function handleSaveCertification(index: number, data: any) {
  try {
    const certification = careerIDStore.certifications[index]
    if (certification?.id) {
      // Update existing certification
      await careerIDStore.updateCertification(certification.id, data)
    } else {
      // Add new certification
      await careerIDStore.addCertification(data)
    }
  } catch (error) {
    console.error('Failed to save certification:', error)
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
async function handleSaveSkillCategory(index: number, categoryData: any) {
  try {
    // Convert category.skills array to ProfileSkill objects
    const skills = categoryData.skills.map((skillName: string) => ({
      name: skillName,
      category: categoryData.name,
      proficiencyLevel: 'intermediate' as const,
      yearsExperience: 2,
      displayOrder: 0
    }))

    // Get existing skills in this category
    const existingSkillsInCategory = careerIDStore.profileSkills.filter(
      skill => skill.category === categoryData.name
    )

    // Find skills that need to be added (not in existing skills)
    const newSkills = skills.filter(
      (skill: { name: string; category: string; proficiencyLevel: string; yearsExperience: number; displayOrder: number }) => 
        !existingSkillsInCategory.some(existing => existing.name === skill.name)
    )

    if (newSkills.length > 0) {
      await careerIDStore.addSkills(newSkills)
    }
  } catch (error) {
    console.error('Failed to save skill category:', error)
  }
}

async function handleDeleteSkillCategory(index: number) {
  try {
    // Component will pass the category data in the event
    // For now, we can use the index to find skills
    // In practice, the component should emit the category name or skills to delete
    const skill = careerIDStore.profileSkills[index]
    if (!skill) return

    await careerIDStore.deleteSkills([skill.id])
  } catch (error) {
    console.error('Failed to delete skill category:', error)
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
            @delete="handleDeleteExperience"
          />
          
          <!-- EducationSection - props down, events up -->
          <ProfileEducationSection 
            v-show="activeStep === 'education'"
            :education="careerIDStore.education"
            @save="handleSaveEducation"
            @delete="handleDeleteEducation"
          />
          
          <!-- AdditionalSection - props down, events up -->
          <ProfileAdditionalSection 
            v-show="activeStep === 'additional'"
            @save-skill-category="handleSaveSkillCategory"
            @delete-skill-category="handleDeleteSkillCategory"
            @save-certification="handleSaveCertification"
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
