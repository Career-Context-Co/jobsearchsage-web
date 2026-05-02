import { createHash } from 'node:crypto'
import { generatePrefixedId } from '@@/server/utils/id-generator'
import type { SageHeroSignalExperience, SageHeroSignalResult } from '@@/server/utils/sage-experience-enhancer'
import type { SupabaseClient } from '@supabase/supabase-js'

export type HeroStoryNudgeStatus = 'active' | 'accepted' | 'declined' | 'converted' | 'stale'

export interface HeroStoryNudge {
  id: string
  profile_id: string
  experience_id: number
  content_hash: string
  signal: string
  context: string
  status: HeroStoryNudgeStatus
  hero_story_id: string | null
  discovery_session_id: number | null
  accepted_at: string | null
  declined_at: string | null
  created_at: string
  updated_at: string
}

export interface HeroStoryNudgeResponse {
  nudge: true
  id: string
  experienceId: number
  contentHash: string
  signal: string
  context: string
  status: HeroStoryNudgeStatus
  heroStoryId: string | null
  discoverySessionId: number | null
  acceptedAt: string | null
  declinedAt: string | null
}

interface HeroNudgeSnapshotParams {
  profileId: string
  experienceId: number
  experience: SageHeroSignalExperience
}

interface CreateHeroNudgeParams extends HeroNudgeSnapshotParams {
  contentHash: string
  signal: string
  context: string
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : ''
}

function normalizeHighlights(highlights: unknown) {
  return Array.isArray(highlights)
    ? highlights
        .filter((item): item is string => typeof item === 'string')
        .map(item => normalizeText(item))
        .filter(Boolean)
    : []
}

export function computeHeroNudgeContentHash(experience: SageHeroSignalExperience) {
  const payload = {
    highlights: normalizeHighlights(experience.highlights),
    summary: normalizeText(experience.summary),
    contextNotes: normalizeText(experience.contextNotes),
    sageNotes: normalizeText(experience.sageNotes)
  }

  return createHash('sha256')
    .update(JSON.stringify(payload))
    .digest('hex')
}

export function mapHeroStoryNudge(row: HeroStoryNudge): HeroStoryNudgeResponse {
  return {
    nudge: true,
    id: row.id,
    experienceId: row.experience_id,
    contentHash: row.content_hash,
    signal: row.signal,
    context: row.context,
    status: row.status,
    heroStoryId: row.hero_story_id,
    discoverySessionId: row.discovery_session_id,
    acceptedAt: row.accepted_at,
    declinedAt: row.declined_at
  }
}

export async function getHeroNudgeForContent(
  supabase: SupabaseClient,
  params: { profileId: string, experienceId: number, contentHash: string }
): Promise<HeroStoryNudge | null> {
  const { profileId, experienceId, contentHash } = params

  const { data, error } = await supabase
    .from('hero_story_nudges')
    .select('*')
    .eq('profile_id', profileId)
    .eq('experience_id', experienceId)
    .eq('content_hash', contentHash)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data as HeroStoryNudge | null
}

export async function getActiveHeroNudgesForProfile(
  supabase: SupabaseClient,
  profileId: string
): Promise<HeroStoryNudge[]> {
  const { data, error } = await supabase
    .from('hero_story_nudges')
    .select('*')
    .eq('profile_id', profileId)
    .eq('status', 'active')
    .is('accepted_at', null)
    .is('declined_at', null)
    .order('updated_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []) as HeroStoryNudge[]
}

export async function markStaleHeroNudges(
  supabase: SupabaseClient,
  params: { profileId: string, experienceId: number, contentHash: string }
) {
  const { profileId, experienceId, contentHash } = params

  const { error } = await supabase
    .from('hero_story_nudges')
    .update({ status: 'stale' })
    .eq('profile_id', profileId)
    .eq('experience_id', experienceId)
    .eq('status', 'active')
    .neq('content_hash', contentHash)

  if (error) {
    throw error
  }
}

export async function createHeroStoryNudge(
  supabase: SupabaseClient,
  params: CreateHeroNudgeParams
): Promise<HeroStoryNudge> {
  const { profileId, experienceId, contentHash, signal, context } = params

  const { data, error } = await supabase
    .from('hero_story_nudges')
    .insert({
      id: generatePrefixedId('hnudge'),
      profile_id: profileId,
      experience_id: experienceId,
      content_hash: contentHash,
      signal,
      context,
      status: 'active'
    })
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return data as HeroStoryNudge
}

export async function getOrCreateHeroNudgeResult(
  supabase: SupabaseClient,
  params: HeroNudgeSnapshotParams,
  detect: () => Promise<SageHeroSignalResult>
): Promise<{ nudge: false } | HeroStoryNudgeResponse> {
  const { profileId, experienceId } = params
  const contentHash = computeHeroNudgeContentHash(params.experience)
  const existing = await getHeroNudgeForContent(supabase, {
    profileId,
    experienceId,
    contentHash
  })

  if (existing) {
    return existing.status === 'active' ? mapHeroStoryNudge(existing) : { nudge: false }
  }

  await markStaleHeroNudges(supabase, {
    profileId,
    experienceId,
    contentHash
  })

  const detected = await detect()
  if (!detected.nudge) {
    return { nudge: false }
  }

  const created = await createHeroStoryNudge(supabase, {
    profileId,
    experienceId,
    experience: params.experience,
    contentHash,
    signal: detected.signal,
    context: detected.context
  })

  return mapHeroStoryNudge(created)
}

export async function declineHeroStoryNudge(
  supabase: SupabaseClient,
  nudgeId: string
): Promise<HeroStoryNudge> {
  const { data, error } = await supabase
    .from('hero_story_nudges')
    .update({
      status: 'declined',
      declined_at: new Date().toISOString()
    })
    .eq('id', nudgeId)
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return data as HeroStoryNudge
}

export async function acceptHeroStoryNudge(
  supabase: SupabaseClient,
  params: { nudgeId: string, heroStoryId: string, discoverySessionId?: number | null }
): Promise<HeroStoryNudge> {
  const { nudgeId, heroStoryId, discoverySessionId } = params
  const payload: Record<string, unknown> = {
    status: 'accepted',
    accepted_at: new Date().toISOString(),
    hero_story_id: heroStoryId
  }

  if (discoverySessionId !== undefined) {
    payload.discovery_session_id = discoverySessionId
  }

  const { data, error } = await supabase
    .from('hero_story_nudges')
    .update(payload)
    .eq('id', nudgeId)
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return data as HeroStoryNudge
}

export async function convertHeroStoryNudge(
  supabase: SupabaseClient,
  nudgeId: string
): Promise<HeroStoryNudge> {
  const { data, error } = await supabase
    .from('hero_story_nudges')
    .update({ status: 'converted' })
    .eq('id', nudgeId)
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return data as HeroStoryNudge
}
