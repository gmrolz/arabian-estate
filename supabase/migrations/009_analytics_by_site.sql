-- Analytics filtered by site_id (for multi-site)

CREATE OR REPLACE FUNCTION public.get_analytics_aggregates(
  p_from_iso TIMESTAMPTZ DEFAULT NULL,
  p_to_iso TIMESTAMPTZ DEFAULT NULL,
  p_site_id BIGINT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_unique_visits BIGINT;
  v_counts JSONB;
  v_by_area JSONB;
BEGIN
  -- Unique visitors (filter by site: join listing for site_id, or use ae.site_id)
  SELECT COUNT(DISTINCT COALESCE(NULLIF(TRIM(ae.session_id), ''), ae.payload->>'session_id', 'legacy_' || ae.id::TEXT))::BIGINT
  INTO v_unique_visits
  FROM public.analytics_events ae
  LEFT JOIN public.listings l ON ae.listing_id = l.id
  WHERE ae.event_type IN ('view', 'cta_whatsapp', 'cta_call', 'photo_view', 'lead')
    AND (p_from_iso IS NULL OR ae.created_at >= p_from_iso)
    AND (p_to_iso IS NULL OR ae.created_at <= p_to_iso)
    AND (p_site_id IS NULL OR ae.site_id = p_site_id OR (ae.site_id IS NULL AND l.site_id = p_site_id));

  -- Per listing (only for site)
  SELECT COALESCE(jsonb_object_agg(lid::TEXT, jsonb_build_object(
    'view', v,
    'cta_whatsapp', w,
    'cta_call', c,
    'photo_view', p,
    'lead', l
  )), '{}'::JSONB)
  INTO v_counts
  FROM (
    SELECT ae.listing_id AS lid,
      COUNT(DISTINCT CASE WHEN ae.event_type = 'view' THEN COALESCE(NULLIF(TRIM(ae.session_id), ''), ae.payload->>'session_id', 'legacy_' || ae.id::TEXT) END)::INT AS v,
      COUNT(*) FILTER (WHERE ae.event_type = 'cta_whatsapp')::INT AS w,
      COUNT(*) FILTER (WHERE ae.event_type = 'cta_call')::INT AS c,
      COUNT(*) FILTER (WHERE ae.event_type = 'photo_view')::INT AS p,
      COUNT(DISTINCT CASE WHEN ae.event_type = 'lead' THEN COALESCE(NULLIF(TRIM(ae.session_id), ''), ae.payload->>'session_id', 'legacy_' || ae.id::TEXT) END)::INT AS l
    FROM public.analytics_events ae
    LEFT JOIN public.listings l ON ae.listing_id = l.id
    WHERE ae.listing_id IS NOT NULL
      AND (p_from_iso IS NULL OR ae.created_at >= p_from_iso)
      AND (p_to_iso IS NULL OR ae.created_at <= p_to_iso)
      AND (p_site_id IS NULL OR ae.site_id = p_site_id OR (ae.site_id IS NULL AND l.site_id = p_site_id))
      AND ae.event_type IN ('view', 'cta_whatsapp', 'cta_call', 'photo_view', 'lead')
    GROUP BY ae.listing_id
  ) sub;

  -- Per location (filter by site)
  SELECT COALESCE(jsonb_object_agg(area_slug, jsonb_build_object('visits', visits, 'leads', leads)), '{}'::JSONB)
  INTO v_by_area
  FROM (
    SELECT COALESCE(l.area_slug, 'new-capital') AS area_slug,
      COUNT(DISTINCT CASE WHEN ae.event_type = 'view' THEN COALESCE(NULLIF(TRIM(ae.session_id), ''), ae.payload->>'session_id', 'legacy_' || ae.id::TEXT) END)::INT AS visits,
      COUNT(DISTINCT CASE WHEN ae.event_type = 'lead' THEN COALESCE(NULLIF(TRIM(ae.session_id), ''), ae.payload->>'session_id', 'legacy_' || ae.id::TEXT) END)::INT AS leads
    FROM public.analytics_events ae
    LEFT JOIN public.listings l ON ae.listing_id = l.id
    WHERE ae.listing_id IS NOT NULL
      AND (p_from_iso IS NULL OR ae.created_at >= p_from_iso)
      AND (p_to_iso IS NULL OR ae.created_at <= p_to_iso)
      AND (p_site_id IS NULL OR ae.site_id = p_site_id OR (ae.site_id IS NULL AND l.site_id = p_site_id))
      AND ae.event_type IN ('view', 'lead')
    GROUP BY COALESCE(l.area_slug, 'new-capital')
  ) loc;

  RETURN jsonb_build_object(
    'uniqueVisits', COALESCE(v_unique_visits, 0),
    'counts', COALESCE(v_counts, '{}'::JSONB),
    'byArea', COALESCE(v_by_area, '{}'::JSONB)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_analytics_aggregates(TIMESTAMPTZ, TIMESTAMPTZ, BIGINT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_analytics_aggregates(TIMESTAMPTZ, TIMESTAMPTZ, BIGINT) TO authenticated;

-- Daily breakdown with site filter
CREATE OR REPLACE FUNCTION public.get_analytics_daily(
  p_from_iso TIMESTAMPTZ,
  p_to_iso TIMESTAMPTZ,
  p_site_id BIGINT DEFAULT NULL
)
RETURNS TABLE (day_date DATE, unique_visits BIGINT, conversions BIGINT, total_views BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH d AS (
    SELECT (ae.created_at AT TIME ZONE 'UTC')::DATE AS d,
      ae.event_type,
      COALESCE(NULLIF(TRIM(ae.session_id), ''), ae.payload->>'session_id', 'legacy_' || ae.id::TEXT) AS sk
    FROM public.analytics_events ae
    LEFT JOIN public.listings l ON ae.listing_id = l.id
    WHERE ae.created_at >= p_from_iso AND ae.created_at <= p_to_iso
      AND ae.event_type IN ('view', 'cta_whatsapp', 'cta_call', 'photo_view', 'lead')
      AND (p_site_id IS NULL OR ae.site_id = p_site_id OR (ae.site_id IS NULL AND l.site_id = p_site_id))
  )
  SELECT d.d,
    COUNT(DISTINCT d.sk)::BIGINT,
    COUNT(DISTINCT CASE WHEN d.event_type = 'lead' THEN d.sk END)::BIGINT,
    COUNT(*) FILTER (WHERE d.event_type = 'view')::BIGINT
  FROM d
  GROUP BY d.d
  ORDER BY d.d;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_analytics_daily(TIMESTAMPTZ, TIMESTAMPTZ, BIGINT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_analytics_daily(TIMESTAMPTZ, TIMESTAMPTZ, BIGINT) TO authenticated;
