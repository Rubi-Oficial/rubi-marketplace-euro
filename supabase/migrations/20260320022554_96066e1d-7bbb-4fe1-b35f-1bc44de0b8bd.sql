CREATE POLICY "Users can read their referrals"
ON public.users
FOR SELECT
TO authenticated
USING (referred_by_user_id = auth.uid());