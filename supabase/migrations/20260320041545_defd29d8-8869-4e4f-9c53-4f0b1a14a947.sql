
-- Recreate eligible_profiles view as security_definer so anon users can query it
DROP VIEW IF EXISTS public.eligible_profiles;

CREATE VIEW public.eligible_profiles
WITH (security_invoker = off)
AS
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
FROM profiles p
WHERE p.status = 'approved'::profile_status
  AND EXISTS (
    SELECT 1 FROM subscriptions s
    WHERE s.user_id = p.user_id
      AND s.status = 'active'::subscription_status
  );

-- Grant select to anon and authenticated
GRANT SELECT ON public.eligible_profiles TO anon, authenticated;
