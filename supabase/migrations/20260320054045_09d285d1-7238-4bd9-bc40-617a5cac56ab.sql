
-- 1. Restrict what owners can set when updating their own profile
-- Allow status changes only to: draft, pending_review, paused (NOT approved/rejected)
-- Prevent changing is_featured and featured_until
ALTER POLICY "Owners can update own profile" ON public.profiles
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND status IN ('draft', 'pending_review', 'paused')
    AND is_featured = (SELECT p.is_featured FROM public.profiles p WHERE p.id = profiles.id)
    AND featured_until IS NOT DISTINCT FROM (SELECT p.featured_until FROM public.profiles p WHERE p.id = profiles.id)
  );

-- 2. Create a secure RPC for reactivating a paused profile back to approved
CREATE OR REPLACE FUNCTION public.reactivate_profile(_profile_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only allow the profile owner to reactivate, and only if currently paused
  UPDATE public.profiles
  SET status = 'approved', updated_at = now()
  WHERE id = _profile_id
    AND user_id = auth.uid()
    AND status = 'paused';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found, not owned by you, or not in paused state';
  END IF;
END;
$$;
