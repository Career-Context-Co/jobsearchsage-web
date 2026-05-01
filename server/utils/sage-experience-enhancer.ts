import { createGateway, generateText } from 'ai'

const apiKey = useRuntimeConfig().aiGatewayApiKey
if (!apiKey) {
  throw new Error('AI Gateway API Key is not set')
}

const gateway = createGateway({
  apiKey: apiKey,
})

export interface SageAchievementExperience {
  title: string
  employer: string
  summary?: string
}

export interface SageAchievementAnswer {
  questionId: string
  answer: string
}

export interface SageAchievementQuestion {
  id: string
  text: string
}

export type SageInterviewMode = 'notes_help' | 'role_summary'

export interface SageInterviewMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface SageInterviewExperience {
  title: string
  employer: string
  employmentType?: string
  summary?: string | null
  highlights?: string[]
  contextNotes?: string | null
  sageNotes?: string | null
}

export type SageInterviewResult =
  | { done: false; message: string }
  | { done: true; output: string }

export class SageExperienceEnhancementError extends Error {
  constructor(
    message: string,
    public code: 'TIMEOUT' | 'INVALID_INPUT' | 'AI_PROVIDER_ERROR',
    public details?: any
  ) {
    super(message)
    this.name = 'SageExperienceEnhancementError'
  }
}

function validateExperience(experience: SageAchievementExperience): void {
  if (!experience || typeof experience !== 'object') {
    throw new SageExperienceEnhancementError('experience is required', 'INVALID_INPUT')
  }

  if (!experience.title || typeof experience.title !== 'string') {
    throw new SageExperienceEnhancementError('experience.title is required and must be a string', 'INVALID_INPUT')
  }

  if (!experience.employer || typeof experience.employer !== 'string') {
    throw new SageExperienceEnhancementError('experience.employer is required and must be a string', 'INVALID_INPUT')
  }

  if (experience.summary !== undefined && typeof experience.summary !== 'string') {
    throw new SageExperienceEnhancementError('experience.summary must be a string when provided', 'INVALID_INPUT')
  }
}

function validateBullet(bullet: string): void {
  if (typeof bullet !== 'string' || bullet.trim().length === 0) {
    throw new SageExperienceEnhancementError('bullet is required and must be a non-empty string', 'INVALID_INPUT')
  }
}

function validateAnswers(answers: SageAchievementAnswer[]): void {
  if (!Array.isArray(answers) || answers.length === 0) {
    throw new SageExperienceEnhancementError('answers must be a non-empty array', 'INVALID_INPUT')
  }

  answers.forEach((entry, index) => {
    if (!entry || typeof entry !== 'object') {
      throw new SageExperienceEnhancementError(`answers[${index}] must be an object`, 'INVALID_INPUT')
    }

    if (typeof entry.questionId !== 'string' || entry.questionId.trim().length === 0) {
      throw new SageExperienceEnhancementError(`answers[${index}].questionId must be a non-empty string`, 'INVALID_INPUT')
    }

    if (typeof entry.answer !== 'string') {
      throw new SageExperienceEnhancementError(`answers[${index}].answer must be a string`, 'INVALID_INPUT')
    }
  })
}

function parseQuestionsResponse(response: string): SageAchievementQuestion[] {
  try {
    let cleanResponse = response.trim()
    if (cleanResponse.startsWith('```')) {
      const start = cleanResponse.indexOf('{')
      const end = cleanResponse.lastIndexOf('}')
      if (start !== -1 && end !== -1 && end > start) {
        cleanResponse = cleanResponse.substring(start, end + 1)
      }
    }

    const parsed = JSON.parse(cleanResponse)
    if (!Array.isArray(parsed.questions)) {
      throw new SageExperienceEnhancementError('AI response missing questions array', 'AI_PROVIDER_ERROR')
    }

    const questions = parsed.questions.map((item: any, index: number) => ({
      id: typeof item.id === 'string' && item.id.trim().length > 0 ? item.id : `q${index + 1}`,
      text: typeof item.text === 'string' ? item.text.trim() : '',
    }))

    if (questions.length === 0 || questions.some((item: SageAchievementQuestion) => item.text.length === 0)) {
      throw new SageExperienceEnhancementError('AI response returned invalid questions', 'AI_PROVIDER_ERROR')
    }

    return questions
  } catch (error) {
    if (error instanceof SageExperienceEnhancementError) {
      throw error
    }

    throw new SageExperienceEnhancementError('Failed to parse questions response', 'AI_PROVIDER_ERROR')
  }
}

function parseImprovedBulletResponse(response: string): string {
  try {
    let cleanResponse = response.trim()
    if (cleanResponse.startsWith('```')) {
      const start = cleanResponse.indexOf('{')
      const end = cleanResponse.lastIndexOf('}')
      if (start !== -1 && end !== -1 && end > start) {
        cleanResponse = cleanResponse.substring(start, end + 1)
      }
    }

    const parsed = JSON.parse(cleanResponse)
    if (typeof parsed.improvedBullet !== 'string' || parsed.improvedBullet.trim().length === 0) {
      throw new SageExperienceEnhancementError('AI response missing improvedBullet', 'AI_PROVIDER_ERROR')
    }

    return parsed.improvedBullet.trim()
  } catch (error) {
    if (error instanceof SageExperienceEnhancementError) {
      throw error
    }

    throw new SageExperienceEnhancementError('Failed to parse improved bullet response', 'AI_PROVIDER_ERROR')
  }
}

async function runWithTimeout(promptRunner: Promise<{ text: string }>): Promise<{ text: string }> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new SageExperienceEnhancementError('Enhancement request timed out after 10 seconds', 'TIMEOUT'))
    }, 10000)
  })

  return Promise.race([promptRunner, timeoutPromise])
}

function validateInterviewExperience(experience: SageInterviewExperience): void {
  if (!experience || typeof experience !== 'object') {
    throw new SageExperienceEnhancementError('experience is required', 'INVALID_INPUT')
  }

  if (!experience.title || typeof experience.title !== 'string') {
    throw new SageExperienceEnhancementError('experience.title is required and must be a string', 'INVALID_INPUT')
  }

  if (!experience.employer || typeof experience.employer !== 'string') {
    throw new SageExperienceEnhancementError('experience.employer is required and must be a string', 'INVALID_INPUT')
  }

  if (experience.summary !== undefined && experience.summary !== null && typeof experience.summary !== 'string') {
    throw new SageExperienceEnhancementError('experience.summary must be a string when provided', 'INVALID_INPUT')
  }

  if (experience.contextNotes !== undefined && experience.contextNotes !== null && typeof experience.contextNotes !== 'string') {
    throw new SageExperienceEnhancementError('experience.contextNotes must be a string when provided', 'INVALID_INPUT')
  }

  if (experience.sageNotes !== undefined && experience.sageNotes !== null && typeof experience.sageNotes !== 'string') {
    throw new SageExperienceEnhancementError('experience.sageNotes must be a string when provided', 'INVALID_INPUT')
  }

  if (experience.highlights !== undefined && !Array.isArray(experience.highlights)) {
    throw new SageExperienceEnhancementError('experience.highlights must be an array when provided', 'INVALID_INPUT')
  }
}

function validateConversationHistory(conversationHistory: SageInterviewMessage[]): void {
  if (!Array.isArray(conversationHistory)) {
    throw new SageExperienceEnhancementError('conversationHistory must be an array', 'INVALID_INPUT')
  }

  conversationHistory.forEach((entry, index) => {
    if (!entry || typeof entry !== 'object') {
      throw new SageExperienceEnhancementError(`conversationHistory[${index}] must be an object`, 'INVALID_INPUT')
    }

    if (entry.role !== 'user' && entry.role !== 'assistant') {
      throw new SageExperienceEnhancementError(`conversationHistory[${index}].role must be "user" or "assistant"`, 'INVALID_INPUT')
    }

    if (typeof entry.content !== 'string' || entry.content.trim().length === 0) {
      throw new SageExperienceEnhancementError(`conversationHistory[${index}].content must be a non-empty string`, 'INVALID_INPUT')
    }
  })
}

function formatConversationHistory(conversationHistory: SageInterviewMessage[]): string {
  if (conversationHistory.length === 0) {
    return '(no prior conversation)'
  }

  return conversationHistory.map((entry) => `${entry.role}: ${entry.content}`).join('\n')
}

export async function conductInterview(
  mode: SageInterviewMode,
  experience: SageInterviewExperience,
  conversationHistory: SageInterviewMessage[]
): Promise<SageInterviewResult> {
  if (mode !== 'notes_help' && mode !== 'role_summary') {
    throw new SageExperienceEnhancementError('mode must be "notes_help" or "role_summary"', 'INVALID_INPUT')
  }

  validateInterviewExperience(experience)
  validateConversationHistory(conversationHistory)

  const userTurnCount = conversationHistory.filter((entry) => entry.role === 'user').length
  const shouldWrapUp = userTurnCount >= 3
  const conversationText = formatConversationHistory(conversationHistory)
  const modeGoal = mode === 'notes_help'
    ? 'Draft clear, practical Sage notes the user can save as read-only assistant notes.'
    : 'Draft a concise professional role summary suitable for the experience summary field.'

  const experienceContext = `Experience context:
- Title: ${experience.title}
- Employer: ${experience.employer}
- Employment Type: ${experience.employmentType || '(not provided)'}
- Existing Summary: ${experience.summary || '(not provided)'}
- Highlights: ${(experience.highlights && experience.highlights.length > 0) ? experience.highlights.join(' | ') : '(not provided)'}
- Context Notes: ${experience.contextNotes || '(not provided)'}
- Existing Sage Notes: ${experience.sageNotes || '(not provided)'}`

  if (shouldWrapUp) {
    const completionPrompt = `You are wrapping up an interview.

Mode: ${mode}
Goal: ${modeGoal}

${experienceContext}

Conversation history:
${conversationText}

Write the final output text for the user. Do not ask another question.`

    try {
      const result = await runWithTimeout(generateText({
        model: gateway('openai/gpt-4o-mini'),
        prompt: completionPrompt,
        temperature: 0.4,
        maxRetries: 2,
      }))

      const output = result.text.trim()
      if (!output) {
        throw new SageExperienceEnhancementError('Interview completion returned empty output', 'AI_PROVIDER_ERROR')
      }

      return { done: true, output }
    } catch (error: any) {
      if (error instanceof SageExperienceEnhancementError) {
        throw error
      }

      throw new SageExperienceEnhancementError(
        'Failed to generate interview completion output',
        'AI_PROVIDER_ERROR',
        { originalError: error?.message }
      )
    }
  }

  const nextTurnPrompt = `You are conducting an interview.

Mode: ${mode}
Goal: ${modeGoal}

${experienceContext}

Conversation history:
${conversationText}

Write exactly one helpful next interviewer message that moves the user toward the goal. Keep it concise.`

  try {
    const result = await runWithTimeout(generateText({
      model: gateway('openai/gpt-4o-mini'),
      prompt: nextTurnPrompt,
      temperature: 0.5,
      maxRetries: 2,
    }))

    const message = result.text.trim()
    if (!message) {
      throw new SageExperienceEnhancementError('Interview turn returned empty message', 'AI_PROVIDER_ERROR')
    }

    return { done: false, message }
  } catch (error: any) {
    if (error instanceof SageExperienceEnhancementError) {
      throw error
    }

    throw new SageExperienceEnhancementError(
      'Failed to generate interview response',
      'AI_PROVIDER_ERROR',
      { originalError: error?.message }
    )
  }
}

export async function generateAchievementQuestions(
  experience: SageAchievementExperience,
  bullet: string
): Promise<SageAchievementQuestion[]> {
  validateExperience(experience)
  validateBullet(bullet)

  const prompt = `You are helping a user strengthen one resume bullet.

Experience context:
- Title: ${experience.title}
- Employer: ${experience.employer}
- Summary: ${experience.summary || '(not provided)'}

Current bullet:
"${bullet}"

Task:
- Ask 3-5 concise follow-up questions that help improve impact, scope, and clarity.
- Questions must focus on missing facts (metrics, scale, ownership, outcomes).
- Return JSON only in this format:
{
  "questions": [
    { "id": "q1", "text": "..." }
  ]
}`

  try {
    const result = await runWithTimeout(generateText({
      model: gateway('openai/gpt-4o-mini'),
      prompt,
      temperature: 0.4,
      maxRetries: 2,
    }))

    return parseQuestionsResponse(result.text)
  } catch (error: any) {
    if (error instanceof SageExperienceEnhancementError) {
      throw error
    }

    throw new SageExperienceEnhancementError(
      'Failed to generate achievement questions',
      'AI_PROVIDER_ERROR',
      { originalError: error?.message }
    )
  }
}

export async function generateImprovedBullet(
  experience: SageAchievementExperience,
  bullet: string,
  answers: SageAchievementAnswer[]
): Promise<string> {
  validateExperience(experience)
  validateBullet(bullet)
  validateAnswers(answers)

  const formattedAnswers = answers
    .map((entry) => `- ${entry.questionId}: ${entry.answer}`)
    .join('\n')

  const prompt = `You are improving a resume bullet using user-provided clarifications.

Experience context:
- Title: ${experience.title}
- Employer: ${experience.employer}
- Summary: ${experience.summary || '(not provided)'}

Original bullet:
"${bullet}"

User answers:
${formattedAnswers}

Rules:
- Keep it factual and do not invent new details.
- Keep it concise and achievement-focused.
- Prefer concrete outcomes and scope when present in the answers.
- Return JSON only in this format:
{
  "improvedBullet": "..."
}`

  try {
    const result = await runWithTimeout(generateText({
      model: gateway('openai/gpt-4o-mini'),
      prompt,
      temperature: 0.3,
      maxRetries: 2,
    }))

    return parseImprovedBulletResponse(result.text)
  } catch (error: any) {
    if (error instanceof SageExperienceEnhancementError) {
      throw error
    }

    throw new SageExperienceEnhancementError(
      'Failed to generate improved bullet',
      'AI_PROVIDER_ERROR',
      { originalError: error?.message }
    )
  }
}
