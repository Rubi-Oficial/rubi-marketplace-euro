
-- PHASE 2: Create eligible_profiles view centralizing business rule
CREATE OR REPLACE VIEW public.eligible_profiles AS
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

-- Grant public read access to the view
GRANT SELECT ON public.eligible_profiles TO anon, authenticated;

-- PHASE 3: Add self-referral prevention constraint
ALTER TABLE public.referral_conversions
  ADD CONSTRAINT prevent_self_referral
  CHECK (referrer_user_id != referred_user_id);

-- Add unique constraint to prevent duplicate commissions per referred user
ALTER TABLE public.referral_conversions
  ADD CONSTRAINT unique_first_conversion_per_user
  UNIQUE (referred_user_id, conversion_type);
