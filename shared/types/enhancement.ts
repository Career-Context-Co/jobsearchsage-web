/**
 * XYZ Method Enhancement TypeScript Interfaces
 * Types for deep profile achievement enhancement using AI-guided questioning
 */

/**
 * A single question in the context gathering process
 */
export interface ContextQuestion {
  id: string
  text: string
}

/**
 * Questions organized by category for presentation
 */
export interface QuestionGroup {
  category: string
  questions: ContextQuestion[]
}

/**
 * Story insights extracted from user answers
 * Represent individual insights about the achievement
 */
export interface ContextStory {
  title?: string
  text: string
  type: 'project' | 'initiative' | 'responsibility' | 'achievement'
}

/**
 * Context object accumulating answers across rounds
 * Used for multi-round enhancement flow
 */
export interface ContextObject {
  notes: ContextStory[]
  answeredQuestions: Array<{
    id: string
    answer: string
  }>
}

/**
 * Primary and secondary resume bullet pair
 * Provides user choice between options
 */
export interface ResumeBullet {
  primary: string
  secondary: string
}

/**
 * Response from gather-context endpoint
 * Returns questions and extracted story notes
 */
export interface GatherContextResponse {
  success: boolean
  data: {
    questionGroups: QuestionGroup[]
    notes: ContextStory[]
  }
}

/**
 * Response from enhance-achievements endpoint
 * Returns generated XYZ-format bullet pairs
 */
export interface EnhanceAchievementsResponse {
  success: boolean
  data: {
    bullets: ResumeBullet[]
  }
}

/**
 * Shared question engine primitives for Sage/HERO AI flows.
 * These are intentionally generic so endpoint-specific prompts can reuse the same UI contract.
 */
export type SageQuestionType = 'free_form' | 'single_choice' | 'multi_choice'

export interface SageQuestionOption {
  id: string
  label: string
  emoji?: string
  allowCustom?: boolean
}

export interface SageQuestion {
  id: string
  text: string
  type: SageQuestionType
  placeholder?: string
  options?: SageQuestionOption[]
}

export interface SageCollectedAnswer {
  questionId: string
  questionText?: string
  answer: string | string[]
}

export type SageQuestionEngineResult<TOutput = string>
  = | { done: false, questions: SageQuestion[] }
    | { done: true, output: TOutput }

export type ResponsibilityInterviewResult = SageQuestionEngineResult<string>

/**
 * Result of synthesizing a single HERO field from gathered answers
 */
export interface HeroFieldResult {
  fieldId: string
  fieldLabel: string
  dbField: string
  text: string
}
