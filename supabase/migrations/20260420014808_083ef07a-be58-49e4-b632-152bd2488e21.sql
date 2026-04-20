CREATE OR REPLACE FUNCTION public.search_profiles(
  p_country_name text DEFAULT NULL::text,
  p_city_slug text DEFAULT NULL::text,
  p_city_slugs text[] DEFAULT NULL::text[],
  p_category text DEFAULT NULL::text,
  p_gender text DEFAULT NULL::text,
  p_search text DEFAULT NULL::text,
  p_service_slug text DEFAULT NULL::text,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0,
  p_service_slugs text[] DEFAULT NULL::text[]
)
RETURNS TABLE(
  id uuid, display_name text, age integer, city text, city_slug text, category text,
  gender text, slug text, pricing_from numeric, is_featured boolean, highlight_tier text,
  highlight_expires_at timestamp with time zone, bio text, has_whatsapp boolean,
  created_at timestamp with time zone, languages text[], tier_rank integer,
  effective_sort_key bigint, image_paths text, service_count bigint
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _limit INT := LEAST(GREATEST(p_limit, 1), 100);
  _offset INT := GREATEST(p_offset, 0);
  _service_id UUID;
  _service_ids UUID[];
  _service_ids_count INT := 0;
  _sanitized TEXT;
BEGIN
  -- Resolve single service slug to ID if provided
  IF p_service_slug IS NOT NULL AND p_service_slug <> '' THEN
    SELECT s.id INTO _service_id FROM services s WHERE s.slug = p_service_slug AND s.is_active = true;
    IF _service_id IS NULL THEN
      RETURN;
    END IF;
  END IF;

  -- Resolve multi-service slugs to IDs (AND semantics: profile must have ALL)
  IF p_service_slugs IS NOT NULL AND array_length(p_service_slugs, 1) IS NOT NULL THEN
    SELECT array_agg(s.id), count(*)::int
      INTO _service_ids, _service_ids_count
    FROM services s
    WHERE s.slug = ANY(p_service_slugs) AND s.is_active = true;

    -- If any requested slug didn't resolve, return empty (strict AND match)
    IF _service_ids_count IS NULL OR _service_ids_count <> array_length(p_service_slugs, 1) THEN
      RETURN;
    END IF;
  END IF;

  -- Sanitize search input
  IF p_search IS NOT NULL AND p_search <> '' THEN
    _sanitized := left(regexp_replace(p_search, '[%_\\(),."'']', '', 'g'), 100);
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
    (_service_id IS NULL OR EXISTS (
      SELECT 1 FROM profile_services ps2 WHERE ps2.profile_id = ep.id AND ps2.service_id = _service_id
    ))
    AND (
      _service_ids IS NULL
      OR (
        SELECT count(DISTINCT ps3.service_id)
        FROM profile_services ps3
        WHERE ps3.profile_id = ep.id AND ps3.service_id = ANY(_service_ids)
      ) = _service_ids_count
    )
    AND (p_country_name IS NULL OR ep.country ILIKE p_country_name)
    AND (p_city_slug IS NULL OR ep.city_slug = p_city_slug)
    AND (p_city_slugs IS NULL OR array_length(p_city_slugs, 1) IS NULL OR ep.city_slug = ANY(p_city_slugs))
    AND (p_category IS NULL OR ep.category ILIKE p_category)
    AND (p_gender IS NULL OR ep.gender ILIKE p_gender)
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
$function$;