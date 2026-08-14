<script setup lang="ts">
import type { StepperItem } from '@nuxt/ui'
import type { ExperienceLinkChoice, HeroExampleRole, HeroWizardStepValue } from '@/utils/heroWizardSections'

definePageMeta({
  layout: 'fullscreen'
})

interface WizardStepperItem extends StepperItem {
  value: HeroWizardStepValue
  letter: string
}

const router = useRouter()
const careerIDStore = useCareerIDStore()
const stepper = useTemplateRef('stepper')

const activeStep = ref<HeroWizardStepValue>('basics')
const exampleRole = ref<HeroExampleRole>('engineer')
const draft = ref(createEmptyHeroWizardDraft())
const experienceLinked = ref<ExperienceLinkChoice>(null)
const titleError = ref('')

const experiences = computed(() => careerIDStore.experience)

const currentSection = computed(() =>
  HERO_WIZARD_SECTIONS.find(section => section.key === activeStep.value)
)

const isIntroFilled = computed(() => isHeroFieldFilled(draft.value.title))

const filledCount = computed(() => countFilledHeroDetails(draft.value))

const progressLabel = computed(() => `${filledCount.value} of 12 details captured`)

const storyTitleDisplay = computed(() => {
  const title = draft.value.title.trim()
  return title || 'Untitled HERO Story'
})

const heading = computed(() => {
  if (activeStep.value === 'basics') {
    return 'Let\'s start with the basics'
  }
  if (activeStep.value === 'review') {
    return 'Review Your Story'
  }
  return currentSection.value?.title ?? ''
})

const subheading = computed(() => {
  if (activeStep.value === 'basics') {
    return 'A title and the experience it belongs to.'
  }
  if (activeStep.value === 'review') {
    return 'Check each section, then save your complete HERO story.'
  }
  return currentSection.value?.question ?? ''
})

const nextLabel = computed(() => {
  switch (activeStep.value) {
    case 'basics':
      return 'Continue to The Hurdle'
    case 'hurdle':
      return 'Continue to The Expectation'
    case 'expectation':
      return 'Continue to The Response'
    case 'response':
      return 'Continue to The Outcome'
    case 'outcome':
      return 'Review Story'
    default:
      return 'Continue'
  }
})

const steps = computed<WizardStepperItem[]>(() => [
  {
    value: 'basics',
    title: 'Basics',
    letter: 'S',
    icon: isIntroFilled.value && activeStep.value !== 'basics'
      ? 'i-lucide-check'
      : undefined
  },
  ...HERO_WIZARD_SECTIONS.map(section => ({
    value: section.key as HeroWizardStepValue,
    title: section.title.replace('The ', ''),
    letter: section.letter,
    icon: isHeroSectionFilled(section, draft.value) && activeStep.value !== section.key
      ? 'i-lucide-check'
      : undefined
  })),
  {
    value: 'review',
    title: 'Review',
    letter: '✓',
    icon: 'i-lucide-check'
  }
])

function indicatorMark(item: WizardStepperItem): string {
  if (item.icon === 'i-lucide-check' || item.value === 'review') {
    return ''
  }
  return item.letter
}

function goNext() {
  if (activeStep.value === 'basics') {
    if (!isHeroFieldFilled(draft.value.title)) {
      titleError.value = 'Story title is required'
      return
    }
    titleError.value = ''
  }

  stepper.value?.next()
}

function goBack() {
  stepper.value?.prev()
}

function goToStep(step: HeroWizardStepValue) {
  activeStep.value = step
}

function shuffleExample() {
  exampleRole.value = nextHeroExampleRole(exampleRole.value)
}

function saveAndExit() {
  router.push('/profile/hero')
}

function saveStory() {
  router.push('/profile/hero')
}

watch(() => draft.value.title, () => {
  if (titleError.value && isHeroFieldFilled(draft.value.title)) {
    titleError.value = ''
  }
})
</script>

<template>
  <UDashboardPanel id="hero-story-wizard">
    <template #header>
      <UDashboardNavbar>
        <template #leading>
          <UDashboardSidebarCollapse />
          <div class="flex items-center gap-3">
            <div class="size-9 rounded-lg bg-primary/10 text-primary font-extrabold flex items-center justify-center">
              H
            </div>
            <div>
              <p class="text-xs text-muted font-medium">
                Your HERO Stories
              </p>
              <p class="text-base font-bold leading-tight">
                {{ storyTitleDisplay }}
              </p>
            </div>
          </div>
        </template>
        <template #right>
          <UButton
            label="Save & Exit"
            color="neutral"
            variant="outline"
            class="cursor-pointer"
            @click="saveAndExit"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-col gap-6 w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 pb-28">
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <div>
            <h1 class="text-2xl font-extrabold">
              {{ heading }}
            </h1>
            <p class="text-sm text-muted mt-1">
              {{ subheading }}
            </p>
          </div>
          <p class="text-sm text-muted font-semibold whitespace-nowrap sm:pt-1">
            {{ progressLabel }}
          </p>
        </div>

        <UStepper
          ref="stepper"
          v-model="activeStep"
          :items="steps"
          :linear="false"
          size="lg"
          orientation="horizontal"
          class="w-full"
        >
          <template #indicator="{ item }">
            <UIcon
              v-if="(item as WizardStepperItem).icon === 'i-lucide-check' || (item as WizardStepperItem).value === 'review'"
              name="i-lucide-check"
              class="size-4"
            />
            <span v-else>{{ indicatorMark(item as WizardStepperItem) }}</span>
          </template>
        </UStepper>

        <div v-show="activeStep === 'basics'" class="max-w-3xl mx-auto w-full">
          <ProfileHeroWizardBasicsStep
            v-model:title="draft.title"
            v-model:source-experience-id="draft.sourceExperienceId"
            v-model:experience-linked="experienceLinked"
            :experiences="experiences"
            :title-error="titleError"
          />
        </div>

        <div
          v-if="currentSection"
          v-show="activeStep !== 'basics' && activeStep !== 'review'"
          class="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-7 items-start"
        >
          <ProfileHeroWizardSectionStep
            v-model="draft"
            :section="currentSection"
          />
          <ProfileHeroWizardHelpExamplesPanel
            :section="currentSection"
            :example-role="exampleRole"
            @shuffle="shuffleExample"
          />
        </div>

        <div v-show="activeStep === 'review'">
          <ProfileHeroWizardReviewStep
            :draft="draft"
            :experience-linked="experienceLinked"
            :experiences="experiences"
            @edit="goToStep"
            @save="saveStory"
          />
        </div>

        <div
          v-if="activeStep !== 'review'"
          class="flex items-center justify-between gap-4"
        >
          <UButton
            v-if="activeStep !== 'basics'"
            label="Back"
            color="neutral"
            variant="outline"
            size="xl"
            class="cursor-pointer"
            @click="goBack"
          />
          <div v-else />
          <UButton
            :label="nextLabel"
            color="primary"
            size="xl"
            class="cursor-pointer"
            @click="goNext"
          />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
