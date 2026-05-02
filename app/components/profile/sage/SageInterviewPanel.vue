<script setup lang="ts">
import type { Experience } from '#shared/types/careerId'
import type { ResponsibilityInterviewResult, SageCollectedAnswer, SageQuestion } from '#shared/types/enhancement'

type InterviewMode = 'notes_help' | 'role_summary'

type PanelPhase
  = | 'loading'
    | 'questioning'
    | 'generating-output'
    | 'review'
    | 'confirm-overwrite'
    | 'saving'

const props = defineProps<{
  mode: InterviewMode
  experience: Experience
  experienceId: number
  profileId: string
}>()

const emit = defineEmits<{
  saved: []
  applySummary: [summary: string]
  close: []
}>()

const sageAIStore = useSageAIStore()
const toast = useToast()

const phase = ref<PanelPhase>('loading')
const questions = ref<SageQuestion[]>([])
const currentQuestionIndex = ref(0)
const allAnswers = ref<SageCollectedAnswer[]>([])
const currentBatchAnswerStartIndex = ref(0)
const round = ref(1)
const editableOutput = ref('')
const requestError = ref<string | null>(null)
const isSubmitting = ref(false)

const modeLabel = computed(() =>
  props.mode === 'notes_help' ? 'Role notes' : 'Role summary'
)

const existingSageNotes = computed(() =>
  sageAIStore.experienceSageNotesFor(props.profileId, props.experienceId)?.content ?? null
)

const existingSummary = computed(() =>
  props.experience.summary ?? null
)

const hasExistingContent = computed(() =>
  props.mode === 'notes_help'
    ? !!existingSageNotes.value
    : !!existingSummary.value
)

const currentQuestion = computed(() =>
  questions.value[currentQuestionIndex.value] ?? null
)

const currentAnswer = computed(() =>
  allAnswers.value[currentBatchAnswerStartIndex.value + currentQuestionIndex.value]?.answer
)

const progressLabel = computed(() =>
  questions.value.length > 0
    ? `Round ${round.value} · Question ${currentQuestionIndex.value + 1} of ${questions.value.length}`
    : `Round ${round.value}`
)

const loadingLabel = computed(() =>
  phase.value === 'generating-output'
    ? 'Reviewing your answers...'
    : 'Preparing questions...'
)

const experiencePayload = computed(() => ({
  title: props.experience.title,
  employer: props.experience.employer,
  employmentType: props.experience.employmentType,
  summary: props.experience.summary ?? undefined,
  highlights: props.experience.highlights,
  contextNotes: props.experience.contextNotes ?? undefined,
  sageNotes: existingSageNotes.value ?? undefined
}))

async function requestNextResult() {
  isSubmitting.value = true
  requestError.value = null

  try {
    const response = await $fetch<{
      success: boolean
      data: ResponsibilityInterviewResult
    }>('/api/ai/experience/responsibility', {
      method: 'POST',
      body: {
        mode: props.mode,
        experience: experiencePayload.value,
        answers: allAnswers.value
      }
    })

    if (!response.success) throw new Error('Responsibility interview request failed')

    if (response.data.done) {
      editableOutput.value = response.data.output
      questions.value = []
      currentQuestionIndex.value = 0
      phase.value = 'review'
      return
    }

    currentBatchAnswerStartIndex.value = allAnswers.value.length
    questions.value = response.data.questions
    currentQuestionIndex.value = 0
    phase.value = 'questioning'
  } catch (error: unknown) {
    const e = error as { data?: { error?: { message?: string } }, message?: string }
    requestError.value
      = e?.data?.error?.message
        || e?.message
        || 'Something went wrong'
    phase.value = questions.value.length > 0 ? 'questioning' : 'loading'
  } finally {
    isSubmitting.value = false
  }
}

async function handleAnswer(questionId: string, value: string | string[], questionText: string) {
  if (!currentQuestion.value || isSubmitting.value) return

  const answerIndex = currentBatchAnswerStartIndex.value + currentQuestionIndex.value
  const nextAnswers = allAnswers.value.slice(0, answerIndex)
  nextAnswers[answerIndex] = {
    questionId,
    questionText,
    answer: value
  }
  allAnswers.value = nextAnswers

  if (currentQuestionIndex.value < questions.value.length - 1) {
    currentQuestionIndex.value++
    return
  }

  phase.value = 'generating-output'
  round.value++
  await requestNextResult()
}

function goBack() {
  if (currentQuestionIndex.value > 0 && !isSubmitting.value) {
    currentQuestionIndex.value--
  }
}

function startSave() {
  if (props.mode === 'role_summary') {
    emit('applySummary', editableOutput.value.trim())
    return
  }

  if (hasExistingContent.value) {
    phase.value = 'confirm-overwrite'
  } else {
    save()
  }
}

async function save() {
  phase.value = 'saving'
  try {
    if (props.mode === 'notes_help') {
      await $fetch('/api/ai/sage/notes', {
        method: 'PUT',
        body: {
          profileId: props.profileId,
          targetType: 'experience',
          targetId: String(props.experienceId),
          content: editableOutput.value.trim()
        }
      })
      await sageAIStore.loadSageNotesForExperience(props.profileId, props.experienceId)
    }
    toast.add({
      title: `${modeLabel.value} saved`,
      description: 'Your experience has been updated.',
      icon: 'i-lucide-check',
      color: 'success'
    })
    emit('saved')
  } catch (error: unknown) {
    const e = error as { message?: string }
    toast.add({
      title: 'Save failed',
      description: e?.message || 'Could not save. Please try again.',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
    phase.value = 'review'
  }
}

onMounted(() => {
  requestNextResult()
})
</script>

<template>
  <div class="h-full flex flex-col gap-4">
    <div
      v-if="phase === 'loading' || phase === 'generating-output'"
      class="flex-1 flex flex-col items-center justify-center gap-3"
    >
      <UIcon
        name="i-lucide-loader-circle"
        class="w-8 h-8 text-primary animate-spin"
      />
      <p class="text-sm text-muted">
        {{ loadingLabel }}
      </p>
      <UAlert
        v-if="requestError"
        color="error"
        variant="subtle"
        title="Something went wrong"
        :description="requestError"
        class="max-w-md"
      />
      <UButton
        v-if="requestError"
        label="Try again"
        color="primary"
        variant="soft"
        class="cursor-pointer"
        :loading="isSubmitting"
        @click="requestNextResult"
      />
    </div>

    <template v-else-if="phase === 'questioning' && currentQuestion">
      <div class="rounded-lg border border-default bg-elevated/50 p-3">
        <p class="text-xs font-medium text-muted uppercase tracking-wide mb-1">
          {{ modeLabel }}
        </p>
        <p class="text-sm text-muted">
          Answer a few focused questions so Sage can produce a more predictable result.
        </p>
      </div>

      <UAlert
        v-if="requestError"
        color="error"
        variant="subtle"
        title="Something went wrong"
        :description="requestError"
      />
      <UButton
        v-if="requestError"
        label="Try again"
        color="primary"
        variant="soft"
        class="cursor-pointer self-start"
        :loading="isSubmitting"
        @click="requestNextResult"
      />

      <ProfileSageQuestionView
        :question="currentQuestion"
        :progress="progressLabel"
        :is-loading="isSubmitting || !!requestError"
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
          class="cursor-pointer"
          @click="emit('close')"
        />
      </div>
    </template>

    <template v-else-if="phase === 'review'">
      <div class="flex-1 flex flex-col gap-4">
        <div class="bg-emerald-500/10 border border-emerald-200/70 dark:border-emerald-700/60 rounded-2xl p-5 flex flex-col gap-4">
          <div class="flex gap-3 items-center">
            <UIcon
              name="i-lucide-check-circle"
              class="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0"
            />
            <p class="font-medium text-sm text-emerald-950 dark:text-emerald-200">
              {{ modeLabel }} ready — review and edit before saving
            </p>
          </div>

          <UTextarea
            v-model="editableOutput"
            autoresize
            :rows="6"
            class="w-full"
          />
        </div>

        <div class="flex justify-end gap-2">
          <UButton
            label="Discard"
            color="neutral"
            variant="ghost"
            class="cursor-pointer"
            @click="emit('close')"
          />
          <UButton
            :label="mode === 'role_summary' ? 'Use in summary field' : 'Save'"
            color="primary"
            icon="i-lucide-check"
            class="cursor-pointer"
            @click="startSave"
          />
        </div>
      </div>
    </template>

    <template v-else-if="phase === 'confirm-overwrite'">
      <div class="flex-1 flex flex-col gap-4">
        <UAlert
          color="warning"
          variant="subtle"
          icon="i-lucide-alert-triangle"
          :title="`Overwrite existing ${modeLabel.toLowerCase()}?`"
          :description="`You already have content for this field. Saving will replace it.`"
        />

        <div class="rounded-lg border border-default p-3">
          <p class="text-xs font-medium text-muted uppercase tracking-wide mb-1">
            Current content
          </p>
          <p class="text-sm whitespace-pre-wrap text-muted">
            {{ mode === 'notes_help' ? existingSageNotes : existingSummary }}
          </p>
        </div>

        <div class="rounded-lg border border-emerald-200/70 dark:border-emerald-700/60 bg-emerald-500/10 p-3">
          <p class="text-xs font-medium text-muted uppercase tracking-wide mb-1">
            New content
          </p>
          <p class="text-sm whitespace-pre-wrap">
            {{ editableOutput }}
          </p>
        </div>

        <div class="flex justify-end gap-2">
          <UButton
            label="Keep existing"
            color="neutral"
            variant="ghost"
            class="cursor-pointer"
            @click="phase = 'review'"
          />
          <UButton
            label="Yes, overwrite"
            color="primary"
            icon="i-lucide-check"
            class="cursor-pointer"
            @click="save"
          />
        </div>
      </div>
    </template>

    <div
      v-else-if="phase === 'saving'"
      class="flex-1 flex flex-col items-center justify-center gap-3"
    >
      <UIcon
        name="i-lucide-loader-circle"
        class="w-8 h-8 text-primary animate-spin"
      />
      <p class="text-sm text-muted">
        Saving…
      </p>
    </div>
  </div>
</template>
