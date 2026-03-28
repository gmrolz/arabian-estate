-- Elite Homes — Accurate analytics (database-driven aggregation)
-- Run in Supabase SQL Editor: Dashboard → SQL Editor → New query → paste & run

-- 1. Add session_id column for reliable, indexed queries
ALTER TABLE public.analytics_events 
  ADD COLUMN IF NOT EXISTS session_id TEXT;

-- 2. Backfill session_id from payload for existing view and lead events
UPDATE public.analytics_events
SET session_id = payload->>'session_id'
WHERE event_type IN ('view', 'lead')
  AND (session_id IS NULL OR session_id = '')
  AND payload->>'session_id' IS NOT NULL 
  AND payload->>'session_id' != '';

-- 3. Index for fast COUNT(DISTINCT session_id) and date filtering
CREATE INDEX IF NOT EXISTS idx_analytics_session_id ON public.analytics_events(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_analytics_created_type ON public.analytics_events(created_at, event_type);

-- 4. Database function: accurate aggregation (no JS, pure SQL)
CREATE OR REPLACE FUNCTION public.get_analytics_aggregates(
  p_from_iso TIMESTAMPTZ DEFAULT NULL,
  p_to_iso TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_unique_visits BIGINT;
  v_per_listing JSONB;
BEGIN
  -- Unique visits: distinct sessions that viewed any listing (1 per session)
  -- Use session_id column if present, else payload->>'session_id', else id for legacy
  SELECT COUNT(DISTINCT (
    COALESCE(
      NULLIF(TRIM(session_id), ''),
      NULLIF(TRIM(payload->>'session_id'), ''),
      'legacy_' || id::TEXT
    )
  ))::BIGINT
  INTO v_unique_visits
  FROM public.analytics_events
  WHERE event_type = 'view'
    AND (p_from_iso IS NULL OR created_at >= p_from_iso)
    AND (p_to_iso IS NULL OR created_at <= p_to_iso);

  -- Per-listing counts: view and lead = distinct sessions (1 per session, matches Google)
  WITH events AS (
    SELECT 
      listing_id,
      event_type,
      COALESCE(
        NULLIF(TRIM(session_id), ''),
        NULLIF(TRIM(payload->>'session_id'), ''),
        'legacy_' || id::TEXT
      ) AS session_key
    FROM public.analytics_events
    WHERE listing_id IS NOT NULL
      AND (p_from_iso IS NULL OR created_at >= p_from_iso)
      AND (p_to_iso IS NULL OR created_at <= p_to_iso)
      AND event_type IN ('view', 'cta_whatsapp', 'cta_call', 'photo_view', 'lead')
  )
  SELECT COALESCE(
    jsonb_object_agg(
      listing_id::TEXT,
      jsonb_build_object(
        'view', view_count,
        'cta_whatsapp', cta_whatsapp,
        'cta_call', cta_call,
        'photo_view', photo_view,
        'lead', lead_count
      )
    ),
    '{}'::JSONB
  )
  INTO v_per_listing
  FROM (
    SELECT 
      listing_id,
      COUNT(DISTINCT CASE WHEN event_type = 'view' THEN session_key END)::INT AS view_count,
      COUNT(*) FILTER (WHERE event_type = 'cta_whatsapp')::INT AS cta_whatsapp,
      COUNT(*) FILTER (WHERE event_type = 'cta_call')::INT AS cta_call,
      COUNT(*) FILTER (WHERE event_type = 'photo_view')::INT AS photo_view,
      COUNT(DISTINCT CASE WHEN event_type = 'lead' THEN session_key END)::INT AS lead_count
    FROM events
    GROUP BY listing_id
  ) sub;

  v_result := jsonb_build_object(
    'uniqueVisits', COALESCE(v_unique_visits, 0),
    'counts', COALESCE(v_per_listing, '{}'::JSONB)
  );

  RETURN v_result;
END;
$$;

-- Grant execute to anon and authenticated (admin uses anon)
GRANT EXECUTE ON FUNCTION public.get_analytics_aggregates(TIMESTAMPTZ, TIMESTAMPTZ) TO anon;
GRANT EXECUTE ON FUNCTION public.get_analytics_aggregates(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;

COMMENT ON FUNCTION public.get_analytics_aggregates IS 'Returns accurate analytics: uniqueVisits (distinct sessions) and per-listing counts. Views = 1 per session per listing.';
