-- Migration: 014_create_get_profile_function
-- Description: Create get_full_profile database function to fetch complete profile data with all related entities in a single query
-- Date: 2025-12-02

CREATE OR REPLACE FUNCTION career_id.get_full_profile(p_profile_id TEXT)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'profile', (
      SELECT json_build_object(
        'id', p.id,
        'user_id', p.user_id,
        'internal_id', p.internal_id,
        'completion_status', p.completion_status,
        'created_at', p.created_at,
        'updated_at', p.updated_at,
        'deleted_at', p.deleted_at,
        'is_deleted', p.is_deleted
      )
      FROM career_id.profiles p
      WHERE p.id = p_profile_id
    ),
    'experience', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'id', e.id,
          'profile_id', e.profile_id,
          'employment_type', e.employment_type,
          'employer', e.employer,
          'title', e.title,
          'location', e.location,
          'location_type', e.location_type,
          'url', e.url,
          'start_date', e.start_date,
          'end_date', e.end_date,
          'current_position', e.current_position,
          'summary', e.summary,
          'highlights', e.highlights,
          'display_order', e.display_order,
          'created_at', e.created_at,
          'updated_at', e.updated_at
        ) ORDER BY e.display_order
      ), '[]'::json)
      FROM career_id.experience e
      WHERE e.profile_id = p_profile_id
    ),
    'education', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'id', ed.id,
          'profile_id', ed.profile_id,
          'degree_type', ed.degree_type,
          'area_of_study', ed.area_of_study,
          'institution', ed.institution,
          'start_date', ed.start_date,
          'end_date', ed.end_date,
          'completed', ed.completed,
          'url', ed.url,
          'credit_hours', ed.credit_hours,
          'coursework', ed.coursework,
          'minors', ed.minors,
          'display_order', ed.display_order,
          'created_at', ed.created_at,
          'updated_at', ed.updated_at
        ) ORDER BY ed.display_order
      ), '[]'::json)
      FROM career_id.education ed
      WHERE ed.profile_id = p_profile_id
    ),
    'certifications', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'id', c.id,
          'profile_id', c.profile_id,
          'name', c.name,
          'issuer', c.issuer,
          'date', c.date,
          'url', c.url,
          'display_order', c.display_order,
          'created_at', c.created_at,
          'updated_at', c.updated_at
        ) ORDER BY c.display_order
      ), '[]'::json)
      FROM career_id.certifications c
      WHERE c.profile_id = p_profile_id
    ),
    'profile_skills', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'id', ps.id,
          'profile_id', ps.profile_id,
          'skill_id', ps.skill_id,
          'name', ps.name,
          'proficiency_level', ps.proficiency_level,
          'years_experience', ps.years_experience,
          'display_order', ps.display_order,
          'skill', CASE 
            WHEN ps.skill_id IS NOT NULL THEN
              json_build_object(
                'id', s.id,
                'name', s.name,
                'category', s.category
              )
            ELSE NULL
          END,
          'created_at', ps.created_at,
          'updated_at', ps.updated_at
        ) ORDER BY ps.display_order
      ), '[]'::json)
      FROM career_id.profile_skills ps
      LEFT JOIN reference.skills s ON s.id = ps.skill_id
      WHERE ps.profile_id = p_profile_id
    ),
    'profile_social_links', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'id', psl.id,
          'profile_id', psl.profile_id,
          'platform_id', psl.platform_id,
          'platform_name_cache', psl.platform_name_cache,
          'url', psl.url,
          'display_order', psl.display_order,
          'created_at', psl.created_at,
          'updated_at', psl.updated_at
        ) ORDER BY psl.display_order
      ), '[]'::json)
      FROM career_id.profile_social_links psl
      WHERE psl.profile_id = p_profile_id
    ),
    'contact_info', (
      SELECT json_build_object(
        'id', ci.id,
        'internal_id', ci.internal_id,
        'profile_id', ci.profile_id,
        'first_name', ci.first_name,
        'last_name', ci.last_name,
        'job_title', ci.job_title,
        'email', ci.email,
        'phone', ci.phone,
        'websites', ci.websites,
        'summary', ci.summary,
        'city', ci.city,
        'state_region', ci.state_region,
        'country', ci.country,
        'postal_code', ci.postal_code,
        'willing_to_relocate', ci.willing_to_relocate,
        'created_at', ci.created_at,
        'updated_at', ci.updated_at
      )
      FROM career_id.contact_info ci
      WHERE ci.profile_id = p_profile_id
    )
  ) INTO result;
  
  -- Return null if profile doesn't exist
  IF result->'profile' IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION career_id.get_full_profile(TEXT) IS 'Fetches a complete profile with all related entities (experience, education, certifications, skills, social links, contact info) in a single query. Returns NULL if profile does not exist.';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION career_id.get_full_profile(TEXT) TO anon, authenticated;
