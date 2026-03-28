# Analytics Setup

## 1. Run migrations in Supabase

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project
2. Go to **SQL Editor** → **New query**
3. Run `001_schema.sql` first (creates `analytics_events` table)
4. Run `006_analytics_reset.sql` (adds functions)

## 2. Reset analytics (start fresh from today)

Run `007_reset_analytics_now.sql` in Supabase SQL Editor to clear all analytics data.

## 3. What gets tracked

| Event        | When                          |
|-------------|--------------------------------|
| **view**    | Card enters viewport (50% visible) |
| **photo_view** | Image visible in carousel (50% in view) |
| **cta_whatsapp** | User clicks WhatsApp |
| **cta_call** | User clicks Call |
| **lead**    | First CTA click per session (1 per session) |

## 4. Dashboard metrics

- **Website visitors** = unique sessions that viewed any card
- **CTA clicks** = total WhatsApp + Call clicks (with breakdown)
- **Cards to conversion** = avg card views per lead
- **Images per visitor** = avg gallery views per session
- **CTR** = CTA clicks / card views
- **Location visits** = visits per area (New Capital, New Cairo, etc.)
