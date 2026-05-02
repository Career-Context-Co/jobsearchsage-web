import { createGateway, generateText } from 'ai'
import { interceptSageQuestionEngineResponse, SageQuestionEngineInterceptorError } from '@@/server/utils/interceptors/sage-question-engine-interceptor'
import type { ResponsibilityInterviewResult, SageCollectedAnswer, SageQuestionType } from '#shared/types/enhancement'

const apiKey = useRuntimeConfig().aiGatewayApiKey
if (!apiKey) {
  throw new Error('AI Gateway API Key is not set')
}

const gateway = createGateway({
  apiKey: apiKey
})

export interface SageAchievementExperience {
  title: string
  employer: string
  summary?: string
}

export interface SageAchievementAnswer {
  questionId: string
  answer: string | string[]
}

export interface SageAchievementQuestionOption {
  id: string
  label: string
  emoji?: string
  allowCustom?: boolean
}

export interface SageAchievementQuestion {
  id: string
  text: string
  type: SageQuestionType
  options: SageAchievementQuestionOption[]
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

export type SageInterviewResult
  = | { done: false, message: string }
    | { done: true, output: string }

export interface SageHeroSignalExperience {
  highlights?: string[]
  summary?: string | null
  contextNotes?: string | null
  sageNotes?: string | null
}

export type SageHeroSignalResult
  = | { nudge: false }
    | { nudge: true, signal: string, context: string }

export class SageExperienceEnhancementError extends Error {
  constructor(
    message: string,
    public code: 'TIMEOUT' | 'INVALID_INPUT' | 'AI_PROVIDER_ERROR',
    public details?: unknown
  ) {
    super(message)
    this.name = 'SageExperienceEnhancementError'
  }
}

type JsonRecord = Record<string, unknown>

function isJsonRecord(value: unknown): value is JsonRecord {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function inferAchievementQuestionType(text: string, rawType: unknown): SageQuestionType {
  const normalizedType = rawType === 'multi_choice' || rawType === 'single_choice'
    ? rawType
    : null
  const lowerText = text.toLowerCase()
  const shouldAllowMultiple = [
    'measurable impact',
    'which impact',
    'which impacts',
    'what impact',
    'what impacts',
    'technologies',
    'tools',
    'stakeholders',
    'responsibilities',
    'outcomes',
    'select all'
  ].some(phrase => lowerText.includes(phrase))

  if (shouldAllowMultiple) {
    return 'multi_choice'
  }

  return normalizedType ?? 'single_choice'
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

    if (typeof entry.answer === 'string') {
      if (entry.answer.trim().length === 0) {
        throw new SageExperienceEnhancementError(`answers[${index}].answer must be non-empty`, 'INVALID_INPUT')
      }
      return
    }

    if (!Array.isArray(entry.answer) || entry.answer.length === 0 || entry.answer.some(item => typeof item !== 'string' || item.trim().length === 0)) {
      throw new SageExperienceEnhancementError(`answers[${index}].answer must be a non-empty string or string array`, 'INVALID_INPUT')
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

    const parsed = JSON.parse(cleanResponse) as JsonRecord
    if (!Array.isArray(parsed.questions)) {
      throw new SageExperienceEnhancementError('AI response missing questions array', 'AI_PROVIDER_ERROR')
    }

    const questions = parsed.questions.map((rawItem, index: number) => {
      const item = isJsonRecord(rawItem) ? rawItem : {}
      const id = typeof item.id === 'string' && item.id.trim().length > 0 ? item.id : `q${index + 1}`
      const text = typeof item.text === 'string' ? item.text.trim() : ''
      const type = inferAchievementQuestionType(text, item.type)
      const rawOptions = Array.isArray(item.options) ? item.options : []
      const options: SageAchievementQuestionOption[] = rawOptions.map((rawOpt, oi: number) => {
        const opt = isJsonRecord(rawOpt) ? rawOpt : {}
        return {
          id: typeof opt.id === 'string' ? opt.id : `${id}_o${oi + 1}`,
          label: typeof opt.label === 'string' ? opt.label.trim() : String(opt.label ?? ''),
          emoji: typeof opt.emoji === 'string' ? opt.emoji : undefined,
          allowCustom: opt.allowCustom === true
        }
      })
      return { id, text, type, options }
    })

    if (questions.length === 0 || questions.some((item: SageAchievementQuestion) => item.text.length === 0 || item.options.length === 0)) {
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

const SAGE_AI_TIMEOUT_MS = 20000

async function runWithTimeout(promptRunner: Promise<{ text: string }>): Promise<{ text: string }> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new SageExperienceEnhancementError('Enhancement request timed out after 20 seconds', 'TIMEOUT'))
    }, SAGE_AI_TIMEOUT_MS)
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

function validateResponsibilityAnswers(answers: SageCollectedAnswer[]): void {
  if (!Array.isArray(answers)) {
    throw new SageExperienceEnhancementError('answers must be an array', 'INVALID_INPUT')
  }

  answers.forEach((entry, index) => {
    if (!entry || typeof entry !== 'object') {
      throw new SageExperienceEnhancementError(`answers[${index}] must be an object`, 'INVALID_INPUT')
    }

    if (typeof entry.questionId !== 'string' || entry.questionId.trim().length === 0) {
      throw new SageExperienceEnhancementError(`answers[${index}].questionId must be a non-empty string`, 'INVALID_INPUT')
    }

    if (entry.questionText !== undefined && typeof entry.questionText !== 'string') {
      throw new SageExperienceEnhancementError(`answers[${index}].questionText must be a string when provided`, 'INVALID_INPUT')
    }

    if (typeof entry.answer === 'string') {
      if (entry.answer.trim().length === 0) {
        throw new SageExperienceEnhancementError(`answers[${index}].answer must be non-empty`, 'INVALID_INPUT')
      }
      return
    }

    if (!Array.isArray(entry.answer) || entry.answer.length === 0 || entry.answer.some(item => typeof item !== 'string' || item.trim().length === 0)) {
      throw new SageExperienceEnhancementError(`answers[${index}].answer must be a non-empty string or string array`, 'INVALID_INPUT')
    }
  })
}

function formatConversationHistory(conversationHistory: SageInterviewMessage[]): string {
  if (conversationHistory.length === 0) {
    return '(no prior conversation)'
  }

  return conversationHistory.map(entry => `${entry.role}: ${entry.content}`).join('\n')
}

function formatResponsibilityAnswers(answers: SageCollectedAnswer[]): string {
  if (answers.length === 0) {
    return '(no answers yet)'
  }

  return answers.map((entry) => {
    const answerText = Array.isArray(entry.answer)
      ? entry.answer.join(', ')
      : entry.answer
    const questionText = entry.questionText?.trim()
      ? ` (${entry.questionText.trim()})`
      : ''

    return `- ${entry.questionId}${questionText}: ${answerText}`
  }).join('\n')
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

  const userTurnCount = conversationHistory.filter(entry => entry.role === 'user').length
  const shouldWrapUp = userTurnCount >= 3
  const conversationText = formatConversationHistory(conversationHistory)

  // notes_help: omit highlights. Sage notes should capture missing role context, not restate bullets.
  // role_summary: omit highlights — responsibility descriptions should come from the conversation, not achievements.
  const notesHelpContext = `Experience context:
- Title: ${experience.title}
- Employer: ${experience.employer}
- Employment Type: ${experience.employmentType || '(not provided)'}
- Existing Summary (do not duplicate): ${experience.summary || '(not provided)'}
- Existing My Notes / Context Notes (do not duplicate): ${experience.contextNotes || '(not provided)'}
- Existing Sage Notes: ${experience.sageNotes || '(not provided)'}`

  const roleSummaryContext = `Experience context:
- Title: ${experience.title}
- Employer: ${experience.employer}
- Employment Type: ${experience.employmentType || '(not provided)'}
- Existing Summary: ${experience.summary || '(not provided)'}
- Context Notes: ${experience.contextNotes || '(not provided)'}
- Existing Sage Notes: ${experience.sageNotes || '(not provided)'}

IMPORTANT: Do NOT use the resume highlights/achievements to write the summary.
A role summary describes what the person was responsible for — their mandate, scope, and types of work they owned — not their results or outcomes.`

  const experienceContext = mode === 'notes_help' ? notesHelpContext : roleSummaryContext

  if (shouldWrapUp) {
    const completionPrompt = mode === 'notes_help'
      ? `You are wrapping up a Sage notes interview.

Goal: Draft quick internal notes as a short bullet list. Capture what happened during the role, what the person did or achieved between profile updates, and useful context from the conversation that is not already captured in the summary, My Notes, or existing achievement bullets. Do not restate existing profile bullets. Keep each note brief and practical. Do not invent details not mentioned in the conversation.

${experienceContext}

Conversation history:
${conversationText}

Write the final Sage notes as 3-6 concise bullets. Do not write a paragraph. Do not ask another question.`
      : `You are wrapping up a role summary interview.

Goal: Write a job-description-style role summary that describes what the person was responsible for at this job — their mandate when hired, the categories of work they owned, and how their scope evolved. Do NOT summarise achievements or outcomes. Do NOT use bullet points. Write 2-4 sentences of plain prose.

${experienceContext}

Conversation history:
${conversationText}

Write only the role summary text. Do not include a heading, preamble, or sign-off. Do not ask another question.`

    try {
      const result = await runWithTimeout(generateText({
        model: gateway('openai/gpt-4o-mini'),
        prompt: completionPrompt,
        temperature: 0.4,
        maxRetries: 2
      }))

      const output = result.text.trim()
      if (!output) {
        throw new SageExperienceEnhancementError('Interview completion returned empty output', 'AI_PROVIDER_ERROR')
      }

      return { done: true, output }
    } catch (error: unknown) {
      if (error instanceof SageExperienceEnhancementError) {
        throw error
      }

      throw new SageExperienceEnhancementError(
        'Failed to generate interview completion output',
        'AI_PROVIDER_ERROR',
        { originalError: getErrorMessage(error) }
      )
    }
  }

  const nextTurnPrompt = mode === 'notes_help'
    ? `You are interviewing someone to capture practical Sage notes about their role.

Goal: Learn what they did, what they owned, and any context useful for future AI assistance with this experience. Keep questions concise and conversational.

${experienceContext}

Conversation history:
${conversationText}

Ask exactly one focused follow-up question. Do not write multiple questions.`
    : `You are interviewing someone to write a job-description-style role summary — what they were responsible for, not what they achieved.

Goal: Understand their mandate when hired, the domains/types of work they owned (e.g. infrastructure, software development, project management, stakeholder communication), and how their scope evolved over time. Do NOT ask about metrics, outcomes, or impact.

Good questions to ask (choose the most relevant given the conversation so far):
- What were you primarily hired or tasked to do when you joined?
- What categories of work did you regularly own? (e.g. feature development, infra, integration work, team coordination)
- Did your responsibilities expand or shift over time?
- Who did you work with or report to, and what was your level of ownership?

${experienceContext}

Conversation history:
${conversationText}

Ask exactly one focused follow-up question from the goal above that has not already been answered. Keep it conversational and concise. Do not ask about results or achievements.`

  try {
    const result = await runWithTimeout(generateText({
      model: gateway('openai/gpt-4o-mini'),
      prompt: nextTurnPrompt,
      temperature: 0.5,
      maxRetries: 2
    }))

    const message = result.text.trim()
    if (!message) {
      throw new SageExperienceEnhancementError('Interview turn returned empty message', 'AI_PROVIDER_ERROR')
    }

    return { done: false, message }
  } catch (error: unknown) {
    if (error instanceof SageExperienceEnhancementError) {
      throw error
    }

    throw new SageExperienceEnhancementError(
      'Failed to generate interview response',
      'AI_PROVIDER_ERROR',
      { originalError: getErrorMessage(error) }
    )
  }
}

export async function conductResponsibilityInterview(
  mode: SageInterviewMode,
  experience: SageInterviewExperience,
  answers: SageCollectedAnswer[],
  forceComplete = false
): Promise<ResponsibilityInterviewResult> {
  if (mode !== 'notes_help' && mode !== 'role_summary') {
    throw new SageExperienceEnhancementError('mode must be "notes_help" or "role_summary"', 'INVALID_INPUT')
  }

  validateInterviewExperience(experience)
  validateResponsibilityAnswers(answers)

  const formattedAnswers = formatResponsibilityAnswers(answers)
  const forceCompleteInstruction = forceComplete
    ? 'The user chose to end questioning now. You MUST return done:true and produce the best final output possible from the available context. Do not ask another question.'
    : 'The user is willing to answer more questions if needed.'

  const modeInstruction = mode === 'notes_help'
    ? `Mode: notes_help
Final output goal: Draft quick internal notes as a short bullet list. Capture what happened during the role, what the person did or achieved between profile updates, and useful context from the interview answers. Do not pull from or restate existing profile bullets, summary, or My Notes. Keep each note brief and practical. Return 3-6 concise bullets, not paragraphs. Do not invent facts beyond provided context and answers.
Stopping rule for notes_help: once there are 3 or more meaningful answers, usually return done:true. If there are 5 or more answers, always return done:true. Notes help does not need exhaustive detail; useful context is enough.`
    : `Mode: role_summary
Final output goal: Write a 2-4 sentence job-description-style role summary. Describe what the person was responsible for: mandate, scope, categories of work owned, stakeholders, and how scope evolved. Do not summarize achievements, metrics, results, or outcomes. Do not use bullet points.
Stopping rule for role_summary: once the mandate, work categories, and scope/stakeholders are clear enough, return done:true. If there are 5 or more answers, always return done:true.`

  const prompt = `SYSTEM RULES (always follow):
- You receive experience context and any answers collected so far.
- Decide whether you have enough to produce a strong final output or need more information.
- ${forceCompleteInstruction}
- If answers is empty, always return done:false with 2-5 questions.
- If answers are present and cover the person's mandate, categories of work owned, stakeholders/scope, and any evolution of scope, return done:true.
- Avoid repetitive follow-up questions. Do not ask for the same information in a different wording.
- If you need more information, return done:false with 1-5 questions.
- Choose question types deliberately:
  - single_choice: use only when exactly one answer should be true, such as primary work type, largest stakeholder group, team size range, reporting line, or ownership level.
  - multi_choice: use whenever more than one answer may be true. Prefer multi_choice for domains owned, tools/technologies used, activity categories, collaboration types, responsibilities, stakeholders, or types of work.
  - free_form: only the user knows the answer, such as why they were hired, specific systems, or how scope changed over time.
- For single_choice and multi_choice, include 4-5 relevant options plus an "Other (specify)" option with allowCustom:true.
- Do not turn "which of these applied?" questions into single_choice. Those must be multi_choice.
- In the first question batch, include at least one multi_choice question when asking about categories of work, domains, tools, stakeholders, or responsibilities.
- Do not include emoji in options.
- Return JSON only. No prose outside the JSON object.

Response schema:
{
  "done": false,
  "questions": [
    {
      "id": "q1",
      "text": "Question text",
      "type": "free_form | single_choice | multi_choice",
      "placeholder": "Optional hint for free_form",
      "options": [
        { "id": "q1_o1", "label": "Option label", "allowCustom": false }
      ]
    }
  ]
}

or:
{
  "done": true,
  "output": "Final output text"
}

${modeInstruction}

Experience context:
- Title: ${experience.title}
- Employer: ${experience.employer}
- Employment Type: ${experience.employmentType || '(not provided)'}
- Existing Summary (do not duplicate): ${experience.summary || '(not provided)'}
- Highlights: (omitted; do not use achievements)
- My Notes / Context Notes (do not duplicate): ${experience.contextNotes || '(not provided)'}
- Existing Sage Notes: ${experience.sageNotes || '(not provided)'}

Collected answers:
Answer count: ${answers.length}
${formattedAnswers}`

  try {
    const result = await runWithTimeout(generateText({
      model: gateway('openai/gpt-4o-mini'),
      prompt,
      temperature: 0.35,
      maxRetries: 2
    }))

    return await interceptSageQuestionEngineResponse(result.text)
  } catch (error: unknown) {
    if (error instanceof SageExperienceEnhancementError) {
      throw error
    }

    if (error instanceof SageQuestionEngineInterceptorError) {
      throw new SageExperienceEnhancementError(
        'Responsibility interview response failed validation',
        'AI_PROVIDER_ERROR',
        error.details
      )
    }

    throw new SageExperienceEnhancementError(
      'Failed to conduct responsibility interview',
      'AI_PROVIDER_ERROR',
      { originalError: getErrorMessage(error) }
    )
  }
}

function parseHeroSignalResponse(response: string): SageHeroSignalResult {
  try {
    let cleanResponse = response.trim()
    if (cleanResponse.startsWith('```')) {
      const start = cleanResponse.indexOf('{')
      const end = cleanResponse.lastIndexOf('}')
      if (start !== -1 && end !== -1 && end > start) {
        cleanResponse = cleanResponse.substring(start, end + 1)
      }
    }

    const parsed = JSON.parse(cleanResponse) as JsonRecord
    if (typeof parsed.nudge !== 'boolean') {
      throw new SageExperienceEnhancementError('AI response missing boolean nudge field', 'AI_PROVIDER_ERROR')
    }

    if (!parsed.nudge) {
      return { nudge: false }
    }

    if (typeof parsed.signal !== 'string' || parsed.signal.trim().length === 0) {
      throw new SageExperienceEnhancementError('AI response missing signal for nudge=true', 'AI_PROVIDER_ERROR')
    }

    if (typeof parsed.context !== 'string' || parsed.context.trim().length === 0) {
      throw new SageExperienceEnhancementError('AI response missing context for nudge=true', 'AI_PROVIDER_ERROR')
    }

    return {
      nudge: true,
      signal: normalizeHeroNudgeSentence(
        parsed.signal,
        10,
        'You showed real leadership here.'
      ),
      context: normalizeHeroNudgeSentence(
        parsed.context,
        18,
        'You have the makings of a strong HERO story.'
      )
    }
  } catch (error) {
    if (error instanceof SageExperienceEnhancementError) {
      throw error
    }

    throw new SageExperienceEnhancementError('Failed to parse hero nudge response', 'AI_PROVIDER_ERROR')
  }
}

function normalizeHeroNudgeSentence(value: unknown, maxWords: number, fallback: string) {
  if (typeof value !== 'string') return fallback

  const normalized = value.replace(/\s+/g, ' ').trim()
  const firstSentence = normalized.match(/^[^.!?]+[.!?]?/)?.[0]?.trim() || normalized
  const words = firstSentence.split(' ').filter(Boolean)
  const shortened = words.length > maxWords
    ? `${words.slice(0, maxWords).join(' ')}.`
    : firstSentence

  return /^(you|your)\b/i.test(shortened) ? shortened : fallback
}

export async function detectHeroSignal(
  experience: SageHeroSignalExperience
): Promise<SageHeroSignalResult> {
  if (!experience || typeof experience !== 'object') {
    throw new SageExperienceEnhancementError('experience is required', 'INVALID_INPUT')
  }

  const highlights = Array.isArray(experience.highlights)
    ? experience.highlights.filter((item: unknown) => typeof item === 'string' && item.trim().length > 0)
    : []
  const summary = typeof experience.summary === 'string' ? experience.summary.trim() : ''
  const contextNotes = typeof experience.contextNotes === 'string' ? experience.contextNotes.trim() : ''
  const sageNotes = typeof experience.sageNotes === 'string' ? experience.sageNotes.trim() : ''

  // Fast-path: no meaningful content means no nudge.
  if (highlights.length === 0 && !summary && !contextNotes && !sageNotes) {
    return { nudge: false }
  }

  const prompt = `You detect whether an experience has strong HERO-story potential.

Input content:
- Highlights: ${highlights.length > 0 ? highlights.join(' | ') : '(none)'}
- Summary: ${summary || '(none)'}
- Context Notes: ${contextNotes || '(none)'}
- Sage Notes: ${sageNotes || '(none)'}

Strong signal includes things like quantified outcomes, cross-functional ownership, leadership/scope, or challenges overcome.

Return JSON only:
{
  "nudge": true,
  "signal": "short second-person sentence, under 10 words, like: You showed real leadership here.",
  "context": "one short second-person sentence, under 18 words, tied to the provided content"
}

Or:
{
  "nudge": false
}`

  try {
    const result = await runWithTimeout(generateText({
      model: gateway('openai/gpt-4o-mini'),
      prompt,
      temperature: 0.3,
      maxRetries: 2
    }))

    return parseHeroSignalResponse(result.text)
  } catch (error: unknown) {
    if (error instanceof SageExperienceEnhancementError) {
      throw error
    }

    throw new SageExperienceEnhancementError(
      'Failed to detect HERO signal',
      'AI_PROVIDER_ERROR',
      { originalError: getErrorMessage(error) }
    )
  }
}

export async function generateAchievementQuestions(
  experience: SageAchievementExperience,
  bullet: string
): Promise<SageAchievementQuestion[]> {
  validateExperience(experience)
  validateBullet(bullet)

  const prompt = `You are helping a user strengthen one resume bullet by asking 3-4 structured questions.

Experience context:
- Title: ${experience.title}
- Employer: ${experience.employer}
- Summary: ${experience.summary || '(not provided)'}

Current bullet:
"${bullet}"

Task:
- Generate 3-4 questions that uncover missing facts: scale, ownership, impact, and outcomes.
- Each question must include a "type": "single_choice" or "multi_choice".
- Use single_choice only when exactly one answer should be true, such as primary ownership level or largest audience.
- Use multi_choice whenever more than one answer may be true. Prefer multi_choice for measurable impact, technologies/tools, stakeholders, responsibilities, collaboration types, or categories of outcomes.
- A question like "What measurable impact did this have?" must be multi_choice because multiple impacts can apply.
- Each question MUST have 4-5 selectable options relevant to the bullet, plus one "Other (specify)" option with allowCustom: true.
- Do not include emoji in options.
- Return JSON only in this exact format:
{
  "questions": [
    {
      "id": "q1",
      "text": "What was the scale or reach of this work?",
      "type": "single_choice",
      "options": [
        { "id": "q1_o1", "label": "Individual contributor only" },
        { "id": "q1_o2", "label": "Small team (2–5 people)" },
        { "id": "q1_o3", "label": "Department or business unit" },
        { "id": "q1_o4", "label": "Cross-functional or company-wide" },
        { "id": "q1_o5", "label": "Other (specify)", "allowCustom": true }
      ]
    }
  ]
}

Keep question text concise. Make options specific and meaningful to the bullet content.`

  try {
    const result = await runWithTimeout(generateText({
      model: gateway('openai/gpt-4o-mini'),
      prompt,
      temperature: 0.4,
      maxRetries: 2
    }))

    return parseQuestionsResponse(result.text)
  } catch (error: unknown) {
    if (error instanceof SageExperienceEnhancementError) {
      throw error
    }

    throw new SageExperienceEnhancementError(
      'Failed to generate achievement questions',
      'AI_PROVIDER_ERROR',
      { originalError: getErrorMessage(error) }
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
    .map((entry) => {
      const answerText = Array.isArray(entry.answer)
        ? entry.answer.join(', ')
        : entry.answer
      return `- ${entry.questionId}: ${answerText}`
    })
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
      maxRetries: 2
    }))

    return parseImprovedBulletResponse(result.text)
  } catch (error: unknown) {
    if (error instanceof SageExperienceEnhancementError) {
      throw error
    }

    throw new SageExperienceEnhancementError(
      'Failed to generate improved bullet',
      'AI_PROVIDER_ERROR',
      { originalError: getErrorMessage(error) }
    )
  }
}
