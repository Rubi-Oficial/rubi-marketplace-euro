
-- 1. Add highlight_sort_key to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS highlight_sort_key BIGINT NOT NULL DEFAULT 0;

-- 2. Create highlight_tier_counters table
CREATE TABLE IF NOT EXISTS public.highlight_tier_counters (
  tier TEXT PRIMARY KEY,
  next_top_key BIGINT NOT NULL DEFAULT 2000000000,
  next_bottom_key BIGINT NOT NULL DEFAULT 1000000000
);

ALTER TABLE public.highlight_tier_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON public.highlight_tier_counters
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Seed initial rows
INSERT INTO public.highlight_tier_counters (tier, next_top_key, next_bottom_key)
VALUES
  ('standard',  2000000000, 1000000000),
  ('premium',   2000000000, 1000000000),
  ('exclusive', 2000000000, 1000000000)
ON CONFLICT (tier) DO NOTHING;

-- 3. Create highlight_events table (immutable audit log)
CREATE TABLE IF NOT EXISTS public.highlight_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  tier TEXT,
  sort_key BIGINT,
  expires_at TIMESTAMPTZ,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.highlight_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON public.highlight_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_highlight_events_profile_id ON public.highlight_events(profile_id);
CREATE INDEX IF NOT EXISTS idx_highlight_events_created_at ON public.highlight_events(created_at DESC);

-- 4. Indexes on profiles for highlight ordering
CREATE INDEX IF NOT EXISTS idx_profiles_highlight_tier ON public.profiles(highlight_tier);
CREATE INDEX IF NOT EXISTS idx_profiles_highlight_sort_key ON public.profiles(highlight_sort_key DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_highlight_expires ON public.profiles(highlight_expires_at);

-- 5. alloc_bottom_key function
CREATE OR REPLACE FUNCTION public.alloc_bottom_key(_tier TEXT)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _key BIGINT;
BEGIN
  UPDATE highlight_tier_counters
  SET next_bottom_key = next_bottom_key - 1
  WHERE tier = _tier
  RETURNING next_bottom_key + 1 INTO _key;

  IF _key IS NULL THEN
    RAISE EXCEPTION 'Unknown tier: %', _tier;
  END IF;
  RETURN _key;
END;
$$;

-- 6. alloc_top_key function
CREATE OR REPLACE FUNCTION public.alloc_top_key(_tier TEXT)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _key BIGINT;
BEGIN
  UPDATE highlight_tier_counters
  SET next_top_key = next_top_key + 1
  WHERE tier = _tier
  RETURNING next_top_key - 1 INTO _key;

  IF _key IS NULL THEN
    RAISE EXCEPTION 'Unknown tier: %', _tier;
  END IF;
  RETURN _key;
END;
$$;

-- 7. Rebuild activate_or_renew_highlight with sort_key logic
CREATE OR REPLACE FUNCTION public.activate_or_renew_highlight(
  p_profile_id UUID,
  p_tier TEXT,
  p_days INTEGER,
  p_source TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _current_tier TEXT;
  _current_expires TIMESTAMPTZ;
  _new_expires TIMESTAMPTZ;
  _sort_key BIGINT;
  _event_type TEXT;
BEGIN
  SELECT highlight_tier, highlight_expires_at, highlight_sort_key
  INTO _current_tier, _current_expires, _sort_key
  FROM profiles WHERE id = p_profile_id;

  -- Renewal: same tier and still active
  IF _current_tier = p_tier AND _current_expires IS NOT NULL AND _current_expires > now() THEN
    _new_expires := _current_expires + (p_days || ' days')::INTERVAL;
    _event_type := 'plan_renewed';

    UPDATE profiles
    SET highlight_expires_at = _new_expires,
        is_featured = true,
        updated_at = now()
    WHERE id = p_profile_id;
  ELSE
    -- New activation or tier change: assign bottom key
    _sort_key := alloc_bottom_key(p_tier);
    _new_expires := now() + (p_days || ' days')::INTERVAL;
    _event_type := 'plan_activated';

    UPDATE profiles
    SET highlight_tier = p_tier,
        highlight_expires_at = _new_expires,
        highlight_sort_key = _sort_key,
        is_featured = true,
        updated_at = now()
    WHERE id = p_profile_id;
  END IF;

  -- Audit log
  INSERT INTO highlight_events (profile_id, event_type, tier, sort_key, expires_at, source)
  VALUES (p_profile_id, _event_type, p_tier, _sort_key, _new_expires, p_source);
END;
$$;

-- 8. Rebuild apply_boost with sort_key logic
CREATE OR REPLACE FUNCTION public.apply_boost(p_profile_id UUID, p_source TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _tier TEXT;
  _expires TIMESTAMPTZ;
  _new_key BIGINT;
BEGIN
  SELECT highlight_tier, highlight_expires_at
  INTO _tier, _expires
  FROM profiles
  WHERE id = p_profile_id;

  -- Must have active premium or exclusive tier
  IF _tier IS NULL OR _tier = 'standard' THEN
    RAISE EXCEPTION 'Profile has no active eligible tier for boost';
  END IF;

  IF _expires IS NULL OR _expires <= now() THEN
    RAISE EXCEPTION 'Highlight has expired, cannot boost';
  END IF;

  _new_key := alloc_top_key(_tier);

  UPDATE profiles
  SET highlight_sort_key = _new_key,
      is_featured = true,
      updated_at = now()
  WHERE id = p_profile_id;

  -- Audit log
  INSERT INTO highlight_events (profile_id, event_type, tier, sort_key, expires_at, source)
  VALUES (p_profile_id, 'boost_applied', _tier, _new_key, _expires, p_source);
END;
$$;

-- 9. Recreate eligible_profiles view with tier_rank and effective_sort_key
DROP VIEW IF EXISTS public.eligible_profiles;

CREATE VIEW public.eligible_profiles
WITH (security_barrier = true)
AS
SELECT
  p.id,
  p.display_name,
  p.age,
  p.bio,
  p.city,
  p.city_slug,
  p.country,
  p.category,
  p.gender,
  p.slug,
  p.pricing_from,
  p.is_featured,
  p.featured_until,
  p.languages,
  p.created_at,
  p.updated_at,
  p.highlight_tier,
  p.highlight_expires_at,
  (p.whatsapp IS NOT NULL AND p.whatsapp <> '') AS has_whatsapp,
  -- tier_rank: active exclusive=3, premium=2, else 1
  CASE
    WHEN p.highlight_expires_at IS NOT NULL
         AND p.highlight_expires_at > now()
         AND p.highlight_tier = 'exclusive' THEN 3
    WHEN p.highlight_expires_at IS NOT NULL
         AND p.highlight_expires_at > now()
         AND p.highlight_tier = 'premium' THEN 2
    ELSE 1
  END AS tier_rank,
  -- effective_sort_key: only for active premium/exclusive
  CASE
    WHEN p.highlight_expires_at IS NOT NULL
         AND p.highlight_expires_at > now()
         AND p.highlight_tier IN ('premium', 'exclusive')
    THEN p.highlight_sort_key
    ELSE 0
  END AS effective_sort_key
FROM profiles p
WHERE p.status = 'approved'
  AND EXISTS (
    SELECT 1 FROM subscriptions s
    WHERE s.user_id = p.user_id
      AND s.status = 'active'
  );
