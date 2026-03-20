
-- Fix 1: Prevent admin role self-promotion via signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _referrer_id UUID;
  _role public.app_role;
  _code TEXT;
BEGIN
  -- Only allow client or professional from metadata, never admin
  _role := CASE
    WHEN (NEW.raw_user_meta_data ->> 'role') = 'professional' THEN 'professional'::app_role
    ELSE 'client'::app_role
  END;
  _code := substr(md5(random()::text), 1, 8);

  IF NEW.raw_user_meta_data ->> 'referral_code' IS NOT NULL THEN
    SELECT id INTO _referrer_id FROM public.users
    WHERE referral_code = NEW.raw_user_meta_data ->> 'referral_code';
  END IF;

  INSERT INTO public.users (id, role, full_name, email, referral_code, referral_link, referred_by_user_id, google_auth_enabled)
  VALUES (
    NEW.id, _role,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.email, ''),
    _code, '/cadastro?ref=' || _code,
    _referrer_id,
    (NEW.raw_app_meta_data ->> 'provider') = 'google'
  );

  IF _role = 'professional' THEN
    INSERT INTO public.profiles (user_id, display_name, status)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''), 'draft');
  END IF;

  RETURN NEW;
END;
$function$;

-- Fix 2: Add admin authorization checks to admin RPCs
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result json;
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'access denied';
  END IF;

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

CREATE OR REPLACE FUNCTION public.get_admin_sanity_checks()
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result json;
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'access denied';
  END IF;

  SELECT json_build_object(
    'users_without_role', (
      SELECT count(*) FROM users WHERE role IS NULL
    ),
    'orphan_profiles', (
      SELECT count(*) FROM profiles p
      WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = p.user_id)
    ),
    'active_subs_no_stripe', (
      SELECT count(*) FROM subscriptions
      WHERE status = 'active' AND stripe_subscription_id IS NULL
    ),
    'conversions_zero_commission', (
      SELECT count(*) FROM referral_conversions
      WHERE commission_amount = 0 AND status != 'rejected'
    ),
    'self_referrals', (
      SELECT count(*) FROM users
      WHERE referred_by_user_id IS NOT NULL AND referred_by_user_id = id
    ),
    'pending_subs_old', (
      SELECT count(*) FROM subscriptions
      WHERE status = 'pending' AND created_at < now() - interval '7 days'
    ),
    'professionals_without_profile', (
      SELECT count(*) FROM users u
      WHERE u.role = 'professional'
      AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = u.id)
    )
  ) INTO result;
  RETURN result;
END;
$function$;
