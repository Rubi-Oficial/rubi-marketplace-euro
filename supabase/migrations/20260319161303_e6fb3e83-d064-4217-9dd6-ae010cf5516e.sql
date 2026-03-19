
-- Table for profile videos
CREATE TABLE public.profile_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  thumbnail_path TEXT,
  duration_seconds INTEGER DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  moderation_status public.moderation_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.profile_videos ENABLE ROW LEVEL SECURITY;

-- Approved videos are public
CREATE POLICY "Approved videos are public"
  ON public.profile_videos FOR SELECT TO public
  USING (moderation_status = 'approved');

-- Owners can manage own videos
CREATE POLICY "Owners can manage own videos"
  ON public.profile_videos FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = profile_videos.profile_id AND profiles.user_id = auth.uid()
  ));

-- Admins can manage all videos
CREATE POLICY "Admins can manage all videos"
  ON public.profile_videos FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'));
