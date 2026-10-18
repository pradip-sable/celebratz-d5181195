CREATE POLICY "listing-media own folder read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'listing-media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "listing-media own folder insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'listing-media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "listing-media own folder update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'listing-media' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'listing-media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "listing-media own folder delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'listing-media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE OR REPLACE FUNCTION public.replace_listing_media(_listing_id uuid, _media jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.listing_media WHERE listing_id = _listing_id;
  INSERT INTO public.listing_media (listing_id, storage_path, type, position, alt_text)
  SELECT _listing_id, e.value->>'storage_path', COALESCE(e.value->>'type', 'image'), (e.ordinality - 1)::int, NULLIF(e.value->>'alt_text', '')
  FROM jsonb_array_elements(COALESCE(_media, '[]'::jsonb)) WITH ORDINALITY AS e(value, ordinality);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.replace_listing_media(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.replace_listing_media(uuid, jsonb) TO authenticated;