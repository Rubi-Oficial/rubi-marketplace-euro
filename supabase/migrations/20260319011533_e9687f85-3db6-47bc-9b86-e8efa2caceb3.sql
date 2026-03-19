
-- Create storage bucket for profile images
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-images', 'profile-images', true);

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload own images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'profile-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete own images
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'profile-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read of profile images
CREATE POLICY "Public can read profile images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'profile-images');

-- Allow admins full access
CREATE POLICY "Admins can manage all profile images"
ON storage.objects FOR ALL TO authenticated
USING (
  bucket_id = 'profile-images'
  AND public.has_role(auth.uid(), 'admin')
);
