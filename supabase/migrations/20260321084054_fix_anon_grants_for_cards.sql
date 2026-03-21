-- Fix missing table-level and function-level grants for anonymous (public) access.
-- PostgreSQL evaluates table/function grants BEFORE RLS policies, so without these
-- grants the existing RLS policies ("Approved images are public",
-- "Anyone can insert leads") are unreachable for the anon role.
--
-- Symptoms fixed by this migration:
--   1. Profile card images not loading  → profile_images SELECT grant
--   2. WhatsApp button redirecting to profile page instead of opening WhatsApp
--      → get_profile_contact EXECUTE grant (RPC was failing with permission denied,
--        falling into the catch block which navigates to /perfil/:slug)
--   3. Lead tracking on WhatsApp card click silently failing → leads INSERT grant

-- 1. Allow anon/authenticated to read approved profile images (cards + profile pages)
GRANT SELECT ON public.profile_images TO anon, authenticated;

-- 2. Allow anon/authenticated to call the secure contact-lookup function
--    (SECURITY DEFINER: runs as owner, never exposes raw phone numbers)
GRANT EXECUTE ON FUNCTION public.get_profile_contact(uuid) TO anon, authenticated;

-- 3. Allow anon/authenticated to insert leads (click tracking)
--    Covered by existing RLS policy "Anyone can insert leads" — just needs table access
GRANT INSERT ON public.leads TO anon, authenticated;
