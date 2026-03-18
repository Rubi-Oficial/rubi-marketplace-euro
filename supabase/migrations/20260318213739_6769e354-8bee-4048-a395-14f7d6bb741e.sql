CREATE OR REPLACE FUNCTION public.get_referrer_id_by_code(_code text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT id FROM public.users WHERE referral_code = _code LIMIT 1
$$;