<script setup lang="ts">
import type { StepperItem } from '@nuxt/ui'
import type { ExperienceLinkChoice, HeroExampleRole, HeroWizardDetailField, HeroWizardSection, HeroWizardStepValue } from '@/utils/heroWizardSections'
import { storeToRefs } from 'pinia'

definePageMeta({
  layout: 'fullscreen',
  middleware: 'hero-feature'
})

interface WizardStepperItem extends StepperItem {
  value: HeroWizardStepValue
  letter: string
}

const route = useRoute()
const router = useRouter()
const toast = useToast()
const careerIDStore = useCareerIDStore()
const accountStore = useAccountStore()
const { isSaving } = storeToRefs(careerIDStore)

const activeStep = ref<HeroWizardStepValue>('basics')
const exampleRole = ref<HeroExampleRole>('engineer')
const draft = ref(createEmptyHeroWizardDraft())
const experienceLinked = ref<ExperienceLinkChoice>(null)
const titleError = ref('')
const persistedStoryId = ref<string | null>(null)

const profileId = computed(() =>
  careerIDStore.profile?.id || careerIDStore.profileId || accountStore.profileId
)
const experiences = computed(() => careerIDStore.experience)

function linkedSourceExperienceId(): number | null {
  return experienceLinked.value === 'yes' ? draft.value.sourceExperienceId : null
}

type WizardSnapshot = {
  title: string
  sourceExperienceId: number | null
} & Record<HeroWizardDetailField, string>

const lastPersistedSnapshot = ref<WizardSnapshot | null>(null)

function takeSnapshot(): WizardSnapshot {
  const details = Object.fromEntries(
    HERO_WIZARD_DETAIL_FIELDS.map(field => [field, draft.value[field].trim()])
  ) as Record<HeroWizardDetailField, string>

  return {
    title: draft.value.title.trim(),
    sourceExperienceId: linkedSourceExperienceId(),
    ...details
  }
}

function markPersisted() {
  lastPersistedSnapshot.value = takeSnapshot()
}

function markPersistedFields(fields: Partial<WizardSnapshot>) {
  const emptyDetails = Object.fromEntries(
    HERO_WIZARD_DETAIL_FIELDS.map(field => [field, ''])
  ) as Record<HeroWizardDetailField, string>

  lastPersistedSnapshot.value = {
    title: '',
    sourceExperienceId: null,
    ...emptyDetails,
    ...lastPersistedSnapshot.value,
    ...fields
  }
}

function basicsHasChanges(): boolean {
  const saved = lastPersistedSnapshot.value
  if (!saved) {
    return true
  }
  const current = takeSnapshot()
  return current.title !== saved.title || current.sourceExperienceId !== saved.sourceExperienceId
}

function sectionHasChanges(section: HeroWizardSection): boolean {
  const saved = lastPersistedSnapshot.value
  if (!saved) {
    return true
  }
  const current = takeSnapshot()
  return section.fields.some(field => current[field.dbField] !== saved[field.dbField])
}

function outstandingChangesPayload() {
  const current = takeSnapshot()
  const saved = lastPersistedSnapshot.value
  if (!saved) {
    return {
      ...heroWizardFullUpdatePayload(draft.value),
      sourceExperienceId: linkedSourceExperienceId()
    }
  }

  const payload: Record<string, string | number | null> = {}
  if (current.title !== saved.title) {
    payload.title = current.title
  }
  if (current.sourceExperienceId !== saved.sourceExperienceId) {
    payload.sourceExperienceId = current.sourceExperienceId
  }
  for (const field of HERO_WIZARD_DETAIL_FIELDS) {
    if (current[field] !== saved[field]) {
      payload[field] = current[field] || null
    }
  }
  return payload
}

function persistenceErrorMessage(fallback: string): string {
  return careerIDStore.error || fallback
}

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

function requireTitle(): boolean {
  if (isHeroFieldFilled(draft.value.title)) {
    titleError.value = ''
    return true
  }
  titleError.value = 'Story title is required'
  return false
}

async function persistBasics(): Promise<boolean> {
  if (!requireTitle()) {
    return false
  }

  if (!profileId.value) {
    toast.add({
      title: 'Error',
      description: 'Profile is required to save a HERO story.',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
    return false
  }

  const sourceExperienceId = linkedSourceExperienceId()

  if (persistedStoryId.value && !basicsHasChanges()) {
    return true
  }

  try {
    if (!persistedStoryId.value) {
      const created = await careerIDStore.createStory(profileId.value, {
        title: draft.value.title.trim(),
        sourceExperienceId: sourceExperienceId ?? undefined,
        displayOrder: careerIDStore.heroStories.length + 1
      })
      persistedStoryId.value = created.id
      markPersistedFields({
        title: draft.value.title.trim(),
        sourceExperienceId
      })
      await router.replace({
        query: {
          ...route.query,
          storyId: created.id
        }
      })
      return true
    }

    await careerIDStore.updateStory(profileId.value, persistedStoryId.value, {
      title: draft.value.title.trim(),
      sourceExperienceId
    })
    markPersistedFields({
      title: draft.value.title.trim(),
      sourceExperienceId
    })
    return true
  } catch {
    toast.add({
      title: 'Error',
      description: persistenceErrorMessage('Failed to save HERO story. Please try again.'),
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
    return false
  }
}

async function persistSectionStep(step: HeroWizardStepValue): Promise<boolean> {
  const section = HERO_WIZARD_SECTIONS.find(item => item.key === step)
  if (!section) {
    return true
  }

  if (persistedStoryId.value && !sectionHasChanges(section)) {
    return true
  }

  if (!persistedStoryId.value) {
    const created = await persistBasics()
    if (!created || !persistedStoryId.value) {
      return false
    }
    if (!sectionHasChanges(section)) {
      return true
    }
  }

  if (!profileId.value || !persistedStoryId.value) {
    return false
  }

  try {
    await careerIDStore.updateStory(
      profileId.value,
      persistedStoryId.value,
      heroSectionUpdatePayload(section, draft.value)
    )
    const savedFields = Object.fromEntries(
      section.fields.map(field => [field.dbField, draft.value[field.dbField].trim()])
    ) as Partial<WizardSnapshot>
    markPersistedFields(savedFields)
    return true
  } catch {
    toast.add({
      title: 'Error',
      description: persistenceErrorMessage('Failed to save HERO story. Please try again.'),
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
    return false
  }
}

async function persistStep(step: HeroWizardStepValue): Promise<boolean> {
  if (step === 'review') {
    return true
  }
  if (step === 'basics') {
    return persistBasics()
  }
  return persistSectionStep(step)
}

async function goNext() {
  const saved = await persistStep(activeStep.value)
  if (!saved) {
    return
  }

  const index = HERO_WIZARD_STEP_ORDER.indexOf(activeStep.value)
  const nextStep = HERO_WIZARD_STEP_ORDER[index + 1]
  if (nextStep) {
    activeStep.value = nextStep
  }
}

function goBack() {
  const index = HERO_WIZARD_STEP_ORDER.indexOf(activeStep.value)
  const previousStep = HERO_WIZARD_STEP_ORDER[index - 1]
  if (previousStep) {
    activeStep.value = previousStep
  }
}

async function onStepperSelect(value: string | number | undefined) {
  const nextStep = value as HeroWizardStepValue | undefined
  if (!nextStep || nextStep === activeStep.value) {
    return
  }

  const saved = await persistStep(activeStep.value)
  if (!saved) {
    return
  }

  activeStep.value = nextStep
}

async function goToStep(step: HeroWizardStepValue) {
  if (step === activeStep.value) {
    return
  }

  const saved = await persistStep(activeStep.value)
  if (!saved) {
    return
  }

  activeStep.value = step
}

function shuffleExample() {
  exampleRole.value = nextHeroExampleRole(exampleRole.value)
}

async function saveAndExit() {
  if (!persistedStoryId.value && activeStep.value === 'basics') {
    await router.push('/profile/hero')
    return
  }

  const saved = await persistStep(activeStep.value)
  if (!saved) {
    return
  }

  await router.push('/profile/hero')
}

async function saveStory() {
  if (!requireTitle()) {
    activeStep.value = 'basics'
    return
  }

  if (!profileId.value) {
    toast.add({
      title: 'Error',
      description: 'Profile is required to save a HERO story.',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
    return
  }

  const payload = outstandingChangesPayload()

  try {
    if (!persistedStoryId.value) {
      const created = await careerIDStore.createStory(profileId.value, {
        ...heroWizardFullUpdatePayload(draft.value),
        sourceExperienceId: linkedSourceExperienceId(),
        displayOrder: careerIDStore.heroStories.length + 1
      })
      persistedStoryId.value = created.id
    } else if (Object.keys(payload).length > 0) {
      await careerIDStore.updateStory(profileId.value, persistedStoryId.value, payload)
    }

    markPersisted()

    toast.add({
      title: 'Success',
      description: `Your HERO story "${draft.value.title.trim()}" has been saved.`,
      icon: 'i-lucide-check',
      color: 'success'
    })

    await router.push('/profile/hero')
  } catch {
    toast.add({
      title: 'Error',
      description: persistenceErrorMessage('Failed to save HERO story. Please try again.'),
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  }
}

function applyPrefillFromQuery() {
  const titleQuery = route.query.title
  if (typeof titleQuery === 'string' && titleQuery.trim()) {
    draft.value.title = titleQuery.trim()
  }

  const sourceQuery = route.query.sourceExperienceId
  const parsed = typeof sourceQuery === 'string' ? Number(sourceQuery) : NaN
  if (Number.isInteger(parsed)) {
    draft.value.sourceExperienceId = parsed
    experienceLinked.value = 'yes'
  }
}

async function hydrateFromStoryId(storyId: string) {
  if (!profileId.value) {
    return
  }

  await careerIDStore.fetchStories(profileId.value)
  const story = careerIDStore.heroStories.find(item => item.id === storyId)
  if (!story) {
    toast.add({
      title: 'Error',
      description: 'That HERO story could not be found.',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
    return
  }

  draft.value = applyHeroStoryToDraft(story)
  persistedStoryId.value = story.id
  experienceLinked.value = story.sourceExperienceId != null ? 'yes' : 'no'
  markPersisted()
}

watch(() => draft.value.title, () => {
  if (titleError.value && isHeroFieldFilled(draft.value.title)) {
    titleError.value = ''
  }
})

onMounted(async () => {
  if (profileId.value && !careerIDStore.isProfileLoaded) {
    try {
      await careerIDStore.fetchProfile(profileId.value)
    } catch {
      // Experience selector can stay empty; persistence still uses profileId
    }
  }

  const storyIdQuery = route.query.storyId
  if (typeof storyIdQuery === 'string' && storyIdQuery.trim()) {
    await hydrateFromStoryId(storyIdQuery.trim())
    return
  }

  applyPrefillFromQuery()
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
            :loading="isSaving"
            :disabled="isSaving"
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
          :model-value="activeStep"
          :items="steps"
          :linear="false"
          size="lg"
          orientation="horizontal"
          class="w-full"
          @update:model-value="onStepperSelect"
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
            :is-saving="isSaving"
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
            :disabled="isSaving"
            @click="goBack"
          />
          <div v-else />
          <UButton
            :label="nextLabel"
            color="primary"
            size="xl"
            class="cursor-pointer"
            :loading="isSaving"
            :disabled="isSaving"
            @click="goNext"
          />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
