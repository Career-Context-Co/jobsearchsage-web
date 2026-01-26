/**
 * Hero Story Enhancement AI Service
 * 
 * Handles AI-powered conversational coaching for HERO story sections.
 * Uses multi-turn conversations to extract information through targeted questions.
 */

import { createGateway, generateText } from 'ai'

const apiKey = useRuntimeConfig().aiGatewayApiKey
if (!apiKey) {
  throw new Error('AI Gateway API Key is not set')
}

const gateway = createGateway({
  apiKey: apiKey,
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
  outcome: ['deliverable', 'metrics', 'impact'],
}

/**
 * Database field names for each section type (camelCase for hero_stories table)
 */
const SECTION_DB_FIELD_NAMES: Record<SectionType, [string, string, string]> = {
  hurdle: ['hurdleProblem', 'hurdleScope', 'hurdleStakes'],
  expectation: ['expectationRole', 'expectationGoals', 'expectationConstraints'],
  response: ['responseActions', 'responseTools', 'responseChallenges'],
  outcome: ['outcomeDeliverable', 'outcomeMetrics', 'outcomeImpact'],
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
function formatCurrentValues(sectionType: SectionType, currentValues: { field1: string | null; field2: string | null; field3: string | null }): string {
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
  const momentContext = input.moment_title ? `
- Hero Moment Title: ${input.moment_title}
- Hero Moment Description: ${input.moment_description || 'none'}` : ''

  // Build experience context if provided
  const experienceContext = input.experience ? `
- Source Experience: ${input.experience.title} at ${input.experience.employer}
- Employment Type: ${input.experience.employment_type}
- Experience Duration: ${input.experience.start_date} to ${input.experience.end_date || 'Present'}
- Experience Summary: ${input.experience.summary || 'none'}
- Experience Highlights: ${input.experience.highlights.length > 0 ? input.experience.highlights.join('; ') : 'none'}
- Experience Context Notes: ${input.experience.context_notes || 'none'}
- Location: ${input.experience.location || 'not specified'} (${input.experience.location_type || 'not specified'})` : ''
  
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
      maxTokens: 500,
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
): Promise<{ aiMessage: string; isComplete: boolean; finalOutput?: EnhancementOutput }> {
  try {
    const systemPrompt = getSystemPromptForSection(sectionType)
    
    // Build messages array with full history
    const messages = [
      ...conversationHistory,
      { role: 'user' as const, content: userMessage },
    ]

    const result = await generateText({
      model: gateway('openai/gpt-4.1-mini'),
      system: systemPrompt,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      temperature: 0.6,
      maxTokens: 800,
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
      finalOutput,
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
  } catch (e) {
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
    [dbFieldNames[2]]: parsed[fieldNames[2]],
  }
}
