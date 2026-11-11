CREATE OR REPLACE FUNCTION public.is_privileged_caller()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT
    COALESCE(auth.role(), '') = 'service_role'
    OR COALESCE((NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'), '') = 'service_role'
    OR COALESCE(current_setting('request.jwt.claim.role', true), '') = 'service_role'
    OR COALESCE(current_setting('role', true), '') IN ('postgres', 'supabase_admin')
    OR COALESCE(public.has_role(auth.uid(), 'admin'::public.app_role), false)
$function$;

REVOKE ALL ON FUNCTION public.is_privileged_caller() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_privileged_caller() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_privileged_caller() TO authenticated;

CREATE OR REPLACE FUNCTION public.guard_vendor_moderation_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF public.is_privileged_caller() THEN
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

CREATE OR REPLACE FUNCTION public.guard_listing_moderation_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF public.is_privileged_caller() THEN
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

    IF pg_trigger_depth() <= 1 THEN
      NEW.rating_avg := OLD.rating_avg;
      NEW.review_count := OLD.review_count;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.guard_package_moderation_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF public.is_privileged_caller() THEN
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
    NEW.rejection_reason := OLD.rejection_reason;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.protect_listing_featured_flag()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.is_featured = true AND NOT public.is_privileged_caller() THEN
      NEW.is_featured := false;
    END IF;
  ELSIF NEW.is_featured IS DISTINCT FROM OLD.is_featured
        AND NOT public.is_privileged_caller() THEN
    NEW.is_featured := OLD.is_featured;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.guard_request_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  target_vendor_id uuid;
  requested_status public.request_status;
BEGIN
  IF public.is_privileged_caller() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF (NEW.listing_id IS NULL) = (NEW.package_id IS NULL) THEN
      RAISE EXCEPTION 'A request must target exactly one listing or package';
    END IF;

    IF NEW.listing_id IS NOT NULL THEN
      SELECT l.vendor_id INTO target_vendor_id
      FROM public.listings AS l
      WHERE l.id = NEW.listing_id;
    ELSE
      SELECT p.vendor_id INTO target_vendor_id
      FROM public.packages AS p
      WHERE p.id = NEW.package_id;
    END IF;

    IF target_vendor_id IS NULL THEN
      RAISE EXCEPTION 'Request target was not found';
    END IF;

    IF NEW.vendor_id IS NOT NULL AND NEW.vendor_id IS DISTINCT FROM target_vendor_id THEN
      RAISE EXCEPTION 'Request vendor does not own the selected target';
    END IF;

    NEW.vendor_id := target_vendor_id;
    NEW.status := 'new'::public.request_status;
    RETURN NEW;
  END IF;

  requested_status := NEW.status;
  NEW := OLD;
  NEW.status := requested_status;
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.guard_request_fields() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.guard_request_fields() FROM anon;
REVOKE ALL ON FUNCTION public.guard_request_fields() FROM authenticated;

CREATE TRIGGER guard_request_fields
BEFORE INSERT OR UPDATE ON public.requests
FOR EACH ROW EXECUTE FUNCTION public.guard_request_fields();