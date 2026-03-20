ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender text;

DROP VIEW IF EXISTS public.eligible_profiles CASCADE;

CREATE VIEW public.eligible_profiles AS
SELECT
  id, user_id, display_name, age, city, city_slug, country, category,
  gender, slug, bio, languages, pricing_from, whatsapp, telegram,
  is_featured, featured_until, created_at, updated_at
FROM profiles p
WHERE status = 'approved'::profile_status
  AND EXISTS (
    SELECT 1 FROM subscriptions s
    WHERE s.user_id = p.user_id AND s.status = 'active'::subscription_status
  );