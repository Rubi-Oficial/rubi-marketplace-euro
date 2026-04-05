
-- Remove overly permissive storage policies that lack ownership checks
DROP POLICY IF EXISTS "Users can delete own media" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own media" ON storage.objects;
