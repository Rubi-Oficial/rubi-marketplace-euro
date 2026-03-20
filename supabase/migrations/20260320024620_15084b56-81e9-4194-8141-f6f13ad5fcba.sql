
-- 1. Fix privilege escalation: restrict users UPDATE to prevent role changes
DROP POLICY IF EXISTS "Users can update own record" ON public.users;
CREATE POLICY "Users can update own record"
  ON public.users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT u.role FROM public.users u WHERE u.id = auth.uid())
  );

-- 2. Fix security definer view: recreate with security_invoker=on
DROP VIEW IF EXISTS public.eligible_profiles;
CREATE VIEW public.eligible_profiles
WITH (security_invoker=on) AS
SELECT
  p.id, p.user_id, p.display_name, p.age, p.city, p.city_slug,
  p.country, p.category, p.slug, p.bio, p.languages,
  p.pricing_from, p.whatsapp, p.telegram,
  p.is_featured, p.featured_until, p.created_at, p.updated_at
FROM public.profiles p
WHERE p.status = 'approved'::profile_status
  AND EXISTS (
    SELECT 1 FROM public.subscriptions s
    WHERE s.user_id = p.user_id AND s.status = 'active'::subscription_status
  );

-- 3. Fix exposed referral data: replace permissive policy
DROP POLICY IF EXISTS "Users can read their referrals" ON public.users;
CREATE POLICY "Users can read referral summary"
  ON public.users FOR SELECT
  TO authenticated
  USING (referred_by_user_id = auth.uid());
