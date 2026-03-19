
-- Add city_slug to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city_slug text;

-- Create services table
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0
);

-- Create profile_services junction table
CREATE TABLE public.profile_services (
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  PRIMARY KEY (profile_id, service_id)
);

-- RLS for services
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active services are public" ON public.services FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Admins can manage services" ON public.services FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS for profile_services
ALTER TABLE public.profile_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read profile_services" ON public.profile_services FOR SELECT TO public USING (true);
CREATE POLICY "Owners can manage own profile_services" ON public.profile_services FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = profile_services.profile_id AND profiles.user_id = auth.uid()));
CREATE POLICY "Admins can manage all profile_services" ON public.profile_services FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed services
INSERT INTO public.services (name, slug, sort_order) VALUES
  ('Dinner Date', 'dinner-date', 1),
  ('Events', 'events', 2),
  ('Travel Companion', 'travel-companion', 3),
  ('Social Company', 'social-company', 4),
  ('Massage', 'massage', 5),
  ('Wellness', 'wellness', 6),
  ('Premium Company', 'premium-company', 7);

-- Recreate eligible_profiles view with city_slug
DROP VIEW IF EXISTS public.eligible_profiles;
CREATE VIEW public.eligible_profiles AS
SELECT
  p.id, p.user_id, p.display_name, p.age, p.city, p.city_slug, p.country,
  p.category, p.slug, p.bio, p.languages, p.pricing_from,
  p.whatsapp, p.telegram, p.is_featured, p.featured_until,
  p.created_at, p.updated_at
FROM public.profiles p
WHERE p.status = 'approved'
  AND EXISTS (
    SELECT 1 FROM public.subscriptions s
    WHERE s.user_id = p.user_id AND s.status = 'active'
  );
