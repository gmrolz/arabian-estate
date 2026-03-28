-- Elite Homes — Reset analytics (start fresh from today)
-- Run in Supabase SQL Editor to clear all analytics data.

TRUNCATE public.analytics_events RESTART IDENTITY;
