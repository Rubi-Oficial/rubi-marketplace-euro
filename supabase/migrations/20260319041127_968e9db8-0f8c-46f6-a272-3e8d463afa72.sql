
-- Fix security definer view warning by using invoker security
DROP VIEW IF EXISTS public.eligible_profiles;

CREATE VIEW public.eligible_profiles
WITH (security_invoker = true)
AS
SELECT
  p.id,
  p.user_id,
  p.display_name,
  p.age,
  p.city,
  p.country,
  p.category,
  p.slug,
  p.pricing_from,
  p.is_featured,
  p.featured_until,
  p.bio,
  p.languages,
  p.whatsapp,
  p.telegram,
  p.created_at,
  p.updated_at
FROM public.profiles p
WHERE p.status = 'approved'
  AND EXISTS (
    SELECT 1 FROM public.subscriptions s
    WHERE s.user_id = p.user_id
      AND s.status = 'active'
  );

GRANT SELECT ON public.eligible_profiles TO anon, authenticated;
