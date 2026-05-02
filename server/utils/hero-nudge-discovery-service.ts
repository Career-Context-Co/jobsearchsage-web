import { createGateway, generateText } from 'ai'
import type { SageHeroSignalExperience } from '@@/server/utils/sage-experience-enhancer'
import type { HeroStoryNudge } from '@@/server/utils/hero-story-nudges'

const apiKey = useRuntimeConfig().aiGatewayApiKey
if (!apiKey) {
  throw new Error('AI Gateway API Key is not set')
}

const gateway = createGateway({
  apiKey: apiKey
})

export class HeroNudgeDiscoveryError extends Error {
  constructor(
    message: string,
    public code: 'TIMEOUT' | 'API_ERROR' | 'INVALID_RESPONSE' | 'API_KEY_MISSING',
    public details?: unknown
  ) {
    super(message)
    this.name = 'HeroNudgeDiscoveryError'
  }
}

export interface HeroStoryFieldUpdates {
  hurdleProblem?: string | null
  hurdleScope?: string | null
  hurdleStakes?: string | null
  expectationRole?: string | null
  expectationGoals?: string | null
  expectationConstraints?: string | null
  responseActions?: string | null
  responseTools?: string | null
  responseChallenges?: string | null
  outcomeDeliverable?: string | null
  outcomeMetrics?: string | null
  outcomeImpact?: string | null
}

export interface HeroNudgeDiscoveryContinueResult {
  aiMessage: string
  storyUpdates: HeroStoryFieldUpdates
  completedFields: string[]
  shouldEndSession: boolean
}

const HERO_NUDGE_DISCOVERY_SYSTEM_PROMPT = `You are helping a user turn one specific experience into a HERO story.

HERO means:
- Hurdle: the challenge, scope, and stakes
- Expectation: the user's role, goals, and constraints
- Response: what they did, tools used, and challenges handled
- Outcome: deliverable, metrics, and impact

Rules:
- This is not broad discovery. Do not ask for other moments or achievements.
- Ask one focused question at a time.
- Use the source experience and nudge as context, but do not invent details.
- When the user gives enough detail for a HERO field, return a concise story update for that field.
- Return JSON only.`

function formatExperience(experience: SageHeroSignalExperience & Record<string, unknown>) {
  const highlights = Array.isArray(experience.highlights)
    ? experience.highlights.filter(item => typeof item === 'string' && item.trim()).join(' | ')
    : '(none)'

  return `Title: ${typeof experience.title === 'string' ? experience.title : '(not provided)'}
Employer: ${typeof experience.employer === 'string' ? experience.employer : '(not provided)'}
Summary: ${experience.summary || '(none)'}
Highlights: ${highlights}
My Notes: ${experience.contextNotes || '(none)'}
Sage Notes: ${experience.sageNotes || '(none)'}`
}

function extractJsonObject(text: string) {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')

  if (start === -1 || end === -1 || end <= start) {
    throw new HeroNudgeDiscoveryError('AI response did not include JSON', 'INVALID_RESPONSE', { text })
  }

  return JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>
}

function normalizeStoryUpdates(value: unknown): HeroStoryFieldUpdates {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  const allowedFields = [
    'hurdleProblem',
    'hurdleScope',
    'hurdleStakes',
    'expectationRole',
    'expectationGoals',
    'expectationConstraints',
    'responseActions',
    'responseTools',
    'responseChallenges',
    'outcomeDeliverable',
    'outcomeMetrics',
    'outcomeImpact'
  ] as const
  const raw = value as Record<string, unknown>
  const updates: HeroStoryFieldUpdates = {}

  for (const field of allowedFields) {
    const fieldValue = raw[field]
    if (typeof fieldValue === 'string' && fieldValue.trim()) {
      updates[field] = fieldValue.trim()
    }
  }

  return updates
}

function normalizeCompletedFields(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : []
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

export async function generateHeroNudgeDiscoveryStart(
  nudge: HeroStoryNudge,
  experience: SageHeroSignalExperience & Record<string, unknown>
): Promise<string> {
  try {
    const prompt = `Start a HERO story interview from this persisted nudge.

Nudge:
- Signal: ${nudge.signal}
- Context: ${nudge.context}

Experience:
${formatExperience(experience)}

Return JSON only:
{
  "acknowledgement": "one short sentence about why this could be a story",
  "question": "one focused question about the Hurdle"
}`

    const result = await generateText({
      model: gateway('openai/gpt-4.1-mini'),
      system: HERO_NUDGE_DISCOVERY_SYSTEM_PROMPT,
      prompt,
      temperature: 0.4
    })

    const parsed = extractJsonObject(result.text)
    const acknowledgement = typeof parsed.acknowledgement === 'string' ? parsed.acknowledgement.trim() : ''
    const question = typeof parsed.question === 'string' ? parsed.question.trim() : ''

    return [acknowledgement, question].filter(Boolean).join(' ')
  } catch (error: unknown) {
    if (getErrorMessage(error).includes('API key')) {
      throw new HeroNudgeDiscoveryError('AI Gateway API key is missing or invalid', 'API_KEY_MISSING', error)
    }
    throw new HeroNudgeDiscoveryError('Failed to start HERO nudge discovery', 'API_ERROR', error)
  }
}

export async function generateHeroNudgeDiscoveryContinue(
  userMessage: string,
  conversationHistory: Array<{ role: string, content: string }>,
  nudge: { signal?: string, context?: string },
  experience: SageHeroSignalExperience & Record<string, unknown>,
  completedFields: string[]
): Promise<HeroNudgeDiscoveryContinueResult> {
  try {
    const historyText = conversationHistory.length > 0
      ? conversationHistory.map(entry => `${entry.role}: ${entry.content}`).join('\n\n')
      : '(none)'

    const prompt = `Continue this HERO story interview.

Nudge:
- Signal: ${nudge.signal || '(none)'}
- Context: ${nudge.context || '(none)'}

Experience:
${formatExperience(experience)}

Conversation so far:
${historyText}

Completed fields:
${completedFields.length > 0 ? completedFields.join(', ') : '(none)'}

Latest user answer:
"${userMessage}"

Return JSON only:
{
  "aiMessage": "Your next message, asking one focused question or explaining that we have enough.",
  "storyUpdates": {
    "hurdleProblem": "string when learned",
    "hurdleScope": "string when learned",
    "hurdleStakes": "string when learned",
    "expectationRole": "string when learned",
    "expectationGoals": "string when learned",
    "expectationConstraints": "string when learned",
    "responseActions": "string when learned",
    "responseTools": "string when learned",
    "responseChallenges": "string when learned",
    "outcomeDeliverable": "string when learned",
    "outcomeMetrics": "string when learned",
    "outcomeImpact": "string when learned"
  },
  "completedFields": ["field names completed so far"],
  "shouldEndSession": false
}

Set shouldEndSession true only when hurdle, expectation, response, and outcome all have enough useful detail.`

    const result = await generateText({
      model: gateway('openai/gpt-4.1-mini'),
      system: HERO_NUDGE_DISCOVERY_SYSTEM_PROMPT,
      prompt,
      temperature: 0.4
    })
    const parsed = extractJsonObject(result.text)

    return {
      aiMessage: typeof parsed.aiMessage === 'string' ? parsed.aiMessage.trim() : '',
      storyUpdates: normalizeStoryUpdates(parsed.storyUpdates),
      completedFields: normalizeCompletedFields(parsed.completedFields),
      shouldEndSession: parsed.shouldEndSession === true
    }
  } catch (error: unknown) {
    if (error instanceof HeroNudgeDiscoveryError) {
      throw error
    }
    if (getErrorMessage(error).includes('API key')) {
      throw new HeroNudgeDiscoveryError('AI Gateway API key is missing or invalid', 'API_KEY_MISSING', error)
    }
    throw new HeroNudgeDiscoveryError('Failed to continue HERO nudge discovery', 'API_ERROR', error)
  }
}
