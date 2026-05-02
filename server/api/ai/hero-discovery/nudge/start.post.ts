import { serverSupabaseClient } from '#supabase/server'
import { logRequest, logSuccess, logError, createTimer } from '@@/server/utils/logger'
import { ErrorCodes } from '@@/server/utils/error-handler'
import { generatePrefixedId } from '@@/server/utils/id-generator'
import { acceptHeroStoryNudge, type HeroStoryNudge } from '@@/server/utils/hero-story-nudges'
import { generateHeroNudgeDiscoveryStart, HeroNudgeDiscoveryError } from '@@/server/utils/hero-nudge-discovery-service'
import type { SageHeroSignalExperience } from '@@/server/utils/sage-experience-enhancer'
import type { SupabaseClient } from '@supabase/supabase-js'

const ROUTE_PATH = '/api/ai/hero-discovery/nudge/start'

interface HeroNudgeDiscoveryStartBody {
  profileId?: string
  nudgeId?: string
  experience?: SageHeroSignalExperience & {
    id?: number | string
    title?: string
    employer?: string
  }
}

function createValidationError(message: string) {
  return createError({
    statusCode: 400,
    statusMessage: 'Bad Request',
    data: {
      success: false,
      error: {
        code: ErrorCodes.VALIDATION_ERROR,
        message
      }
    }
  })
}

function createUnauthorizedError() {
  return createError({
    statusCode: 401,
    statusMessage: 'Unauthorized',
    data: {
      success: false,
      error: {
        code: ErrorCodes.UNAUTHORIZED,
        message: 'Not authenticated'
      }
    }
  })
}

function normalizeExperienceId(value: unknown) {
  const parsed = typeof value === 'string' ? Number(value) : value
  return Number.isInteger(parsed) ? parsed as number : null
}

function getLastAssistantMessage(sessionData: Record<string, unknown>) {
  const history = Array.isArray(sessionData.conversation_history) ? sessionData.conversation_history : []
  const lastAssistant = [...history].reverse().find((entry) => {
    return typeof entry === 'object' && entry !== null && 'role' in entry && entry.role === 'assistant'
  })

  return typeof lastAssistant === 'object'
    && lastAssistant !== null
    && 'content' in lastAssistant
    && typeof lastAssistant.content === 'string'
    ? lastAssistant.content
    : ''
}

function normalizeStoryTitle(value: unknown) {
  if (typeof value !== 'string') return ''

  return value
    .trim()
    .replace(/^[-*]\s*/, '')
    .replace(/\s+/g, ' ')
    .replace(/[.!?]+$/, '')
}

function sentenceCase(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value
}

function createStoryTitle(
  experience: NonNullable<HeroNudgeDiscoveryStartBody['experience']>,
  nudge: HeroStoryNudge
) {
  const highlights = Array.isArray(experience.highlights) ? experience.highlights : []
  const titleSource = highlights.find(item => normalizeStoryTitle(item))
    || normalizeStoryTitle(experience.summary)
    || normalizeStoryTitle(experience.contextNotes)
    || normalizeStoryTitle(nudge.context)
    || normalizeStoryTitle(nudge.signal)
    || 'Possible HERO story'

  const title = sentenceCase(normalizeStoryTitle(titleSource))
  return title.length > 90 ? `${title.slice(0, 87).trim()}...` : title
}

async function createPartialHeroStory(
  supabase: SupabaseClient,
  profileId: string,
  experience: NonNullable<HeroNudgeDiscoveryStartBody['experience']>,
  nudge: HeroStoryNudge
) {
  const storyId = generatePrefixedId('hero')
  const storyTitle = createStoryTitle(experience, nudge)

  const { data, error } = await supabase
    .schema('career_id')
    .from('hero_stories')
    .insert({
      id: storyId,
      profile_id: profileId,
      title: storyTitle,
      source_experience_id: normalizeExperienceId(experience.id),
      display_order: 0
    })
    .select('id')
    .single()

  if (error) {
    throw error
  }

  return data.id as string
}

async function updatePartialHeroStoryTitle(
  supabase: SupabaseClient,
  heroStoryId: string,
  experience: NonNullable<HeroNudgeDiscoveryStartBody['experience']>,
  nudge: HeroStoryNudge
) {
  const experienceTitle = normalizeStoryTitle(experience.title)
  const employer = normalizeStoryTitle(experience.employer)

  if (!experienceTitle || !employer) return

  const legacyTitle = `${experienceTitle} at ${employer}`

  const { data } = await supabase
    .schema('career_id')
    .from('hero_stories')
    .select('title')
    .eq('id', heroStoryId)
    .maybeSingle()

  if (data?.title !== legacyTitle) return

  await supabase
    .schema('career_id')
    .from('hero_stories')
    .update({ title: createStoryTitle(experience, nudge) })
    .eq('id', heroStoryId)
}

export default eventHandler(async (event) => {
  const getElapsed = createTimer()
  logRequest('POST', ROUTE_PATH)

  try {
    const body = await readBody<HeroNudgeDiscoveryStartBody>(event)
    const profileId = body.profileId
    const nudgeId = body.nudgeId
    const experience = body.experience
    const experienceId = normalizeExperienceId(experience?.id)

    if (!profileId || typeof profileId !== 'string') {
      throw createValidationError('profileId is required')
    }

    if (!nudgeId || typeof nudgeId !== 'string') {
      throw createValidationError('nudgeId is required')
    }

    if (!experience || typeof experience !== 'object') {
      throw createValidationError('experience is required')
    }

    if (experienceId === null) {
      throw createValidationError('experience.id is required')
    }

    const supabase = await serverSupabaseClient(event)
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw createUnauthorizedError()
    }

    const { data: nudgeData, error: nudgeError } = await supabase
      .from('hero_story_nudges')
      .select('*')
      .eq('id', nudgeId)
      .eq('profile_id', profileId)
      .eq('experience_id', experienceId)
      .single()

    if (nudgeError || !nudgeData) {
      throw createValidationError('nudge not found')
    }

    const nudge = nudgeData as HeroStoryNudge
    const heroStoryId = nudge.hero_story_id || await createPartialHeroStory(supabase, profileId, experience, nudge)
    if (nudge.hero_story_id) {
      await updatePartialHeroStoryTitle(supabase, heroStoryId, experience, nudge)
    }

    if (nudge.discovery_session_id) {
      const { data: existingSession } = await supabase
        .from('hero_discovery_sessions')
        .select('id, session_data, session_status')
        .eq('id', nudge.discovery_session_id)
        .eq('session_status', 'active')
        .maybeSingle()

      if (existingSession) {
        await acceptHeroStoryNudge(supabase, {
          nudgeId,
          heroStoryId,
          discoverySessionId: existingSession.id
        })

        return {
          success: true,
          data: {
            sessionId: existingSession.id,
            heroStoryId,
            message: getLastAssistantMessage(existingSession.session_data ?? {})
          }
        }
      }
    }

    const experienceSnapshot = { ...experience }
    const aiMessage = await generateHeroNudgeDiscoveryStart(nudge, experienceSnapshot)
    const sessionData = {
      mode: 'experience_nudge_story',
      source_snapshot: experienceSnapshot,
      nudge: {
        id: nudge.id,
        signal: nudge.signal,
        context: nudge.context
      },
      conversation_history: [
        { role: 'assistant', content: aiMessage }
      ],
      story_progress: {
        answeredQuestions: 0,
        completedFields: []
      }
    }
    const { data: session, error: sessionError } = await supabase
      .from('hero_discovery_sessions')
      .insert({
        profile_id: profileId,
        session_status: 'active',
        session_type: 'experience_nudge_story',
        source_type: 'experience',
        source_experience_id: experienceId,
        hero_nudge_id: nudge.id,
        hero_story_id: heroStoryId,
        progress_count: 0,
        session_data: sessionData
      })
      .select('id')
      .single()

    if (sessionError) {
      throw sessionError
    }

    await acceptHeroStoryNudge(supabase, {
      nudgeId,
      heroStoryId,
      discoverySessionId: session.id
    })

    const duration = getElapsed()
    logSuccess('POST', ROUTE_PATH, duration, {
      profileId,
      nudgeId,
      sessionId: session.id,
      heroStoryId
    })

    return {
      success: true,
      data: {
        sessionId: session.id,
        heroStoryId,
        message: aiMessage
      }
    }
  } catch (error: unknown) {
    const apiError = error as { statusCode?: number, message?: string }
    if (apiError?.statusCode) {
      logError('POST', ROUTE_PATH, error, { kind: 'request' })
      throw error
    }

    if (error instanceof HeroNudgeDiscoveryError) {
      const statusCode = error.code === 'TIMEOUT' ? 504 : 503
      throw createError({
        statusCode,
        statusMessage: statusCode === 504 ? 'Request Timeout' : 'Service Unavailable',
        data: {
          success: false,
          error: {
            code: error.code,
            message: error.message
          }
        }
      })
    }

    const duration = getElapsed()
    logError('POST', ROUTE_PATH, error, {
      duration,
      message: apiError?.message || 'Unknown error'
    })

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      data: {
        success: false,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'Failed to start HERO nudge discovery'
        }
      }
    })
  }
})
