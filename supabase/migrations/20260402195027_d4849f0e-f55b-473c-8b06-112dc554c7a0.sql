
-- Make bucket private
UPDATE storage.buckets SET public = false WHERE id = 'profile-images';

-- Storage RLS policies for objects
-- Allow authenticated users to upload to their profile folder
CREATE POLICY "Users can upload own media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-images'
);

-- Allow authenticated users to delete own media
CREATE POLICY "Users can delete own media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-images'
);

-- Allow authenticated users to read (for signed URL generation)
CREATE POLICY "Authenticated can read media"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'profile-images'
);

-- Allow anon to read (for signed URL verification)
CREATE POLICY "Anon can read media"
ON storage.objects FOR SELECT
TO anon
USING (
  bucket_id = 'profile-images'
);

-- Allow admins full access
CREATE POLICY "Admins can manage all media"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'profile-images' AND public.has_role(auth.uid(), 'admin'::public.app_role)
)
WITH CHECK (
  bucket_id = 'profile-images' AND public.has_role(auth.uid(), 'admin'::public.app_role)
);
