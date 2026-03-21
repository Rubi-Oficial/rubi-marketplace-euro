-- Restore SELECT grants on eligible_profiles view for anon and authenticated roles.
-- Previous migrations that recreated this view omitted the GRANT statement,
-- causing the view to be inaccessible to public queries and resulting in empty
-- profile listings on the site.
GRANT SELECT ON public.eligible_profiles TO anon, authenticated;
