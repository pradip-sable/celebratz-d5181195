CREATE OR REPLACE FUNCTION public.get_vendor_contact_for_request(_request_id uuid)
RETURNS TABLE (business_name text, contact_phone text, contact_email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT v.business_name, v.contact_phone, v.contact_email
  FROM public.requests AS r
  JOIN public.vendors AS v ON v.id = r.vendor_id
  WHERE r.id = _request_id
    AND r.customer_id = auth.uid()
    AND r.status = 'accepted'::public.request_status;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_vendor_contact_for_request(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_vendor_contact_for_request(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_vendor_contact_for_request(uuid) TO authenticated;