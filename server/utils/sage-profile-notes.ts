type SupabaseClient = any

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
  targetType: string
  targetId: string
  noteType?: string
}

interface SageNotesLookupForExperienceParams {
  userId: string
  profileId: string
  experienceId: string
}

interface SageNotesLookupForProfileTargetParams {
  userId: string
  profileId: string
  targetType: string
  noteType?: string
}

interface SageNotesUpsertParams extends SageNotesLookupParams {
  content: string
  metadata?: Record<string, any>
}

interface SageNotesUpsertForExperienceParams extends SageNotesLookupForExperienceParams {
  content: string
  metadata?: Record<string, any>
}

function isNoRowsError(error: any): boolean {
  return error?.code === 'PGRST116' || error?.message?.includes('No rows found')
}

export async function getSageNote(
  supabase: SupabaseClient,
  params: SageNotesLookupParams
): Promise<SageProfileNote | null> {
  const { userId, profileId, targetType, targetId, noteType } = params
  const resolvedNoteType = noteType ?? SAGE_NOTES_NOTE_TYPE

  const { data, error } = await supabase
    .from('sage_profile_notes')
    .select('id, user_id, profile_id, target_type, target_id, note_type, content, metadata, created_at, updated_at')
    .eq('user_id', userId)
    .eq('profile_id', profileId)
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .eq('note_type', resolvedNoteType)
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

export async function upsertSageNote(
  supabase: SupabaseClient,
  params: SageNotesUpsertParams
): Promise<SageProfileNote> {
  const { userId, profileId, targetType, targetId, noteType, content, metadata } = params
  const resolvedNoteType = noteType ?? SAGE_NOTES_NOTE_TYPE

  const payload = {
    user_id: userId,
    profile_id: profileId,
    target_type: targetType,
    target_id: targetId,
    note_type: resolvedNoteType,
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

export async function getSageNotesForExperience(
  supabase: SupabaseClient,
  params: SageNotesLookupForExperienceParams
): Promise<SageProfileNote | null> {
  const { userId, profileId, experienceId } = params

  return getSageNote(supabase, {
    userId,
    profileId,
    targetType: SAGE_NOTES_TARGET_TYPE,
    targetId: experienceId,
    noteType: SAGE_NOTES_NOTE_TYPE,
  })
}

export async function getSageNotesForProfileTarget(
  supabase: SupabaseClient,
  params: SageNotesLookupForProfileTargetParams
): Promise<SageProfileNote[]> {
  const { userId, profileId, targetType, noteType } = params
  const resolvedNoteType = noteType ?? SAGE_NOTES_NOTE_TYPE

  const { data, error } = await supabase
    .from('sage_profile_notes')
    .select('id, user_id, profile_id, target_type, target_id, note_type, content, metadata, created_at, updated_at')
    .eq('user_id', userId)
    .eq('profile_id', profileId)
    .eq('target_type', targetType)
    .eq('note_type', resolvedNoteType)
    .order('updated_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []) as SageProfileNote[]
}

export async function upsertSageNotesForExperience(
  supabase: SupabaseClient,
  params: SageNotesUpsertForExperienceParams
): Promise<SageProfileNote> {
  const { userId, profileId, experienceId, content, metadata } = params

  return upsertSageNote(supabase, {
    userId,
    profileId,
    targetType: SAGE_NOTES_TARGET_TYPE,
    targetId: experienceId,
    noteType: SAGE_NOTES_NOTE_TYPE,
    content,
    metadata,
  })
}
