
-- Fix site_visits: prevent user_id spoofing
DROP POLICY IF EXISTS "Anyone can insert site visits" ON public.site_visits;

CREATE POLICY "Anyone can insert site visits"
ON public.site_visits
FOR INSERT
TO anon, authenticated
WITH CHECK (
  user_id IS NULL OR user_id = auth.uid()
);

-- Fix leads: validate profile_id references an approved profile
DROP POLICY IF EXISTS "Anyone can insert leads" ON public.leads;

CREATE POLICY "Anyone can insert leads"
ON public.leads
FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = leads.profile_id
      AND p.status = 'approved'
  )
);
