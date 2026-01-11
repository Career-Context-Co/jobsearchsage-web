/**
 * Discovery Session AI Service
 * 
 * Handles AI-powered discovery conversation using Vercel AI SDK with AI Gateway.
 * Generates opening greetings, processes user messages, and captures moments.
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
 * Error class for discovery service
 */
export class DiscoveryError extends Error {
  constructor(
    message: string,
    public code: 'TIMEOUT' | 'API_ERROR' | 'INVALID_RESPONSE' | 'API_KEY_MISSING',
    public details?: any
  ) {
    super(message)
    this.name = 'DiscoveryError'
  }
}

/**
 * System prompt for discovery session start
 */
const DISCOVERY_START_SYSTEM_PROMPT = `You are a career achievement discovery assistant helping users identify career accomplishments worth documenting as HERO stories.

YOUR ROLE IN THIS SESSION:
- This is the START of a discovery conversation
- Your job is to warmly introduce the process and ask an opening question
- You are NOT creating structured HERO stories (that happens in a different session)
- You are ONLY identifying potential achievement moments

WHAT YOU'RE LOOKING FOR:
Career moments where the user:
- Solved a meaningful problem
- Achieved measurable results
- Overcame a challenge
- Demonstrated growth or leadership
- Created something valuable

OUTPUT FOR THIS TURN:
- A warm, encouraging greeting
- Brief explanation of what we're doing (1-2 sentences)
- ONE opening question to get started

TONE:
- Conversational and supportive
- Encouraging without being overly enthusiastic
- Professional but friendly
- Make the user feel this is a collaborative exploration

DO NOT:
- Ask multiple questions at once
- Try to structure information into HERO fields
- Make assumptions about the user's experience level
- Be overly formal or robotic`

/**
 * System prompt for discovery session continue
 */
const DISCOVERY_CONTINUE_SYSTEM_PROMPT = `You are conducting an ongoing HERO discovery conversation. The user is sharing career achievements with you.

YOUR ROLE:
- Listen for achievement moments worth documenting
- Ask follow-up questions to understand what they did
- Capture moments in a structured format (title + raw notes only)
- Guide toward discovering 3-5 total moments
- Keep the conversation flowing naturally

CRITICAL RULES:

1. DO NOT structure information into HERO fields
   - You are NOT creating Hurdle/Expectation/Response/Outcome yet
   - That happens in a separate Story Builder session
   - Only capture: title, raw_notes, source_experience_id

2. ONLY write what the user explicitly states
   - Don't assume details they haven't mentioned
   - Don't infer numbers, scope, or impact
   - If you're unsure, ask instead of guessing

3. Capture moments as you discover them
   - When you have enough info about a moment, save it
   - Generate a descriptive title (5-10 words)
   - Write raw notes summarizing what they said
   - Confirm with user before moving on

4. Ask ONE question at a time
   - Don't overwhelm with multiple questions
   - Follow-up questions should feel natural
   - Listen to what they emphasize

5. Know when to move on
   - After 3-5 follow-ups per moment, capture and move on
   - Don't interrogate—this should feel conversational
   - If user's energy shifts to a new topic, follow them

TONE:
- Encouraging and interested
- Professional but conversational
- Validate their achievements ("That sounds impactful!")
- Make them feel heard`

/**
 * System prompt for discovery session end
 */
const DISCOVERY_END_SYSTEM_PROMPT = `You are concluding a HERO discovery session. The user has shared career achievements with you and you've captured 3-5 moments worth documenting.

YOUR ROLE:
- Summarize what was discovered
- Validate the user's achievements
- Help them choose which moment to develop first
- Set expectations for the next step (Story Builder)
- End on an encouraging, forward-looking note

CRITICAL RULES:

1. Present moments clearly and concisely
   - List title + one-sentence summary for each
   - Make it easy for user to scan and choose
   - Don't overwhelm with detail—they've heard it already

2. Guide them to choose ONE moment to develop
   - Don't force them to develop all moments now
   - Emphasize they can come back to others later
   - Make it easy to pick the most relevant/recent/exciting one

3. Set expectations for Story Builder
   - Briefly explain what happens next (structured questions)
   - Mention it takes 10-15 minutes
   - Position it as "turning this into interview/resume content"

4. DO NOT start building the HERO story yet
   - That happens in a separate Story Builder session
   - This endpoint is ONLY about wrapping up discovery
   - Don't ask HERO framework questions

TONE:
- Congratulatory and validating
- Forward-looking and motivating
- Clear and directive (help them make a decision)
- Professional but warm`

/**
 * Generate opening greeting and question for discovery session start
 */
export async function generateDiscoveryStart(
  userName: string,
  currentRole: string | null,
  yearsExperience: number | null,
  sourceExperience?: any
): Promise<string> {
  try {
    // Build experience context if provided
    let experienceContext = ''
    if (sourceExperience) {
      experienceContext = `

They clicked on this specific experience to discuss:
- Employer: ${sourceExperience.employer}
- Title: ${sourceExperience.title}
- Employment Type: ${sourceExperience.employmentType}
- Location: ${sourceExperience.location || sourceExperience.locationType || 'Not specified'}
- Duration: ${sourceExperience.startDate}${sourceExperience.endDate ? ` to ${sourceExperience.endDate}` : ' to Present'}
${sourceExperience.summary ? `- Summary: ${sourceExperience.summary}` : ''}
${sourceExperience.highlights && sourceExperience.highlights.length > 0 ? `- Key highlights: ${sourceExperience.highlights.slice(0, 3).join(', ')}` : ''}`
    }

    let userPrompt = `The user is starting a HERO discovery session.

User profile context:
- Name: ${userName}
${currentRole ? `- Current role: ${currentRole}` : '- Current role: (not provided)'}
${yearsExperience ? `- Years of experience: ${yearsExperience}` : '- Years of experience: (not provided)'}${experienceContext}

Task:
1. Greet the user warmly
2. Briefly explain that you'll help them identify 3-5 career achievements
3. Ask ONE opening question to get started (consider their experience if provided)

Keep your response to 3-4 sentences maximum.`

    const result = await generateText({
      model: gateway('google/gemini-2.5-flash-lite'),
      system: DISCOVERY_START_SYSTEM_PROMPT,
      prompt: userPrompt,
      temperature: 0.5,
    })

    return result.text
  } catch (error: any) {
    if (error.code === 'ERR_TIMEOUT') {
      throw new DiscoveryError('AI request timed out', 'TIMEOUT', error)
    }
    if (error.message?.includes('API key')) {
      throw new DiscoveryError('AI Gateway API key is missing or invalid', 'API_KEY_MISSING', error)
    }
    throw new DiscoveryError('Failed to generate discovery greeting', 'API_ERROR', error)
  }
}

/**
 * Continue discovery conversation and identify moments
 */
export async function generateDiscoveryContinue(
  userMessage: string,
  capturedMoments: Array<{ title: string; rawNotes: string }>,
  conversationHistory: Array<{ role: string; content: string }>
): Promise<{ aiMessage: string; momentCaptured?: any; shouldEndSession: boolean }> {
  try {
    // Format captured moments for the prompt
    const capturedMomentsText = capturedMoments.length > 0
      ? capturedMoments.map((m, i) => `${i + 1}. ${m.title}\n   ${m.rawNotes}`).join('\n\n')
      : 'None yet'

    // Format conversation history for context
    const conversationContext = conversationHistory.length > 0
      ? conversationHistory.map((msg) => `${msg.role}: ${msg.content}`).join('\n\n')
      : 'No prior conversation'

    const userPrompt = `CONVERSATION HISTORY:
${conversationContext}

---

Moments captured so far: ${capturedMoments.length}/3-5

Already captured:
${capturedMomentsText}

Latest user message:
"${userMessage}"

CRITICAL INSTRUCTIONS:
1. Review conversation history to understand context and what's been discussed
2. Determine if user is sharing a NEW achievement OR providing details about one already discussed
3. If SHARING NEW achievement:
   - Ask EXACTLY ONE follow-up question to understand it
   - Focus on: What did you do? What resulted?
4. If PROVIDED ENOUGH DETAIL (you have a clear title and what they did + result):
   - IMMEDIATELY capture the moment
   - Generate title (5-10 words, action-focused)
   - Generate raw_notes (2-3 sentences with what they did and result)
   - After capturing, ASK ABOUT A DIFFERENT ACHIEVEMENT - do not ask more about this one
5. If HAVE 3-5 MOMENTS: Gently suggest wrapping up to develop one into a full story

RESPONSE RULES:
- Keep ai_message conversational (1-2 sentences max)
- Do NOT ask for more details about a captured moment
- Always try to move to NEW moments, not deeper into current one
- Use JSON format below

{
  "ai_message": "Your response to user",
  "moment_ready_to_capture": true/false,
  "moment_title": "string or null",
  "moment_raw_notes": "string or null",
  "should_end_session": false/true
}`

    const result = await generateText({
      model: gateway('openai/gpt-4.1-mini'),
      system: DISCOVERY_CONTINUE_SYSTEM_PROMPT,
      prompt: userPrompt,
      temperature: 0.5,
    })

    // Parse the response
    let parsedResponse
    try {
      const jsonMatch = result.text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in response')
      }
    } catch (parseError) {
      throw new DiscoveryError('Failed to parse AI response', 'INVALID_RESPONSE', { text: result.text })
    }

    return {
      aiMessage: parsedResponse.ai_message || '',
      momentCaptured: parsedResponse.moment_ready_to_capture
        ? {
            title: parsedResponse.moment_title,
            rawNotes: parsedResponse.moment_raw_notes,
          }
        : undefined,
      shouldEndSession: parsedResponse.should_end_session || false,
    }
  } catch (error: any) {
    if (error instanceof DiscoveryError) {
      throw error
    }
    if (error.code === 'ERR_TIMEOUT') {
      throw new DiscoveryError('AI request timed out', 'TIMEOUT', error)
    }
    if (error.message?.includes('API key')) {
      throw new DiscoveryError('AI Gateway API key is missing or invalid', 'API_KEY_MISSING', error)
    }
    throw new DiscoveryError('Failed to continue discovery conversation', 'API_ERROR', error)
  }
}

/**
 * Generate end session summary and guidance
 */
export async function generateDiscoveryEnd(moments: Array<{ title: string; rawNotes: string }>): Promise<{ aiMessage: string; nextEndpoint: string }> {
  try {
    const momentsList = moments
      .map(
        (m, i) =>
          `${i + 1}. **${m.title}** - ${m.rawNotes.split('.')[0] || m.rawNotes.substring(0, 50)}`
      )
      .join('\n')

    const userPrompt = `Session context:
- Total moments discovered: ${moments.length}

Captured moments:
${momentsList}

Tasks:
1. Celebrate the user's achievement in identifying these moments
2. Present the moments in a scannable format (title + one sentence)
3. Ask which moment they'd like to develop into a full HERO story
4. Briefly explain what the Story Builder session involves (10-15 minutes)
5. Make it easy for them to choose and proceed

Keep response to 6-8 sentences maximum. Be clear and action-oriented.`

    const result = await generateText({
      model: gateway('google/gemini-2.5-flash-lite'),
      system: DISCOVERY_END_SYSTEM_PROMPT,
      prompt: userPrompt,
      temperature: 0.5,
    })

    return {
      aiMessage: result.text,
      nextEndpoint: '/api/ai/hero/story-builder/start',
    }
  } catch (error: any) {
    if (error.code === 'ERR_TIMEOUT') {
      throw new DiscoveryError('AI request timed out', 'TIMEOUT', error)
    }
    if (error.message?.includes('API key')) {
      throw new DiscoveryError('AI Gateway API key is missing or invalid', 'API_KEY_MISSING', error)
    }
    throw new DiscoveryError('Failed to generate discovery end summary', 'API_ERROR', error)
  }
}
