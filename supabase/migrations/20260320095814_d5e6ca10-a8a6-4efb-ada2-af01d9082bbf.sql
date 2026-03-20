
-- Fix 1: Restrict INSERT policy on users to only allow client/professional roles
ALTER POLICY "System can insert users" ON public.users
  WITH CHECK (auth.uid() = id AND role IN ('client'::app_role, 'professional'::app_role));

-- Fix 2: Drop the overly permissive referral summary policy that exposes PII
DROP POLICY "Users can read referral summary" ON public.users;

-- Fix 2b: Create a security definer function to return only safe referral data
CREATE OR REPLACE FUNCTION public.get_my_referrals()
RETURNS TABLE(id uuid, display_name text, role app_role, created_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id, u.full_name, u.role, u.created_at
  FROM public.users u
  WHERE u.referred_by_user_id = auth.uid()
  ORDER BY u.created_at DESC;
$$;
