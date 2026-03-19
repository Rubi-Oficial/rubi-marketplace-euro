
CREATE OR REPLACE FUNCTION public.get_admin_sanity_checks()
 RETURNS json
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result json;
BEGIN
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
