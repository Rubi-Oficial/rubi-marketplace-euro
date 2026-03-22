
DROP VIEW IF EXISTS public.eligible_profiles;

CREATE VIEW public.eligible_profiles AS
SELECT
  p.id, p.display_name, p.age, p.bio, p.city, p.city_slug, p.country,
  p.category, p.gender, p.slug, p.pricing_from, p.is_featured,
  p.featured_until, p.languages, p.created_at, p.updated_at,
  (p.whatsapp IS NOT NULL AND p.whatsapp <> '') AS has_whatsapp
FROM profiles p
WHERE p.status = 'approved'
  AND EXISTS (
    SELECT 1 FROM subscriptions s
    WHERE s.user_id = p.user_id AND s.status = 'active'
  );

GRANT SELECT ON public.eligible_profiles TO anon, authenticated;
