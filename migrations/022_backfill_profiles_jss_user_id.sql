-- Migration: 022_backfill_profiles_jss_user_id
-- Description: Populate jss_user_id on existing profiles by joining through public.users
-- Prerequisite for RLS - profiles must have jss_user_id set for auth.uid() to match
-- Date: 2026-02-19

UPDATE career_id.profiles p
SET jss_user_id = u.id
FROM public.users u
WHERE u.career_id_profile_id = p.id
  AND p.jss_user_id IS NULL;
