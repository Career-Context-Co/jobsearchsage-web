import { createGateway, generateText } from 'ai'
import { z } from 'zod'
import type {
  ResponsibilityInterviewResult,
  SageQuestion,
  SageQuestionOption,
  SageQuestionType
} from '#shared/types/enhancement'

const INTERCEPTOR_REPAIR_MODEL = 'openai/gpt-4o-mini'
const MAX_QUESTIONS_PER_BATCH = 5
const INTERCEPTOR_REPAIR_TIMEOUT_MS = 20000
const apiKey = useRuntimeConfig().aiGatewayApiKey
if (!apiKey) {
  throw new Error('AI Gateway API Key is not set')
}

const gateway = createGateway({
  apiKey: apiKey
})

const questionTypeSchema = z.enum(['free_form', 'single_choice', 'multi_choice'])

const rawOptionSchema = z.object({
  id: z.string().optional(),
  label: z.string().optional(),
  emoji: z.string().optional(),
  allowCustom: z.boolean().optional()
}).passthrough()

const rawQuestionSchema = z.object({
  id: z.string().optional(),
  text: z.string(),
  type: questionTypeSchema,
  placeholder: z.string().optional(),
  options: z.array(rawOptionSchema).optional()
}).passthrough()

const rawResultSchema = z.union([
  z.object({
    done: z.literal(false),
    questions: z.array(rawQuestionSchema)
  }).passthrough(),
  z.object({
    done: z.literal(true),
    output: z.string()
  }).passthrough()
])

export class SageQuestionEngineInterceptorError extends Error {
  constructor(message: string, public details?: unknown) {
    super(message)
    this.name = 'SageQuestionEngineInterceptorError'
  }
}

function extractJsonObject(rawText: string): unknown {
  const trimmed = rawText.trim()
  if (!trimmed) {
    throw new SageQuestionEngineInterceptorError('AI response was empty')
  }

  const start = trimmed.indexOf('{')
  const end = trimmed.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) {
    throw new SageQuestionEngineInterceptorError('AI response did not contain a JSON object')
  }

  try {
    return JSON.parse(trimmed.substring(start, end + 1))
  } catch (error: unknown) {
    throw new SageQuestionEngineInterceptorError('AI response JSON could not be parsed', error)
  }
}

function uniqueId(baseId: string, seenIds: Set<string>) {
  let id = baseId
  let suffix = 2
  while (seenIds.has(id)) {
    id = `${baseId}_${suffix}`
    suffix += 1
  }
  seenIds.add(id)
  return id
}

function normalizeOption(option: z.infer<typeof rawOptionSchema>, questionId: string, index: number, seenIds: Set<string>): SageQuestionOption | null {
  const label = option.label?.trim()
  if (!label) return null

  const fallbackId = `${questionId}_o${index + 1}`
  return {
    id: uniqueId(option.id?.trim() || fallbackId, seenIds),
    label,
    ...(option.emoji?.trim() ? { emoji: option.emoji.trim() } : {}),
    ...(option.allowCustom === true ? { allowCustom: true } : {})
  }
}

function normalizeQuestion(question: z.infer<typeof rawQuestionSchema>, index: number, seenIds: Set<string>): SageQuestion {
  const id = uniqueId(question.id?.trim() || `q${index + 1}`, seenIds)
  const text = question.text.trim()
  const type = question.type as SageQuestionType

  if (!text) {
    throw new SageQuestionEngineInterceptorError(`questions[${index}].text must be non-empty`)
  }

  const normalized: SageQuestion = {
    id,
    text,
    type,
    ...(question.placeholder?.trim() ? { placeholder: question.placeholder.trim() } : {})
  }

  if (type !== 'free_form') {
    const optionIds = new Set<string>()
    const options = (question.options ?? [])
      .map((option, optionIndex) => normalizeOption(option, id, optionIndex, optionIds))
      .filter((option): option is SageQuestionOption => option !== null)

    if (options.length === 0) {
      throw new SageQuestionEngineInterceptorError(`questions[${index}].options must include at least one valid option`)
    }

    normalized.options = options
  }

  return normalized
}

function normalizeQuestionEngineResult(parsed: unknown): ResponsibilityInterviewResult {
  const rawResult = rawResultSchema.parse(parsed)

  if (rawResult.done) {
    const output = rawResult.output.trim()
    if (!output) {
      throw new SageQuestionEngineInterceptorError('done=true response must include non-empty output')
    }

    return { done: true, output }
  }

  const questionIds = new Set<string>()
  const questions = rawResult.questions
    .slice(0, MAX_QUESTIONS_PER_BATCH)
    .map((question, index) => normalizeQuestion(question, index, questionIds))

  if (questions.length === 0) {
    throw new SageQuestionEngineInterceptorError('done=false response must include at least one valid question')
  }

  return { done: false, questions }
}

async function repairQuestionEngineResponse(rawText: string, validationError: unknown): Promise<string> {
  const prompt = `You repair malformed JSON from an AI question engine.

Rules:
- Do not add new domain facts.
- Preserve the user's meaning from the raw text.
- Return JSON only.
- Output must be exactly one of these shapes:
{
  "done": false,
  "questions": [
    {
      "id": "q1",
      "text": "Question text",
      "type": "free_form",
      "placeholder": "Optional hint"
    }
  ]
}

or:
{
  "done": false,
  "questions": [
    {
      "id": "q1",
      "text": "Question text",
      "type": "single_choice",
      "options": [
        { "id": "q1_o1", "label": "Option label" },
        { "id": "q1_o2", "label": "Other (specify)", "allowCustom": true }
      ]
    }
  ]
}

or:
{
  "done": true,
  "output": "Final output text"
}

Validation error:
${validationError instanceof Error ? validationError.message : String(validationError)}

Raw model output:
${rawText}`

  const repairRequest = generateText({
    model: gateway(INTERCEPTOR_REPAIR_MODEL),
    prompt,
    temperature: 0,
    maxRetries: 1
  })

  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new SageQuestionEngineInterceptorError('Question engine repair request timed out after 20 seconds'))
    }, INTERCEPTOR_REPAIR_TIMEOUT_MS)
  })

  const result = await Promise.race([repairRequest, timeout])

  return result.text
}

export async function interceptSageQuestionEngineResponse(rawText: string): Promise<ResponsibilityInterviewResult> {
  try {
    return normalizeQuestionEngineResult(extractJsonObject(rawText))
  } catch (initialError: unknown) {
    try {
      const repairedText = await repairQuestionEngineResponse(rawText, initialError)
      return normalizeQuestionEngineResult(extractJsonObject(repairedText))
    } catch (repairError: unknown) {
      throw new SageQuestionEngineInterceptorError(
        'AI response did not match the Sage question engine contract',
        {
          initialError,
          repairError,
          repairModel: INTERCEPTOR_REPAIR_MODEL
        }
      )
    }
  }
}
