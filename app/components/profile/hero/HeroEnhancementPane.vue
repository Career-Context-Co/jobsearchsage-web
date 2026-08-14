<script setup lang="ts">
import type { QuestionGroup, HeroFieldResult } from '#shared/types/enhancement'

interface Props {
  storyId: string
  profileId: string
  sectionType: 'hurdle' | 'expectation' | 'response' | 'outcome'
  sectionLabel: string
  sourceExperience?: {
    id: number
    title: string
    employer: string
    summary?: string | null
    highlights: string[]
    context_notes?: string | null
  }
  momentTitle?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'accept-suggestions': [section: string, suggestions: Record<string, string>]
  'close': []
}>()

const sageAIStore = useSageAIStore()

const questionRoundRef = ref<{ handleProceed: () => void }>()

type ViewState = 'questions' | 'preview'
const viewState = ref<ViewState>('questions')
const currentRound = ref(1)
const questionGroups = ref<QuestionGroup[]>([])
const answeredQuestions = ref<Array<{ id: string, answer: string }>>([])
const results = ref<HeroFieldResult[]>([])
const isLoadingQuestions = ref(false)
const isLoadingSynthesis = ref(false)
const error = ref<string | null>(null)

const isLoading = computed(() => isLoadingQuestions.value || isLoadingSynthesis.value)

const stepText = computed(() => {
  if (viewState.value === 'preview') return 'Review & Accept'
  return `Round ${currentRound.value}: Answer Questions`
})

onMounted(async () => {
  await fetchQuestions()
})

async function fetchQuestions() {
  isLoadingQuestions.value = true
  error.value = null

  try {
    const result = await sageAIStore.fetchHeroSectionQuestions({
      profileId: props.profileId,
      storyId: props.storyId,
      sectionType: props.sectionType,
      sourceExperience: props.sourceExperience,
      momentTitle: props.momentTitle,
      context: answeredQuestions.value.length > 0
        ? { notes: [], answeredQuestions: answeredQuestions.value }
        : undefined
    })

    questionGroups.value = result.questionGroups

    if (result.questionGroups.length === 0 && answeredQuestions.value.length > 0) {
      await synthesize()
    }
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }, message?: string }
    error.value = err?.data?.message || err?.message || 'Failed to generate questions'
    console.error('Failed to fetch hero section questions:', e)
  } finally {
    isLoadingQuestions.value = false
  }
}

async function synthesize() {
  isLoadingSynthesis.value = true
  error.value = null

  try {
    const result = await sageAIStore.synthesizeHeroSection({
      profileId: props.profileId,
      storyId: props.storyId,
      sectionType: props.sectionType,
      answers: answeredQuestions.value,
      sourceExperience: props.sourceExperience,
      momentTitle: props.momentTitle
    })

    results.value = result.results
    viewState.value = 'preview'
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }, message?: string }
    error.value = err?.data?.message || err?.message || 'Failed to synthesize answers'
    console.error('Failed to synthesize hero section:', e)
  } finally {
    isLoadingSynthesis.value = false
  }
}

function handleQuestionRoundProceed(event: { round: number, answers: Array<{ id: string, answer: string }> }) {
  answeredQuestions.value = [...answeredQuestions.value, ...event.answers]
  currentRound.value++
  fetchQuestions()
}

function handleNext() {
  questionRoundRef.value?.handleProceed()
}

function handlePreviewBack() {
  viewState.value = 'questions'
}

function handleAcceptResults(acceptedResults: HeroFieldResult[]) {
  const suggestions: Record<string, string> = {}
  for (const r of acceptedResults) {
    suggestions[r.dbField] = r.text
  }
  emit('accept-suggestions', props.sectionType, suggestions)
}

function handleClose() {
  emit('close')
}
</script>

<template>
  <div class="h-full w-full flex flex-col">
    <!-- Header -->
    <div class="flex items-start justify-between pb-4">
      <div class="flex-1 mb-4">
        <h2 class="text-lg font-semibold mb-2">
          {{ sectionLabel }} Section
        </h2>
        <p class="text-sm text-muted mb-1">
          {{ stepText }}
        </p>
        <UProgress
          :model-value="viewState === 'preview' ? 100 : Math.min(currentRound * 33, 90)"
          :max="100"
          class="w-full"
        />
      </div>
      <UButton
        icon="i-lucide-x"
        color="neutral"
        variant="ghost"
        size="sm"
        class="cursor-pointer shrink-0 ml-4"
        @click="handleClose"
      />
    </div>

    <!-- Error State -->
    <div v-if="error" class="bg-error/10 border border-error text-error px-4 py-3 rounded-lg text-sm mb-4">
      <div class="flex items-center justify-between">
        <span>{{ error }}</span>
        <UButton
          label="Retry"
          size="xs"
          color="error"
          variant="soft"
          class="cursor-pointer"
          @click="fetchQuestions"
        />
      </div>
    </div>

    <!-- Body -->
    <div class="flex-1 overflow-y-auto space-y-4">
      <!-- Questions View -->
      <div v-if="viewState === 'questions'" class="space-y-4">
        <ProfileEnhancementQuestionRound
          ref="questionRoundRef"
          :round="currentRound <= 1 ? 1 : 2"
          :question-groups="questionGroups"
          :story-notes="[]"
          :is-loading="isLoadingQuestions"
          @proceed="handleQuestionRoundProceed"
          @back="handleClose"
          @cancel="handleClose"
        />
      </div>

      <!-- Preview View -->
      <div v-else-if="viewState === 'preview'" class="space-y-4">
        <ProfileHeroEnhancementResultPreview
          :results="results"
          :is-loading="isLoadingSynthesis"
          @back="handlePreviewBack"
          @accept="handleAcceptResults"
        />
      </div>
    </div>

    <!-- Footer -->
    <div v-if="viewState === 'questions' && !isLoading && questionGroups.length > 0" class="flex items-center justify-between gap-3 pt-4">
      <UButton
        label="Cancel"
        icon="i-lucide-x"
        color="neutral"
        variant="outline"
        class="cursor-pointer"
        @click="handleClose"
      />
      <UButton
        label="Submit Answers"
        icon="i-lucide-arrow-right"
        color="primary"
        class="cursor-pointer"
        @click="handleNext"
      />
    </div>
  </div>
</template>
