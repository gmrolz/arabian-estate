-- Payment plan display fields (optional; used for "X% down · Y years" on cards)
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS payment_years INT,
  ADD COLUMN IF NOT EXISTS payment_down_pct INT;

COMMENT ON COLUMN public.listings.payment_years IS 'Number of years for installments (display on card)';
COMMENT ON COLUMN public.listings.payment_down_pct IS 'Down payment percent 0, 5, or 10 (display on card)';
