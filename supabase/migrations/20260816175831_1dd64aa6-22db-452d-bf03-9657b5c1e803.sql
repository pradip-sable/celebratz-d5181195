ALTER TABLE public.requests ALTER COLUMN customer_id DROP NOT NULL;
COMMENT ON COLUMN public.requests.customer_id IS 'Authenticated customer, if known. Guest requests are allowed in Phase 1.';