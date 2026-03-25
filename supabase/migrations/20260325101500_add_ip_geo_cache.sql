-- Cache geolocation by hashed IP to avoid repeated provider calls on each visit.
CREATE TABLE IF NOT EXISTS public.ip_geo_cache (
  ip_hash text PRIMARY KEY,
  country_code text,
  city_name text,
  last_resolved_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ip_geo_cache_last_resolved
  ON public.ip_geo_cache (last_resolved_at DESC);

ALTER TABLE public.ip_geo_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages geo cache"
ON public.ip_geo_cache
AS PERMISSIVE
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE TRIGGER update_ip_geo_cache_updated_at
BEFORE UPDATE ON public.ip_geo_cache
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
