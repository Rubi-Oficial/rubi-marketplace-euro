
-- Table for tracking site visits
CREATE TABLE public.site_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  page_path text NOT NULL,
  referrer_url text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  ip_hash text,
  country_code text,
  city_name text,
  user_agent text,
  device_type text,
  user_id uuid,
  is_bot boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for analytics queries
CREATE INDEX idx_site_visits_created_at ON public.site_visits (created_at DESC);
CREATE INDEX idx_site_visits_ip_hash ON public.site_visits (ip_hash) WHERE ip_hash IS NOT NULL;
CREATE INDEX idx_site_visits_session_id ON public.site_visits (session_id);

-- RLS
ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;

-- Anyone can insert visits (tracking)
CREATE POLICY "Anyone can insert site visits"
ON public.site_visits FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- Only admins can read
CREATE POLICY "Admins can read site visits"
ON public.site_visits FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- RPC for aggregated analytics
CREATE OR REPLACE FUNCTION public.get_access_analytics()
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result json;
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'access denied';
  END IF;

  SELECT json_build_object(
    'visits_24h', (SELECT count(*) FROM site_visits WHERE created_at >= now() - interval '24 hours'),
    'visits_7d', (SELECT count(*) FROM site_visits WHERE created_at >= now() - interval '7 days'),
    'visits_30d', (SELECT count(*) FROM site_visits WHERE created_at >= now() - interval '30 days'),
    'unique_sessions_24h', (SELECT count(DISTINCT session_id) FROM site_visits WHERE created_at >= now() - interval '24 hours'),
    'unique_sessions_7d', (SELECT count(DISTINCT session_id) FROM site_visits WHERE created_at >= now() - interval '7 days'),
    'unique_sessions_30d', (SELECT count(DISTINCT session_id) FROM site_visits WHERE created_at >= now() - interval '30 days'),
    'bot_count_24h', (SELECT count(*) FROM site_visits WHERE is_bot = true AND created_at >= now() - interval '24 hours'),
    'bot_count_7d', (SELECT count(*) FROM site_visits WHERE is_bot = true AND created_at >= now() - interval '7 days'),
    'daily_visits', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM (
        SELECT date_trunc('day', created_at)::date as day, count(*) as visits, count(DISTINCT session_id) as unique_sessions
        FROM site_visits WHERE created_at >= now() - interval '30 days'
        GROUP BY 1 ORDER BY 1
      ) t
    ),
    'top_pages', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM (
        SELECT page_path, count(*) as hits
        FROM site_visits WHERE created_at >= now() - interval '30 days'
        GROUP BY page_path ORDER BY hits DESC LIMIT 10
      ) t
    ),
    'device_distribution', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM (
        SELECT COALESCE(device_type, 'unknown') as device, count(*) as visits
        FROM site_visits WHERE created_at >= now() - interval '30 days'
        GROUP BY device_type ORDER BY visits DESC
      ) t
    ),
    'top_referrers', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM (
        SELECT COALESCE(referrer_url, 'Direct') as referrer, count(*) as visits
        FROM site_visits WHERE created_at >= now() - interval '30 days'
        GROUP BY referrer_url ORDER BY visits DESC LIMIT 10
      ) t
    ),
    'top_utm_sources', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM (
        SELECT utm_source, count(*) as visits
        FROM site_visits WHERE created_at >= now() - interval '30 days' AND utm_source IS NOT NULL
        GROUP BY utm_source ORDER BY visits DESC LIMIT 10
      ) t
    ),
    'top_countries', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM (
        SELECT COALESCE(country_code, 'Unknown') as country, count(*) as visits
        FROM site_visits WHERE created_at >= now() - interval '30 days'
        GROUP BY country_code ORDER BY visits DESC LIMIT 10
      ) t
    ),
    'top_cities', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM (
        SELECT COALESCE(city_name, 'Unknown') as city, count(*) as visits
        FROM site_visits WHERE created_at >= now() - interval '30 days' AND city_name IS NOT NULL
        GROUP BY city_name ORDER BY visits DESC LIMIT 10
      ) t
    ),
    'suspicious_ips', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM (
        SELECT ip_hash, count(*) as hits, max(created_at) as last_seen,
               count(DISTINCT page_path) as unique_pages,
               bool_or(is_bot) as is_known_bot
        FROM site_visits
        WHERE created_at >= now() - interval '24 hours' AND ip_hash IS NOT NULL
        GROUP BY ip_hash HAVING count(*) > 100
        ORDER BY hits DESC LIMIT 20
      ) t
    ),
    'suspicious_sessions', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM (
        SELECT session_id, count(*) as pageviews, min(created_at) as started, max(created_at) as last_seen,
               count(DISTINCT page_path) as unique_pages
        FROM site_visits
        WHERE created_at >= now() - interval '24 hours'
        GROUP BY session_id HAVING count(*) > 50
        ORDER BY pageviews DESC LIMIT 20
      ) t
    ),
    'recent_bots', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM (
        SELECT ip_hash, user_agent, page_path, created_at
        FROM site_visits
        WHERE is_bot = true AND created_at >= now() - interval '24 hours'
        ORDER BY created_at DESC LIMIT 20
      ) t
    )
  ) INTO result;
  RETURN result;
END;
$$;
