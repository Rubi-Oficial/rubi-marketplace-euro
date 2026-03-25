CREATE TABLE public.ip_geo_cache (
  ip_hash TEXT PRIMARY KEY,
  country_code TEXT,
  city_name TEXT,
  last_resolved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ip_geo_cache ENABLE ROW LEVEL SECURITY;

-- Only service role (edge functions) should access this table
CREATE POLICY "Service role only" ON public.ip_geo_cache
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Also allow site_visits updates from service role
CREATE POLICY "Service role can update site_visits" ON public.site_visits
  FOR UPDATE TO service_role USING (true) WITH CHECK (true);