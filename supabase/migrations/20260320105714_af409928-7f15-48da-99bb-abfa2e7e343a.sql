
-- 1. Remove the overly permissive public SELECT policy on profiles
-- Public access should go through eligible_profiles view only
DROP POLICY IF EXISTS "Approved profiles are public" ON public.profiles;

-- 2. Recreate eligible_profiles view with security_barrier to prevent predicate pushdown attacks
DROP VIEW IF EXISTS public.eligible_profiles;

CREATE VIEW public.eligible_profiles
WITH (security_barrier=true, security_invoker=false) AS
SELECT
  p.id,
  p.user_id,
  p.display_name,
  p.age,
  p.city,
  p.city_slug,
  p.country,
  p.category,
  p.slug,
  p.bio,
  p.languages,
  p.pricing_from,
  p.whatsapp,
  p.telegram,
  p.is_featured,
  p.featured_until,
  p.created_at,
  p.updated_at
FROM public.profiles p
WHERE p.status = 'approved'::profile_status
  AND EXISTS (
    SELECT 1 FROM public.subscriptions s
    WHERE s.user_id = p.user_id AND s.status = 'active'::subscription_status
  );

-- Grant SELECT on the view to anon and authenticated roles
GRANT SELECT ON public.eligible_profiles TO anon;
GRANT SELECT ON public.eligible_profiles TO authenticated;
