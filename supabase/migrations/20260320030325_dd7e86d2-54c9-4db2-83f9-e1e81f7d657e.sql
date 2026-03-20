
-- 1. Create countries table
CREATE TABLE public.countries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  iso_code text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active countries are public"
  ON public.countries FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admins can manage countries"
  ON public.countries FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Create cities table
CREATE TABLE public.cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id uuid NOT NULL REFERENCES public.countries(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active cities are public"
  ON public.cities FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admins can manage cities"
  ON public.cities FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Seed countries
INSERT INTO public.countries (name, slug, iso_code, sort_order) VALUES
  ('Netherlands', 'netherlands', 'NL', 1),
  ('Spain', 'spain', 'ES', 2),
  ('Portugal', 'portugal', 'PT', 3),
  ('Germany', 'germany', 'DE', 4),
  ('France', 'france', 'FR', 5),
  ('Italy', 'italy', 'IT', 6),
  ('Belgium', 'belgium', 'BE', 7),
  ('United Kingdom', 'united-kingdom', 'GB', 8);

-- 4. Seed cities
-- Netherlands
INSERT INTO public.cities (country_id, name, slug, is_featured, sort_order)
SELECT c.id, v.name, v.slug, v.feat, v.ord
FROM public.countries c,
(VALUES
  ('Amsterdam', 'amsterdam', true, 1),
  ('Rotterdam', 'rotterdam', true, 2),
  ('Den Haag', 'den-haag', true, 3),
  ('Utrecht', 'utrecht', false, 4),
  ('Eindhoven', 'eindhoven', true, 5)
) AS v(name, slug, feat, ord)
WHERE c.iso_code = 'NL';

-- Spain
INSERT INTO public.cities (country_id, name, slug, is_featured, sort_order)
SELECT c.id, v.name, v.slug, v.feat, v.ord
FROM public.countries c,
(VALUES
  ('Madrid', 'madrid', true, 1),
  ('Barcelona', 'barcelona', true, 2),
  ('Valencia', 'valencia', false, 3),
  ('Seville', 'seville', false, 4),
  ('Malaga', 'malaga', false, 5)
) AS v(name, slug, feat, ord)
WHERE c.iso_code = 'ES';

-- Portugal
INSERT INTO public.cities (country_id, name, slug, is_featured, sort_order)
SELECT c.id, v.name, v.slug, v.feat, v.ord
FROM public.countries c,
(VALUES
  ('Lisbon', 'lisbon', true, 1),
  ('Porto', 'porto', true, 2),
  ('Faro', 'faro', false, 3),
  ('Braga', 'braga', false, 4),
  ('Coimbra', 'coimbra', false, 5)
) AS v(name, slug, feat, ord)
WHERE c.iso_code = 'PT';

-- Germany
INSERT INTO public.cities (country_id, name, slug, is_featured, sort_order)
SELECT c.id, v.name, v.slug, v.feat, v.ord
FROM public.countries c,
(VALUES
  ('Berlin', 'berlin', true, 1),
  ('Munich', 'munich', true, 2),
  ('Frankfurt', 'frankfurt', false, 3),
  ('Hamburg', 'hamburg', false, 4),
  ('Cologne', 'cologne', false, 5)
) AS v(name, slug, feat, ord)
WHERE c.iso_code = 'DE';

-- France
INSERT INTO public.cities (country_id, name, slug, is_featured, sort_order)
SELECT c.id, v.name, v.slug, v.feat, v.ord
FROM public.countries c,
(VALUES
  ('Paris', 'paris', true, 1),
  ('Lyon', 'lyon', false, 2),
  ('Marseille', 'marseille', false, 3),
  ('Nice', 'nice', true, 4),
  ('Toulouse', 'toulouse', false, 5)
) AS v(name, slug, feat, ord)
WHERE c.iso_code = 'FR';

-- Italy
INSERT INTO public.cities (country_id, name, slug, is_featured, sort_order)
SELECT c.id, v.name, v.slug, v.feat, v.ord
FROM public.countries c,
(VALUES
  ('Rome', 'rome', true, 1),
  ('Milan', 'milan', true, 2),
  ('Florence', 'florence', false, 3),
  ('Naples', 'naples', false, 4),
  ('Venice', 'venice', false, 5)
) AS v(name, slug, feat, ord)
WHERE c.iso_code = 'IT';

-- Belgium
INSERT INTO public.cities (country_id, name, slug, is_featured, sort_order)
SELECT c.id, v.name, v.slug, v.feat, v.ord
FROM public.countries c,
(VALUES
  ('Brussels', 'brussels', true, 1),
  ('Antwerp', 'antwerp', true, 2),
  ('Ghent', 'ghent', false, 3),
  ('Bruges', 'bruges', false, 4),
  ('Liège', 'liege', false, 5)
) AS v(name, slug, feat, ord)
WHERE c.iso_code = 'BE';

-- United Kingdom
INSERT INTO public.cities (country_id, name, slug, is_featured, sort_order)
SELECT c.id, v.name, v.slug, v.feat, v.ord
FROM public.countries c,
(VALUES
  ('London', 'london', true, 1),
  ('Manchester', 'manchester', true, 2),
  ('Birmingham', 'birmingham', false, 3),
  ('Edinburgh', 'edinburgh', false, 4),
  ('Liverpool', 'liverpool', false, 5)
) AS v(name, slug, feat, ord)
WHERE c.iso_code = 'GB';

-- 5. Add country_slug to profiles for consistency
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country_slug text;
