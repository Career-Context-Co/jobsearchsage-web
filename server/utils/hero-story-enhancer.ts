/**
 * Hero Story Enhancement AI Service
 *
 * Handles AI-powered conversational coaching for HERO story sections.
 * Supports both free-form conversational and structured question-based modes.
 */

import { createGateway, generateText } from 'ai'
import {
  getFirstQuestion,
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
- Did they have decision-making authority? Approval needed?
- Were they working solo, leading a team, or part of a team?
- Focus ONLY on position and authority - extract the MINIMUM necessary
- Do NOT extract specific work activities, technical details, or project descriptions
- Keep role description to 1-2 sentences maximum

[GOALS]:
- FIRST: Ask qualitatively what they were expected to accomplish (not metrics yet!)
  Example: "For the database migration, what were you expected to accomplish?"
- THEN: Ask about metrics, timelines, targets that defined success
  Example: "How was success measured? Were there specific performance targets?"
- FINALLY: Ask who set these goals and why
  Example: "Who decided on these goals - was it a leadership directive or team initiative?"
- Use the Hurdle context to understand what problem they were solving
- Focus on BUSINESS OUTCOMES: cost reduction, performance improvements, adoption rates

[CONSTRAINTS]:
- Timeline: How much time did they have? Sprint, quarter, specific deadline?
- Budget: Fixed budget, limited resources, or budget-constrained?
- Technical: Had to maintain backward compatibility, no breaking changes?
- Team: Limited headcount, had to work with existing team only?
- Political: Required approvals, stakeholder buy-in needed?
- Operational: Couldn't take downtime, had to deploy incrementally?

CRITICAL RULES:
1. DO NOT invent authority or scope they didn't have
2. For ROLE: focus only on their responsibility and authority - do NOT include specific actions, metrics, or achievements
3. If they're unsure about goals/metrics, ask what "done" looked like
4. Help them identify constraints even if they didn't think about them explicitly
5. Preserve their exact numbers and timelines
6. Keep questions conversational and one at a time

CONVERSATION FLOW:
1. Start with ROLE - understand their position and authority
2. Move to GOALS - clarify what success meant
3. Ask about CONSTRAINTS - uncover limits they operated under
4. Summarize and ask for refinements
5. Output final structured content

OUTPUT FORMAT:
After the conversation loop, return valid JSON:
{
  "role": "1-2 sentences MAX: job title + decision authority + team structure ONLY. NO actions, NO detailed responsibilities, NO project descriptions",
  "goals": "1-2 sentences: CORPORATE INITIATIVE or BUSINESS TARGET with specific metrics, timelines, and who set them. Example: 'Leadership mandated reducing support tickets by 30% within 6 months to retain at-risk contracts'",
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
    // Hurdle
    problem?: string
    scope?: string
    stakes?: string
    // Response
    actions?: string
    tools?: string
    challenges?: string
    // Outcome
    deliverable?: string
    metrics?: string
    impact?: string
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

    // For ROLE and GOALS fields, only include job title and employer (no summary/highlights to avoid bleeding)
    const experienceContext = context.experience
      ? (field === 'role' || field === 'goals')
        ? `
Experience: ${context.experience.title} at ${context.experience.employer}`
        : `
Experience: ${context.experience.title} at ${context.experience.employer}
Summary: ${context.experience.summary || 'none'}
Highlights: ${context.experience.highlights.join('; ') || 'none'}`
      : ''

    const previousFieldsContext = context.previous_field_results
      ? `
=== HURDLE SECTION (Context about the problem they faced) ===
${context.previous_field_results.problem ? `Problem: ${context.previous_field_results.problem}` : ''}
${context.previous_field_results.scope ? `Scope: ${context.previous_field_results.scope}` : ''}
${context.previous_field_results.stakes ? `Stakes: ${context.previous_field_results.stakes}` : ''}
${'='.repeat(50)}`
      : ''

    // Format answers for AI with clear labels
    const answersText = answers.map((a, idx) => {
      const customPart = a.customText ? ` (custom: ${a.customText})` : ''
      const answerLabel = field === 'goals' 
        ? idx === 0 ? 'OBJECTIVE' : idx === 1 ? 'METRICS' : 'SOURCE'
        : field === 'role'
        ? idx === 0 ? 'TITLE' : idx === 1 ? 'AUTHORITY' : 'TEAM'
        : `Q${idx + 1}`
      return `${answerLabel}: "${a.selectedOption}${customPart}"`
    }).join('\n')

    const fieldPrompt = getFieldSynthesisPrompt(field)

    const systemPrompt = `You are an expert at synthesizing structured question answers into compelling, concise achievement story text.

${fieldPrompt}

Your task:
1. Review the user's answers to structured questions
2. Generate concise text by COMBINING their exact answers into a coherent sentence
3. Use the EXACT WORDS from their answers - do NOT paraphrase, do NOT use synonyms, do NOT embellish
4. For ROLE and GOALS fields: IGNORE all context except the user's direct answers
5. DO NOT invent information, details, or terminology not in their answers
6. Write in past tense, active voice
7. Do NOT include field labels or headers in output
8. Output ONLY the combined text, nothing else

CRITICAL: If user said "enhance system reliability", write "enhance system reliability" - NOT "improve performance" or "drive innovation"`

    const userPrompt = `${momentContext}${experienceContext}${previousFieldsContext}

User's Answers to ${field.toUpperCase()} Questions:
${answersText}

${(field === 'role' || field === 'goals') 
  ? `CRITICAL INSTRUCTIONS:
- Use the EXACT WORDS from the user's answers above
- Simply combine their answers into one coherent sentence
- DO NOT paraphrase, rephrase, or use synonyms
- DO NOT add words like "innovation", "features", "adoption" unless they said those words
- If they said "enhance system reliability" → write "enhance system reliability"
- If they said "user satisfaction ratings" → write "user satisfaction ratings"

` 
  : ''}Generate the ${field} text:`

    // Use fewer tokens for role and goals fields to enforce brevity and prevent hallucination
    const maxTokens = (field === 'role' || field === 'goals') ? 150 : 300
    // Use very low temperature for role and goals to reduce creativity/hallucination
    const temperature = (field === 'role' || field === 'goals') ? 0.1 : 0.7
    
    const result = await generateText({
      model: gateway('openai/gpt-4o-mini'),
      system: systemPrompt,
      prompt: userPrompt,
      temperature,
      maxTokens
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
      return `For the ROLE field, write 1-2 SHORT sentences by DIRECTLY COMBINING the user's answers.

YOU WILL RECEIVE:
- TITLE: Their job title
- AUTHORITY: Their decision-making authority
- TEAM: Team structure (solo, led team, part of team)

STRICT RULES:
1. Use the EXACT WORDS from their answers - copy them directly
2. Do NOT add actions (no "designing", "managing", "implementing")
3. Maximum 2 sentences, maximum 40 words
4. Just combine: [TITLE] + [AUTHORITY] + [TEAM]

OUTPUT FORMAT:
"As [TITLE text], I [AUTHORITY text] and [TEAM text]."

Example:
If TITLE: "Software Engineer 2"
If AUTHORITY: "Collaborated with cross-functional teams with shared decision-making"
If TEAM: "Part of a team"

Output: "As Software Engineer 2, I collaborated with cross-functional teams with shared decision-making and was part of a team."

DO NOT CHANGE THE WORDS. Just combine them.`

    case 'goals':
      return `For the GOALS field, write 1-2 sentences by DIRECTLY COMBINING the user's answers.

YOU WILL RECEIVE:
- OBJECTIVE: What they were expected to accomplish
- METRICS: How success was measured
- SOURCE: Who set the goals

STRICT RULES:
1. Use the EXACT WORDS from their answers - copy them directly
2. Do NOT paraphrase "Enhance system reliability" into "improve performance" or "drive innovation"
3. Do NOT add words like "innovation", "features", "adoption" unless those exact words appear in answers
4. Simply concatenate: [OBJECTIVE] + [METRICS] + [SOURCE]

OUTPUT FORMAT:
"The goal was to [OBJECTIVE text], with success measured by [METRICS text], set by [SOURCE text]."

Example:
If OBJECTIVE: "Enhance system reliability and uptime"
If METRICS: "User satisfaction ratings post-migration"
If SOURCE: "Engineering team to improve system stability"

Output: "The goal was to enhance system reliability and uptime, with success measured by user satisfaction ratings post-migration, set by the engineering team to improve system stability."

DO NOT CHANGE THE WORDS. Just combine them.`

    case 'constraints':
      return `For the CONSTRAINTS field, synthesize answers to convey:
- Budget, timeline, or resource limitations
- Technical limitations or requirements
- Organizational or policy constraints

Example: "I had to deliver within 6 weeks with no additional headcount, while maintaining backward compatibility with the existing OAuth implementation and meeting SOC 2 compliance requirements."`

    // Response fields
    case 'actions':
      return `For the ACTIONS field, synthesize answers to convey:
- The specific steps or methodology used
- The sequence of what was done
- Whether the work was solo or collaborative
- How the approach was validated

Example: "I began by profiling the slow endpoints to identify the root cause, then designed a Redis caching layer, implemented it incrementally behind a feature flag, and validated each step with load tests before full rollout."`

    case 'tools':
      return `For the TOOLS field, synthesize answers to convey:
- Specific technologies, languages, or frameworks used
- Infrastructure components (databases, caching, cloud services)
- Development and delivery tools
- Third-party services or APIs

Example: "I used Python and FastAPI for the backend service, Redis for caching, PostgreSQL for persistence, AWS Lambda and SQS for async processing, and Datadog for monitoring and alerting."`

    case 'challenges':
      return `For the CHALLENGES field, synthesize answers to convey:
- What did not go as planned or was harder than expected
- Technical, process, or knowledge obstacles
- How each obstacle was overcome

Example: "The main challenge was cache invalidation causing stale data for high-frequency writes, which I solved by implementing event-driven invalidation instead of TTL-only expiry. I also had to ramp up quickly on Redis Cluster configuration, which required two extra days of research."`

    // Outcome fields
    case 'deliverable':
      return `For the DELIVERABLE field, synthesize answers to convey:
- The tangible thing created, shipped, or delivered (feature, system, process, tool, fix)
- Whether it reached production and when
- The deployment approach (smooth, incremental, big launch)

Example: "I shipped a distributed rate-limiting service to production in a phased rollout over two weeks, replacing the previous per-instance in-memory approach with a Redis-backed cluster that handles all traffic globally."`

    case 'metrics':
      return `For the METRICS field, synthesize answers to convey:
- Quantifiable before-and-after improvements
- Performance, scale, cost, or quality numbers
- Use exact figures with ~ for estimates if needed

Example: "API response times dropped from ~8 seconds to under 200ms (97% improvement), error rates fell from 12% to under 0.5%, and the service now handles 3x the previous peak traffic without degradation."`

    case 'impact':
      return `For the IMPACT field, synthesize answers to convey:
- Business impact: revenue unlocked, launches enabled, customers unblocked
- Team impact: velocity, morale, or productivity improvements
- Recognition received (awards, shout-outs, promotions)
- Downstream effects or strategic significance

Example: "The improvement unblocked the Q3 mobile launch, which the product team had been waiting on for six weeks, and reduced support tickets by 40%. Engineering leadership cited the project in the all-hands performance review and I received a spot bonus."`
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
      role: `Generate ONE conversational question to help identify the user's ROLE for this story.

ROLE has exactly 3 aspects - ask ONE question per aspect:
  - Question 1: Job title/position during this work
  - Question 2: Decision-making authority (full authority, collaborative, directive from manager)
  - Question 3: Team structure (worked solo, led team, part of team)

STOP after 3 questions.

Reference the story title in your question. Provide 4-6 specific answer options.

Example questions:
- "What was your job title when you worked on this project?"
- "What level of decision-making authority did you have?"
- "Did you work solo or as part of a team?"

Good answer options for authority:
- "Full decision authority - I made all technical calls"
- "Collaborative - decisions made with team input"  
- "Directive from management - I executed their plan"
- "Needed approval from senior leadership"`,
      
      goals: `Generate ONE conversational question to help identify the GOALS for this story.

GOALS has exactly 3 aspects - ask ONE question per aspect:
  - Question 1: What were you/your team expected to accomplish? (qualitative objective)
  - Question 2: How was success measured? (metrics, timelines, targets)
  - Question 3: Who set these goals? (leadership directive, team initiative, business need)

STOP after 3 questions.

Reference the story title in your question. Provide 4-6 specific answer options.

Example questions:
- "What were you expected to accomplish with this project?"
- "Were there specific metrics or timelines to meet?"
- "Who set these goals - leadership, your team, or was it self-driven?"`,
      
      constraints: `Generate ONE conversational question to help identify the CONSTRAINTS for this story.

Focus areas (max 5 questions):
- Timeline constraints (deadlines, sprint cycles)
- Budget or resource limitations
- Technical constraints (backward compatibility, no downtime)
- Team constraints (limited headcount)
- Organizational constraints (approvals, stakeholder buy-in)

Reference the story title in your question. Provide 4-6 specific answer options.

Example questions:
- "What timeline were you working with for this project?"
- "Were there any budget or resource limitations?"
- "Were there technical constraints you had to work within?"`,

      // Response field prompts
      actions: `Generate ONE conversational question to help identify the ACTIONS taken in this story.

ACTIONS has up to 5 aspects - ask one at a time:
- First step / starting approach (research, prototype, incremental, etc.)
- Sequence of steps taken
- Collaboration: solo work vs. coordinating with others
- Validation: how they tested or verified their approach
- Implementation method

Reference the specific work from the story title. Provide 4-6 concrete answer options.

Example questions:
- "Where did you start when tackling this project?"
- "What was your implementation approach?"
- "Did you work solo or coordinate with others on this?"`,

      tools: `Generate ONE conversational question to help identify the TOOLS and technologies used in this story.

TOOLS has up to 4 aspects:
- Programming languages, frameworks, or libraries
- Infrastructure: databases, caching, queues, cloud services
- Development / delivery tools: CI/CD, testing frameworks, observability
- Third-party services or APIs

Reference the specific work from the story title. Provide 4-6 concrete, specific answer options (not generic categories).

Example questions:
- "What programming languages or frameworks did you use for this?"
- "What infrastructure or cloud services were involved?"
- "What tools did you use to test or monitor this work?"`,

      challenges: `Generate ONE conversational question to help identify the CHALLENGES encountered in this story.

CHALLENGES has up to 4 aspects:
- Technical obstacles: bugs, performance, compatibility issues
- Process obstacles: approvals, coordination delays, review cycles
- Knowledge gaps: had to learn something new
- How each obstacle was overcome

Reference the specific work from the story title. Provide 4-6 concrete answer options.

Example questions:
- "What was the hardest technical obstacle you ran into?"
- "Were there any unexpected complications or blockers?"
- "Was there anything you had to learn on the fly to complete this?"`,

      // Outcome field prompts
      deliverable: `Generate ONE conversational question to help identify the DELIVERABLE from this story.

DELIVERABLE has up to 4 aspects:
- What tangible thing was shipped (feature, system, process, tool, fix)
- Whether it shipped to production and when
- What the deployment was like (smooth, incremental, big launch)
- Whether it is still in use

Reference the specific work from the story title. Provide 4-6 concrete answer options.

Example questions:
- "What specific thing did you ship or deliver with this project?"
- "Did this make it to production? How was it rolled out?"
- "Is what you built still in use today?"`,

      metrics: `Generate ONE conversational question to help identify the METRICS from this story.

METRICS has up to 4 aspects:
- Performance improvements: speed, latency, error rates (before vs. after)
- Scale improvements: users, requests, transactions
- Cost or time savings
- Quality improvements: uptime, reliability, adoption rates

Reference the specific work from the story title. Provide 4-6 concrete answer options.

Example questions:
- "Were there measurable performance improvements? How much faster or more reliable?"
- "Do you have before-and-after numbers for this work?"
- "What cost or time savings resulted from this?"`,

      impact: `Generate ONE conversational question to help identify the IMPACT of this story.

IMPACT has up to 4 aspects:
- Business impact: unlocked revenue, enabled a launch, unblocked customers
- Team impact: improved velocity, morale, or productivity
- User impact: positive feedback, adoption growth
- Recognition: awards, shout-outs, promotions, downstream effects

Reference the specific work from the story title. Provide 4-6 concrete answer options.

Example questions:
- "What happened to the business or team as a result of this work?"
- "Did users or customers notice the change? What was their reaction?"
- "Did this work lead to any recognition or open up future opportunities?"`
    }

    // Build context string
    const contextStr = buildContextString(context, field)
    const answersStr = answers.length > 0 
      ? `\n=== PREVIOUS ANSWERS (DO NOT REPEAT THESE TOPICS) ===\n${answers.map((a, idx) => `Question ${idx + 1}: ${a.questionId}\nAnswer: ${a.selectedOption}${a.customText ? ` (${a.customText})` : ''}`).join('\n\n')}\n${'='.repeat(50)}`
      : ''
    
    const previousQuestionStr = previousQuestion && lastSelectedOption
      ? `\nPrevious Question: ${previousQuestion.text}\nUser Selected: ${lastSelectedOption}${lastCustomText ? ` (${lastCustomText})` : ''}`
      : ''

    // Role and Goals fields have exactly 3 aspects, cap at 3 questions; others cap at 5
    const maxQuestionsForField = (field === 'role' || field === 'goals') ? 3 : 5
    const shouldContinue = answers.length < maxQuestionsForField
    
    // Force completion if max questions reached
    if (!shouldContinue) {
      return null
    }

    const systemPrompt = `You are an AI coach generating targeted, contextual questions for a HERO story enhancement session.

${fieldPrompts[field]}

CRITICAL FOCUS RULES:
1. Read the STORY TITLE in the context - your questions must be about that specific story
2. Use the key action from the title in your questions (e.g., "database migration", "API optimization")
3. Use the Job Title and Employer for context about their role
4. If Hurdle section is provided, use it for additional context about the problem

QUESTION GENERATION RULES:
1. ALWAYS reference the specific achievement from the story title in your question
2. Make questions CONVERSATIONAL - vary your phrasing, don't repeat the same question structure
3. Extract keywords from the title (e.g., "database migration", "cloud infrastructure") and use them naturally
4. Provide 4-6 SPECIFIC, CONTEXTUAL multiple-choice options (not generic ones)
5. Options should feel like real answers someone would give, not generic categories
6. Include an "Other (specify)" option that allows custom text
7. CRITICAL: Check "Previous Answers" section carefully - NEVER ask about something already covered
8. If an aspect is already known (e.g., job title already answered), move to the next aspect
9. Only indicate completion when you have ALL the information needed OR max questions reached

BAD EXAMPLES (repetitive format):
"In the achievement related to migrating the database, what was your job title?"
"In the achievement related to migrating the database, what was your authority?"
(Same structure = robotic)

GOOD EXAMPLES (conversational, varied):
"What was your job title when you worked on the database migration?"
"Who had the final say on technical decisions for this migration?"
"Did you lead this migration effort, or were you part of a larger team?"
(Different structures = natural conversation)

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
Questions asked so far: ${answers.length}/${maxQuestionsForField}

IMPORTANT:
1. Your question must reference the Story Title from the context
2. DO NOT repeat questions already answered above
3. Check previous answers to avoid asking the same thing

COMPLETION CRITERIA:
${field === 'role' 
  ? 'ROLE needs 3 aspects: (1) job title, (2) authority, (3) team structure. Stop after 3 questions.'
  : field === 'goals'
  ? 'GOALS needs 3 aspects: (1) objective, (2) metrics, (3) who set goals. Stop after 3 questions.'
  : field === 'constraints'
  ? 'CONSTRAINTS: Ask up to 5 questions about limitations they faced.'
  : field === 'actions'
  ? 'ACTIONS: Ask up to 5 questions covering their step-by-step approach.'
  : field === 'tools'
  ? 'TOOLS: Ask up to 4 questions covering languages, infra, delivery, and third-party services.'
  : field === 'challenges'
  ? 'CHALLENGES: Ask up to 4 questions covering obstacles encountered and how they were solved.'
  : field === 'deliverable'
  ? 'DELIVERABLE: Ask up to 4 questions covering what was shipped, when, and how.'
  : field === 'metrics'
  ? 'METRICS: Ask up to 4 questions covering before/after numbers and measurable improvements.'
  : field === 'impact'
  ? 'IMPACT: Ask up to 4 questions covering business, team, user, and recognition effects.'
  : 'Ask up to 5 targeted questions.'}

${!shouldContinue ? 'STOP: Maximum questions reached. Return {"continue": false}' : 'Generate the next question or indicate completion if you have sufficient information:'}
`

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

    // Generate more descriptive question ID based on field and question number
    let questionId = `${field}_q${answers.length + 1}`
    if (field === 'role') {
      const roleAspects = ['title', 'authority', 'team']
      if (answers.length < roleAspects.length) {
        questionId = `${field}_${roleAspects[answers.length]}`
      }
    } else if (field === 'goals') {
      const goalsAspects = ['objective', 'metrics', 'source']
      if (answers.length < goalsAspects.length) {
        questionId = `${field}_${goalsAspects[answers.length]}`
      }
    }

    // Return structured question
    return {
      id: questionId,
      text: parsed.question,
      field,
      options: parsed.options || []
    }
  } catch (error: any) {
    console.error('Error generating contextual question:', error)
    // Fallback to static question if AI fails
    // Note: getFirstQuestion only works for hurdle fields (problem, scope, stakes)
    if (field === 'problem' || field === 'scope' || field === 'stakes') {
      return getFirstQuestion(field)
    }
    const fallbackText: Record<SectionField, string> = {
      problem: 'What specific problem or challenge did you face?',
      scope: 'Who was affected by this problem?',
      stakes: 'What was at risk if this was not solved?',
      role: 'What was your job title during this achievement?',
      goals: 'What were you trying to accomplish with this project?',
      constraints: 'What constraints or limitations did you face?',
      actions: 'What was your first step in addressing this challenge?',
      tools: 'What technologies or tools did you use?',
      challenges: 'What unexpected obstacles did you encounter?',
      deliverable: 'What tangible thing did you ship or deliver?',
      metrics: 'What measurable improvements resulted from your work?',
      impact: 'What was the broader impact of this work on the business or team?'
    }
    return {
      id: `${field}_fallback`,
      text: fallbackText[field],
      field,
      options: [
        { id: 'option1', label: 'Please specify', allowCustom: true }
      ]
    }
  }
}

/**
 * Build context string for AI prompts
 */
function buildContextString(context: StructuredEnhancementInput, field?: string): string {
  let contextStr = ''

  // HERO STORY TITLE is the PRIMARY focus
  if (context.moment_title && context.moment_title.trim().length > 0) {
    contextStr += `=== PRIMARY: THE STORY ===
Story Title: "${context.moment_title}"
ALL questions must be about this specific story: "${context.moment_title}"`
  }

  // Experience context - include job title and employer, but NOT summary/highlights for role/goals
  if (context.experience) {
    contextStr += `\n\n=== BACKGROUND ===
Job Title: ${context.experience.title}
Employer: ${context.experience.employer}`
    
    // Only include summary/highlights for fields other than role/goals to prevent confusion
    if (field !== 'role' && field !== 'goals') {
      if (context.experience.summary) {
        contextStr += `\nSummary: ${context.experience.summary}`
      }
      if (context.experience.highlights && context.experience.highlights.length > 0) {
        contextStr += `\nHighlights: ${context.experience.highlights.join('; ')}`
      }
    }
  }

  // Include previous section context if filled in
  if (context.previous_field_results) {
    const pfr = context.previous_field_results
    const hasProblem = pfr.problem && pfr.problem.trim().length > 20
    const hasScope = pfr.scope && pfr.scope.trim().length > 20
    const hasStakes = pfr.stakes && pfr.stakes.trim().length > 20

    if (hasProblem || hasScope || hasStakes) {
      contextStr += '\n\n=== HURDLE SECTION (already filled) ==='
      if (hasProblem) contextStr += `\nProblem: ${pfr.problem}`
      if (hasScope) contextStr += `\nScope: ${pfr.scope}`
      if (hasStakes) contextStr += `\nStakes: ${pfr.stakes}`
    }

    const hasActions = pfr.actions && pfr.actions.trim().length > 10
    const hasTools = pfr.tools && pfr.tools.trim().length > 10
    const hasChallenges = pfr.challenges && pfr.challenges.trim().length > 10

    if (hasActions || hasTools || hasChallenges) {
      contextStr += '\n\n=== RESPONSE SECTION (already filled) ==='
      if (hasActions) contextStr += `\nActions: ${pfr.actions}`
      if (hasTools) contextStr += `\nTools: ${pfr.tools}`
      if (hasChallenges) contextStr += `\nChallenges: ${pfr.challenges}`
    }

    const hasDeliverable = pfr.deliverable && pfr.deliverable.trim().length > 10
    const hasMetrics = pfr.metrics && pfr.metrics.trim().length > 10
    const hasImpact = pfr.impact && pfr.impact.trim().length > 10

    if (hasDeliverable || hasMetrics || hasImpact) {
      contextStr += '\n\n=== OUTCOME SECTION (already filled) ==='
      if (hasDeliverable) contextStr += `\nDeliverable: ${pfr.deliverable}`
      if (hasMetrics) contextStr += `\nMetrics: ${pfr.metrics}`
      if (hasImpact) contextStr += `\nImpact: ${pfr.impact}`
    }
  }

  return contextStr
}

/**
 * Generate contextual transition message for structured questions
 */
export async function generateTransitionMessage(
  field: SectionField,
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
