REVOKE EXECUTE ON FUNCTION public.validate_package_listing() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_package_status() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_listing_tier_count() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_request_tier() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_review_change() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_listing_rating(uuid) FROM anon, authenticated;