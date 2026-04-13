CREATE OR REPLACE FUNCTION public.get_access_analytics()
 RETURNS json
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

    -- Authenticated / Anonymous visits
    'authenticated_visits_24h', (SELECT count(*) FROM site_visits WHERE user_id IS NOT NULL AND created_at >= now() - interval '24 hours'),
    'authenticated_visits_7d', (SELECT count(*) FROM site_visits WHERE user_id IS NOT NULL AND created_at >= now() - interval '7 days'),
    'anonymous_visits_24h', (SELECT count(*) FROM site_visits WHERE user_id IS NULL AND created_at >= now() - interval '24 hours'),

    -- Bounce rate (7d): % of sessions with only 1 pageview
    'bounce_rate_7d', (
      SELECT ROUND(
        CASE WHEN count(*) = 0 THEN 0
        ELSE (count(*) FILTER (WHERE pv = 1))::numeric / count(*) * 100
        END, 1
      )
      FROM (
        SELECT session_id, count(*) as pv
        FROM site_visits
        WHERE created_at >= now() - interval '7 days' AND is_bot = false
        GROUP BY session_id
      ) s
    ),

    -- Average session depth (7d)
    'avg_session_depth_7d', (
      SELECT ROUND(AVG(pv)::numeric, 1)
      FROM (
        SELECT session_id, count(*) as pv
        FROM site_visits
        WHERE created_at >= now() - interval '7 days' AND is_bot = false
        GROUP BY session_id
      ) s
    ),

    -- Hourly distribution (24h)
    'hourly_distribution', (
      SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.hour), '[]'::json) FROM (
        SELECT
          EXTRACT(HOUR FROM created_at)::int as hour,
          count(*) as visits,
          count(*) FILTER (WHERE is_bot = true) as bot_visits,
          count(*) FILTER (WHERE user_id IS NOT NULL) as auth_visits
        FROM site_visits
        WHERE created_at >= now() - interval '24 hours'
        GROUP BY 1
      ) t
    ),

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

    -- Top authenticated users (7d)
    'top_authenticated_users', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM (
        SELECT
          sv.user_id,
          COALESCE(u.full_name, u.email, 'Unknown') as display_name,
          u.role::text as role,
          count(*) as visits,
          count(DISTINCT sv.session_id) as sessions,
          count(DISTINCT sv.page_path) as unique_pages,
          max(sv.created_at) as last_seen
        FROM site_visits sv
        JOIN users u ON u.id = sv.user_id
        WHERE sv.created_at >= now() - interval '7 days' AND sv.user_id IS NOT NULL
        GROUP BY sv.user_id, u.full_name, u.email, u.role
        ORDER BY visits DESC
        LIMIT 10
      ) t
    ),

    -- Top UTM campaigns (30d)
    'top_utm_campaigns', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM (
        SELECT
          utm_campaign,
          COALESCE(utm_source, '') as utm_source,
          COALESCE(utm_medium, '') as utm_medium,
          count(*) as visits,
          count(DISTINCT session_id) as unique_sessions
        FROM site_visits
        WHERE created_at >= now() - interval '30 days' AND utm_campaign IS NOT NULL
        GROUP BY utm_campaign, utm_source, utm_medium
        ORDER BY visits DESC
        LIMIT 10
      ) t
    ),

    -- Bot classification by user agent (7d)
    'bot_by_agent', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM (
        SELECT
          user_agent,
          count(*) as hits,
          count(DISTINCT ip_hash) as unique_ips,
          count(DISTINCT page_path) as unique_pages,
          min(created_at) as first_seen,
          max(created_at) as last_seen,
          ARRAY(SELECT DISTINCT pp FROM unnest(array_agg(page_path)) pp LIMIT 5) as pages_visited
        FROM site_visits
        WHERE is_bot = true AND created_at >= now() - interval '7 days'
        GROUP BY user_agent
        ORDER BY hits DESC
        LIMIT 20
      ) t
    ),

    'suspicious_ips', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM (
        SELECT ip_hash, count(*) as hits, max(created_at) as last_seen,
               count(DISTINCT page_path) as unique_pages,
               bool_or(is_bot) as is_known_bot,
               max(country_code) as country_code,
               max(city_name) as city_name,
               (array_agg(user_agent ORDER BY created_at DESC))[1] as user_agent_sample
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
               country_code, city_name
        FROM site_visits
        WHERE is_bot = true AND created_at >= now() - interval '24 hours'
        ORDER BY created_at DESC LIMIT 20
      ) t
    )
  ) INTO result;
  RETURN result;
END;
$function$;