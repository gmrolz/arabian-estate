-- Elite Homes — Analytics reset & rebuild (minimal, correct)
-- Run in Supabase SQL Editor. Uncomment TRUNCATE below to clear old data.

-- Optional: clear all analytics (uncomment to start fresh)
-- TRUNCATE public.analytics_events RESTART IDENTITY;

-- 1. Ensure columns
ALTER TABLE public.analytics_events ADD COLUMN IF NOT EXISTS session_id TEXT;
ALTER TABLE public.analytics_events ADD COLUMN IF NOT EXISTS ip TEXT;

-- 2. Simple aggregation: unique visits + per-listing counts
CREATE OR REPLACE FUNCTION public.get_analytics_aggregates(
  p_from_iso TIMESTAMPTZ DEFAULT NULL,
  p_to_iso TIMESTAMPTZ DEFAULT NULL
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
  -- Unique visitors = distinct sessions with ANY activity (1 per session)
  SELECT COUNT(DISTINCT COALESCE(NULLIF(TRIM(session_id), ''), payload->>'session_id', 'legacy_' || id::TEXT))::BIGINT
  INTO v_unique_visits
  FROM public.analytics_events
  WHERE event_type IN ('view', 'cta_whatsapp', 'cta_call', 'photo_view', 'lead')
    AND (p_from_iso IS NULL OR created_at >= p_from_iso)
    AND (p_to_iso IS NULL OR created_at <= p_to_iso);

  -- Per listing: view (1 per session), cta, photo_view, lead (1 per session)
  SELECT COALESCE(jsonb_object_agg(lid::TEXT, jsonb_build_object(
    'view', v,
    'cta_whatsapp', w,
    'cta_call', c,
    'photo_view', p,
    'lead', l
  )), '{}'::JSONB)
  INTO v_counts
  FROM (
    SELECT listing_id AS lid,
      COUNT(DISTINCT CASE WHEN event_type = 'view' THEN COALESCE(NULLIF(TRIM(session_id), ''), payload->>'session_id', 'legacy_' || id::TEXT) END)::INT AS v,
      COUNT(*) FILTER (WHERE event_type = 'cta_whatsapp')::INT AS w,
      COUNT(*) FILTER (WHERE event_type = 'cta_call')::INT AS c,
      COUNT(*) FILTER (WHERE event_type = 'photo_view')::INT AS p,
      COUNT(DISTINCT CASE WHEN event_type = 'lead' THEN COALESCE(NULLIF(TRIM(session_id), ''), payload->>'session_id', 'legacy_' || id::TEXT) END)::INT AS l
    FROM public.analytics_events
    WHERE listing_id IS NOT NULL
      AND (p_from_iso IS NULL OR created_at >= p_from_iso)
      AND (p_to_iso IS NULL OR created_at <= p_to_iso)
      AND event_type IN ('view', 'cta_whatsapp', 'cta_call', 'photo_view', 'lead')
    GROUP BY listing_id
  ) sub;

  -- Per location: visits = distinct sessions per area (1 per session per area)
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

GRANT EXECUTE ON FUNCTION public.get_analytics_aggregates(TIMESTAMPTZ, TIMESTAMPTZ) TO anon;
GRANT EXECUTE ON FUNCTION public.get_analytics_aggregates(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;

-- 3. Daily breakdown for trend chart
CREATE OR REPLACE FUNCTION public.get_analytics_daily(
  p_from_iso TIMESTAMPTZ,
  p_to_iso TIMESTAMPTZ
)
RETURNS TABLE (day_date DATE, unique_visits BIGINT, conversions BIGINT, total_views BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH d AS (
    SELECT (created_at AT TIME ZONE 'UTC')::DATE AS d,
      event_type,
      COALESCE(NULLIF(TRIM(session_id), ''), payload->>'session_id', 'legacy_' || id::TEXT) AS sk
    FROM public.analytics_events
    WHERE created_at >= p_from_iso AND created_at <= p_to_iso
      AND event_type IN ('view', 'cta_whatsapp', 'cta_call', 'photo_view', 'lead')
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

GRANT EXECUTE ON FUNCTION public.get_analytics_daily(TIMESTAMPTZ, TIMESTAMPTZ) TO anon;
GRANT EXECUTE ON FUNCTION public.get_analytics_daily(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
