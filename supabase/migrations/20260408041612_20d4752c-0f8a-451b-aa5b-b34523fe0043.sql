
-- Remove the permissive public INSERT policy
DROP POLICY IF EXISTS "Anyone can insert site visits" ON public.site_visits;

-- Allow only service_role to insert (used by track-visit edge function)
CREATE POLICY "Service role can insert site_visits"
ON public.site_visits
FOR INSERT
TO service_role
WITH CHECK (true);
