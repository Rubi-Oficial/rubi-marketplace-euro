
CREATE OR REPLACE FUNCTION public.search_profiles(
  p_country_name TEXT DEFAULT NULL,
  p_city_slug TEXT DEFAULT NULL,
  p_city_slugs TEXT[] DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_gender TEXT DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_service_slug TEXT DEFAULT NULL,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  display_name TEXT,
  age INT,
  city TEXT,
  city_slug TEXT,
  category TEXT,
  gender TEXT,
  slug TEXT,
  pricing_from NUMERIC,
  is_featured BOOLEAN,
  highlight_tier TEXT,
  highlight_expires_at TIMESTAMPTZ,
  bio TEXT,
  has_whatsapp BOOLEAN,
  created_at TIMESTAMPTZ,
  languages TEXT[],
  tier_rank INT,
  effective_sort_key BIGINT,
  image_paths TEXT,
  service_count BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _limit INT := LEAST(GREATEST(p_limit, 1), 100);
  _offset INT := GREATEST(p_offset, 0);
  _service_id UUID;
  _sanitized TEXT;
BEGIN
  -- Resolve service slug to ID if provided
  IF p_service_slug IS NOT NULL AND p_service_slug <> '' THEN
    SELECT s.id INTO _service_id FROM services s WHERE s.slug = p_service_slug AND s.is_active = true;
    IF _service_id IS NULL THEN
      RETURN; -- No matching service, return empty
    END IF;
  END IF;

  -- Sanitize search input
  IF p_search IS NOT NULL AND p_search <> '' THEN
    _sanitized := left(regexp_replace(p_search, '[%_\\(),.\"'']', '', 'g'), 100);
    IF _sanitized = '' THEN
      _sanitized := NULL;
    END IF;
  END IF;

  RETURN QUERY
  SELECT
    ep.id,
    ep.display_name,
    ep.age,
    ep.city,
    ep.city_slug,
    ep.category,
    ep.gender,
    ep.slug,
    ep.pricing_from,
    ep.is_featured,
    ep.highlight_tier,
    ep.highlight_expires_at,
    ep.bio,
    ep.has_whatsapp,
    ep.created_at,
    ep.languages,
    ep.tier_rank,
    ep.effective_sort_key,
    (
      SELECT string_agg(pi.storage_path, ',' ORDER BY pi.sort_order)
      FROM profile_images pi
      WHERE pi.profile_id = ep.id AND pi.moderation_status = 'approved'
    ) AS image_paths,
    (
      SELECT count(*)
      FROM profile_services ps
      WHERE ps.profile_id = ep.id
    ) AS service_count
  FROM eligible_profiles ep
  WHERE
    -- Service filter: profile must have the specified service
    (_service_id IS NULL OR EXISTS (
      SELECT 1 FROM profile_services ps2 WHERE ps2.profile_id = ep.id AND ps2.service_id = _service_id
    ))
    -- Country filter (case-insensitive)
    AND (p_country_name IS NULL OR ep.country ILIKE p_country_name)
    -- City slug filter (single)
    AND (p_city_slug IS NULL OR ep.city_slug = p_city_slug)
    -- City slugs filter (array)
    AND (p_city_slugs IS NULL OR array_length(p_city_slugs, 1) IS NULL OR ep.city_slug = ANY(p_city_slugs))
    -- Category filter
    AND (p_category IS NULL OR ep.category ILIKE p_category)
    -- Gender filter
    AND (p_gender IS NULL OR ep.gender ILIKE p_gender)
    -- Search filter
    AND (
      _sanitized IS NULL
      OR ep.display_name ILIKE '%' || _sanitized || '%'
      OR ep.city ILIKE '%' || _sanitized || '%'
      OR ep.category ILIKE '%' || _sanitized || '%'
    )
  ORDER BY
    ep.tier_rank DESC,
    ep.effective_sort_key DESC,
    ep.is_featured DESC,
    ep.created_at DESC,
    ep.id DESC
  LIMIT _limit
  OFFSET _offset;
END;
$$;

-- Grant execute to anon and authenticated (read-only, same data as eligible_profiles view)
GRANT EXECUTE ON FUNCTION public.search_profiles TO anon, authenticated;
