-- Fix highlight system regressions and wire Stripe renewal/expiry semantics

-- 1) Ensure profile highlight schema is complete and compatible with legacy featured fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS highlight_tier TEXT NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS highlight_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS highlight_sort_key BIGINT NOT NULL DEFAULT 0;

UPDATE public.profiles
SET highlight_tier = COALESCE(NULLIF(highlight_tier, ''), 'standard')
WHERE highlight_tier IS NULL OR highlight_tier = '';

ALTER TABLE public.profiles
  ALTER COLUMN highlight_tier SET DEFAULT 'standard',
  ALTER COLUMN highlight_tier SET NOT NULL,
  ALTER COLUMN highlight_sort_key SET DEFAULT 0,
  ALTER COLUMN highlight_sort_key SET NOT NULL;

-- 2) Ensure plans carry highlight metadata
ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS is_boost BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS highlight_days INTEGER NOT NULL DEFAULT 30;

UPDATE public.plans
SET tier = COALESCE(NULLIF(tier, ''), 'standard')
WHERE tier IS NULL OR tier = '';

ALTER TABLE public.plans
  ALTER COLUMN tier SET DEFAULT 'standard',
  ALTER COLUMN tier SET NOT NULL,
  ALTER COLUMN is_boost SET DEFAULT false,
  ALTER COLUMN is_boost SET NOT NULL,
  ALTER COLUMN highlight_days SET DEFAULT 30,
  ALTER COLUMN highlight_days SET NOT NULL;

-- 3) Counter table for deterministic top/bottom placement within each tier
CREATE TABLE IF NOT EXISTS public.highlight_tier_counters (
  tier TEXT PRIMARY KEY CHECK (tier IN ('standard', 'premium', 'exclusive')),
  next_top_key BIGINT NOT NULL DEFAULT 2000000000,
  next_bottom_key BIGINT NOT NULL DEFAULT 1000000000
);

INSERT INTO public.highlight_tier_counters (tier)
VALUES ('standard'), ('premium'), ('exclusive')
ON CONFLICT (tier) DO NOTHING;

-- 4) Immutable event log with idempotency by source
CREATE TABLE IF NOT EXISTS public.highlight_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('plan_activated', 'plan_renewed', 'boost_applied', 'expired')),
  tier TEXT NOT NULL CHECK (tier IN ('standard', 'premium', 'exclusive')),
  sort_key BIGINT,
  valid_until TIMESTAMPTZ,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS highlight_events_source_uidx
  ON public.highlight_events (source)
  WHERE source IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_highlight_events_profile_created
  ON public.highlight_events (profile_id, created_at DESC);

-- 5) Deterministic key allocators
CREATE OR REPLACE FUNCTION public.alloc_top_key(p_tier TEXT)
RETURNS BIGINT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  v_key BIGINT;
BEGIN
  IF p_tier NOT IN ('standard', 'premium', 'exclusive') THEN
    RAISE EXCEPTION 'alloc_top_key: invalid tier %', p_tier;
  END IF;

  UPDATE public.highlight_tier_counters
  SET next_top_key = next_top_key + 1
  WHERE tier = p_tier
  RETURNING next_top_key - 1 INTO v_key;

  IF v_key IS NULL THEN
    INSERT INTO public.highlight_tier_counters (tier, next_top_key, next_bottom_key)
    VALUES (p_tier, 2000000001, 1000000000)
    ON CONFLICT (tier) DO UPDATE
      SET next_top_key = public.highlight_tier_counters.next_top_key + 1
    RETURNING next_top_key - 1 INTO v_key;
  END IF;

  RETURN v_key;
END;
$$;

CREATE OR REPLACE FUNCTION public.alloc_bottom_key(p_tier TEXT)
RETURNS BIGINT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  v_key BIGINT;
BEGIN
  IF p_tier NOT IN ('standard', 'premium', 'exclusive') THEN
    RAISE EXCEPTION 'alloc_bottom_key: invalid tier %', p_tier;
  END IF;

  UPDATE public.highlight_tier_counters
  SET next_bottom_key = next_bottom_key - 1
  WHERE tier = p_tier
  RETURNING next_bottom_key + 1 INTO v_key;

  IF v_key IS NULL THEN
    INSERT INTO public.highlight_tier_counters (tier, next_top_key, next_bottom_key)
    VALUES (p_tier, 2000000000, 999999999)
    ON CONFLICT (tier) DO UPDATE
      SET next_bottom_key = public.highlight_tier_counters.next_bottom_key - 1
    RETURNING next_bottom_key + 1 INTO v_key;
  END IF;

  RETURN v_key;
END;
$$;

-- 6) Activation/renewal that supports either day-based extension or explicit target expiry (webhook sync)
CREATE OR REPLACE FUNCTION public.activate_or_renew_highlight(
  p_profile_id UUID,
  p_tier TEXT,
  p_days INTEGER,
  p_source TEXT DEFAULT NULL,
  p_target_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  v_profile RECORD;
  v_sort_key BIGINT;
  v_expires_at TIMESTAMPTZ;
  v_event_type TEXT;
  v_has_active_same_tier BOOLEAN;
BEGIN
  IF p_tier NOT IN ('standard', 'premium', 'exclusive') THEN
    RAISE EXCEPTION 'activate_or_renew_highlight: invalid tier %', p_tier;
  END IF;

  IF p_source IS NOT NULL AND EXISTS (SELECT 1 FROM public.highlight_events WHERE source = p_source) THEN
    RETURN;
  END IF;

  SELECT id, user_id, highlight_tier, highlight_expires_at, highlight_sort_key
    INTO v_profile
    FROM public.profiles
   WHERE id = p_profile_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'activate_or_renew_highlight: profile % not found', p_profile_id;
  END IF;

  v_has_active_same_tier :=
    v_profile.highlight_tier = p_tier
    AND v_profile.highlight_expires_at IS NOT NULL
    AND v_profile.highlight_expires_at > now();

  IF v_has_active_same_tier THEN
    v_sort_key := v_profile.highlight_sort_key;
    v_event_type := 'plan_renewed';

    IF p_target_expires_at IS NOT NULL THEN
      v_expires_at := GREATEST(v_profile.highlight_expires_at, p_target_expires_at);
    ELSE
      v_expires_at := v_profile.highlight_expires_at + (GREATEST(p_days, 0) * INTERVAL '1 day');
    END IF;
  ELSE
    v_sort_key := alloc_bottom_key(p_tier);
    v_event_type := 'plan_activated';

    IF p_target_expires_at IS NOT NULL THEN
      v_expires_at := p_target_expires_at;
    ELSE
      v_expires_at := now() + (GREATEST(p_days, 0) * INTERVAL '1 day');
    END IF;
  END IF;

  UPDATE public.profiles
  SET highlight_tier = p_tier,
      highlight_expires_at = v_expires_at,
      highlight_sort_key = v_sort_key,
      is_featured = (p_tier IN ('premium', 'exclusive') AND v_expires_at > now()),
      featured_until = CASE WHEN p_tier IN ('premium', 'exclusive') THEN v_expires_at ELSE NULL END,
      updated_at = now()
  WHERE id = p_profile_id;

  INSERT INTO public.highlight_events (profile_id, user_id, event_type, tier, sort_key, valid_until, source)
  VALUES (p_profile_id, v_profile.user_id, v_event_type, p_tier, v_sort_key, v_expires_at, p_source);
END;
$$;

-- 7) Boost always repositions to top of current active paid tier without changing tier
CREATE OR REPLACE FUNCTION public.apply_boost(
  p_profile_id UUID,
  p_source TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  v_profile RECORD;
  v_sort_key BIGINT;
BEGIN
  IF p_source IS NOT NULL AND EXISTS (SELECT 1 FROM public.highlight_events WHERE source = p_source) THEN
    RETURN;
  END IF;

  SELECT id, user_id, highlight_tier, highlight_expires_at
    INTO v_profile
    FROM public.profiles
   WHERE id = p_profile_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'apply_boost: profile % not found', p_profile_id;
  END IF;

  IF v_profile.highlight_tier NOT IN ('premium', 'exclusive')
     OR v_profile.highlight_expires_at IS NULL
     OR v_profile.highlight_expires_at <= now() THEN
    RAISE EXCEPTION 'apply_boost: profile % has no active eligible tier', p_profile_id;
  END IF;

  v_sort_key := alloc_top_key(v_profile.highlight_tier);

  UPDATE public.profiles
  SET highlight_sort_key = v_sort_key,
      updated_at = now()
  WHERE id = p_profile_id;

  INSERT INTO public.highlight_events (profile_id, user_id, event_type, tier, sort_key, valid_until, source)
  VALUES (p_profile_id, v_profile.user_id, 'boost_applied', v_profile.highlight_tier, v_sort_key, v_profile.highlight_expires_at, p_source);
END;
$$;

-- 8) Explicit expiry function for webhook cancellation/unpaid flows
CREATE OR REPLACE FUNCTION public.expire_highlight(
  p_profile_id UUID,
  p_source TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  v_profile RECORD;
BEGIN
  IF p_source IS NOT NULL AND EXISTS (SELECT 1 FROM public.highlight_events WHERE source = p_source) THEN
    RETURN;
  END IF;

  SELECT id, user_id, highlight_tier
    INTO v_profile
    FROM public.profiles
   WHERE id = p_profile_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'expire_highlight: profile % not found', p_profile_id;
  END IF;

  UPDATE public.profiles
  SET highlight_tier = 'standard',
      highlight_expires_at = now(),
      highlight_sort_key = 0,
      is_featured = false,
      featured_until = NULL,
      updated_at = now()
  WHERE id = p_profile_id;

  INSERT INTO public.highlight_events (profile_id, user_id, event_type, tier, sort_key, valid_until, source)
  VALUES (p_profile_id, v_profile.user_id, 'expired', 'standard', 0, now(), p_source);
END;
$$;

-- 9) Listing index for public ranking (tier + position + fallback)
CREATE INDEX IF NOT EXISTS idx_profiles_public_highlight_order
  ON public.profiles (status, highlight_tier, highlight_sort_key DESC, created_at DESC, id DESC)
  WHERE status = 'approved';

-- 10) Expose ranking metadata on eligible_profiles (keeps existing access model)
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
  p.highlight_tier,
  p.highlight_expires_at,
  p.highlight_sort_key,
  CASE
    WHEN p.highlight_tier = 'exclusive' AND p.highlight_expires_at IS NOT NULL AND p.highlight_expires_at > now() THEN 3
    WHEN p.highlight_tier = 'premium' AND p.highlight_expires_at IS NOT NULL AND p.highlight_expires_at > now() THEN 2
    ELSE 1
  END AS tier_rank,
  CASE
    WHEN p.highlight_tier IN ('premium', 'exclusive')
      AND p.highlight_expires_at IS NOT NULL
      AND p.highlight_expires_at > now()
    THEN p.highlight_sort_key
    ELSE 0
  END AS effective_sort_key,
  p.created_at,
  p.updated_at,
  (p.whatsapp IS NOT NULL AND p.whatsapp <> '') AS has_whatsapp,
  (p.telegram IS NOT NULL AND p.telegram <> '') AS has_telegram
FROM public.profiles p
WHERE p.status = 'approved'::public.profile_status
  AND EXISTS (
    SELECT 1
    FROM public.subscriptions s
    WHERE s.user_id = p.user_id
      AND s.status = 'active'::public.subscription_status
  );

GRANT SELECT ON public.eligible_profiles TO anon, authenticated;
