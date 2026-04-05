-- Drop the 3 overly permissive SELECT policies on storage.objects
DROP POLICY IF EXISTS "Anon can read media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can read media" ON storage.objects;
DROP POLICY IF EXISTS "Public can read profile images" ON storage.objects;

-- Create a single SELECT policy that only allows access to approved media files
-- This checks that the file path exists in profile_images or profile_videos with approved status
CREATE POLICY "Approved media is readable"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'profile-images'
  AND (
    EXISTS (
      SELECT 1 FROM public.profile_images pi
      WHERE pi.storage_path = name
        AND pi.moderation_status = 'approved'
    )
    OR EXISTS (
      SELECT 1 FROM public.profile_videos pv
      WHERE pv.storage_path = name
        AND pv.moderation_status = 'approved'
    )
  )
);

-- Also allow profile owners to read their own files (any status, for dashboard preview)
CREATE POLICY "Owners can read own media"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'profile-images'
  AND (
    EXISTS (
      SELECT 1 FROM public.profile_images pi
      JOIN public.profiles p ON p.id = pi.profile_id
      WHERE pi.storage_path = name
        AND p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profile_videos pv
      JOIN public.profiles p ON p.id = pv.profile_id
      WHERE pv.storage_path = name
        AND p.user_id = auth.uid()
    )
  )
);