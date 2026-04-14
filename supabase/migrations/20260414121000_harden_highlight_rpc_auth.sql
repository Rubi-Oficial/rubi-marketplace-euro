-- Harden privileged highlight RPC functions against direct client invocation.
-- These functions are intended for trusted backend flows (e.g. Stripe webhook)
-- and must never be callable by anon/authenticated clients.

-- 1) Lock down function EXECUTE privileges.
REVOKE EXECUTE ON FUNCTION public.activate_or_renew_highlight(UUID, TEXT, INTEGER, TEXT, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.apply_boost(UUID, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.expire_highlight(UUID, TEXT) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.activate_or_renew_highlight(UUID, TEXT, INTEGER, TEXT, TIMESTAMPTZ) TO service_role;
GRANT EXECUTE ON FUNCTION public.apply_boost(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.expire_highlight(UUID, TEXT) TO service_role;

-- 2) Add in-function authorization checks as defense in depth.
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
  IF COALESCE(auth.role(), '') <> 'service_role' THEN
    RAISE EXCEPTION 'activate_or_renew_highlight: forbidden' USING ERRCODE = '42501';
  END IF;

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
  IF COALESCE(auth.role(), '') <> 'service_role' THEN
    RAISE EXCEPTION 'apply_boost: forbidden' USING ERRCODE = '42501';
  END IF;

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
  IF COALESCE(auth.role(), '') <> 'service_role' THEN
    RAISE EXCEPTION 'expire_highlight: forbidden' USING ERRCODE = '42501';
  END IF;

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
