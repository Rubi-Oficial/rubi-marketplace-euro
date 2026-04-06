
-- Fix: Prevent profile owners from modifying highlight fields directly
-- Only SECURITY DEFINER functions (activate_or_renew_highlight, apply_boost) should change these
DROP POLICY IF EXISTS "Owners can update own profile" ON public.profiles;

CREATE POLICY "Owners can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid()
  AND status = ANY(ARRAY['draft'::profile_status, 'pending_review'::profile_status, 'paused'::profile_status])
  -- Prevent changing is_featured
  AND is_featured = (SELECT p.is_featured FROM profiles p WHERE p.id = profiles.id)
  -- Prevent changing featured_until
  AND NOT (featured_until IS DISTINCT FROM (SELECT p.featured_until FROM profiles p WHERE p.id = profiles.id))
  -- Prevent changing highlight_tier
  AND NOT (highlight_tier IS DISTINCT FROM (SELECT p.highlight_tier FROM profiles p WHERE p.id = profiles.id))
  -- Prevent changing highlight_expires_at
  AND NOT (highlight_expires_at IS DISTINCT FROM (SELECT p.highlight_expires_at FROM profiles p WHERE p.id = profiles.id))
  -- Prevent changing highlight_sort_key
  AND highlight_sort_key = (SELECT p.highlight_sort_key FROM profiles p WHERE p.id = profiles.id)
);
