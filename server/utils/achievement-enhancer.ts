/**
 * Achievement Enhancement Utility
 *
 * Uses Vercel AI SDK with AI Gateway (GPT-4o-mini) to enhance professional
 * achievement descriptions with light polish while preserving meaning and facts.
 *
 * Features:
 * - Context-aware enhancement using employer and job title
 * - Grammar, syntax, and punctuation fixes
 * - Strong action verb improvements
 * - Concise and direct phrasing
 * - 10-second timeout handling
 * - Comprehensive error handling
 */

import { createGateway, generateText } from 'ai'

// Use the same AI Gateway configuration as resume extractor
const apiKey = useRuntimeConfig().aiGatewayApiKey
if (!apiKey) {
  throw new Error('AI Gateway API Key is not set')
}

const gateway = createGateway({
  apiKey: apiKey,
});

/**
 * Input type for experience slice
 */
export interface ExperienceSlice {
  employmentType: string
  employer: string
  title: string
  url?: string
  summary?: string
  highlights: string[]
}

/**
 * Enhancement error types
 */
export class EnhancementError extends Error {
  constructor(
    message: string,
    public code: 'TIMEOUT' | 'INVALID_INPUT' | 'AI_PROVIDER_ERROR',
    public details?: any
  ) {
    super(message)
    this.name = 'EnhancementError'
  }
}

/**
 * System prompt for achievement enhancement
 */
const SYSTEM_PROMPT = `You are an expert career coach specializing in achievement writing.
Your task is to polish professional achievement descriptions while
preserving the user's original meaning and facts.

CONTEXT: You will receive job context (employer, title, employment type) and an array of achievements to enhance.

RULES:
1. Fix grammar, syntax, and punctuation errors in each achievement
2. Replace weak or vague verbs with stronger, more specific action verbs
3. Make phrasing more concise and direct
4. Remove filler words and redundancy
5. Use the job context to inform enhancement but DO NOT add fabricated details
6. DO NOT add new information, metrics, or fabricated details
7. DO NOT change the core meaning or facts stated by the user
8. Keep the same tense and perspective as the original
9. Return ONLY the enhanced achievements array in JSON format

CRITICAL: If the user claims they "led", "architected", or had significant ownership, 
preserve this regardless of seniority. Only enhance WEAK or AMBIGUOUS verbs.

SENIORITY-AWARE ENHANCEMENT:
When replacing weak verbs (e.g., "helped with", "worked on", "was involved in"):

ENTRY-LEVEL (Intern, Junior, Associate, Assistant):
- Default to: Contributed to, supported, assisted with, collaborated on, developed
- Only use "led" or "architected" if the original explicitly claims this

MID-LEVEL (Engineer, Analyst, Designer, Specialist):
- Use: Developed, implemented, built, designed, delivered, created, optimized

SENIOR-LEVEL (Senior, Lead, Principal, Staff):
- Use: Architected, led, drove, designed, established, delivered, owned

LEADERSHIP (Manager, Director, VP, Head, Chief):
- Use: Directed, established, led, built (teams), scaled, transformed, drove

EMPLOYMENT TYPE ADJUSTMENTS:
- INTERNSHIP: Default to collaborative verbs for ambiguous cases, but respect explicit claims
- CONTRACT: Focus on delivery verbs (delivered, built, designed)
- PART-TIME: Scale down one level from title when ambiguous
- FULL-TIME: Use full seniority-appropriate verbs

EXAMPLES:

Weak verb (ambiguous): "Helped with implementing a new system"
- Intern → "Contributed to implementation of a new system"
- Senior → "Led implementation of a new system"

Strong verb (explicit): "Architected a new microservices platform"
- Intern → Keep as "Architected a new microservices platform" (user claims this)
- Senior → Keep as "Architected a new microservices platform"

Weak verb: "Worked on improving app performance"
- Junior → "Improved app performance"
- Lead → "Drove app performance improvements"`

/**
 * Create user prompt for enhancement
 */
function createUserPrompt(experienceSlice: ExperienceSlice): string {
  const { employer, title, highlights } = experienceSlice

  return `Polish the achievements for this work experience:

Employer: ${employer}
Title: ${title}

Achievements to enhance:
${highlights.map((highlight, index) => `${index + 1}. ${highlight}`).join('\n')}

Return JSON: { "highlights": ["enhanced achievement 1", "enhanced achievement 2", ...] }`
}

/**
 * Validate experience slice input
 */
function validateExperienceSlice(slice: ExperienceSlice): void {
  if (!slice.employmentType || typeof slice.employmentType !== 'string') {
    throw new EnhancementError('employmentType is required and must be a string', 'INVALID_INPUT')
  }

  if (!slice.employer || typeof slice.employer !== 'string') {
    throw new EnhancementError('employer is required and must be a string', 'INVALID_INPUT')
  }

  if (!slice.title || typeof slice.title !== 'string') {
    throw new EnhancementError('title is required and must be a string', 'INVALID_INPUT')
  }

  if (!Array.isArray(slice.highlights)) {
    throw new EnhancementError('highlights must be an array of strings', 'INVALID_INPUT')
  }

  if (slice.highlights.length === 0) {
    throw new EnhancementError('highlights array cannot be empty', 'INVALID_INPUT')
  }

  // Validate each highlight
  slice.highlights.forEach((highlight, index) => {
    if (typeof highlight !== 'string') {
      throw new EnhancementError(`highlights[${index}] must be a string`, 'INVALID_INPUT')
    }

    if (highlight.trim().length === 0) {
      throw new EnhancementError(`highlights[${index}] cannot be empty`, 'INVALID_INPUT')
    }

    if (highlight.length > 500) {
      throw new EnhancementError(`highlights[${index}] must be 500 characters or less`, 'INVALID_INPUT')
    }
  })
}

/**
 * Parse AI response and validate format
 */
function parseEnhancementResponse(response: string): string[] {
  try {
    // Clean the response - remove markdown code blocks if present
    let cleanResponse = response.trim()

    // Remove markdown code blocks if present
    if (cleanResponse.startsWith('```json') || cleanResponse.startsWith('```')) {
      const startIndex = cleanResponse.indexOf('{')
      const endIndex = cleanResponse.lastIndexOf('}')

      if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        cleanResponse = cleanResponse.substring(startIndex, endIndex + 1)
      }
    }

    const parsed = JSON.parse(cleanResponse)

    if (!parsed.highlights || !Array.isArray(parsed.highlights)) {
      throw new EnhancementError('AI response missing highlights array', 'AI_PROVIDER_ERROR')
    }

    if (parsed.highlights.length === 0) {
      throw new EnhancementError('AI response contains empty highlights array', 'AI_PROVIDER_ERROR')
    }

    // Validate that all enhanced highlights are strings
    parsed.highlights.forEach((highlight: any, index: number) => {
      if (typeof highlight !== 'string') {
        throw new EnhancementError(`Enhanced highlight ${index} is not a string`, 'AI_PROVIDER_ERROR')
      }
    })

    return parsed.highlights
  } catch (error) {
    if (error instanceof EnhancementError) {
      throw error
    }
    throw new EnhancementError('Failed to parse AI response as valid JSON', 'AI_PROVIDER_ERROR')
  }
}

/**
 * Enhance experience achievements using AI
 *
 * @param experienceSlice - Experience data with employer, title, and highlights to enhance
 * @returns Promise resolving to enhanced highlights array in same order as input
 * @throws EnhancementError on validation, timeout, or AI provider errors
 */
export async function enhanceExperienceAchievements(experienceSlice: ExperienceSlice): Promise<string[]> {
  // Validate input
  validateExperienceSlice(experienceSlice)

  const { highlights } = experienceSlice

  try {
    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new EnhancementError('Enhancement request timed out after 10 seconds', 'TIMEOUT'))
      }, 10000) // 10 seconds
    })

    // Create AI enhancement promise
    const enhancementPromise = generateText({
      model: gateway('openai/gpt-4o-mini'),
      system: SYSTEM_PROMPT,
      prompt: createUserPrompt(experienceSlice),
      temperature: 0.3, // Lower temperature for more consistent, conservative enhancements
      maxRetries: 2
    })

    // Race between enhancement and timeout
    const result = await Promise.race([enhancementPromise, timeoutPromise])

    // Parse and validate the AI response
    const enhancedHighlights = parseEnhancementResponse(result.text)

    // Ensure we return the same number of highlights as input
    if (enhancedHighlights.length !== highlights.length) {
      throw new EnhancementError(
        `AI returned ${enhancedHighlights.length} highlights but expected ${highlights.length}`,
        'AI_PROVIDER_ERROR'
      )
    }

    return enhancedHighlights

  } catch (error: any) {
    // Re-throw EnhancementError instances
    if (error instanceof EnhancementError) {
      throw error
    }

    // Handle AI SDK errors
    if (error.name === 'AIError' || error.message?.includes('AI')) {
      throw new EnhancementError(
        'AI provider error occurred during enhancement',
        'AI_PROVIDER_ERROR',
        { originalError: error.message }
      )
    }

    // Handle network or other unexpected errors
    throw new EnhancementError(
      'Unexpected error during achievement enhancement',
      'AI_PROVIDER_ERROR',
      { originalError: error.message }
    )
  }
}
