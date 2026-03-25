-- Migration: 040_fix_handle_new_user_security_definer
-- Description: Re-create handle_new_user trigger function with SECURITY DEFINER.
--
-- Root cause: Migration 039 re-created this function without SECURITY DEFINER,
-- causing it to run as the calling role (supabase_auth_admin) which lacks
-- INSERT permission on public.users. This results in:
--   ERROR: permission denied for table users (SQLSTATE 42501)
-- ...which Supabase surfaces as "Database error saving new user".
--
-- Fix: SECURITY DEFINER makes the function execute as its owner (postgres),
-- who has full access. The fixed search_path from 039 is preserved.
-- Date: 2026-03-25

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;
