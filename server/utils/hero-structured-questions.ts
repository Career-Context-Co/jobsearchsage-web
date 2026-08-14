/**
 * Hero Story Structured Questions Engine
 *
 * Defines question trees and flow logic for structured AI assistance.
 * Each field (problem, scope, stakes) has 2-3 questions with multiple-choice options.
 */

export type HurdleField = 'problem' | 'scope' | 'stakes'
export type ExpectationField = 'role' | 'goals' | 'constraints'
export type ResponseField = 'actions' | 'tools' | 'challenges'
export type OutcomeField = 'deliverable' | 'metrics' | 'impact'
export type SectionField = HurdleField | ExpectationField | ResponseField | OutcomeField

export interface QuestionOption {
  id: string
  label: string
  emoji?: string
  allowCustom?: boolean
}

export interface StructuredQuestion {
  id: string
  text: string
  field: SectionField
  options: QuestionOption[]
  nextQuestionLogic?: (selectedOption: string) => string | null
}

/**
 * Question trees for Hurdle section
 */
const PROBLEM_QUESTIONS: Record<string, StructuredQuestion> = {
  problem_type: {
    id: 'problem_type',
    text: 'What type of problem did you face?',
    field: 'problem',
    options: [
      { id: 'technical', label: 'Technical Issue', emoji: '🐛' },
      { id: 'process', label: 'Process Issue', emoji: '📋' },
      { id: 'business', label: 'Business Opportunity', emoji: '💰' },
      { id: 'user_experience', label: 'User Experience Issue', emoji: '😟' },
      { id: 'other', label: 'Other (specify)', emoji: '✏️', allowCustom: true }
    ],
    nextQuestionLogic: (selectedOption) => {
      if (selectedOption === 'other') return 'problem_impact'
      return `problem_${selectedOption}_specifics`
    }
  },
  problem_technical_specifics: {
    id: 'problem_technical_specifics',
    text: 'What specific technical issue did you identify?',
    field: 'problem',
    options: [
      { id: 'performance', label: 'Slow performance or high latency', emoji: '⚡' },
      { id: 'bugs', label: 'Bugs or errors in production', emoji: '🐞' },
      { id: 'architecture', label: 'Architecture limitations', emoji: '🏗️' },
      { id: 'security', label: 'Security vulnerabilities', emoji: '🔒' },
      { id: 'scalability', label: 'Scalability issues', emoji: '📈' },
      { id: 'other', label: 'Other (specify)', allowCustom: true }
    ],
    nextQuestionLogic: () => 'problem_impact'
  },
  problem_process_specifics: {
    id: 'problem_process_specifics',
    text: 'What specific process issue did you identify?',
    field: 'problem',
    options: [
      { id: 'workflow', label: 'Inefficient workflow', emoji: '🔄' },
      { id: 'coordination', label: 'Poor team coordination', emoji: '👥' },
      { id: 'communication', label: 'Communication gaps', emoji: '💬' },
      { id: 'manual', label: 'Manual repetitive tasks', emoji: '🔁' },
      { id: 'other', label: 'Other (specify)', allowCustom: true }
    ],
    nextQuestionLogic: () => 'problem_impact'
  },
  problem_business_specifics: {
    id: 'problem_business_specifics',
    text: 'What specific business opportunity did you identify?',
    field: 'problem',
    options: [
      { id: 'revenue', label: 'Revenue growth opportunity', emoji: '💵' },
      { id: 'market', label: 'New market opportunity', emoji: '🌍' },
      { id: 'efficiency', label: 'Cost efficiency opportunity', emoji: '💡' },
      { id: 'competitive', label: 'Competitive advantage', emoji: '🏆' },
      { id: 'other', label: 'Other (specify)', allowCustom: true }
    ],
    nextQuestionLogic: () => 'problem_impact'
  },
  problem_user_experience_specifics: {
    id: 'problem_user_experience_specifics',
    text: 'What specific user experience issue did you identify?',
    field: 'problem',
    options: [
      { id: 'confusing', label: 'Confusing interface or flow', emoji: '🤔' },
      { id: 'slow', label: 'Slow or unresponsive', emoji: '🐌' },
      { id: 'accessibility', label: 'Accessibility issues', emoji: '♿' },
      { id: 'missing', label: 'Missing features', emoji: '❌' },
      { id: 'other', label: 'Other (specify)', allowCustom: true }
    ],
    nextQuestionLogic: () => 'problem_impact'
  },
  problem_impact: {
    id: 'problem_impact',
    text: 'How was this problem impacting things?',
    field: 'problem',
    options: [
      { id: 'blocking', label: 'Blocking work or progress', emoji: '🛑' },
      { id: 'degraded', label: 'Degraded performance', emoji: '📉' },
      { id: 'inefficient', label: 'Creating inefficiency', emoji: '⏳' },
      { id: 'risky', label: 'Creating risk or instability', emoji: '⚠️' },
      { id: 'other', label: 'Other (specify)', allowCustom: true }
    ],
    nextQuestionLogic: () => null // End of problem questions
  }
}

const SCOPE_QUESTIONS: Record<string, StructuredQuestion> = {
  scope_who: {
    id: 'scope_who',
    text: 'Who was affected by this problem?',
    field: 'scope',
    options: [
      { id: 'just_me', label: 'Just me', emoji: '👤' },
      { id: 'team', label: 'My team', emoji: '👥' },
      { id: 'department', label: 'Entire department', emoji: '🏢' },
      { id: 'company_wide', label: 'Company-wide', emoji: '🏛️' },
      { id: 'customers', label: 'External customers/users', emoji: '👨‍💼' },
      { id: 'other', label: 'Other (specify)', allowCustom: true }
    ],
    nextQuestionLogic: () => 'scope_frequency'
  },
  scope_frequency: {
    id: 'scope_frequency',
    text: 'How often did this problem occur?',
    field: 'scope',
    options: [
      { id: 'constant', label: 'Constantly / All the time', emoji: '🔥' },
      { id: 'daily', label: 'Daily / Multiple times per day', emoji: '📅' },
      { id: 'occasional', label: 'Occasionally / Weekly', emoji: '📆' },
      { id: 'one_time', label: 'One-time event', emoji: '⚡' },
      { id: 'other', label: 'Other (specify)', allowCustom: true }
    ],
    nextQuestionLogic: () => 'scope_duration'
  },
  scope_duration: {
    id: 'scope_duration',
    text: 'How long had this been a problem?',
    field: 'scope',
    options: [
      { id: 'years', label: 'Years', emoji: '📅' },
      { id: 'months', label: 'Months', emoji: '📆' },
      { id: 'weeks', label: 'Weeks', emoji: '🗓️' },
      { id: 'days', label: 'Days', emoji: '⏰' },
      { id: 'other', label: 'Other (specify)', allowCustom: true }
    ],
    nextQuestionLogic: () => null // End of scope questions
  }
}

const STAKES_QUESTIONS: Record<string, StructuredQuestion> = {
  stakes_risk: {
    id: 'stakes_risk',
    text: 'What was at risk if this wasn\'t solved?',
    field: 'stakes',
    options: [
      { id: 'revenue_loss', label: 'Revenue loss or missed opportunities', emoji: '💸' },
      { id: 'missed_deadlines', label: 'Missed deadlines or delays', emoji: '⏱️' },
      { id: 'customer_churn', label: 'Customer churn or dissatisfaction', emoji: '😞' },
      { id: 'team_morale', label: 'Team morale or productivity', emoji: '😓' },
      { id: 'technical_debt', label: 'Technical debt or instability', emoji: '⚙️' },
      { id: 'competitive', label: 'Competitive disadvantage', emoji: '🏁' },
      { id: 'other', label: 'Other (specify)', allowCustom: true }
    ],
    nextQuestionLogic: () => 'stakes_urgency'
  },
  stakes_urgency: {
    id: 'stakes_urgency',
    text: 'How urgent was solving this problem?',
    field: 'stakes',
    options: [
      { id: 'critical', label: 'Critical - Had to be solved immediately', emoji: '🚨' },
      { id: 'high', label: 'High - Important to solve soon', emoji: '🔴' },
      { id: 'medium', label: 'Medium - Would improve things significantly', emoji: '🟡' },
      { id: 'low', label: 'Low - Nice to have improvement', emoji: '🟢' }
    ],
    nextQuestionLogic: () => 'stakes_quantify'
  },
  stakes_quantify: {
    id: 'stakes_quantify',
    text: 'Did you have specific numbers or metrics about the impact?',
    field: 'stakes',
    options: [
      { id: 'had_numbers', label: 'Yes, I had specific numbers', emoji: '📊' },
      { id: 'rough_estimate', label: 'Rough estimates or ballpark figures', emoji: '📈' },
      { id: 'no_numbers', label: 'No specific numbers, but clear qualitative impact', emoji: '📝' }
    ],
    nextQuestionLogic: () => null // End of stakes questions
  }
}

/**
 * Get the first question for a field
 */
export function getFirstQuestion(field: HurdleField): StructuredQuestion {
  switch (field) {
    case 'problem':
      return PROBLEM_QUESTIONS.problem_type!
    case 'scope':
      return SCOPE_QUESTIONS.scope_who!
    case 'stakes':
      return STAKES_QUESTIONS.stakes_risk!
  }
}

/**
 * Get next question based on current question and selected option
 */
export function getNextQuestion(
  currentQuestionId: string,
  selectedOption: string,
  field: HurdleField
): StructuredQuestion | null {
  const questionMap = field === 'problem'
    ? PROBLEM_QUESTIONS
    : field === 'scope'
      ? SCOPE_QUESTIONS
      : STAKES_QUESTIONS

  const currentQuestion = questionMap[currentQuestionId]
  if (!currentQuestion) {
    throw new Error(`Question not found: ${currentQuestionId}`)
  }

  const nextQuestionId = currentQuestion.nextQuestionLogic?.(selectedOption)

  if (!nextQuestionId) {
    return null // Conversation complete for this field
  }

  const nextQuestion = questionMap[nextQuestionId]
  if (!nextQuestion) {
    throw new Error(`Next question not found: ${nextQuestionId}`)
  }

  return nextQuestion
}

/**
 * Answer record for tracking user selections
 */
export interface QuestionAnswer {
  questionId: string
  selectedOption: string
  customText?: string
  timestamp: string
}

/**
 * Build a summary text from answers collected for a field
 */
export function buildFieldSummary(
  field: HurdleField,
  answers: QuestionAnswer[]
): string {
  // This is a placeholder - the AI will generate the actual summary
  // But we provide the structured data for the AI to work with
  const answerMap: Record<string, { option: string, custom?: string }> = {}

  answers.forEach((answer) => {
    answerMap[answer.questionId] = {
      option: answer.selectedOption,
      custom: answer.customText
    }
  })

  return JSON.stringify(answerMap)
}

/**
 * Get all questions for a field (for testing/validation)
 */
export function getAllQuestionsForField(field: HurdleField): StructuredQuestion[] {
  const questionMap = field === 'problem'
    ? PROBLEM_QUESTIONS
    : field === 'scope'
      ? SCOPE_QUESTIONS
      : STAKES_QUESTIONS

  return Object.values(questionMap)
}
