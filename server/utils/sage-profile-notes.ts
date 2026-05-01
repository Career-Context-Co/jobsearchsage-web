import type { SupabaseClient } from '@supabase/supabase-js'

export const SAGE_NOTES_TARGET_TYPE = 'experience'
export const SAGE_NOTES_NOTE_TYPE = 'sage_notes'

export interface SageProfileNote {
  id: number
  user_id: string
  profile_id: string
  target_type: string
  target_id: string
  note_type: string
  content: string
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

interface SageNotesLookupParams {
  userId: string
  profileId: string
  experienceId: string
}

interface SageNotesUpsertParams extends SageNotesLookupParams {
  content: string
  metadata?: Record<string, any>
}

function isNoRowsError(error: any): boolean {
  return error?.code === 'PGRST116' || error?.message?.includes('No rows found')
}

export async function getSageNotesForExperience(
  supabase: SupabaseClient,
  params: SageNotesLookupParams
): Promise<SageProfileNote | null> {
  const { userId, profileId, experienceId } = params

  const { data, error } = await supabase
    .from('sage_profile_notes')
    .select('id, user_id, profile_id, target_type, target_id, note_type, content, metadata, created_at, updated_at')
    .eq('user_id', userId)
    .eq('profile_id', profileId)
    .eq('target_type', SAGE_NOTES_TARGET_TYPE)
    .eq('target_id', experienceId)
    .eq('note_type', SAGE_NOTES_NOTE_TYPE)
    .maybeSingle()

  if (error) {
    if (isNoRowsError(error)) {
      return null
    }

    throw error
  }

  if (!data) {
    return null
  }

  return data as SageProfileNote
}

export async function upsertSageNotesForExperience(
  supabase: SupabaseClient,
  params: SageNotesUpsertParams
): Promise<SageProfileNote> {
  const { userId, profileId, experienceId, content, metadata } = params

  const payload = {
    user_id: userId,
    profile_id: profileId,
    target_type: SAGE_NOTES_TARGET_TYPE,
    target_id: experienceId,
    note_type: SAGE_NOTES_NOTE_TYPE,
    content,
    metadata: metadata ?? {},
  }

  const { data, error } = await supabase
    .from('sage_profile_notes')
    .upsert(payload, {
      onConflict: 'user_id,target_type,target_id,note_type',
    })
    .select('id, user_id, profile_id, target_type, target_id, note_type, content, metadata, created_at, updated_at')
    .single()

  if (error) {
    throw error
  }

  return data as SageProfileNote
}
