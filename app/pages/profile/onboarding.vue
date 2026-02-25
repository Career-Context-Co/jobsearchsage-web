<script setup lang="ts">
import type { StepperItem } from '@nuxt/ui'
import { ref, useTemplateRef, onMounted, computed } from 'vue'
import { useCareerIDStore } from '~/stores/careerIDStore'

definePageMeta({
  layout: 'fullscreen'
})

const stepper = useTemplateRef('stepper')
const activeStep = ref('upload')

// Template refs for section components (for autosave)
const uploadSectionRef = useTemplateRef('uploadSection')
const contactSectionRef = useTemplateRef('contactSection')
const experienceSectionRef = useTemplateRef('experienceSection')
const educationSectionRef = useTemplateRef('educationSection')
const skillsSectionRef = useTemplateRef('skillsSection')
const certificationsSectionRef = useTemplateRef('certificationsSection')

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
    title: 'Skills',
    icon: 'i-lucide-lightbulb',
    value: 'skills'
  },
  {
    title: 'Certifications',
    icon: 'i-lucide-award',
    value: 'certifications'
  }
]

const careerIDStore = useCareerIDStore()
const accountStore = useAccountStore()
const toast = useToast()
const router = useRouter()
const posthog = usePostHog()

// Check if user is continuing onboarding after taking a break
const isContinuingOnboarding = computed(() =>
  careerIDStore.profile?.completionStatus === 'incomplete' && careerIDStore.isProfileLoaded
)

// Handle save from ContactSection - diffs against store to determine API calls
async function handleSaveContact(payload: {
  contactInfo: any
  socialLinks: { id?: number, platformId: number, url: string }[]
  deletedLinkIds: number[]
}) {
  try {
    const { contactInfo, socialLinks, deletedLinkIds } = payload

    // 1. Save contact info
    if (careerIDStore.contactInfo?.id) {
      await careerIDStore.updateContactInfo(careerIDStore.contactInfo.id, contactInfo)
    } else {
      await careerIDStore.createContactInfo(contactInfo)
    }

    // 2. Handle social links changes

    // STEP 1: Delete explicitly removed links (user clicked delete button)
    for (const deletedId of deletedLinkIds) {
      try {
        await careerIDStore.deleteSocialLink(deletedId)
      } catch (deleteError: any) {
        console.error('Failed to delete social link:', deletedId, deleteError)
        // Continue to next delete - don't stop the save process
      }
    }

    // STEP 2: Update existing links (id exists, check if url changed)
    const existingLinks = careerIDStore.profileSocialLinks
    for (const link of socialLinks) {
      if (link.id) {
        const existing = existingLinks.find(l => l.id === link.id)
        if (existing && existing.url !== link.url) {
          await careerIDStore.updateSocialLink(link.id, { url: link.url })
        }
      }
    }

    // STEP 3: Add new links (no id)
    const linksToAdd = socialLinks.filter(l => !l.id)
    if (linksToAdd.length > 0) {
      // Remove old extracted links without IDs before adding saved ones
      careerIDStore.profileSocialLinks = careerIDStore.profileSocialLinks.filter(link => link.id !== undefined)

      await careerIDStore.addSocialLinks(linksToAdd.map((l, i) => ({
        platformId: l.platformId,
        url: l.url,
        displayOrder: existingLinks.length + i
      })))
    }

    // Clear isExtracted flag from all items after successful save
    if (careerIDStore.contactInfo) {
      careerIDStore.contactInfo.isExtracted = false
    }
    careerIDStore.profileSocialLinks.forEach((link) => {
      link.isExtracted = false
    })

    // Show success toast
    toast.add({
      title: 'Saved',
      description: 'Contact information saved successfully',
      color: 'success'
    })
  } catch (error: any) {
    console.error('Failed to save contact section:', error)

    // Handle API errors in the child component (e.g., duplicate platforms)
    if (contactSectionRef.value?.handleApiError) {
      contactSectionRef.value.handleApiError(error)
    }

    // Show error toast
    toast.add({
      title: 'Save Failed',
      description: error?.data?.error?.message || 'Failed to save contact information',
      color: 'error'
    })
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

// NOTE: handleSaveAllAdditional removed - Skills and Certifications now have separate sections
// Each section handles its own API calls directly (no bulk save needed)

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

    // Note: New sections will handle their own reverts
  }
}

// Handle skip or successful upload from ResumeUploadSection
function handleUploadComplete(extracted: boolean) {
  if (extracted) {
    // Show success toast with extraction stats
    const counts = careerIDStore.sectionCounts
    const totalExtracted = counts.experience + counts.education + counts.skills + counts.certifications

    toast.add({
      title: 'Resume Extracted Successfully! 🎉',
      description: `Extracted ${totalExtracted} items from your resume. Review and edit in the next steps.`,
      color: 'success',
      timeout: 5000
    })

    posthog?.capture('resume_uploaded', {
      extracted_experience: counts.experience,
      extracted_education: counts.education,
      extracted_skills: counts.skills,
      extracted_certifications: counts.certifications,
      total_extracted: totalExtracted
    })
  }

  // Advance to Contact step
  stepper.value?.next()
}

// Save and validate current step before navigation
async function saveAndValidateCurrentStep(): Promise<boolean> {
  try {
    let success = true

    switch (activeStep.value) {
      case 'upload':
        // No save needed for upload step
        success = true
        break
      case 'contact':
        success = await contactSectionRef.value?.saveAllUnsaved() ?? true
        break
      case 'experience':
        success = await experienceSectionRef.value?.saveAllUnsaved() ?? true
        break
      case 'education':
        success = await educationSectionRef.value?.saveAllUnsaved() ?? true
        break
      case 'skills':
        success = await skillsSectionRef.value?.saveAllUnsaved() ?? true
        break
      case 'certifications':
        success = await certificationsSectionRef.value?.saveAllUnsaved() ?? true
        break
    }

    if (!success) {
      toast.add({
        title: 'Validation Errors',
        description: 'Please fix the errors in this section before continuing.',
        icon: 'i-lucide-alert-circle',
        color: 'error'
      })
    }

    return success
  } catch (error) {
    console.error('Failed to save current step:', error)
    toast.add({
      title: 'Error',
      description: 'Failed to save this section. Please try again.',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
    return false
  }
}

// Take a break - clear extracted data and navigate to profile
function takeABreak() {
  // Clear all extracted and unsaved data
  careerIDStore.clearExtractedData()

  // Clear any error state from the store
  careerIDStore.clearError()

  posthog?.capture('onboarding_abandoned', { step: activeStep.value })

  toast.add({
    title: 'Taking a Break',
    description: 'Your saved progress has been preserved. Come back anytime to continue!',
    icon: 'i-lucide-coffee',
    color: 'primary'
  })

  // Navigate to profile page
  router.push('/profile')
}

// Complete profile - save certifications and redirect
async function completeProfile() {
  try {
    // Save certifications section (last step)
    const success = await saveAndValidateCurrentStep()

    if (!success) {
      return // Don't redirect if validation failed
    }

    // Update profile completion status to 'complete'
    if (careerIDStore.profileId) {
      await careerIDStore.updateProfile(careerIDStore.profileId, {
        completionStatus: 'complete'
      })
    }

    posthog?.capture('onboarding_completed', {
      experience_count: careerIDStore.sectionCounts.experience,
      education_count: careerIDStore.sectionCounts.education,
      skills_count: careerIDStore.sectionCounts.skills,
      certifications_count: careerIDStore.sectionCounts.certifications,
      has_contact_info: careerIDStore.hasContactInfo,
      completion_percentage: careerIDStore.completionPercentage
    })

    // All done! Show success toast and redirect
    toast.add({
      title: 'Profile Completed! 🎉',
      description: 'Your profile has been saved successfully. Redirecting...',
      icon: 'i-lucide-check-circle',
      color: 'success'
    })

    // Redirect to profile page after a brief delay
    setTimeout(() => {
      router.push('/profile')
    }, 1500)
  } catch (error: any) {
    console.error('Failed to complete profile:', error)
    toast.add({
      title: 'Error',
      description: 'An unexpected error occurred. Please try again.',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  }
}

// app.vue loads the profile for authenticated users before any page renders.
// Here we only need to create a profile if none was found (new user).
onMounted(async () => {
  if (careerIDStore.profile) return

  try {
    await careerIDStore.createProfile()
    toast.add({
      title: 'Welcome!',
      description: 'Your profile has been initialized',
      icon: 'i-lucide-sparkles',
      color: 'success'
    })
  } catch (error: any) {
    console.error('Failed to create profile:', error)
    toast.add({
      title: 'Error',
      description: error?.data?.error?.message || 'Failed to create your profile. Please refresh the page.',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
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
        <!-- Stepper Component -->
        <UStepper
          ref="stepper"
          v-model="activeStep"
          size="lg"
          disabled
          :items="steps"
          orientation="horizontal"
          class="w-full"
        />

        <!-- Content Area with Dynamic Components -->
        <div class="p-6 sm:p-8">
          <!-- Info Banner for Continue Onboarding -->
          <UAlert
            v-if="activeStep === 'upload' && isContinuingOnboarding"
            color="primary"
            icon="i-lucide-sparkles"
            title="Welcome back!"
            description="You can upload a new resume to extract additional information, or continue editing your existing profile data."
            class="mb-6"
          />

          <ProfileOnboardingResumeUploadSection
            v-show="activeStep === 'upload'"
            ref="uploadSection"
            @upload-complete="handleUploadComplete"
          />

          <ProfileOnboardingContactSection
            v-show="activeStep === 'contact'"
            ref="contactSection"
            :contact-info="careerIDStore.contactInfo"
            :profile-social-links="careerIDStore.profileSocialLinks"
            @save="handleSaveContact"
          />

          <ProfileOnboardingExperienceSection
            v-show="activeStep === 'experience'"
            ref="experienceSection"
            :experience="careerIDStore.experience"
          />

          <ProfileOnboardingEducationSection
            v-show="activeStep === 'education'"
            ref="educationSection"
            :education="careerIDStore.education"
          />

          <ProfileOnboardingSkillsSection
            v-show="activeStep === 'skills'"
            ref="skillsSection"
            :skill-groups="careerIDStore.profileSkills"
          />

          <ProfileOnboardingCertificationsSection
            v-show="activeStep === 'certifications'"
            ref="certificationsSection"
            :certifications="careerIDStore.certifications"
          />
        </div>

        <!-- Navigation Buttons -->
        <div class="flex justify-between items-center gap-4">
          <div class="flex gap-2">
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
            <UButton
              label="Take a Break"
              class="cursor-pointer"
              size="xl"
              leading-icon="i-lucide-coffee"
              color="neutral"
              variant="ghost"
              @click="takeABreak"
            />
          </div>

          <div class="flex gap-2">
            <UButton
              v-if="stepper?.hasNext"
              class="cursor-pointer"
              size="xl"
              label="Continue"
              trailing-icon="i-lucide-chevron-right"
              color="primary"
              @click="async () => {
                const success = await saveAndValidateCurrentStep()
                if (success) {
                  posthog?.capture('onboarding_step_completed', { step: activeStep })
                  stepper?.next()
                }
              }"
            />
            <UButton
              v-else
              class="cursor-pointer"
              size="xl"
              label="Complete Profile"
              trailing-icon="i-lucide-check"
              color="success"
              @click="completeProfile"
            />
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
