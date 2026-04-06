
-- 1. Create deduplication table for Stripe webhooks
CREATE TABLE public.stripe_webhook_event_dedup (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS: only service_role can access
ALTER TABLE public.stripe_webhook_event_dedup ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON public.stripe_webhook_event_dedup
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Auto-cleanup old events (older than 7 days) - optional index for performance
CREATE INDEX idx_dedup_created_at ON public.stripe_webhook_event_dedup (created_at);

-- 2. Add missing columns to plans table
ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS is_boost BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS highlight_days INTEGER DEFAULT 30;

-- 3. Add missing columns to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS highlight_tier TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS highlight_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- 4. Create activate_or_renew_highlight function
CREATE OR REPLACE FUNCTION public.activate_or_renew_highlight(
  p_profile_id UUID,
  p_tier TEXT,
  p_days INTEGER,
  p_source TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_expires TIMESTAMPTZ;
  new_expires TIMESTAMPTZ;
BEGIN
  SELECT highlight_expires_at INTO current_expires
  FROM profiles WHERE id = p_profile_id;

  -- If currently active, extend from current expiry; otherwise from now
  IF current_expires IS NOT NULL AND current_expires > now() THEN
    new_expires := current_expires + (p_days || ' days')::INTERVAL;
  ELSE
    new_expires := now() + (p_days || ' days')::INTERVAL;
  END IF;

  UPDATE profiles
  SET highlight_tier = p_tier,
      highlight_expires_at = new_expires,
      is_featured = true,
      updated_at = now()
  WHERE id = p_profile_id;
END;
$$;

-- 5. Create apply_boost function (bumps updated_at to re-sort profile to top)
CREATE OR REPLACE FUNCTION public.apply_boost(
  p_profile_id UUID,
  p_source TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE profiles
  SET updated_at = now(),
      is_featured = true
  WHERE id = p_profile_id
    AND status = 'approved';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found or not approved';
  END IF;
END;
$$;

-- 6. Update existing plans with proper tier values
UPDATE public.plans SET tier = 'standard' WHERE tier IS NULL OR tier = 'standard';
