
CREATE OR REPLACE FUNCTION public.get_profile_contact(p_profile_id uuid)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'whatsapp', p.whatsapp,
    'telegram', p.telegram
  )
  FROM profiles p
  WHERE p.id = p_profile_id
    AND p.status = 'approved'
    AND EXISTS (
      SELECT 1 FROM subscriptions s
      WHERE s.user_id = p.user_id
        AND s.status = 'active'
    )
$$;
