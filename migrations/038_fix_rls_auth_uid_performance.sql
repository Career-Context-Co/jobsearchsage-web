-- Migration: 038_fix_rls_auth_uid_performance
-- Description: Replace auth.uid() with (select auth.uid()) in all RLS policies so the value
--   is evaluated once per statement instead of per row (fixes Supabase RLS performance warning).
-- Date: 2026-03-07

-- ---------------------------------------------------------------------------
-- DROP existing policies (all 14 tables, 4 policies each)
-- ---------------------------------------------------------------------------

-- career_id.profiles
DROP POLICY IF EXISTS "profiles_select_own" ON career_id.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON career_id.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON career_id.profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON career_id.profiles;

-- career_id.contact_info
DROP POLICY IF EXISTS "contact_info_select_own_profile" ON career_id.contact_info;
DROP POLICY IF EXISTS "contact_info_insert_own_profile" ON career_id.contact_info;
DROP POLICY IF EXISTS "contact_info_update_own_profile" ON career_id.contact_info;
DROP POLICY IF EXISTS "contact_info_delete_own_profile" ON career_id.contact_info;

-- career_id.experience
DROP POLICY IF EXISTS "experience_select_own_profile" ON career_id.experience;
DROP POLICY IF EXISTS "experience_insert_own_profile" ON career_id.experience;
DROP POLICY IF EXISTS "experience_update_own_profile" ON career_id.experience;
DROP POLICY IF EXISTS "experience_delete_own_profile" ON career_id.experience;

-- career_id.education
DROP POLICY IF EXISTS "education_select_own_profile" ON career_id.education;
DROP POLICY IF EXISTS "education_insert_own_profile" ON career_id.education;
DROP POLICY IF EXISTS "education_update_own_profile" ON career_id.education;
DROP POLICY IF EXISTS "education_delete_own_profile" ON career_id.education;

-- career_id.certifications
DROP POLICY IF EXISTS "certifications_select_own_profile" ON career_id.certifications;
DROP POLICY IF EXISTS "certifications_insert_own_profile" ON career_id.certifications;
DROP POLICY IF EXISTS "certifications_update_own_profile" ON career_id.certifications;
DROP POLICY IF EXISTS "certifications_delete_own_profile" ON career_id.certifications;

-- career_id.profile_skills
DROP POLICY IF EXISTS "profile_skills_select_own_profile" ON career_id.profile_skills;
DROP POLICY IF EXISTS "profile_skills_insert_own_profile" ON career_id.profile_skills;
DROP POLICY IF EXISTS "profile_skills_update_own_profile" ON career_id.profile_skills;
DROP POLICY IF EXISTS "profile_skills_delete_own_profile" ON career_id.profile_skills;

-- career_id.profile_social_links
DROP POLICY IF EXISTS "profile_social_links_select_own_profile" ON career_id.profile_social_links;
DROP POLICY IF EXISTS "profile_social_links_insert_own_profile" ON career_id.profile_social_links;
DROP POLICY IF EXISTS "profile_social_links_update_own_profile" ON career_id.profile_social_links;
DROP POLICY IF EXISTS "profile_social_links_delete_own_profile" ON career_id.profile_social_links;

-- career_id.hero_stories
DROP POLICY IF EXISTS "hero_stories_select_own_profile" ON career_id.hero_stories;
DROP POLICY IF EXISTS "hero_stories_insert_own_profile" ON career_id.hero_stories;
DROP POLICY IF EXISTS "hero_stories_update_own_profile" ON career_id.hero_stories;
DROP POLICY IF EXISTS "hero_stories_delete_own_profile" ON career_id.hero_stories;

-- career_id.hero_moments
DROP POLICY IF EXISTS "hero_moments_select_own_profile" ON career_id.hero_moments;
DROP POLICY IF EXISTS "hero_moments_insert_own_profile" ON career_id.hero_moments;
DROP POLICY IF EXISTS "hero_moments_update_own_profile" ON career_id.hero_moments;
DROP POLICY IF EXISTS "hero_moments_delete_own_profile" ON career_id.hero_moments;

-- public.hero_discovery_sessions
DROP POLICY IF EXISTS "hero_discovery_sessions_select_own_profile" ON public.hero_discovery_sessions;
DROP POLICY IF EXISTS "hero_discovery_sessions_insert_own_profile" ON public.hero_discovery_sessions;
DROP POLICY IF EXISTS "hero_discovery_sessions_update_own_profile" ON public.hero_discovery_sessions;
DROP POLICY IF EXISTS "hero_discovery_sessions_delete_own_profile" ON public.hero_discovery_sessions;

-- public.hero_story_sessions
DROP POLICY IF EXISTS "hero_story_sessions_select_own_profile" ON public.hero_story_sessions;
DROP POLICY IF EXISTS "hero_story_sessions_insert_own_profile" ON public.hero_story_sessions;
DROP POLICY IF EXISTS "hero_story_sessions_update_own_profile" ON public.hero_story_sessions;
DROP POLICY IF EXISTS "hero_story_sessions_delete_own_profile" ON public.hero_story_sessions;

-- public.docs_resumes
DROP POLICY IF EXISTS "docs_resumes_select_own_profile" ON public.docs_resumes;
DROP POLICY IF EXISTS "docs_resumes_insert_own_profile" ON public.docs_resumes;
DROP POLICY IF EXISTS "docs_resumes_update_own_profile" ON public.docs_resumes;
DROP POLICY IF EXISTS "docs_resumes_delete_own_profile" ON public.docs_resumes;

-- public.docs_generated_resume_log
DROP POLICY IF EXISTS "docs_generated_resume_log_select_own_profile" ON public.docs_generated_resume_log;
DROP POLICY IF EXISTS "docs_generated_resume_log_insert_own_profile" ON public.docs_generated_resume_log;
DROP POLICY IF EXISTS "docs_generated_resume_log_update_own_profile" ON public.docs_generated_resume_log;
DROP POLICY IF EXISTS "docs_generated_resume_log_delete_own_profile" ON public.docs_generated_resume_log;

-- ---------------------------------------------------------------------------
-- CREATE policies with (select auth.uid()) instead of auth.uid()
-- ---------------------------------------------------------------------------

-- career_id.profiles
CREATE POLICY "profiles_select_own"
  ON career_id.profiles FOR SELECT
  USING (jss_user_id = (select auth.uid()));

CREATE POLICY "profiles_insert_own"
  ON career_id.profiles FOR INSERT
  WITH CHECK (jss_user_id = (select auth.uid()));

CREATE POLICY "profiles_update_own"
  ON career_id.profiles FOR UPDATE
  USING (jss_user_id = (select auth.uid()))
  WITH CHECK (jss_user_id = (select auth.uid()));

CREATE POLICY "profiles_delete_own"
  ON career_id.profiles FOR DELETE
  USING (jss_user_id = (select auth.uid()));

-- career_id.contact_info
CREATE POLICY "contact_info_select_own_profile"
  ON career_id.contact_info FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = contact_info.profile_id AND jss_user_id = (select auth.uid())
    )
  );

CREATE POLICY "contact_info_insert_own_profile"
  ON career_id.contact_info FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = contact_info.profile_id AND jss_user_id = (select auth.uid())
    )
  );

CREATE POLICY "contact_info_update_own_profile"
  ON career_id.contact_info FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = contact_info.profile_id AND jss_user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = contact_info.profile_id AND jss_user_id = (select auth.uid())
    )
  );

CREATE POLICY "contact_info_delete_own_profile"
  ON career_id.contact_info FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = contact_info.profile_id AND jss_user_id = (select auth.uid())
    )
  );

-- career_id.experience
CREATE POLICY "experience_select_own_profile"
  ON career_id.experience FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = experience.profile_id AND jss_user_id = (select auth.uid())
    )
  );

CREATE POLICY "experience_insert_own_profile"
  ON career_id.experience FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = experience.profile_id AND jss_user_id = (select auth.uid())
    )
  );

CREATE POLICY "experience_update_own_profile"
  ON career_id.experience FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = experience.profile_id AND jss_user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = experience.profile_id AND jss_user_id = (select auth.uid())
    )
  );

CREATE POLICY "experience_delete_own_profile"
  ON career_id.experience FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = experience.profile_id AND jss_user_id = (select auth.uid())
    )
  );

-- career_id.education
CREATE POLICY "education_select_own_profile"
  ON career_id.education FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = education.profile_id AND jss_user_id = (select auth.uid())
    )
  );

CREATE POLICY "education_insert_own_profile"
  ON career_id.education FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = education.profile_id AND jss_user_id = (select auth.uid())
    )
  );

CREATE POLICY "education_update_own_profile"
  ON career_id.education FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = education.profile_id AND jss_user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = education.profile_id AND jss_user_id = (select auth.uid())
    )
  );

CREATE POLICY "education_delete_own_profile"
  ON career_id.education FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = education.profile_id AND jss_user_id = (select auth.uid())
    )
  );

-- career_id.certifications
CREATE POLICY "certifications_select_own_profile"
  ON career_id.certifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = certifications.profile_id AND jss_user_id = (select auth.uid())
    )
  );

CREATE POLICY "certifications_insert_own_profile"
  ON career_id.certifications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = certifications.profile_id AND jss_user_id = (select auth.uid())
    )
  );

CREATE POLICY "certifications_update_own_profile"
  ON career_id.certifications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = certifications.profile_id AND jss_user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = certifications.profile_id AND jss_user_id = (select auth.uid())
    )
  );

CREATE POLICY "certifications_delete_own_profile"
  ON career_id.certifications FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = certifications.profile_id AND jss_user_id = (select auth.uid())
    )
  );

-- career_id.profile_skills
CREATE POLICY "profile_skills_select_own_profile"
  ON career_id.profile_skills FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = profile_skills.profile_id AND jss_user_id = (select auth.uid())
    )
  );

CREATE POLICY "profile_skills_insert_own_profile"
  ON career_id.profile_skills FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = profile_skills.profile_id AND jss_user_id = (select auth.uid())
    )
  );

CREATE POLICY "profile_skills_update_own_profile"
  ON career_id.profile_skills FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = profile_skills.profile_id AND jss_user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = profile_skills.profile_id AND jss_user_id = (select auth.uid())
    )
  );

CREATE POLICY "profile_skills_delete_own_profile"
  ON career_id.profile_skills FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = profile_skills.profile_id AND jss_user_id = (select auth.uid())
    )
  );

-- career_id.profile_social_links
CREATE POLICY "profile_social_links_select_own_profile"
  ON career_id.profile_social_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = profile_social_links.profile_id AND jss_user_id = (select auth.uid())
    )
  );

CREATE POLICY "profile_social_links_insert_own_profile"
  ON career_id.profile_social_links FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = profile_social_links.profile_id AND jss_user_id = (select auth.uid())
    )
  );

CREATE POLICY "profile_social_links_update_own_profile"
  ON career_id.profile_social_links FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = profile_social_links.profile_id AND jss_user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = profile_social_links.profile_id AND jss_user_id = (select auth.uid())
    )
  );

CREATE POLICY "profile_social_links_delete_own_profile"
  ON career_id.profile_social_links FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = profile_social_links.profile_id AND jss_user_id = (select auth.uid())
    )
  );

-- career_id.hero_stories
CREATE POLICY "hero_stories_select_own_profile"
  ON career_id.hero_stories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = hero_stories.profile_id AND jss_user_id = (select auth.uid())
    )
  );

CREATE POLICY "hero_stories_insert_own_profile"
  ON career_id.hero_stories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = hero_stories.profile_id AND jss_user_id = (select auth.uid())
    )
  );

CREATE POLICY "hero_stories_update_own_profile"
  ON career_id.hero_stories FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = hero_stories.profile_id AND jss_user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = hero_stories.profile_id AND jss_user_id = (select auth.uid())
    )
  );

CREATE POLICY "hero_stories_delete_own_profile"
  ON career_id.hero_stories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = hero_stories.profile_id AND jss_user_id = (select auth.uid())
    )
  );

-- career_id.hero_moments
CREATE POLICY "hero_moments_select_own_profile"
  ON career_id.hero_moments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = hero_moments.profile_id AND jss_user_id = (select auth.uid())
    )
  );

CREATE POLICY "hero_moments_insert_own_profile"
  ON career_id.hero_moments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = hero_moments.profile_id AND jss_user_id = (select auth.uid())
    )
  );

CREATE POLICY "hero_moments_update_own_profile"
  ON career_id.hero_moments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = hero_moments.profile_id AND jss_user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = hero_moments.profile_id AND jss_user_id = (select auth.uid())
    )
  );

CREATE POLICY "hero_moments_delete_own_profile"
  ON career_id.hero_moments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = hero_moments.profile_id AND jss_user_id = (select auth.uid())
    )
  );

-- public.hero_discovery_sessions
CREATE POLICY "hero_discovery_sessions_select_own_profile"
  ON public.hero_discovery_sessions FOR SELECT
  USING (
    profile_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = hero_discovery_sessions.profile_id AND jss_user_id = (select auth.uid())
    )
  );

CREATE POLICY "hero_discovery_sessions_insert_own_profile"
  ON public.hero_discovery_sessions FOR INSERT
  WITH CHECK (
    profile_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = hero_discovery_sessions.profile_id AND jss_user_id = (select auth.uid())
    )
  );

CREATE POLICY "hero_discovery_sessions_update_own_profile"
  ON public.hero_discovery_sessions FOR UPDATE
  USING (
    profile_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = hero_discovery_sessions.profile_id AND jss_user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    profile_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = hero_discovery_sessions.profile_id AND jss_user_id = (select auth.uid())
    )
  );

CREATE POLICY "hero_discovery_sessions_delete_own_profile"
  ON public.hero_discovery_sessions FOR DELETE
  USING (
    profile_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = hero_discovery_sessions.profile_id AND jss_user_id = (select auth.uid())
    )
  );

-- public.hero_story_sessions
CREATE POLICY "hero_story_sessions_select_own_profile"
  ON public.hero_story_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = hero_story_sessions.profile_id AND jss_user_id = (select auth.uid())
    )
  );

CREATE POLICY "hero_story_sessions_insert_own_profile"
  ON public.hero_story_sessions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = hero_story_sessions.profile_id AND jss_user_id = (select auth.uid())
    )
  );

CREATE POLICY "hero_story_sessions_update_own_profile"
  ON public.hero_story_sessions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = hero_story_sessions.profile_id AND jss_user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = hero_story_sessions.profile_id AND jss_user_id = (select auth.uid())
    )
  );

CREATE POLICY "hero_story_sessions_delete_own_profile"
  ON public.hero_story_sessions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = hero_story_sessions.profile_id AND jss_user_id = (select auth.uid())
    )
  );

-- public.docs_resumes
CREATE POLICY "docs_resumes_select_own_profile"
  ON public.docs_resumes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = docs_resumes.profile_id AND jss_user_id = (select auth.uid())
    )
  );

CREATE POLICY "docs_resumes_insert_own_profile"
  ON public.docs_resumes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = docs_resumes.profile_id AND jss_user_id = (select auth.uid())
    )
  );

CREATE POLICY "docs_resumes_update_own_profile"
  ON public.docs_resumes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = docs_resumes.profile_id AND jss_user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = docs_resumes.profile_id AND jss_user_id = (select auth.uid())
    )
  );

CREATE POLICY "docs_resumes_delete_own_profile"
  ON public.docs_resumes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = docs_resumes.profile_id AND jss_user_id = (select auth.uid())
    )
  );

-- public.docs_generated_resume_log
CREATE POLICY "docs_generated_resume_log_select_own_profile"
  ON public.docs_generated_resume_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = docs_generated_resume_log.profile_id AND jss_user_id = (select auth.uid())
    )
  );

CREATE POLICY "docs_generated_resume_log_insert_own_profile"
  ON public.docs_generated_resume_log FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = docs_generated_resume_log.profile_id AND jss_user_id = (select auth.uid())
    )
  );

CREATE POLICY "docs_generated_resume_log_update_own_profile"
  ON public.docs_generated_resume_log FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = docs_generated_resume_log.profile_id AND jss_user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = docs_generated_resume_log.profile_id AND jss_user_id = (select auth.uid())
    )
  );

CREATE POLICY "docs_generated_resume_log_delete_own_profile"
  ON public.docs_generated_resume_log FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = docs_generated_resume_log.profile_id AND jss_user_id = (select auth.uid())
    )
  );
