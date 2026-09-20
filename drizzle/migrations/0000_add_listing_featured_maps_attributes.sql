ALTER TABLE public.listings
  ADD COLUMN is_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN google_maps_url text,
  ADD COLUMN category_attributes jsonb DEFAULT '{}'::jsonb;

CREATE INDEX listings_featured_live_rating_idx
  ON public.listings (is_featured DESC, rating_avg DESC)
  WHERE status = 'live';

CREATE OR REPLACE FUNCTION public.protect_listing_featured_flag()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role text := current_setting('request.jwt.claim.role', true);
  caller_is_admin boolean := public.has_role(auth.uid(), 'admin');
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.is_featured = true
       AND caller_role IS DISTINCT FROM 'service_role'
       AND NOT caller_is_admin THEN
      NEW.is_featured := false;
    END IF;
  ELSIF NEW.is_featured IS DISTINCT FROM OLD.is_featured
       AND caller_role IS DISTINCT FROM 'service_role'
       AND NOT caller_is_admin THEN
    NEW.is_featured := OLD.is_featured;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.protect_listing_featured_flag() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.protect_listing_featured_flag() FROM anon;
REVOKE ALL ON FUNCTION public.protect_listing_featured_flag() FROM authenticated;

CREATE TRIGGER protect_listing_featured_flag
BEFORE INSERT OR UPDATE OF is_featured ON public.listings
FOR EACH ROW EXECUTE FUNCTION public.protect_listing_featured_flag();