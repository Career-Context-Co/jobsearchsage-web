<script setup lang="ts">
import type { Experience } from '#shared/types/careerId'
import type { SageCollectedAnswer, SageQuestion } from '#shared/types/enhancement'

type Phase = 'loading-questions' | 'answering' | 'loading-result' | 'review' | 'error'

const props = defineProps<{
  experience: Pick<Experience, 'title' | 'employer' | 'summary'>
  bullet: string
  experienceId: number
  profileId: string
}>()

const emit = defineEmits<{
  confirm: [improvedBullet: string]
  discard: []
}>()

const toast = useToast()

const phase = ref<Phase>('loading-questions')
const questions = ref<SageQuestion[]>([])
const currentQuestionIndex = ref(0)
const collectedAnswers = ref<SageCollectedAnswer[]>([])
const improvedBullet = ref('')
const requestError = ref<string | null>(null)
const isProcessing = ref(false)

const currentQuestion = computed(() => questions.value[currentQuestionIndex.value] ?? null)
const currentAnswer = computed(() =>
  collectedAnswers.value[currentQuestionIndex.value]?.answer
)

const progressLabel = computed(() =>
  questions.value.length > 0
    ? `Question ${currentQuestionIndex.value + 1} of ${questions.value.length}`
    : ''
)

const experiencePayload = computed(() => ({
  title: props.experience.title,
  employer: props.experience.employer,
  ...(props.experience.summary != null && props.experience.summary !== ''
    ? { summary: props.experience.summary }
    : {})
}))

async function loadQuestions() {
  phase.value = 'loading-questions'
  requestError.value = null
  questions.value = []
  currentQuestionIndex.value = 0
  collectedAnswers.value = []
  improvedBullet.value = ''

  try {
    const response = await $fetch<{
      success: boolean
      data: { phase: 'questions', questions: SageQuestion[] }
    }>('/api/ai/experience/enhance-achievement', {
      method: 'POST',
      body: { experience: experiencePayload.value, bullet: props.bullet }
    })

    if (!response.success || !response.data?.questions?.length) {
      throw new Error('No questions returned')
    }

    questions.value = response.data.questions
    phase.value = 'answering'
  } catch (error: unknown) {
    const e = error as { data?: { error?: { message?: string } }, message?: string }
    requestError.value = e?.data?.error?.message || e?.message || 'Could not load questions'
    phase.value = 'error'
  }
}

async function handleAnswer(questionId: string, value: string | string[], questionText: string) {
  if (!currentQuestion.value || isProcessing.value) return

  const nextAnswers = collectedAnswers.value.slice(0, currentQuestionIndex.value)
  nextAnswers[currentQuestionIndex.value] = { questionId, questionText, answer: value }
  collectedAnswers.value = nextAnswers

  if (currentQuestionIndex.value < questions.value.length - 1) {
    currentQuestionIndex.value++
  } else {
    await generateBullet()
  }
}

function goBack() {
  if (currentQuestionIndex.value > 0 && !isProcessing.value) {
    currentQuestionIndex.value--
  }
}

async function generateBullet() {
  phase.value = 'loading-result'
  isProcessing.value = true
  requestError.value = null

  try {
    const response = await $fetch<{
      success: boolean
      data: { phase: 'result', improvedBullet: string }
    }>('/api/ai/experience/enhance-achievement', {
      method: 'POST',
      body: {
        experience: experiencePayload.value,
        bullet: props.bullet,
        answers: collectedAnswers.value
      }
    })

    if (!response.success || typeof response.data?.improvedBullet !== 'string') {
      throw new Error('No improved bullet returned')
    }

    improvedBullet.value = response.data.improvedBullet
    phase.value = 'review'
  } catch (error: unknown) {
    const e = error as { data?: { error?: { message?: string } }, message?: string }
    requestError.value = e?.data?.error?.message || e?.message || 'Could not generate improved bullet'
    phase.value = 'error'
    toast.add({
      title: 'Enhancement failed',
      description: requestError.value,
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    isProcessing.value = false
  }
}

function handleDiscard() {
  emit('discard')
}

onMounted(() => {
  if (!props.bullet.trim()) {
    requestError.value = 'This achievement is empty.'
    phase.value = 'error'
    return
  }
  loadQuestions()
})
</script>

<template>
  <div class="flex flex-col gap-4 min-h-[320px]">
    <!-- Loading questions -->
    <div
      v-if="phase === 'loading-questions'"
      class="flex-1 flex flex-col items-center justify-center gap-3 py-12"
    >
      <UIcon
        name="i-lucide-loader-circle"
        class="w-8 h-8 text-primary animate-spin"
      />
      <p class="text-sm text-muted">
        Preparing questions…
      </p>
    </div>

    <!-- Question flow (turn-by-turn) -->
    <template v-else-if="phase === 'answering' && currentQuestion">
      <!-- Original bullet context -->
      <div class="rounded-lg border border-default bg-elevated/50 p-3">
        <p class="text-xs font-medium text-muted uppercase tracking-wide mb-1">
          Achievement
        </p>
        <p class="text-sm whitespace-pre-wrap">
          {{ bullet }}
        </p>
      </div>

      <ProfileSageQuestionView
        :question="currentQuestion"
        :progress="progressLabel"
        :is-loading="isProcessing"
        :initial-answer="currentAnswer"
        :can-go-back="currentQuestionIndex > 0"
        @answer="handleAnswer"
        @back="goBack"
      />

      <div class="flex justify-start">
        <UButton
          label="Cancel"
          color="neutral"
          variant="ghost"
          size="sm"
          class="cursor-pointer"
          @click="handleDiscard"
        />
      </div>
    </template>

    <!-- Generating result -->
    <div
      v-else-if="phase === 'loading-result'"
      class="flex-1 flex flex-col items-center justify-center gap-3 py-12"
    >
      <UIcon
        name="i-lucide-loader-circle"
        class="w-8 h-8 text-primary animate-spin"
      />
      <p class="text-sm text-muted">
        Generating improved bullet…
      </p>
    </div>

    <!-- Review -->
    <div
      v-else-if="phase === 'review'"
      class="space-y-4"
    >
      <div class="grid gap-3 sm:grid-cols-2">
        <div class="rounded-lg border border-default p-3">
          <p class="text-xs font-medium text-muted mb-1">
            Original
          </p>
          <p class="text-sm whitespace-pre-wrap">
            {{ bullet }}
          </p>
        </div>
        <div class="rounded-lg border border-primary/30 bg-primary/5 p-3">
          <p class="text-xs font-medium text-muted mb-1">
            Sage suggestion
          </p>
          <p class="text-sm whitespace-pre-wrap">
            {{ improvedBullet }}
          </p>
        </div>
      </div>

      <div class="flex flex-wrap gap-2 justify-end">
        <UButton
          label="Discard"
          color="neutral"
          variant="ghost"
          class="cursor-pointer"
          @click="handleDiscard"
        />
        <UButton
          label="Use this bullet"
          color="primary"
          icon="i-lucide-check"
          class="cursor-pointer"
          @click="emit('confirm', improvedBullet)"
        />
      </div>
    </div>

    <!-- Error -->
    <div
      v-else-if="phase === 'error'"
      class="flex flex-col gap-4"
    >
      <UAlert
        color="error"
        variant="subtle"
        title="Something went wrong"
        :description="requestError ?? undefined"
      />
      <div class="flex justify-end gap-2">
        <UButton
          label="Cancel"
          color="neutral"
          variant="ghost"
          class="cursor-pointer"
          @click="handleDiscard"
        />
        <UButton
          label="Try again"
          color="primary"
          variant="outline"
          class="cursor-pointer"
          @click="loadQuestions"
        />
      </div>
    </div>
  </div>
</template>
