/**
 * Hero Story Enhancement AI Service
 *
 * Handles AI-powered conversational coaching for HERO story sections.
 * Supports both free-form conversational and structured question-based modes.
 */

import { createGateway, generateText } from 'ai'
import {
  getFirstQuestion,
  getNextQuestion,
  type HurdleField,
  type SectionField,
  type QuestionAnswer,
  type StructuredQuestion
} from './hero-structured-questions'

const apiKey = useRuntimeConfig().aiGatewayApiKey
if (!apiKey) {
  throw new Error('AI Gateway API Key is not set')
}

const gateway = createGateway({
  apiKey: apiKey
})

/**
 * Error class for hero story enhancement service
 */
export class HeroEnhancementError extends Error {
  constructor(
    message: string,
    public code: 'TIMEOUT' | 'API_ERROR' | 'INVALID_RESPONSE' | 'API_KEY_MISSING',
    public details?: any
  ) {
    super(message)
    this.name = 'HeroEnhancementError'
  }
}

/**
 * Section type definition
 */
export type SectionType = 'hurdle' | 'expectation' | 'response' | 'outcome'

/**
 * Field names for each section type (as they appear in prompts and AI responses)
 */
const SECTION_FIELD_NAMES: Record<SectionType, [string, string, string]> = {
  hurdle: ['problem', 'scope', 'stakes'],
  expectation: ['role', 'goals', 'constraints'],
  response: ['actions', 'tools', 'challenges'],
  outcome: ['deliverable', 'metrics', 'impact']
}

/**
 * Database field names for each section type (camelCase for hero_stories table)
 */
const SECTION_DB_FIELD_NAMES: Record<SectionType, [string, string, string]> = {
  hurdle: ['hurdleProblem', 'hurdleScope', 'hurdleStakes'],
  expectation: ['expectationRole', 'expectationGoals', 'expectationConstraints'],
  response: ['responseActions', 'responseTools', 'responseChallenges'],
  outcome: ['outcomeDeliverable', 'outcomeMetrics', 'outcomeImpact']
}

/**
 * System prompts for each section
 */
const HURDLE_SYSTEM_PROMPT = `You are an interactive AI coach helping a user build out the Hurdle section of their HERO story. The Hurdle describes the challenge, problem, or opportunity they faced at work.

THREE TAGS IN THIS SECTION:
- [PROBLEM]: The specific challenge, problem, or opportunity identified
- [SCOPE]: The size, scale, and who or what was affected
- [STAKES]: Why this mattered, what was at risk, the business or team impact

YOUR ROLE:
- Ask targeted questions to help the user articulate each tag
- Most users will have empty or minimal fields when they click "Get AI Help"
- Use the hero moment title/description and source experience as context clues
- Guide them through a conversational question loop
- When they provide answers, help refine them with follow-up questions

WHAT TO LOOK FOR AND ASK ABOUT PER TAG:

[PROBLEM]:
- What was broken, slow, missing, or inefficient?
- Was it a technical issue, process issue, or business opportunity?
- What triggered this - customer complaint, metric, incident, observation?
- Be specific: "slow API response" not just "system issues"

[SCOPE]:
- How many people/systems/customers were affected?
- Was it just your team, entire company, or external users?
- What was the frequency? Daily, constant, occasional?
- Geographic scope? One office, multiple regions, global?
- Duration? How long had this been a problem?

[STAKES]:
- What was at risk if this wasn't solved?
- Business impact: revenue loss, customer churn, missed deadlines?
- Team impact: morale, productivity, technical debt?
- Competitive impact: losing to competitors, market position?
- Quantify if possible: "risk losing $X" or "blocking Y% of team"

CRITICAL RULES:
1. DO NOT invent details - only ask questions to extract what they know
2. If they say "I don't know" or "not sure", move on to next question
3. Keep questions conversational and one at a time
4. Preserve their exact facts, numbers, and phrasing
5. For vague answers, ask clarifying follow-ups

CONVERSATION FLOW:
1. Acknowledge their hero moment context
2. Ask targeted questions for PROBLEM
3. Ask targeted questions for SCOPE
4. Ask targeted questions for STAKES
5. Summarize what you learned and ask if they want to add/refine anything
6. Output final structured content

OUTPUT FORMAT:
After the conversation loop, return valid JSON:
{
  "problem": "specific problem extracted from conversation",
  "scope": "scope details extracted from conversation",
  "stakes": "stakes/impact extracted from conversation",
  "questions_asked": ["list of questions you asked"],
  "conversation_complete": true
}

If you need more rounds of questions, set conversation_complete: false and continue asking.`

const EXPECTATION_SYSTEM_PROMPT = `You are an interactive AI coach helping a user build out the Expectation section of their HERO story. The Expectation describes what they were responsible for and what they were trying to achieve.

THREE TAGS IN THIS SECTION:
- [ROLE]: The user's responsibility, authority, or position in addressing this challenge
- [GOALS]: The specific targets, objectives, or outcomes they were trying to accomplish
- [CONSTRAINTS]: The limits, boundaries, or constraints they operated under (budget, timeline, resources, technical limitations)

YOUR ROLE:
- Ask targeted questions to help the user articulate each tag
- Most users will have empty or minimal fields when they click "Get AI Help"
- Use the hero moment title/description and source experience as context clues
- Guide them through a conversational question loop

WHAT TO LOOK FOR AND ASK ABOUT PER TAG:

[ROLE]:
- What was their official job title when this happened?
- Were they leading this effort or supporting someone else?
- Did they have decision-making authority? Approval needed?
- Were they working solo, leading a team, or part of a team?
- Cross-functional coordination needed? Which teams/stakeholders?
- Was this their main job or a side initiative?

[GOALS]:
- What were they trying to achieve? What would "success" look like?
- Were there specific metrics or targets? (speed, cost, quality, adoption)
- Was there a deadline or milestone driving this?
- Who set these goals - leadership, the team, or themselves?
- Primary goal vs. secondary goals?
- Quantifiable whenever possible

[CONSTRAINTS]:
- Timeline: How much time did they have? Sprint, quarter, specific deadline?
- Budget: Fixed budget, limited resources, or budget-constrained?
- Technical: Had to maintain backward compatibility, no breaking changes?
- Team: Limited headcount, had to work with existing team only?
- Political: Required approvals, stakeholder buy-in needed?
- Operational: Couldn't take downtime, had to deploy incrementally?

CRITICAL RULES:
1. DO NOT invent authority or scope they didn't have
2. If they're unsure about goals/metrics, ask what "done" looked like
3. Help them identify constraints even if they didn't think about them explicitly
4. Preserve their exact numbers and timelines
5. Keep questions conversational and one at a time

CONVERSATION FLOW:
1. Start with ROLE - understand their position and authority
2. Move to GOALS - clarify what success meant
3. Ask about CONSTRAINTS - uncover limits they operated under
4. Summarize and ask for refinements
5. Output final structured content

OUTPUT FORMAT:
After the conversation loop, return valid JSON:
{
  "role": "role and authority extracted from conversation",
  "goals": "specific goals extracted from conversation",
  "constraints": "constraints extracted from conversation",
  "questions_asked": ["list of questions you asked"],
  "conversation_complete": true
}`

const RESPONSE_SYSTEM_PROMPT = `You are an interactive AI coach helping a user build out the Response section of their HERO story. The Response describes what specific actions they took to address the challenge.

THREE TAGS IN THIS SECTION:
- [ACTIONS]: The specific steps, approach, or methodology they followed
- [TOOLS]: The technologies, systems, frameworks, or resources they used
- [CHALLENGES]: The obstacles they encountered and how they overcame them

YOUR ROLE:
- Ask targeted questions to help the user articulate each tag
- Most users will have empty or minimal fields when they click "Get AI Help"
- Use the hero moment title/description and source experience as context clues
- Guide them through a conversational question loop

WHAT TO LOOK FOR AND ASK ABOUT PER TAG:

[ACTIONS]:
- What was their first step? Where did they start?
- What approach or methodology did they use? (research, prototype, incremental, etc.)
- Walk through the sequence: What came after the first step?
- Did they work solo or coordinate with others?
- How did they validate their approach? Testing? Code review?
- What was the implementation process like?
- Be specific about what they actually did, not what "the team" did

[TOOLS]:
- What specific technologies did they use? Versions matter.
- Programming languages, frameworks, libraries?
- Infrastructure: databases, caching layers, message queues?
- Monitoring/observability tools?
- Development tools: IDEs, CI/CD, testing frameworks?
- Third-party services or APIs?
- List concrete tools, not generic categories

[CHALLENGES]:
- What didn't go as planned? What was harder than expected?
- Technical obstacles: bugs, performance issues, compatibility?
- Process obstacles: reviews, approvals, coordination delays?
- Knowledge gaps: Had to learn something new?
- How did they overcome each obstacle? What was their solution?
- Multiple challenges are common - probe for all of them

CRITICAL RULES:
1. DO NOT invent technical details they didn't mention
2. Ask for specifics: "What version of Redis?" "Which AWS services?"
3. Help them separate what they did vs. what the team did
4. If they skip CHALLENGES, probe explicitly - obstacles make stories compelling
5. Preserve their exact technical terminology and tools

CONVERSATION FLOW:
1. Ask about ACTIONS - get the step-by-step walkthrough
2. Ask about TOOLS - get specific technologies and versions
3. Ask about CHALLENGES - uncover obstacles and solutions
4. Summarize and ask for refinements
5. Output final structured content

OUTPUT FORMAT:
After the conversation loop, return valid JSON:
{
  "actions": "specific actions extracted from conversation",
  "tools": "specific tools and technologies extracted from conversation",
  "challenges": "obstacles and solutions extracted from conversation",
  "questions_asked": ["list of questions you asked"],
  "conversation_complete": true
}`

const OUTCOME_SYSTEM_PROMPT = `You are an interactive AI coach helping a user build out the Outcome section of their HERO story. The Outcome describes what was delivered and the measurable impact achieved.

THREE TAGS IN THIS SECTION:
- [DELIVERABLE]: The tangible output, system, feature, or artifact created
- [METRICS]: Quantifiable results with numbers, percentages, or measurable improvements
- [IMPACT]: The qualitative business, team, or user impact, including recognition received

YOUR ROLE:
- Ask targeted questions to help the user articulate each tag
- Most users will have empty or minimal fields when they click "Get AI Help"
- Use the hero moment title/description and source experience as context clues
- Guide them through a conversational question loop
- Help users quantify their impact even when they think they "don't have numbers"

WHAT TO LOOK FOR AND ASK ABOUT PER TAG:

[DELIVERABLE]:
- What tangible thing did they create/ship/deliver?
- Was it a feature, system, process, tool, or fix?
- Did it ship to production? When?
- What was the deployment like? (smooth, incremental, big launch)
- Is this still in use today?
- Be concrete: "authentication caching layer" not "better performance"

[METRICS]:
- Performance improvements: How much faster/slower? Before vs. after?
- Scale improvements: How many more users/requests/transactions?
- Cost savings: How much money saved? What % reduction?
- Time savings: How much time saved for whom?
- Quality improvements: Error rate reduction? Uptime increase?
- Adoption metrics: How many users? What % adoption?
- Ask: "Before you made this change, what was the number? After the change, what was it?"
- Even rough numbers are valuable: "went from ~10s to ~2s"

[IMPACT]:
- Business impact: Did this unlock revenue, enable a launch, unblock customers?
- Team impact: Did this improve team velocity, morale, or productivity?
- User impact: Did users notice? Positive feedback?
- Strategic impact: Did this enable future work or change direction?
- Recognition: Awards, shout-outs, promotions, bonuses?
- Downstream effects: What happened as a result of this?
- Ask: "What happened as a result of this work?"

CRITICAL RULES:
1. DO NOT invent metrics - if they don't know, probe differently
2. Help them find metrics they didn't realize they had
3. "How do you know it worked?" often reveals hidden metrics
4. Preserve their exact numbers - don't round or inflate
5. If they're unsure of exact number, rough estimates are okay with ~

CONVERSATION FLOW:
1. Ask about DELIVERABLE - what tangible thing shipped
2. Ask about METRICS - probe for before/after numbers
3. Ask about IMPACT - uncover the ripple effects
4. If metrics are missing, ask "How do you know it worked?"
5. Summarize and ask for refinements
6. Output final structured content

OUTPUT FORMAT:
After the conversation loop, return valid JSON:
{
  "deliverable": "specific deliverable extracted from conversation",
  "metrics": "quantified metrics extracted from conversation",
  "impact": "qualitative impact extracted from conversation",
  "questions_asked": ["list of questions you asked"],
  "conversation_complete": true
}`

/**
 * Get system prompt for section type
 */
function getSystemPromptForSection(sectionType: SectionType): string {
  switch (sectionType) {
    case 'hurdle':
      return HURDLE_SYSTEM_PROMPT
    case 'expectation':
      return EXPECTATION_SYSTEM_PROMPT
    case 'response':
      return RESPONSE_SYSTEM_PROMPT
    case 'outcome':
      return OUTCOME_SYSTEM_PROMPT
  }
}

/**
 * Enhancement input context
 */
export interface EnhancementInput {
  moment_title?: string | null
  moment_description?: string | null
  experience?: {
    id: number
    title: string
    employer: string
    employment_type: 'full_time' | 'part_time' | 'contract' | 'freelance' | 'internship'
    start_date: string
    end_date?: string | null
    current_position: boolean
    summary?: string | null
    highlights: string[]
    context_notes?: string | null
    location?: string
    location_type?: 'on_site' | 'remote' | 'hybrid'
  }
  current_values: {
    field1: string | null
    field2: string | null
    field3: string | null
  }
}

/**
 * Format current field values for display
 */
function formatCurrentValues(sectionType: SectionType, currentValues: { field1: string | null, field2: string | null, field3: string | null }): string {
  const fieldNames = SECTION_FIELD_NAMES[sectionType]
  return `- ${fieldNames[0].toUpperCase()}: ${currentValues.field1 || 'empty'}
- ${fieldNames[1].toUpperCase()}: ${currentValues.field2 || 'empty'}
- ${fieldNames[2].toUpperCase()}: ${currentValues.field3 || 'empty'}`
}

/**
 * Build input message for conversation start
 */
function buildInputMessage(sectionType: SectionType, input: EnhancementInput): string {
  // Build moment context if provided
  const momentContext = input.moment_title
    ? `
- Hero Moment Title: ${input.moment_title}
- Hero Moment Description: ${input.moment_description || 'none'}`
    : ''

  // Build experience context if provided
  const experienceContext = input.experience
    ? `
- Source Experience: ${input.experience.title} at ${input.experience.employer}
- Employment Type: ${input.experience.employment_type}
- Experience Duration: ${input.experience.start_date} to ${input.experience.end_date || 'Present'}
- Experience Summary: ${input.experience.summary || 'none'}
- Experience Highlights: ${input.experience.highlights.length > 0 ? input.experience.highlights.join('; ') : 'none'}
- Experience Context Notes: ${input.experience.context_notes || 'none'}
- Location: ${input.experience.location || 'not specified'} (${input.experience.location_type || 'not specified'})`
    : ''

  // Build contextual coaching guidance
  let coachingGuidance = 'Begin your interactive coaching session by asking your first targeted question.'
  if (input.experience) {
    coachingGuidance += ` Use the experience summary, highlights, and context notes to inform your questions with relevant details about their work at ${input.experience.employer}.`
  } else if (input.moment_title) {
    coachingGuidance += ` Use the hero moment title and description to inform your questions.`
  }

  return `CONTEXT PROVIDED:${momentContext}${experienceContext}

CURRENT FIELD VALUES (may be empty):
${formatCurrentValues(sectionType, input.current_values)}

${coachingGuidance}`
}

/**
 * Start enhancement conversation for a section
 */
export async function startEnhancementConversation(
  sectionType: SectionType,
  input: EnhancementInput
): Promise<string> {
  try {
    const systemPrompt = getSystemPromptForSection(sectionType)
    const userPrompt = buildInputMessage(sectionType, input)

    const result = await generateText({
      model: gateway('openai/gpt-4.1-mini'),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.6,
      maxTokens: 500
    })

    return result.text
  } catch (error: any) {
    if (error.code === 'ERR_TIMEOUT') {
      throw new HeroEnhancementError('AI request timed out', 'TIMEOUT', error)
    }
    if (error.message?.includes('API key')) {
      throw new HeroEnhancementError('AI Gateway API key is missing or invalid', 'API_KEY_MISSING', error)
    }
    throw new HeroEnhancementError('Failed to start enhancement conversation', 'API_ERROR', error)
  }
}

/**
 * Conversation message
 */
export interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
}

/**
 * Enhancement output with proper field names
 */
export interface EnhancementOutput {
  [key: string]: string
}

/**
 * Continue enhancement conversation
 */
export async function continueEnhancementConversation(
  sectionType: SectionType,
  conversationHistory: ConversationMessage[],
  userMessage: string
): Promise<{ aiMessage: string, isComplete: boolean, finalOutput?: EnhancementOutput }> {
  try {
    const systemPrompt = getSystemPromptForSection(sectionType)

    // Build messages array with full history
    const messages = [
      ...conversationHistory,
      { role: 'user' as const, content: userMessage }
    ]

    const result = await generateText({
      model: gateway('openai/gpt-4.1-mini'),
      system: systemPrompt,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content
      })),
      temperature: 0.6,
      maxTokens: 800
    })

    const aiResponse = result.text

    // Check if conversation is complete by looking for JSON with conversation_complete: true
    const isComplete = checkIfComplete(aiResponse)
    let finalOutput: EnhancementOutput | undefined

    if (isComplete) {
      finalOutput = extractFinalOutput(aiResponse, sectionType)
    }

    return {
      aiMessage: aiResponse,
      isComplete,
      finalOutput
    }
  } catch (error: any) {
    if (error instanceof HeroEnhancementError) {
      throw error
    }
    if (error.code === 'ERR_TIMEOUT') {
      throw new HeroEnhancementError('AI request timed out', 'TIMEOUT', error)
    }
    if (error.message?.includes('API key')) {
      throw new HeroEnhancementError('AI Gateway API key is missing or invalid', 'API_KEY_MISSING', error)
    }
    throw new HeroEnhancementError('Failed to continue enhancement conversation', 'API_ERROR', error)
  }
}

/**
 * Check if AI response indicates conversation completion
 */
function checkIfComplete(aiResponse: string): boolean {
  try {
    const jsonMatch = aiResponse.match(/\{[\s\S]*"conversation_complete":\s*true[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return parsed.conversation_complete === true
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_e) {
    // Not JSON yet, conversation continues
  }
  return false
}

/**
 * Extract final output from completed conversation
 */
function extractFinalOutput(aiResponse: string, sectionType: SectionType): EnhancementOutput {
  const jsonMatch = aiResponse.match(/\{[\s\S]*"conversation_complete"[\s\S]*\}/)
  if (!jsonMatch) {
    throw new HeroEnhancementError('No final JSON output found', 'INVALID_RESPONSE', { response: aiResponse })
  }

  const parsed = JSON.parse(jsonMatch[0])
  const fieldNames = SECTION_FIELD_NAMES[sectionType]
  const dbFieldNames = SECTION_DB_FIELD_NAMES[sectionType]

  // Validate all 3 expected fields exist
  if (!parsed[fieldNames[0]] || !parsed[fieldNames[1]] || !parsed[fieldNames[2]]) {
    throw new HeroEnhancementError(
      'Invalid AI response structure - missing required fields',
      'INVALID_RESPONSE',
      { parsed, expectedFields: fieldNames }
    )
  }

  // Return with database field names (camelCase)
  return {
    [dbFieldNames[0]]: parsed[fieldNames[0]],
    [dbFieldNames[1]]: parsed[fieldNames[1]],
    [dbFieldNames[2]]: parsed[fieldNames[2]]
  }
}

/**
 * ========================================
 * STRUCTURED QUESTION MODE
 * ========================================
 */

/**
 * Structured enhancement input context
 */
export interface StructuredEnhancementInput {
  moment_title?: string | null
  moment_description?: string | null
  experience?: {
    id: number
    title: string
    employer: string
    summary?: string | null
    highlights: string[]
    context_notes?: string | null
  }
  previous_field_results?: {
    problem?: string
    scope?: string
  }
}

/**
 * Start structured enhancement for a specific field
 * Returns the first question for that field, contextualized to the user's experience
 */
export async function startStructuredEnhancement(
  field: SectionField,
  context: StructuredEnhancementInput
): Promise<StructuredQuestion> {
  // Generate a contextual first question using AI
  return await generateContextualQuestion(field, context, null, [])
}

/**
 * Continue structured enhancement with user's answer
 * Returns next question or null if field is complete
 */
export async function continueStructuredEnhancement(
  field: SectionField,
  currentQuestion: StructuredQuestion,
  selectedOption: string,
  customText: string | undefined,
  context: StructuredEnhancementInput,
  answers: QuestionAnswer[]
): Promise<StructuredQuestion | null> {
  // Generate next contextual question using AI
  return await generateContextualQuestion(field, context, currentQuestion, answers, selectedOption, customText)
}

/**
 * Generate final field text from collected structured answers using AI
 */
export async function generateFieldTextFromAnswers(
  field: SectionField,
  answers: QuestionAnswer[],
  context: StructuredEnhancementInput
): Promise<string> {
  try {
    // Build context for AI
    const momentContext = context.moment_title
      ? `
Hero Moment: ${context.moment_title}
Description: ${context.moment_description || 'none'}`
      : ''

    const experienceContext = context.experience
      ? `
Experience: ${context.experience.title} at ${context.experience.employer}
Summary: ${context.experience.summary || 'none'}
Highlights: ${context.experience.highlights.join('; ') || 'none'}`
      : ''

    const previousFieldsContext = context.previous_field_results
      ? `
Previous Fields:
${context.previous_field_results.problem ? `- Problem: ${context.previous_field_results.problem}` : ''}
${context.previous_field_results.scope ? `- Scope: ${context.previous_field_results.scope}` : ''}`
      : ''

    // Format answers for AI
    const answersText = answers.map((a) => {
      const customPart = a.customText ? ` (custom: ${a.customText})` : ''
      return `- ${a.questionId}: ${a.selectedOption}${customPart}`
    }).join('\n')

    const fieldPrompt = getFieldSynthesisPrompt(field)

    const systemPrompt = `You are an expert at synthesizing structured question answers into compelling, concise achievement story text.

${fieldPrompt}

Your task:
1. Review the user's answers to structured questions
2. Use the context provided (hero moment, experience, previous fields) to write contextual text
3. Generate a single cohesive paragraph (2-4 sentences) that captures the essence
4. Use specific details from their answers
5. Keep it concise but informative
6. Write in past tense, active voice
7. Do NOT include field labels or headers in output
8. Output ONLY the paragraph text, nothing else`

    const userPrompt = `${momentContext}${experienceContext}${previousFieldsContext}

User's Answers to ${field.toUpperCase()} Questions:
${answersText}

Generate the ${field} text:`

    const result = await generateText({
      model: gateway('openai/gpt-4o-mini'),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7,
      maxTokens: 300
    })

    return result.text.trim()
  } catch (error: any) {
    if (error.code === 'ERR_TIMEOUT') {
      throw new HeroEnhancementError('AI request timed out', 'TIMEOUT', error)
    }
    if (error.message?.includes('API key')) {
      throw new HeroEnhancementError('AI Gateway API key is missing or invalid', 'API_KEY_MISSING', error)
    }
    throw new HeroEnhancementError('Failed to generate field text from answers', 'API_ERROR', error)
  }
}

/**
 * Get field-specific synthesis prompts
 */
function getFieldSynthesisPrompt(field: SectionField): string {
  switch (field) {
    // Hurdle fields
    case 'problem':
      return `For the PROBLEM field, synthesize answers to convey:
- What the specific problem/challenge/opportunity was
- The nature of the issue (technical, process, business, etc.)
- How it was impacting things

Example: "Authentication API endpoints were experiencing 8-10 second response times due to unoptimized database queries and lack of caching, blocking developer productivity across the engineering team of 25 people who logged in multiple times daily."`

    case 'scope':
      return `For the SCOPE field, synthesize answers to convey:
- Who was affected (team, department, customers, etc.)
- How frequently it occurred
- How long it had been a problem

Example: "The issue affected all 25 engineers on the platform team, occurring constantly with every login attempt, and had been degrading developer experience for 6 months."`

    case 'stakes':
      return `For the STAKES field, synthesize answers to convey:
- What was at risk if not solved
- The urgency level
- Quantifiable impact if mentioned

Example: "Without a solution, the team risked continued productivity loss of 2-3 hours per week per engineer, mounting frustration, and potential talent retention issues as developers complained about slow tooling."`

    // Expectation fields
    case 'role':
      return `For the ROLE field, synthesize answers to convey:
- What their position or title was in this context
- Their authority and decision-making power
- Whether they led, collaborated, or contributed individually

Example: "As Senior Backend Engineer and technical lead for the authentication team, I was responsible for architecting the solution, making key technical decisions, and coordinating implementation across three developers."`

    case 'goals':
      return `For the GOALS field, synthesize answers to convey:
- What specific outcomes they were trying to achieve
- How success was measured or defined
- Who set the goals and why

Example: "My primary goal was to reduce authentication latency to under 500ms while maintaining security standards. Leadership set a hard deadline of Q2 due to customer complaints impacting renewals."`

    case 'constraints':
      return `For the CONSTRAINTS field, synthesize answers to convey:
- Budget, timeline, or resource limitations
- Technical limitations or requirements
- Organizational or policy constraints

Example: "I had to deliver within 6 weeks with no additional headcount, while maintaining backward compatibility with the existing OAuth implementation and meeting SOC 2 compliance requirements."`
  }
}

/**
 * Generate contextual question based on experience and previous answers
 */
async function generateContextualQuestion(
  field: SectionField,
  context: StructuredEnhancementInput,
  previousQuestion: StructuredQuestion | null,
  answers: QuestionAnswer[],
  lastSelectedOption?: string,
  lastCustomText?: string
): Promise<StructuredQuestion | null> {
  try {
    const fieldPrompts: Record<SectionField, string> = {
      // Hurdle field prompts
      problem: `Generate a targeted multiple-choice question to help identify the PROBLEM they faced in THIS SPECIFIC ACHIEVEMENT.

CRITICAL: Your question MUST reference the specific work mentioned in the hero story title.
For example:
- If title mentions "database migration", ask about database issues
- If title mentions "API performance", ask about API problems  
- If title mentions "authentication system", ask about auth challenges

Focus on:
- What was broken, slow, missing, or inefficient IN THIS SPECIFIC PROJECT?
- Was it technical, process, business, or UX-related TO THIS WORK?
- What triggered their awareness of this problem IN THIS CONTEXT?

Use the exact terminology and technology from the story title in your question.`,
      
      scope: `Generate a targeted multiple-choice question to help identify the SCOPE of this specific problem.

CRITICAL: Your question MUST connect to the achievement in the story title.

Focus on:
- Who was affected BY THIS SPECIFIC ISSUE? (team size, department, customers)
- How frequently did THIS PROBLEM occur?
- How long had THIS SPECIFIC ISSUE been a problem?
- What was the scale or reach OF THIS PARTICULAR CHALLENGE?

Reference the specific work from the story title and previous answers.`,
      
      stakes: `Generate a targeted multiple-choice question to help identify the STAKES for this specific problem.

CRITICAL: Your question MUST relate to the achievement mentioned in the story title.

Focus on:
- What was at risk if THIS SPECIFIC PROBLEM wasn't solved?
- Business impact of NOT solving THIS ISSUE: revenue, deadlines, customers?
- Team impact of THIS PROBLEM: morale, productivity, retention?
- Urgency and quantifiable metrics RELATED TO THIS CHALLENGE?

Reference the specific work from the story title and previous answers.`,

      // Expectation field prompts
      role: `Generate a targeted multiple-choice question to help identify the user's ROLE in THIS SPECIFIC ACHIEVEMENT.

CRITICAL: Your question MUST reference the specific work mentioned in the hero story title.
For example:
- If title mentions "database migration", ask about their role in the migration
- If title mentions "team leadership", ask about their leadership responsibilities
- If title mentions "system design", ask about their design authority

Focus on:
- What was their specific position or title?
- What was their authority or decision-making power IN THIS PROJECT?
- What responsibilities were they assigned FOR THIS SPECIFIC WORK?
- Were they leading, collaborating, or contributing individually?

Use the exact terminology from the story title in your question.`,
      
      goals: `Generate a targeted multiple-choice question to help identify the GOALS they were trying to achieve in THIS SPECIFIC ACHIEVEMENT.

CRITICAL: Your question MUST connect to the achievement in the story title.

Focus on:
- What specific outcomes were they trying to accomplish WITH THIS WORK?
- What targets or metrics defined success FOR THIS PROJECT?
- Were the goals set by leadership, the team, or themselves?
- What did "done" look like FOR THIS SPECIFIC ACHIEVEMENT?

Reference the specific work from the story title and previous answers.`,
      
      constraints: `Generate a targeted multiple-choice question to help identify the CONSTRAINTS they faced in THIS SPECIFIC ACHIEVEMENT.

CRITICAL: Your question MUST relate to the achievement mentioned in the story title.

Focus on:
- What limits or boundaries did they operate under IN THIS PROJECT?
- Were there budget, timeline, or resource constraints FOR THIS WORK?
- What technical limitations affected THIS SPECIFIC SOLUTION?
- Were there organizational or policy constraints TO CONSIDER?

Reference the specific work from the story title and previous answers.`
    }

    // Build context string
    const contextStr = buildContextString(context)
    const answersStr = answers.length > 0 
      ? `\nPrevious Answers:\n${answers.map(a => `Q: ${a.questionId}\nA: ${a.selectedOption}${a.customText ? ` (${a.customText})` : ''}`).join('\n')}`
      : ''
    
    const previousQuestionStr = previousQuestion && lastSelectedOption
      ? `\nPrevious Question: ${previousQuestion.text}\nUser Selected: ${lastSelectedOption}${lastCustomText ? ` (${lastCustomText})` : ''}`
      : ''

    // Determine if we need another question
    const shouldContinue = answers.length < 3 // Max 3 questions per field

    const systemPrompt = `You are an AI coach generating targeted, contextual questions for a HERO story enhancement session.

${fieldPrompts[field]}

CRITICAL FOCUS RULES:
1. The HERO STORY TITLE is the PRIMARY subject - you MUST reference it directly in your question
2. Extract the key action/technology from the title and incorporate it into your question
3. Example: If title is "Migrated database to cloud infrastructure", ask about the DATABASE MIGRATION and CLOUD aspects
4. Example: If title is "Reduced API latency by 60%", ask about the LATENCY PROBLEM and API performance
5. Your questions should help elaborate on the SPECIFIC achievement mentioned in the title

QUESTION GENERATION RULES:
1. ALWAYS reference the specific achievement from the story title in your question
2. Make the question about the exact work described in the title, not generic problems
3. Extract keywords from the title (e.g., "database migration", "cloud infrastructure") and use them
4. Provide 4-6 clear, relevant multiple-choice options that relate to the story title
5. Options should be specific to the type of work mentioned in the title
6. Include an "Other (specify)" option that allows custom text
7. Keep questions conversational but SPECIFIC to their story
8. If you have enough information (after 2-3 questions), return null to indicate completion

BAD EXAMPLE (too generic):
Title: "Migrated database to cloud infrastructure"
Question: "What inefficiencies did you encounter at work?"

GOOD EXAMPLE (references the story):
Title: "Migrated database to cloud infrastructure"
Question: "What specific issues with the existing database setup prompted the need for migrating to cloud infrastructure?"

OUTPUT FORMAT:
Return a JSON object with this structure:
{
  "question": "Your specific question here?",
  "options": [
    { "id": "option1", "label": "First option", "emoji": "🎯" },
    { "id": "option2", "label": "Second option", "emoji": "📊" },
    { "id": "other", "label": "Other (specify)", "allowCustom": true }
  ],
  "continue": true
}

If no more questions needed, return:
{
  "continue": false
}

Generate ONE targeted question that moves the conversation forward.`

    const userPrompt = `${contextStr}${answersStr}${previousQuestionStr}

Field: ${field.toUpperCase()}
Questions asked so far: ${answers.length}/3

REMINDER: Your question must directly reference the specific achievement from the hero story title above. Extract keywords from the title and incorporate them into your question. Make it about THAT specific work, not generic problems.

Generate the ${shouldContinue ? 'next' : 'final'} question or indicate completion:`

    const result = await generateText({
      model: gateway('openai/gpt-4o-mini'),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.8,
      maxTokens: 500
    })

    // Parse the response
    const jsonMatch = result.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Invalid AI response format')
    }

    const parsed = JSON.parse(jsonMatch[0])

    // Check if conversation should continue
    if (!parsed.continue || !parsed.question) {
      return null // No more questions needed
    }

    // Return structured question
    return {
      id: `${field}_q${answers.length + 1}`,
      text: parsed.question,
      field,
      options: parsed.options || []
    }
  } catch (error: any) {
    console.error('Error generating contextual question:', error)
    // Fallback to static question if AI fails
    return getFirstQuestion(field)
  }
}

/**
 * Build context string for AI prompts
 */
function buildContextString(context: StructuredEnhancementInput): string {
  let contextStr = ''

  // HERO STORY is the PRIMARY focus
  if (context.moment_title) {
    contextStr += `\n=== PRIMARY FOCUS: THIS IS THE STORY ===
Hero Story Title: ${context.moment_title}`
    if (context.moment_description) {
      contextStr += `\nStory Description: ${context.moment_description}`
    }
    contextStr += '\n\nALL questions must be about THIS specific achievement shown in the title above.'
  }

  // Experience provides background context ONLY
  if (context.experience) {
    contextStr += `\n\n=== BACKGROUND CONTEXT (for reference only) ===
- Their Role: ${context.experience.title} at ${context.experience.employer}`
    
    // Only include summary if it's brief, skip highlights to avoid confusion
    if (context.experience.summary && context.experience.summary.length < 200) {
      contextStr += `\n- Role Summary: ${context.experience.summary}`
    }
    
    contextStr += '\n\nUse the role and company for context, but do NOT ask about other projects.'
  }

  if (context.previous_field_results) {
    contextStr += '\n\n=== PREVIOUS FIELD RESULTS ==='
    if (context.previous_field_results.problem) {
      contextStr += `\n- Problem: ${context.previous_field_results.problem}`
    }
    if (context.previous_field_results.scope) {
      contextStr += `\n- Scope: ${context.previous_field_results.scope}`
    }
  }

  return contextStr
}

/**
 * Generate contextual transition message for structured questions
 */
export async function generateTransitionMessage(
  field: HurdleField,
  _previousAnswer: { questionId: string, selectedOption: string, customText?: string },
  nextQuestion: StructuredQuestion | null,
  _context: StructuredEnhancementInput,
  questionNumber?: number,
  totalQuestions?: number
): Promise<string> {
  if (!nextQuestion) {
    return `Great! I have everything I need for ${field}.`
  }

  // Generate contextual coaching based on progress
  const progress = questionNumber && totalQuestions ? questionNumber / totalQuestions : 0

  // Early in conversation (< 33%)
  if (progress < 0.33) {
    const earlyMessages = [
      'This is great! Let me ask a few more questions to understand the full picture.',
      'Perfect! Just a few more questions to go.',
      'Got it! Let\'s continue building your story.',
      'Thanks for that. I\'m starting to see the picture.'
    ]
    return earlyMessages[Math.floor(Math.random() * earlyMessages.length)]
  }

  // Mid conversation (33% - 66%)
  if (progress < 0.66) {
    const midMessages = [
      'This is good info! Just a few more questions to understand the scope...',
      'Great progress! We\'re halfway there.',
      'Excellent! I\'m getting a clear picture of your situation.',
      'Perfect! A couple more questions and we\'ll have everything we need.'
    ]
    return midMessages[Math.floor(Math.random() * midMessages.length)]
  }

  // Near completion (> 66%)
  const lateMessages = [
    'Almost there! Just one or two more questions...',
    'We\'re nearly done! This is coming together nicely.',
    'Great! We\'re in the home stretch now.',
    'Excellent work! Just wrapping up with a final question or two.'
  ]
  return lateMessages[Math.floor(Math.random() * lateMessages.length)]
}
