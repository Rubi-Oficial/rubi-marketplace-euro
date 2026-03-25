-- Add Brazil as a country
INSERT INTO public.countries (name, slug, iso_code, sort_order)
VALUES ('Brasil', 'brasil', 'BR', 9);

-- Add major Brazilian cities
INSERT INTO public.cities (country_id, name, slug, is_featured, sort_order)
SELECT c.id, v.name, v.slug, v.feat, v.ord
FROM public.countries c,
(VALUES
  ('São Paulo',     'sao-paulo',     true,  1),
  ('Rio de Janeiro','rio-de-janeiro', true,  2),
  ('Belo Horizonte','belo-horizonte', true,  3),
  ('Curitiba',      'curitiba',      true,  4),
  ('Porto Alegre',  'porto-alegre',  false, 5),
  ('Brasília',      'brasilia',      false, 6),
  ('Salvador',      'salvador',      false, 7),
  ('Fortaleza',     'fortaleza',     false, 8),
  ('Recife',        'recife',        false, 9),
  ('Manaus',        'manaus',        false, 10)
) AS v(name, slug, feat, ord)
WHERE c.iso_code = 'BR';
