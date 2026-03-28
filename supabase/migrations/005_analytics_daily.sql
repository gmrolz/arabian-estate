-- Elite Homes — Daily analytics for trend chart
-- Run in Supabase SQL Editor after 004_analytics_accurate.sql

CREATE OR REPLACE FUNCTION public.get_analytics_daily(
  p_from_iso TIMESTAMPTZ,
  p_to_iso TIMESTAMPTZ
)
RETURNS TABLE (
  day_date DATE,
  unique_visits BIGINT,
  conversions BIGINT,
  total_views BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH daily AS (
    SELECT
      (created_at AT TIME ZONE 'UTC')::DATE AS d,
      event_type,
      COALESCE(
        NULLIF(TRIM(session_id), ''),
        NULLIF(TRIM(payload->>'session_id'), ''),
        'legacy_' || id::TEXT
      ) AS session_key
    FROM public.analytics_events
    WHERE created_at >= p_from_iso
      AND created_at <= p_to_iso
      AND event_type IN ('view', 'lead')
  )
  SELECT
    daily.d AS day_date,
    COUNT(DISTINCT CASE WHEN daily.event_type = 'view' THEN daily.session_key END)::BIGINT AS unique_visits,
    COUNT(DISTINCT CASE WHEN daily.event_type = 'lead' THEN daily.session_key END)::BIGINT AS conversions,
    COUNT(*) FILTER (WHERE daily.event_type = 'view')::BIGINT AS total_views
  FROM daily
  GROUP BY daily.d
  ORDER BY daily.d;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_analytics_daily(TIMESTAMPTZ, TIMESTAMPTZ) TO anon;
GRANT EXECUTE ON FUNCTION public.get_analytics_daily(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
