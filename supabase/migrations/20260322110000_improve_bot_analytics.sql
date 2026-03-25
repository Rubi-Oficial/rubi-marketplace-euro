-- Update get_access_analytics to return richer bot information:
-- 1. recent_bots now includes country_code field
-- 2. New bot_by_agent aggregate: groups bots by user_agent with counts and pages

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
        SELECT ip_hash, user_agent, page_path, created_at,
               COALESCE(country_code, 'Unknown') as country_code,
               COALESCE(city_name, '') as city_name
        FROM site_visits
        WHERE is_bot = true AND created_at >= now() - interval '24 hours'
        ORDER BY created_at DESC LIMIT 50
      ) t
    ),
    'bot_by_agent', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM (
        SELECT
          COALESCE(user_agent, 'Unknown') as user_agent,
          count(*) as hits,
          count(DISTINCT ip_hash) as unique_ips,
          count(DISTINCT page_path) as unique_pages,
          min(created_at) as first_seen,
          max(created_at) as last_seen,
          (array_agg(DISTINCT page_path ORDER BY page_path) FILTER (WHERE page_path IS NOT NULL))[1:20] as pages_visited
        FROM site_visits
        WHERE is_bot = true AND created_at >= now() - interval '24 hours'
        GROUP BY user_agent
        ORDER BY hits DESC LIMIT 20
      ) t
    )
  ) INTO result;
  RETURN result;
END;
$$;
