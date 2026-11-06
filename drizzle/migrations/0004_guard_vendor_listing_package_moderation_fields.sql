CREATE OR REPLACE FUNCTION public.guard_vendor_moderation_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  caller_role text := current_setting('request.jwt.claim.role', true);
  caller_is_admin boolean := public.has_role(auth.uid(), 'admin');
BEGIN
  IF caller_role = 'service_role' OR caller_is_admin THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.status := 'pending';
  ELSE
    NEW.status := OLD.status;
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.guard_vendor_moderation_fields() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.guard_vendor_moderation_fields() FROM anon;
REVOKE ALL ON FUNCTION public.guard_vendor_moderation_fields() FROM authenticated;

CREATE TRIGGER guard_vendor_moderation_fields
BEFORE INSERT OR UPDATE ON public.vendors
FOR EACH ROW EXECUTE FUNCTION public.guard_vendor_moderation_fields();

CREATE OR REPLACE FUNCTION public.guard_listing_moderation_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  caller_role text := current_setting('request.jwt.claim.role', true);
  caller_is_admin boolean := public.has_role(auth.uid(), 'admin');
BEGIN
  IF caller_role = 'service_role' OR caller_is_admin THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.status NOT IN ('draft'::public.listing_status, 'pending'::public.listing_status) THEN
      RAISE EXCEPTION 'Non-admin listings must be created as draft or pending';
    END IF;
    NEW.rating_avg := 0;
    NEW.review_count := 0;
  ELSE
    IF NEW.status IS DISTINCT FROM OLD.status
       AND NEW.status NOT IN ('draft'::public.listing_status, 'pending'::public.listing_status, 'paused'::public.listing_status) THEN
      RAISE EXCEPTION 'Non-admin listings cannot be set to live or rejected';
    END IF;

    -- Review-triggered rating recalculation updates listings from a nested trigger.
    -- Direct signed-in writes remain unable to alter these aggregate fields.
    IF pg_trigger_depth() <= 1 THEN
      NEW.rating_avg := OLD.rating_avg;
      NEW.review_count := OLD.review_count;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.guard_listing_moderation_fields() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.guard_listing_moderation_fields() FROM anon;
REVOKE ALL ON FUNCTION public.guard_listing_moderation_fields() FROM authenticated;

CREATE TRIGGER guard_listing_moderation_fields
BEFORE INSERT OR UPDATE ON public.listings
FOR EACH ROW EXECUTE FUNCTION public.guard_listing_moderation_fields();

CREATE OR REPLACE FUNCTION public.guard_package_moderation_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  caller_role text := current_setting('request.jwt.claim.role', true);
  caller_is_admin boolean := public.has_role(auth.uid(), 'admin');
BEGIN
  IF caller_role = 'service_role' OR caller_is_admin THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.status NOT IN ('draft'::public.listing_status, 'pending'::public.listing_status) THEN
      RAISE EXCEPTION 'Non-admin packages must be created as draft or pending';
    END IF;
    NEW.rejection_reason := NULL;
  ELSE
    IF NEW.status IS DISTINCT FROM OLD.status
       AND NEW.status NOT IN ('draft'::public.listing_status, 'pending'::public.listing_status, 'paused'::public.listing_status) THEN
      RAISE EXCEPTION 'Non-admin packages cannot be set to live or rejected';
    END IF;
    -- Vendor package edits may submit NULL here; preserve the admin-owned reason.
    NEW.rejection_reason := OLD.rejection_reason;
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.guard_package_moderation_fields() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.guard_package_moderation_fields() FROM anon;
REVOKE ALL ON FUNCTION public.guard_package_moderation_fields() FROM authenticated;

CREATE TRIGGER guard_package_moderation_fields
BEFORE INSERT OR UPDATE ON public.packages
FOR EACH ROW EXECUTE FUNCTION public.guard_package_moderation_fields();