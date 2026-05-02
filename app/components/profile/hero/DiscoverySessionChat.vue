<script setup lang="ts">
import { ref, computed } from 'vue'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface CapturedMoment {
  id?: string | number
  title: string
  rawNotes: string
}

interface UIMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  parts: Array<{ type: 'text', text: string }>
}

interface Props {
  sessionId?: string | number
  profileId?: string
  mode?: 'moment_discovery' | 'experience_nudge_story'
  messages?: ChatMessage[]
  capturedMoments?: CapturedMoment[]
  isLoading?: boolean
  error?: string | null
  sessionStatus?: 'active' | 'paused' | 'completed' | 'abandoned'
}

const props = withDefaults(defineProps<Props>(), {
  sessionId: '',
  profileId: '',
  mode: 'moment_discovery',
  messages: () => [],
  capturedMoments: () => [],
  isLoading: false,
  error: null,
  sessionStatus: 'active'
})

const emit = defineEmits<{
  close: []
  sendMessage: [payload: { userMessage: string, capturedMoments: CapturedMoment[] }]
  endSession: []
  developStory: []
  saveMoments: [payload: { capturedMoments: CapturedMoment[] }]
}>()

const userMessage = ref('')

const uiMessages = computed<UIMessage[]>(() =>
  props.messages.map((msg, index) => ({
    id: `msg-${index}`,
    role: msg.role,
    parts: [{ type: 'text', text: msg.content }]
  }))
)

const getMessageText = (message: { parts?: Array<{ type?: string, text?: string }> }) => {
  const textPart = message.parts?.find(part => part.type === 'text')
  return textPart?.text ?? ''
}

const chatStatus = computed<'ready' | 'submitted' | 'streaming' | 'error'>(() => {
  if (props.error) return 'error'
  if (props.isLoading) return 'streaming'
  return 'ready'
})

const isSessionComplete = computed(() => props.sessionStatus === 'completed')
const isNudgeStoryMode = computed(() => props.mode === 'experience_nudge_story')

function handleSendMessage(event?: Event) {
  if (event) {
    event.preventDefault()
  }

  const trimmed = userMessage.value.trim()
  if (!trimmed || props.isLoading || isSessionComplete.value) return

  emit('sendMessage', {
    userMessage: trimmed,
    capturedMoments: props.capturedMoments
  })

  userMessage.value = ''
}

function handleEndSession() {
  if (!isNudgeStoryMode.value && props.capturedMoments.length > 0) {
    emit('saveMoments', { capturedMoments: props.capturedMoments })
  }
  emit('endSession')
}

function handleDevelopStory() {
  emit('developStory')
}
</script>

<template>
  <div class="h-full w-full flex flex-col">
    <!-- Header: Title + Close Button -->
    <div class="flex items-start justify-between pb-4">
      <div class="flex-1">
        <h2 class="text-lg font-semibold mb-2">
          {{ isNudgeStoryMode ? 'HERO Story Interview' : 'Discovery Session' }}
        </h2>
        <p class="text-sm text-muted">
          {{ isNudgeStoryMode ? 'Turn this experience into a focused HERO story' : 'Share your achievement stories and capture key moments' }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <UButton
          icon="i-lucide-x"
          color="neutral"
          variant="ghost"
          size="sm"
          class="cursor-pointer shrink-0"
          @click="emit('close')"
        />
      </div>
    </div>

    <!-- Body: Scrollable Content -->
    <div class="flex-1 overflow-y-auto space-y-6">
      <!-- Info Banner -->
      <div class="bg-base border border-default rounded-lg p-4">
        <div class="flex gap-3">
          <UIcon name="i-lucide-sparkles" class="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
          <div class="text-sm text-foreground">
            <p class="font-medium mb-1">
              {{ isNudgeStoryMode ? 'Story Interview in Progress' : 'Discovery Session in Progress' }}
            </p>
            <p class="text-muted text-xs">
              {{ isNudgeStoryMode ? 'Answer a few focused questions so we can shape this into a HERO story.' : 'Share your achievement stories and we\'ll capture key moments. You can refine them later or develop them into full HERO stories.' }}
            </p>
          </div>
        </div>
      </div>

      <div v-if="error" class="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600">
        {{ error }}
      </div>

      <!-- Captured Moments Section -->
      <div v-if="!isNudgeStoryMode" class="space-y-3">
        <!-- Moments Header -->
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-foreground uppercase tracking-wide flex items-center gap-2">
            <UIcon name="i-lucide-sparkles" class="w-5 h-5 text-teal-500" />
            Captured Moments
          </h3>
          <span class="text-xs text-muted">{{ capturedMoments.length }} captured</span>
        </div>

        <!-- Moments Display -->
        <div v-if="capturedMoments.length > 0" class="border-2 border-teal-500 bg-teal-500/10 p-4 rounded-lg">
          <ul class="space-y-2">
            <li
              v-for="(moment, index) in capturedMoments"
              :key="moment.id ?? `captured-${index}`"
              class="flex gap-2 text-sm text-foreground items-start"
            >
              <span class="text-teal-500 text-2xl">•</span>
              <div>
                <p class="font-medium">
                  {{ moment.title }}
                </p>
                <p class="text-xs text-muted mt-1">
                  {{ moment.rawNotes }}
                </p>
              </div>
            </li>
          </ul>
        </div>
        <div v-else class="flex items-start gap-3 border-2 border-teal-500 bg-teal-500/10 p-4 rounded-lg">
          <UIcon name="i-lucide-lightbulb" class="w-4 h-4 text-muted shrink-0 mt-0.5" />
          <div class="text-sm text-muted">
            <p class="font-medium mb-1">
              No moments captured yet
            </p>
            <p class="text-xs">
              Share your achievements in the chat below and we'll capture them.
            </p>
          </div>
        </div>
      </div>

      <!-- Chat Section -->
      <div class="flex-1 flex flex-col min-h-[400px]">
        <UChatMessages
          :messages="uiMessages"
          :status="chatStatus"
          :should-auto-scroll="true"
          :assistant="{
            icon: 'i-lucide-sparkles',
            variant: 'naked',
            side: 'left'
          }"
          :user="{
            variant: 'soft',
            side: 'right'
          }"
          class="flex-1 min-h-0"
        >
          <template #content="{ message }">
            <p class="text-sm whitespace-pre-wrap">
              {{ getMessageText(message) }}
            </p>
          </template>
        </UChatMessages>
      </div>
    </div>

    <div v-if="isSessionComplete" class="border border-emerald-500/40 bg-emerald-500/10 rounded-lg p-4">
      <div class="flex items-center justify-between gap-4">
        <div>
          <p class="text-sm font-medium text-foreground">
            {{ isNudgeStoryMode ? 'Ready to continue in the HERO story panel?' : 'Ready to turn this into a HERO story?' }}
          </p>
          <p class="text-xs text-muted">
            {{ isNudgeStoryMode ? 'Open the linked story and keep shaping the details.' : 'Start the story builder with your captured moment.' }}
          </p>
        </div>
        <UButton
          :label="isNudgeStoryMode ? 'Open Story' : 'Develop Story'"
          icon="i-lucide-sparkles"
          color="primary"
          size="sm"
          class="cursor-pointer shrink-0"
          @click="handleDevelopStory"
        />
      </div>
    </div>

    <!-- Footer: Chat Input -->
    <div class="flex items-center gap-2">
      <UChatPrompt
        v-model="userMessage"
        :placeholder="isNudgeStoryMode ? 'Answer the HERO story question here...' : 'Share more about your achievement here...'"
        variant="subtle"
        :disabled="isLoading || isSessionComplete"
        @submit="handleSendMessage"
      >
        <UChatPromptSubmit
          :status="chatStatus"
          icon="i-lucide-send"
          color="primary"
          variant="ghost"
          @click="handleSendMessage"
        />
      </UChatPrompt>
      <UButton
        :label="isNudgeStoryMode ? 'Finish' : 'End'"
        color="neutral"
        variant="ghost"
        size="sm"
        class="cursor-pointer shrink-0"
        :disabled="isLoading"
        @click="handleEndSession"
      />
    </div>
  </div>
</template>
