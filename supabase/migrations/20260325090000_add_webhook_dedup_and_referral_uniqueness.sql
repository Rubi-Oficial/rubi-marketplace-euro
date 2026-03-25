-- Stripe webhook deduplication table
CREATE TABLE IF NOT EXISTS public.stripe_webhook_event_dedup (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure one conversion per referred user + conversion type.
WITH duplicate_conversions AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY referred_user_id, conversion_type
      ORDER BY created_at ASC, id ASC
    ) AS row_num
  FROM public.referral_conversions
)
DELETE FROM public.referral_conversions
WHERE id IN (
  SELECT id
  FROM duplicate_conversions
  WHERE row_num > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS referral_conversions_referred_user_conversion_type_uidx
  ON public.referral_conversions (referred_user_id, conversion_type);
