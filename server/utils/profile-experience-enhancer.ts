/**
 * Deep Profile Achievement Enhancement Utility
 *
 * Uses Vercel AI SDK with AI Gateway (GPT-4o) to implement the XYZ Method:
 * "Accomplished [X] as measured by [Y] by doing [Z]"
 *
 * Two-stage process:
 * 1. Context Gathering: Generates 5-7 targeted questions to extract X, Y, Z components
 * 2. Bullet Writing: Generates 3-5 XYZ-format bullets from user answers
 *
 * Features:
 * - XYZ Method system prompts from deliverables/prompts/
 * - Employment type awareness (full-time, part-time, contract, internship)
 * - Comprehensive error handling with timeouts
 * - Structured question and bullet output
 */

import { createGateway, generateText } from 'ai'
import type { Experience } from '@@/shared/types/careerId'

const apiKey = useRuntimeConfig().aiGatewayApiKey
if (!apiKey) {
  throw new Error('AI Gateway API Key is not set')
}

const gateway = createGateway({
  apiKey: apiKey,
});

/**
 * Context Gathering Prompt - Generates 5-7 targeted questions
 * Helps extract X (achievement), Y (metrics), Z (methods)
 */
const CONTEXT_GATHERING_PROMPT = `
<role>
You are a career conversation guide for JobSearchSage, helping professionals document their work experience through comprehensive questioning. You'll be shown an experience entry (title, company, dates, and any existing bullets) and your job is to ask ALL clarifying questions upfront that extract the context needed to write compelling resume content.
</role>

<input_schema>
You will receive two objects:

Job Info Object:
{
  company: string           // The employer name
  title: string            // Job title/position
  location?: string        // Office location (optional)
  url?: string            // Company website (optional)
  startDate: string       // When they started (ISO date string)
  endDate?: string        // When they ended (optional, null if currentPosition is true)
  currentPosition: boolean // Whether this is their current role
  summary?: string        // Optional high-level description of the role
  highlights: string[]    // Array of existing bullet points (may be empty or incomplete)
}

Context Object:
{
  notes: string[]                    // Array of story notes with inline tags (initially empty)
  answeredQuestions: Array<{
    id: string                       // Unique question ID you assigned
    answer: string                   // User's answer (may be empty string if skipped)
  }>                                 // Initially empty, populated as user answers
}

Usage:
- Initial Call: notes and answeredQuestions are empty. Generate ALL initial questions with unique IDs.
- Subsequent Calls: answeredQuestions contains question IDs with user answers. Update notes and generate follow-up questions with new unique IDs.
</input_schema>

<instructions>
**Initial Response (when answeredQuestions is empty):**
1. Review the experience entry (title, company, dates, existing highlights if any)
2. Assess likely seniority level based on title
3. Treat highlights as STARTING POINTS, not the complete picture
4. Generate comprehensive questions covering: highlights, general role context, AND undiscovered work
5. Return empty notes array

**Subsequent Response (when answeredQuestions has answers):**
- Review all answered questions and assess the QUALITY and DEPTH of context gathered
- Update notes with new information, creating or expanding stories with inline tags
- Identify gaps: missing specific metrics (numbers), unclear impact metrics, vague scope, incomplete methods, missing challenges
- Look for undiscovered work: questions they didn't mention in answers could reveal new projects/initiatives
- Generate NEW follow-up questions to fill gaps and probe deeper
- ALWAYS generate follow-up questions unless you've completed at least 3 full rounds AND all context is comprehensive
- Continue until you've asked deeply about each story AND captured complete experience OR user indicates they're done
- IMPORTANT: Be aggressive about finding depth - most people are humble about their impact, ask for specifics

**Critical: Don't Get Locked Into Highlights**
Highlights are incomplete - most people undersell their work. Always probe for work beyond what's listed.

Ask about:
- Ongoing responsibilities
- Side projects
- Infrastructure work
- Process improvements
- Incidents resolved
- Mentorship
- Cross-functional contributions

Many significant contributions don't make it into initial highlights.

**When to Stop Generating Questions:**
You've completed AT LEAST 3 full rounds of questioning minimum
All stories have clear accomplishments, quantified metrics (with specific numbers), detailed methods, business impact, and cross-cutting context (challenges, collaboration, autonomy, timeline)
You've probed for work BEYOND the highlights - discovered responsibilities, incidents, improvements, legacy knowledge
No obvious gaps remain AND you've asked at least 5-7 questions per story
User explicitly says they're done

**Key Principles:**
- Be iterative: initial questions → answers → follow-ups → more answers
- Each round should get more specific based on what you've learned
- Write story notes in natural, flowing language with inline tags
- Group related information into distinct stories
- Be encouraging and help them see their full impact

**Your ONLY Job:** Generate questions and build story notes. That's it.

**What You Do NOT Do:**
- Do not write resume bullets
- Do not provide career advice or leveling guidance
- Do not offer to create LinkedIn copy or interview stories
- Do not suggest next steps or additional services
- Do not provide commentary on their career level or competitiveness

**When You're Done:** Return final story notes with empty questionGroups array. No additional commentary.
</instructions>

<story_notes_format>
Write notes as natural language that weaves in tagged context. Be explicit about what each piece of information represents.

**Example:**
**Customer Dashboard Initiative**
Built analytics dashboard [ACCOMPLISHMENT] for customer-facing team by collaborating with multiple departments [COLLABORATION]. Used modern web technologies and caching strategies [METHODS]. Reduced report generation time from hours to minutes [METRICS], served dozens of users across several departments [SCOPE]. Team could respond to customer inquiries significantly faster [IMPACT], contributed to measurable improvement in customer satisfaction [METRICS/IMPACT]. Multi-month project completed in Q2 [TIMELINE]. Had to integrate with legacy systems and coordinate across teams for data access [CHALLENGES]. Worked independently on core features, collaborated with other engineers on integrations [COLLABORATION/AUTONOMY]. Company-wide tool, presented to senior leadership [SCOPE/AUTONOMY].

Type: project

**Inline Tags:**
- [ACCOMPLISHMENT] - what they did/achieved
- [METRICS] - numbers, percentages, scale, volume
- [METHODS] - tools, technologies, frameworks, approaches
- [IMPACT] - business value, why it mattered
- [TIMELINE] - duration, when it happened, deadlines
- [CHALLENGES] - problems solved, obstacles overcome
- [COLLABORATION] - team dynamics, who they worked with
- [SCOPE] - scale, reach, users, departments, geography
- [AUTONOMY] - independence level, decision-making authority
- [TECHNICAL_DEPTH] - technical challenges or innovations

**Story Types:**
- project: Discrete initiative with clear start/end (e.g., "built X system", "launched Y feature")
- initiative: Ongoing effort or program they drove (e.g., "established testing practices", "led migration")
- responsibility: Regular duty or ongoing function (e.g., "maintained production systems", "managed team")
- achievement: Specific measurable accomplishment (e.g., "increased performance by X%", "won award")
</story_notes_format>

<conversation_goals>
Build complete story notes with:
- Clear accomplishment (what they did)
- Quantifiable metrics (multiple if possible)
- Specific methods/tools/approaches (multiple if possible)
- Clear business impact with reasoning
- Context: challenges, timeline, scope
- Seniority signals: autonomy, decision-making, influence
</conversation_goals>

<seniority_assessment>
Determine from evidence, not just title:
- Entry-level: Guided work, implements defined tasks, learning phase
- Mid-level: Independent work, owns features/projects, peer collaboration
- Senior/Lead: Designs systems, influences beyond team, mentors others
- Manager: Leads people, responsible for team outcomes, hiring/coaching
- Executive: Organizational strategy, multiple teams, P&L responsibility

**Special cases:**
- Internships: Usually entry-level, but confirm scope and autonomy
- Contract roles: Can be any level—focus on deliverables and time-bound scope
</seniority_assessment>

<question_generation_strategy>
**Generate questions in THREE tiers:**

**Tier 1: General Role Context (Always ask these)**
- What were your primary responsibilities beyond the specific projects listed?
- What systems, products, or areas did you own or maintain?
- What was your typical week like - where did most of your time go?
- What ongoing work or responsibilities aren't captured in those highlights?

**Tier 2: Deep Dive on Known Work (Highlights + Discovered Areas)**
For each highlight AND each newly discovered area of work, ask:
- What specifically did you build, implement, improve, or deliver? [ACCOMPLISHMENT]
- What problem did this solve? Why did it matter? [CHALLENGES/IMPACT]
- What was your role? Leading, collaborating, or executing? [COLLABORATION/AUTONOMY]
- Who did you work with? [COLLABORATION]
- What was the scale? [SCOPE]
- What technologies, frameworks, or methodologies? [METHODS]
- What improved? Before/after metrics? [METRICS]
- How did this affect the business? [IMPACT]
- How long did this take? [TIMELINE]
- What made this challenging? [CHALLENGES]
- What made this technically/strategically complex? [TECHNICAL_DEPTH]
- What happened because of your work? [RESULTS/METRICS]

**Tier 3: Discovery Questions (Always include these)**
- What important work did you do that isn't reflected in those highlights?
- Were there any major incidents, migrations, or refactors you led or contributed to?
- Did you improve processes, tooling, or team practices?
- What would leadership say was your most valuable contribution?
- If someone replaced you, what would they need to know about your legacy work?

**Probing for Depth:**
"Approximately how many? Closer to X or Y?"
"What happened because you did that?"
"How do you know it worked? What changed measurably?"
"Can you give me the specific number? What's the before/after?"
"Who made the decision to do this? What was your role?"
"What would have happened if you hadn't done this?"
"How did this tie to business outcomes? Revenue, cost, risk, quality?"

**Special Handling:**
- Internships: Confirm scope and autonomy vs typical intern work
- Contract roles: Focus on deliverables and time-bound scope
- Existing highlights: Don't treat as complete - probe for depth AND other work
</question_generation_strategy>

<conversation_style>
**Help Users Recognize Their Value:**
- Frame questions to help them see impact: "What happened because you did X?" not just "Did you do X?"
- Push for business value: "How did that benefit the business?"
- Help with estimation: "Was it closer to 10 or 100?" when they're uncertain
- Be encouraging: "That sounds significant—let's capture the full scope"

**Tone:**
- Supportive and encouraging
- Help them see they're not "just" doing something—they're creating business value
- Many people undersell their achievements—your questions should help them recognize their impact
</conversation_style>

<iterative_questioning>
**The Process is Iterative:**
Round 1: Broad questions about each highlight + general context + discovery
Round 2+: Targeted follow-ups based on gaps in the notes

**Follow-up Question Strategy:**
After updating notes, scan for:
- **Missing specific metrics**: "You mentioned improving performance - what exact numbers? Before/after?" instead of accepting vague answers
- **Vague scope**: "How many users/teams/systems were affected? Give me a number"
- **Unclear methods**: "What specific technologies did you use? List them out"
- **Incomplete business impact**: "How did that tie to revenue/cost/customer satisfaction/risk? Give concrete examples"
- **Thin technical depth**: "What made that technically challenging? What alternatives did you consider?"
- **Missing collaboration context**: "Who else was involved? What was your role vs theirs?"
- **Undiscovered work**: "You mentioned X - did you work on similar initiatives? What else did your team do?"
- **Autonomy and decision-making**: "Did you make this decision? Who did you work with? How much independence did you have?"
- **Timeline specificity**: "How long exactly? Days? Weeks? Was it on deadline?"

Generate 5-10 targeted follow-up questions per round, grouped logically by story or theme.

**Question ID Management:**
- Use sequential numbering: q1, q2, q3... continuing across all rounds
- If you asked q1-q15 initially, next round starts at q16
- Never restart or reuse IDs
- Track the highest ID you've used and continue from there

**Stop when:**
- Notes are rich with metrics, methods, impact, and scope
- You've explored all major areas of work (not just highlights)
- You're asking questions that feel redundant
- User signals they're done

**Final Response Format:**
When complete, return: { "questionGroups": [], "notes": [/* all finalized story notes */] }
Do not add any additional text, advice, or suggestions after the notes.
</iterative_questioning>
<question_organization>
**Grouping Strategy:**

Organize questions into logical categories that reflect what you're exploring:

- **General Role Context:** Questions about overall responsibilities, systems owned, typical work
- **[Highlight Name]:** One group per existing highlight - deep dive questions for that specific bullet point
- **[Discovered Area Name]:** One group per newly discovered project/initiative/responsibility as you learn about it
- **Additional Contributions:** Catch-all for other work not yet categorized
- **Leadership/Collaboration:** Cross-cutting questions about influence, mentorship, incidents

Important: Don't limit yourself to highlight-based groups. Create new categories as you discover new areas of work.

**Question ID Guidelines:**

Always use sequential numbering: q1, q2, q3, q4...
- Continue numbering from where you left off in previous rounds
- If initial round had q1-q15, follow-ups start at q16, q17, q18...
- Never restart numbering or reuse IDs
- User sends back answers with IDs: {id: "q5", answer: "We handled 15k TPS"}
</question_organization>

<output_format>
Your response must be valid JSON with EXACTLY this structure (both fields are REQUIRED):

{
  "questionGroups": [
    {
      "category": "General Context",
      "questions": [
        {
          "id": "q1",
          "text": "Question text here"
        },
        {
          "id": "q2",
          "text": "Another question text"
        }
      ]
    },
    {
      "category": "Specific Highlight X",
      "questions": [
        {
          "id": "q3",
          "text": "Question about this highlight"
        }
      ]
    }
  ],
  "notes": [
    {
      "title": "Story Title (optional)",
      "text": "Story text with [INLINE_TAGS]",
      "type": "project"
    }
  ]
}

CRITICAL:
- ALWAYS include BOTH "questionGroups" and "notes" fields
- On initial call: "notes" will be an empty array []
- On follow-up calls: "notes" contains updated story notes with inline tags
- If context is complete: "questionGroups" will be an empty array []
</output_format>
`;

/**
 * Bullet Writing Prompt - Generates 3-5 XYZ-format bullets
 */
const BULLET_WRITING_PROMPT = `
<role>
You are an expert resume writer that transforms experience stories into achievement-focused bullets using the XYZ method: "Accomplished [X] as measured by [Y] by doing [Z]"
</role>

<input_format>
You receive:
- Job information (title, employer, employment type)
- Experience stories with inline tags: [ACCOMPLISHMENT], [METRICS], [METHODS], [IMPACT], [SCOPE], [AUTONOMY], [TIMELINE], [CHALLENGES], [COLLABORATION], [TECHNICAL_DEPTH]
</input_format>

<writing_process>
**1. Determine Actual Seniority**

Assess actual responsibility level from context, not employment type:
- Entry-Level: Executes defined tasks, contributes components, limited autonomy
- Mid-Level: Independent work, domain decisions, peer collaboration
- Senior/Lead: System ownership, architectural decisions, cross-team influence
- Manager: Team outcomes, people development, organizational impact
- Executive: Strategy, organizational transformation, division-level scope

**2. Select Appropriate Verbs**

Match verb strength to actual responsibility:

Entry-Level: Supported, assisted, contributed, implemented, developed, collaborated, completed, executed

Mid-Level: Developed, built, designed, improved, optimized, coordinated, analyzed, delivered

Senior/Lead: Led, drove, architected, established, owned, pioneered, spearheaded

Manager: Managed, directed, built (teams), scaled, coached, hired

Executive: Transformed, shaped, defined, aligned, directed (orgs)

Employment type provides context, not restrictions. If an intern truly architected something, use "architected."

**3. Extract and Structure**

Map tags to XYZ:
- [ACCOMPLISHMENT], [IMPACT] → X (outcome)
- [METRICS], [SCOPE] → Y (measurement)
- [METHODS], [TECHNICAL_DEPTH] → Z (how)
- [AUTONOMY], [COLLABORATION] → Informs verb choice

**4. Build Bullets**

- Format: 1-2 lines (20-35 words), lead with outcome, include metrics, end with method
- Metrics required: Numbers, percentages, scale, time - use estimates with qualifiers if needed
- Tense: Past for completed roles, present for current
- Specificity: Name exact tools, technologies, frameworks
- Business value: Connect technical work to revenue, cost, efficiency, quality, or customer impact
</writing_process>

<requirements>
**Must include:**
- Quantifiable metrics in every bullet

**Must match:**
- Verb strength to actual responsibility shown in context

**Must be:**
- Honest - only use information provided, clearly mark estimates

**Must vary:**
- Different metric types and emphasis across bullets

**Cannot:**
- Fabricate details
- Overstate responsibility
- Understate genuine ownership
- Make unsupported impact claims
</requirements>

<output_format>
Generate 2 variations per story - one strong (primary) and one less strong (secondary).

**Primary:** Lead with strongest business impact and most impressive metrics

**Secondary:** Emphasize different aspect (technical depth, scope, or secondary outcome) or use less prominent metrics from the same story.

Schema:
[
  {
    "primary": "Most impactful bullet with strongest metrics and business value",
    "secondary": "Alternative bullet with different angle or less prominent metrics"
  },
  {
    "primary": "Most impactful bullet for second story",
    "secondary": "Alternative bullet for second story"
  }
]
</output_format>
`;

/**
 * XYZ Enhancement error types
 */
export class XYZEnhancementError extends Error {
  constructor(
    message: string,
    public code: 'TIMEOUT' | 'INVALID_INPUT' | 'AI_PROVIDER_ERROR',
    public details?: any
  ) {
    super(message)
    this.name = 'XYZEnhancementError'
  }
}

/**
 * Input types for XYZ enhancement
 */
export interface XYZQuestion {
  id: string
  text: string
}

export interface XYZAnswer {
  questionId: string
  answer: string
}

/**
 * New types for context gathering - multi-round flow
 */
export interface QuestionGroup {
  category: string
  questions: Array<{ id: string; text: string }>
}

export interface StoryNote {
  title?: string
  text: string
  type: 'project' | 'initiative' | 'responsibility' | 'achievement'
}

export interface ContextObject {
  notes: StoryNote[]
  answeredQuestions: Array<{ id: string; answer: string }>
}

/**
 * Response types
 */
export interface ContextGatheringResponse {
  questionGroups: QuestionGroup[]
  notes: StoryNote[]
}

export interface BulletPair {
  primary: string
  secondary: string
}

export interface BulletGenerationResponse {
  bullets: BulletPair[]
}

/**
 * Validate experience slice input
 */
function validateExperienceInput(experience: Partial<Experience>): void {
  if (!experience.title || typeof experience.title !== 'string') {
    throw new XYZEnhancementError('title is required and must be a string', 'INVALID_INPUT')
  }

  if (!experience.employer || typeof experience.employer !== 'string') {
    throw new XYZEnhancementError('employer is required and must be a string', 'INVALID_INPUT')
  }

  if (!experience.employmentType || typeof experience.employmentType !== 'string') {
    throw new XYZEnhancementError('employmentType is required and must be a string', 'INVALID_INPUT')
  }

  // Highlights are optional for context gathering (may be empty or missing)
  if (experience.highlights !== undefined && !Array.isArray(experience.highlights)) {
    throw new XYZEnhancementError('highlights must be an array of strings', 'INVALID_INPUT')
  }
}

/**
 * Validate user answers format
 */
function validateAnswers(answers: XYZAnswer[]): void {
  if (!Array.isArray(answers)) {
    throw new XYZEnhancementError('answers must be an array', 'INVALID_INPUT')
  }

  answers.forEach((answer, index) => {
    if (!answer.questionId || typeof answer.questionId !== 'string') {
      throw new XYZEnhancementError(`answers[${index}].questionId must be a non-empty string`, 'INVALID_INPUT')
    }

    if (typeof answer.answer !== 'string') {
      throw new XYZEnhancementError(`answers[${index}].answer must be a string`, 'INVALID_INPUT')
    }
  })
}

/**
 * Validate story notes format
 */
function validateNotes(notes: StoryNote[]): void {
  if (!Array.isArray(notes)) {
    throw new XYZEnhancementError('notes must be an array', 'INVALID_INPUT')
  }

  if (notes.length === 0) {
    throw new XYZEnhancementError('notes array cannot be empty - context gathering must be completed first', 'INVALID_INPUT')
  }

  notes.forEach((note, index) => {
    if (typeof note.text !== 'string' || note.text.trim().length === 0) {
      throw new XYZEnhancementError(`notes[${index}].text must be a non-empty string`, 'INVALID_INPUT')
    }

    if (note.type && !['project', 'initiative', 'responsibility', 'achievement'].includes(note.type)) {
      throw new XYZEnhancementError(`notes[${index}].type must be one of: project, initiative, responsibility, achievement`, 'INVALID_INPUT')
    }
  })
}

/**
 * Validate context object format
 */
function validateContext(context: ContextObject): void {
  if (!context || typeof context !== 'object') {
    throw new XYZEnhancementError('context must be an object', 'INVALID_INPUT')
  }

  if (!Array.isArray(context.notes)) {
    throw new XYZEnhancementError('context.notes must be an array', 'INVALID_INPUT')
  }

  if (!Array.isArray(context.answeredQuestions)) {
    throw new XYZEnhancementError('context.answeredQuestions must be an array', 'INVALID_INPUT')
  }

  // Validate notes structure
  context.notes.forEach((note, index) => {
    if (typeof note.text !== 'string') {
      throw new XYZEnhancementError(`context.notes[${index}].text must be a string`, 'INVALID_INPUT')
    }
  })

  // Validate answeredQuestions structure
  context.answeredQuestions.forEach((qa, index) => {
    if (typeof qa.id !== 'string' || typeof qa.answer !== 'string') {
      throw new XYZEnhancementError(`context.answeredQuestions[${index}] must have id and answer strings`, 'INVALID_INPUT')
    }
  })
}

/**
 * Parse context gathering response from AI
 */
function parseContextGatheringResponse(response: string): ContextGatheringResponse {
  try {
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

    // Log the raw response for debugging
    console.log('[parseContextGatheringResponse] Raw parsed response:', JSON.stringify(parsed, null, 2))

    // Validate questionGroups array
    if (!Array.isArray(parsed.questionGroups)) {
      console.error('[parseContextGatheringResponse] Missing questionGroups. Keys found:', Object.keys(parsed))
      throw new XYZEnhancementError('Response missing questionGroups array', 'AI_PROVIDER_ERROR', { receivedKeys: Object.keys(parsed) })
    }

    // Validate each question group
    parsed.questionGroups.forEach((group: any, groupIndex: number) => {
      if (typeof group.category !== 'string') {
        throw new XYZEnhancementError(`Question group ${groupIndex} missing category`, 'AI_PROVIDER_ERROR')
      }
      if (!Array.isArray(group.questions)) {
        throw new XYZEnhancementError(`Question group ${groupIndex} missing questions array`, 'AI_PROVIDER_ERROR')
      }
      group.questions.forEach((q: any, qIndex: number) => {
        if (typeof q.id !== 'string' || typeof q.text !== 'string') {
          throw new XYZEnhancementError(`Question group ${groupIndex}, question ${qIndex} invalid format`, 'AI_PROVIDER_ERROR')
        }
      })
    })

    // Validate notes array - make it default to empty array if missing on initial call
    if (!Array.isArray(parsed.notes)) {
      console.warn('[parseContextGatheringResponse] Missing notes array, defaulting to empty array')
      parsed.notes = []
    }

    // Validate each note (if any exist)
    parsed.notes.forEach((note: any, index: number) => {
      if (typeof note.text !== 'string') {
        throw new XYZEnhancementError(`Note ${index} missing text field`, 'AI_PROVIDER_ERROR')
      }
      if (note.type && !['project', 'initiative', 'responsibility', 'achievement'].includes(note.type)) {
        throw new XYZEnhancementError(`Note ${index} has invalid type`, 'AI_PROVIDER_ERROR')
      }
    })

    return parsed as ContextGatheringResponse
  } catch (error) {
    if (error instanceof XYZEnhancementError) {
      throw error
    }
    console.error('[parseContextGatheringResponse] JSON parse error:', error)
    throw new XYZEnhancementError('Failed to parse context gathering response as valid JSON', 'AI_PROVIDER_ERROR', { originalError: String(error) })
  }
}

/**
 * Parse bullet generation response from AI
 */
function parseBulletGenerationResponse(response: string): BulletGenerationResponse {
  try {
    let cleanResponse = response.trim()

    // Remove markdown code blocks if present
    if (cleanResponse.startsWith('```json') || cleanResponse.startsWith('```')) {
      const startIndex = cleanResponse.indexOf('[')
      const endIndex = cleanResponse.lastIndexOf(']')

      if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        cleanResponse = cleanResponse.substring(startIndex, endIndex + 1)
      }
    }

    // Parse as array of { primary, secondary } objects
    const parsed = JSON.parse(cleanResponse)
    
    if (!Array.isArray(parsed)) {
      throw new XYZEnhancementError('Response must be an array of bullet pairs', 'AI_PROVIDER_ERROR')
    }

    // Validate all items have primary and secondary fields
    parsed.forEach((bulletPair: any, index: number) => {
      if (typeof bulletPair.primary !== 'string') {
        throw new XYZEnhancementError(`Bullet pair ${index} missing or invalid primary field`, 'AI_PROVIDER_ERROR')
      }
      if (typeof bulletPair.secondary !== 'string') {
        throw new XYZEnhancementError(`Bullet pair ${index} missing or invalid secondary field`, 'AI_PROVIDER_ERROR')
      }
    })

    return { bullets: parsed as BulletPair[] }
  } catch (error) {
    if (error instanceof XYZEnhancementError) {
      throw error
    }
    throw new XYZEnhancementError('Failed to parse bullet generation response as valid JSON', 'AI_PROVIDER_ERROR')
  }
}

/**
 * Generate XYZ context gathering questions (multi-round iterative flow)
 *
 * @param experience - Experience object with title, employer, highlights
 * @param context - Optional context object with notes and answeredQuestions (null on first call)
 * @returns Promise with generated questions and story notes
 * @throws XYZEnhancementError on validation, timeout, or AI provider errors
 */
export async function generateXYZQuestions(
  experience: Partial<Experience>,
  context?: ContextObject | null
): Promise<{ questionGroups: QuestionGroup[]; notes: StoryNote[] }> {
  // Validate input
  validateExperienceInput(experience)
  
  if (context) {
    validateContext(context)
  }

  try {
    let userPrompt: string

    if (!context || context.answeredQuestions.length === 0) {
      // Initial call - provide full job data
      const jobData = JSON.stringify({
        company: experience.employer,
        title: experience.title,
        location: experience.location || null,
        url: experience.url || null,
        startDate: experience.startDate || null,
        endDate: experience.endDate || null,
        currentPosition: experience.currentPosition || false,
        summary: experience.summary || null,
        highlights: experience.highlights || []
      }, null, 2)

      const contextData = JSON.stringify({
        notes: [],
        answeredQuestions: []
      }, null, 2)

      userPrompt = `
Job Info Object:
${jobData}

Context Object:
${contextData}

This is the initial call. Please generate comprehensive questions organized into appropriate groups.

Return ONLY valid JSON in this EXACT format (both fields required):
{
  "questionGroups": [
    {
      "category": "General Role Context",
      "questions": [
        { "id": "q1", "text": "Your question here?" },
        { "id": "q2", "text": "Another question?" }
      ]
    }
  ],
  "notes": []
}
      `
    } else {
      // Follow-up call - only send context
      const contextData = JSON.stringify(context, null, 2)

      userPrompt = `
Context Object (with answered questions and current notes):
${contextData}

Please review the answered questions and update the story notes with the new information.

IMPORTANT: You MUST generate follow-up questions UNLESS:
1. You've completed at least 3 full rounds of conversation (counting this round)
2. AND all stories have comprehensive details: specific metrics with numbers, clear methods/technologies, business impact, challenges, collaboration context, and autonomy level
3. AND you've asked about work beyond the initial highlights

Return ONLY valid JSON in this EXACT format (both fields required):
{
  "questionGroups": [
    {
      "category": "Category Name",
      "questions": [
        { "id": "q16", "text": "Specific follow-up question with concrete focus?" }
      ]
    }
  ],
  "notes": [
    {
      "title": "Story Title",
      "text": "Story with [TAGS]",
      "type": "project"
    }
  ]
}

If you need more information, generate 5-10 follow-up questions. If context is truly complete after 3+ rounds, return empty questionGroups.
      `
    }

    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new XYZEnhancementError('Question generation timed out after 30 seconds', 'TIMEOUT'))
      }, 30000) // 30 seconds for questions (complex prompt requires more time)
    })

    // Create AI enhancement promise
    const enhancementPromise = generateText({
      model: gateway('openai/gpt-4o'), // Use full GPT-4o for complex context gathering
      system: CONTEXT_GATHERING_PROMPT,
      prompt: userPrompt,
      temperature: 0.7, // Slightly higher for more exploratory questions
      maxRetries: 2
    })

    // Race between enhancement and timeout
    const result = await Promise.race([enhancementPromise, timeoutPromise])

    // Parse and validate the AI response
    const parsed = parseContextGatheringResponse(result.text)

    // Return question groups and notes as-is
    return {
      questionGroups: parsed.questionGroups,
      notes: parsed.notes
    }

  } catch (error: any) {
    // Re-throw XYZEnhancementError instances
    if (error instanceof XYZEnhancementError) {
      throw error
    }

    // Handle AI SDK errors
    if (error.name === 'AIError' || error.message?.includes('AI')) {
      throw new XYZEnhancementError(
        'AI provider error occurred during question generation',
        'AI_PROVIDER_ERROR',
        { originalError: error.message }
      )
    }

    // Handle network or other unexpected errors
    throw new XYZEnhancementError(
      'Unexpected error during question generation',
      'AI_PROVIDER_ERROR',
      { originalError: error.message }
    )
  }
}

/**
 * Generate XYZ-format achievement bullets from story notes
 *
 * @param experience - Experience object
 * @param notes - Story notes with inline tags from context gathering
 * @returns Promise with structured bullet pairs (primary + secondary)
 * @throws XYZEnhancementError on validation, timeout, or AI provider errors
 */
export async function generateXYZBullets(
  experience: Partial<Experience>,
  notes: StoryNote[]
): Promise<BulletPair[]> {
  // Validate inputs
  validateExperienceInput(experience)
  validateNotes(notes)

  try {
    // Format story notes for the prompt
    const formattedNotes = notes
      .map((note, index) => {
        let noteText = note.title ? `**${note.title}**\n${note.text}` : note.text
        if (note.type) {
          noteText += `\n\nType: ${note.type}`
        }
        return `Story ${index + 1}:\n${noteText}`
      })
      .join('\n\n---\n\n')

    // Create user prompt
    const userPrompt = `
Job Information:
Title: ${experience.title}
Employer: ${experience.employer}
Employment Type: ${experience.employmentType}

Experience Stories with Inline Tags:
${formattedNotes}

Using the XYZ method, generate 2 bullet variations (primary and secondary) for each story.
Return as a JSON array following this schema:
[
  {
    "primary": "Most impactful bullet with strongest metrics",
    "secondary": "Alternative bullet emphasizing different angle"
  }
]
`

    // Create timeout promise (longer for bullet generation)
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new XYZEnhancementError('Bullet generation timed out after 20 seconds', 'TIMEOUT'))
      }, 20000) // 20 seconds for bullets
    })

    // Create AI enhancement promise
    const enhancementPromise = generateText({
      model: gateway('anthropic/claude-3-haiku'),
      system: BULLET_WRITING_PROMPT,
      prompt: userPrompt,
      temperature: 0.5,
      maxRetries: 2
    })

    // Race between enhancement and timeout
    const result = await Promise.race([enhancementPromise, timeoutPromise])

    // Parse and validate the AI response
    const parsed = parseBulletGenerationResponse(result.text)

    return parsed.bullets

  } catch (error: any) {
    // Re-throw XYZEnhancementError instances
    if (error instanceof XYZEnhancementError) {
      throw error
    }

    // Handle AI SDK errors
    if (error.name === 'AIError' || error.message?.includes('AI')) {
      throw new XYZEnhancementError(
        'AI provider error occurred during bullet generation',
        'AI_PROVIDER_ERROR',
        { originalError: error.message }
      )
    }

    // Handle network or other unexpected errors
    throw new XYZEnhancementError(
      'Unexpected error during bullet generation',
      'AI_PROVIDER_ERROR',
      { originalError: error.message }
    )
  }
}

