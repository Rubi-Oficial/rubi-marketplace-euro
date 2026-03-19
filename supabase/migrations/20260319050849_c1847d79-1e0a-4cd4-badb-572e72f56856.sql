CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
 RETURNS json
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total_users', (SELECT count(*) FROM users),
    'active_profiles', (SELECT count(*) FROM profiles WHERE status = 'approved'),
    'pending_profiles', (SELECT count(*) FROM profiles WHERE status = 'pending_review'),
    'active_subs', (SELECT count(*) FROM subscriptions WHERE status = 'active'),
    'problem_subs', (SELECT count(*) FROM subscriptions WHERE status IN ('past_due', 'expired')),
    'canceled_subs', (SELECT count(*) FROM subscriptions WHERE status = 'canceled'),
    'pending_subs', (SELECT count(*) FROM subscriptions WHERE status = 'pending'),
    'total_leads', (SELECT count(*) FROM leads),
    'total_clients', (SELECT count(*) FROM users WHERE role = 'client'),
    'unread_messages', (SELECT count(*) FROM contact_messages WHERE is_read = false),
    'total_messages', (SELECT count(*) FROM contact_messages),
    'gmv', (SELECT COALESCE(SUM(p.price), 0) FROM subscriptions s JOIN plans p ON p.id = s.plan_id WHERE s.status = 'active'),
    'pending_commissions', (SELECT COALESCE(SUM(commission_amount), 0) FROM referral_conversions WHERE status = 'pending'),
    'approved_commissions', (SELECT COALESCE(SUM(commission_amount), 0) FROM referral_conversions WHERE status = 'approved'),
    'paid_commissions', (SELECT COALESCE(SUM(commission_amount), 0) FROM referral_conversions WHERE status = 'paid'),
    'signups_7d', (SELECT count(*) FROM users WHERE created_at >= now() - interval '7 days'),
    'signups_30d', (SELECT count(*) FROM users WHERE created_at >= now() - interval '30 days'),
    'payments_7d', (SELECT count(*) FROM subscriptions WHERE status = 'active' AND starts_at >= now() - interval '7 days'),
    'payments_30d', (SELECT count(*) FROM subscriptions WHERE status = 'active' AND starts_at >= now() - interval '30 days'),
    'top_affiliates', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM (
        SELECT
          u.full_name as name,
          u.referral_code as code,
          COALESCE(rc.click_count, 0) as clicks,
          COALESCE(cv.conv_count, 0) as conversions,
          COALESCE(cv.total_commission, 0) as commission
        FROM users u
        LEFT JOIN (
          SELECT referrer_user_id, count(*) as click_count
          FROM referral_clicks GROUP BY referrer_user_id
        ) rc ON rc.referrer_user_id = u.id
        LEFT JOIN (
          SELECT referrer_user_id, count(*) as conv_count, SUM(commission_amount) as total_commission
          FROM referral_conversions GROUP BY referrer_user_id
        ) cv ON cv.referrer_user_id = u.id
        WHERE u.referral_code IS NOT NULL
          AND (COALESCE(rc.click_count, 0) > 0 OR COALESCE(cv.conv_count, 0) > 0)
        ORDER BY COALESCE(cv.total_commission, 0) DESC
        LIMIT 5
      ) t
    )
  ) INTO result;
  RETURN result;
END;
$function$;