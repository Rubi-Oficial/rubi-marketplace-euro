
-- Update eligible_profiles view to expose has_whatsapp boolean
-- This allows listing cards to show a WhatsApp contact button without
-- exposing the actual phone number (which stays behind the get_profile_contact RPC)

DROP VIEW IF EXISTS public.eligible_profiles;

CREATE VIEW public.eligible_profiles
WITH (security_barrier = true, security_invoker = false)
AS
SELECT
  p.id,
  p.display_name,
  p.age,
  p.city,
  p.city_slug,
  p.country,
  p.category,
  p.gender,
  p.slug,
  p.bio,
  p.languages,
  p.pricing_from,
  p.is_featured,
  p.featured_until,
  p.created_at,
  p.updated_at,
  (p.whatsapp IS NOT NULL AND p.whatsapp <> '') AS has_whatsapp,
  (p.telegram IS NOT NULL AND p.telegram <> '') AS has_telegram
FROM profiles p
WHERE p.status = 'approved'::profile_status
  AND EXISTS (
    SELECT 1 FROM subscriptions s
    WHERE s.user_id = p.user_id
      AND s.status = 'active'::subscription_status
  );

GRANT SELECT ON public.eligible_profiles TO anon, authenticated;
