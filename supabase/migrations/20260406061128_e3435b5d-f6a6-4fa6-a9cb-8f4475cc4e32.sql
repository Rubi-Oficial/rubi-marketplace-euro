
-- 1. Restrict profile_services public SELECT to only approved profiles
DROP POLICY IF EXISTS "Public can read profile_services" ON public.profile_services;

CREATE POLICY "Public can read approved profile_services"
ON public.profile_services
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = profile_services.profile_id
      AND p.status = 'approved'
  )
);

-- 2. Restrict referral_clicks INSERT to validate referral_code exists
DROP POLICY IF EXISTS "Anyone can insert clicks" ON public.referral_clicks;

CREATE POLICY "Anyone can insert validated clicks"
ON public.referral_clicks
FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.referral_code = referral_clicks.referral_code
      AND u.id = referral_clicks.referrer_user_id
  )
);
