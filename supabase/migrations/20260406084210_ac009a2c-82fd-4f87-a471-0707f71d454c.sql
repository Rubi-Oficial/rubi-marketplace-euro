
-- Drop the existing permissive UPDATE policy
DROP POLICY IF EXISTS "Users can update own record" ON public.users;

-- Create a restricted UPDATE policy that only allows changing full_name and phone
-- All other sensitive fields (role, referral_code, referral_link, referred_by_user_id, google_auth_enabled, email) are frozen
CREATE POLICY "Users can update own record"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND role = (SELECT u.role FROM public.users u WHERE u.id = auth.uid())
  AND referral_code IS NOT DISTINCT FROM (SELECT u.referral_code FROM public.users u WHERE u.id = auth.uid())
  AND referral_link IS NOT DISTINCT FROM (SELECT u.referral_link FROM public.users u WHERE u.id = auth.uid())
  AND referred_by_user_id IS NOT DISTINCT FROM (SELECT u.referred_by_user_id FROM public.users u WHERE u.id = auth.uid())
  AND google_auth_enabled IS NOT DISTINCT FROM (SELECT u.google_auth_enabled FROM public.users u WHERE u.id = auth.uid())
  AND email IS NOT DISTINCT FROM (SELECT u.email FROM public.users u WHERE u.id = auth.uid())
);
