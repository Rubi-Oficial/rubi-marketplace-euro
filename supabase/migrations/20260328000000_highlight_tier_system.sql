-- ============================================================
-- BLOCK 1+2: Paid Highlight Tier System — Schema & Ranking
-- ============================================================

-- 1. Add highlight columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS highlight_tier       TEXT    NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS highlight_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS highlight_sort_key   BIGINT  NOT NULL DEFAULT 0;

-- 2. Add highlight columns to plans
ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS tier           TEXT    NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS is_boost       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS highlight_days INTEGER NOT NULL DEFAULT 30;

-- 3. Counter table for monotonic sort-key allocation
--    next_top_key    (2 000 000 000+) → boosts,        ascending = most-recent boost on top
--    next_bottom_key (1 000 000 000-) → new activations, descending = oldest activation on top
CREATE TABLE IF NOT EXISTS public.highlight_tier_counters (
  tier             TEXT   PRIMARY KEY,
  next_top_key     BIGINT NOT NULL DEFAULT 2000000000,
  next_bottom_key  BIGINT NOT NULL DEFAULT 1000000000
);

INSERT INTO public.highlight_tier_counters (tier)
VALUES ('standard'), ('premium'), ('exclusive')
ON CONFLICT (tier) DO NOTHING;

-- 4. Immutable audit / idempotency log
CREATE TABLE IF NOT EXISTS public.highlight_events (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES public.users(id)    ON DELETE CASCADE,
  event_type  TEXT        NOT NULL
                CHECK (event_type IN ('plan_activated','plan_renewed','boost_applied','expired')),
  tier        TEXT        NOT NULL,
  sort_key    BIGINT,
  valid_until TIMESTAMPTZ,
  source      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique source prevents the same Stripe event from creating two rows
CREATE UNIQUE INDEX IF NOT EXISTS highlight_events_source_uidx
  ON public.highlight_events (source)
  WHERE source IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_highlight_events_profile
  ON public.highlight_events (profile_id);

-- 5a. alloc_top_key — boost goes to the TOP of the tier block
--     Returns an ever-increasing key (≥ 2 000 000 000)
CREATE OR REPLACE FUNCTION public.alloc_top_key(p_tier TEXT)
RETURNS BIGINT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  v_key BIGINT;
BEGIN
  UPDATE highlight_tier_counters
    SET next_top_key = next_top_key + 1
  WHERE tier = p_tier
  RETURNING next_top_key - 1 INTO v_key;

  -- Insert row if tier not yet in the table
  IF v_key IS NULL THEN
    INSERT INTO highlight_tier_counters (tier, next_top_key, next_bottom_key)
    VALUES (p_tier, 2000000001, 1000000000)
    ON CONFLICT (tier) DO UPDATE
      SET next_top_key = highlight_tier_counters.next_top_key + 1
    RETURNING next_top_key - 1 INTO v_key;
  END IF;

  RETURN v_key;
END;
$$;

-- 5b. alloc_bottom_key — new plan activation enters the BOTTOM of the tier block
--     Returns an ever-decreasing key (≤ 1 000 000 000)
--     Oldest activation = highest key = appears first within the activation band
CREATE OR REPLACE FUNCTION public.alloc_bottom_key(p_tier TEXT)
RETURNS BIGINT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  v_key BIGINT;
BEGIN
  UPDATE highlight_tier_counters
    SET next_bottom_key = next_bottom_key - 1
  WHERE tier = p_tier
  RETURNING next_bottom_key + 1 INTO v_key;

  IF v_key IS NULL THEN
    INSERT INTO highlight_tier_counters (tier, next_top_key, next_bottom_key)
    VALUES (p_tier, 2000000000, 999999999)
    ON CONFLICT (tier) DO UPDATE
      SET next_bottom_key = highlight_tier_counters.next_bottom_key - 1
    RETURNING next_bottom_key + 1 INTO v_key;
  END IF;

  RETURN v_key;
END;
$$;

-- 5c. activate_or_renew_highlight
--     • Same tier still active  → renewal: extend expiry, keep sort_key
--     • Tier changed / expired  → new activation: enter bottom of new tier block
CREATE OR REPLACE FUNCTION public.activate_or_renew_highlight(
  p_profile_id UUID,
  p_tier        TEXT,
  p_days        INTEGER,
  p_source      TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  v_profile    RECORD;
  v_sort_key   BIGINT;
  v_expires_at TIMESTAMPTZ;
  v_event_type TEXT;
BEGIN
  -- Idempotency guard
  IF p_source IS NOT NULL AND EXISTS (
    SELECT 1 FROM highlight_events WHERE source = p_source
  ) THEN
    RETURN;
  END IF;

  SELECT highlight_tier, highlight_expires_at, highlight_sort_key, user_id
    INTO v_profile
    FROM profiles
   WHERE id = p_profile_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'activate_or_renew_highlight: profile % not found', p_profile_id;
  END IF;

  IF  v_profile.highlight_tier = p_tier
  AND v_profile.highlight_expires_at IS NOT NULL
  AND v_profile.highlight_expires_at > now()
  THEN
    -- Renewal: extend validity, do NOT change sort_key (no repositioning)
    v_sort_key   := v_profile.highlight_sort_key;
    v_expires_at := v_profile.highlight_expires_at + (p_days * INTERVAL '1 day');
    v_event_type := 'plan_renewed';
  ELSE
    -- New activation or tier change: enter at bottom of new tier block
    v_sort_key   := alloc_bottom_key(p_tier);
    v_expires_at := now() + (p_days * INTERVAL '1 day');
    v_event_type := 'plan_activated';
  END IF;

  UPDATE profiles
     SET highlight_tier        = p_tier,
         highlight_expires_at  = v_expires_at,
         highlight_sort_key    = v_sort_key
   WHERE id = p_profile_id;

  INSERT INTO highlight_events (profile_id, user_id, event_type, tier, sort_key, valid_until, source)
  VALUES (p_profile_id, v_profile.user_id, v_event_type, p_tier, v_sort_key, v_expires_at, p_source);
END;
$$;

-- 5d. apply_boost
--     Move profile to top of its current tier block.
--     Requires an active premium or exclusive tier.
CREATE OR REPLACE FUNCTION public.apply_boost(
  p_profile_id UUID,
  p_source      TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  v_profile  RECORD;
  v_sort_key BIGINT;
BEGIN
  -- Idempotency guard
  IF p_source IS NOT NULL AND EXISTS (
    SELECT 1 FROM highlight_events WHERE source = p_source
  ) THEN
    RETURN;
  END IF;

  SELECT highlight_tier, highlight_expires_at, highlight_sort_key, user_id
    INTO v_profile
    FROM profiles
   WHERE id = p_profile_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'apply_boost: profile % not found', p_profile_id;
  END IF;

  -- Guard: boost only valid with an active premium/exclusive tier
  IF  v_profile.highlight_tier NOT IN ('premium', 'exclusive')
   OR v_profile.highlight_expires_at IS NULL
   OR v_profile.highlight_expires_at <= now()
  THEN
    RAISE EXCEPTION 'apply_boost: profile % has no active eligible tier (tier=%, expires=%)',
      p_profile_id, v_profile.highlight_tier, v_profile.highlight_expires_at;
  END IF;

  v_sort_key := alloc_top_key(v_profile.highlight_tier);

  UPDATE profiles
     SET highlight_sort_key = v_sort_key
   WHERE id = p_profile_id;

  INSERT INTO highlight_events (profile_id, user_id, event_type, tier, sort_key, valid_until, source)
  VALUES (p_profile_id, v_profile.user_id, 'boost_applied',
          v_profile.highlight_tier, v_sort_key, v_profile.highlight_expires_at, p_source);
END;
$$;

-- 6. RLS for new tables
ALTER TABLE public.highlight_tier_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage highlight_tier_counters"
  ON public.highlight_tier_counters FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'));

ALTER TABLE public.highlight_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profile owners can read own highlight_events"
  ON public.highlight_events FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
     WHERE profiles.id  = highlight_events.profile_id
       AND profiles.user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all highlight_events"
  ON public.highlight_events FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- 7. Performance index for the listing query
CREATE INDEX IF NOT EXISTS idx_profiles_highlight_listing
  ON public.profiles (highlight_tier, highlight_sort_key DESC)
  WHERE status = 'approved';

-- 8. Backfill: profiles with is_featured = true → highlight_tier = 'premium'
--    Assigns each a unique sort_key (ordered by created_at ASC so oldest = top of block)
DO $$
DECLARE
  r     RECORD;
  v_key BIGINT;
BEGIN
  FOR r IN
    SELECT id, featured_until
      FROM profiles
     WHERE is_featured = true
       AND highlight_tier = 'standard'
     ORDER BY created_at ASC
  LOOP
    v_key := alloc_bottom_key('premium');
    UPDATE profiles
       SET highlight_tier       = 'premium',
           highlight_expires_at = COALESCE(r.featured_until, now() + INTERVAL '30 days'),
           highlight_sort_key   = v_key
     WHERE id = r.id;
  END LOOP;
END;
$$;

-- 9. Recreate eligible_profiles view with highlight fields and computed rank columns
--    The WHERE clause is intentionally unchanged (active subscription still required).
--    tier_rank    : ordering priority (3=exclusive, 2=premium, 1=standard — only if active)
--    effective_sort_key : normalises expired highlights to 0 so they don't pollute ordering
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
    WHEN p.highlight_tier = 'exclusive'
         AND p.highlight_expires_at IS NOT NULL
         AND p.highlight_expires_at > now()  THEN 3
    WHEN p.highlight_tier = 'premium'
         AND p.highlight_expires_at IS NOT NULL
         AND p.highlight_expires_at > now()  THEN 2
    ELSE 1
  END                                              AS tier_rank,
  CASE
    WHEN p.highlight_tier IN ('exclusive', 'premium')
         AND p.highlight_expires_at IS NOT NULL
         AND p.highlight_expires_at > now()
    THEN p.highlight_sort_key
    ELSE 0
  END                                              AS effective_sort_key,
  p.created_at,
  p.updated_at,
  (p.whatsapp IS NOT NULL AND p.whatsapp <> '')    AS has_whatsapp,
  (p.telegram IS NOT NULL AND p.telegram <> '')    AS has_telegram
FROM profiles p
WHERE p.status = 'approved'::profile_status
  AND EXISTS (
    SELECT 1 FROM subscriptions s
     WHERE s.user_id = p.user_id
       AND s.status  = 'active'::subscription_status
  );

GRANT SELECT ON public.eligible_profiles TO anon, authenticated;
