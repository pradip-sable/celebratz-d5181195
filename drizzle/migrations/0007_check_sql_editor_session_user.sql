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
    OR session_user IN ('postgres', 'supabase_admin')
    OR COALESCE(public.has_role(auth.uid(), 'admin'::public.app_role), false)
$function$;

REVOKE ALL ON FUNCTION public.is_privileged_caller() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_privileged_caller() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_privileged_caller() TO authenticated;