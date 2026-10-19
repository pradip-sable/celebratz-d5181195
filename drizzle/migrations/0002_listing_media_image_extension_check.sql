DROP POLICY IF EXISTS "listing-media own folder insert" ON storage.objects;
DROP POLICY IF EXISTS "listing-media own folder update" ON storage.objects;

CREATE POLICY "listing-media own folder insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'listing-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND lower(name) ~ '\.(jpe?g|png|webp)$'
);

CREATE POLICY "listing-media own folder update" ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'listing-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'listing-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND lower(name) ~ '\.(jpe?g|png|webp)$'
);