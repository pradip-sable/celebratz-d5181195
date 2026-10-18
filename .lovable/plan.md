# Listing photo storage and media-write function (backend only)

Vendors can upload listing photos to their own storage folder and save the photo set (order, cover, alt text) in one step. A live listing stays live when its photos change. No UI changes.

## 1. Storage bucket
- Create a public bucket `listing-media` with a 5 MB limit and these allowed file types: image/jpeg, image/png, image/webp. Allowed types are set on the bucket when it is created. If the bucket tool can't set them, a later migration sets `allowed_mime_types` on that one bucket row only.
- Migration with policies on `storage.objects`, scoped to `bucket_id = 'listing-media'`:
  - SELECT: public, open to anon and authenticated.
  - INSERT, UPDATE, DELETE: authenticated users only, and only where `(storage.foldername(name))[1] = auth.uid()::text`. UPDATE also checks this with `WITH CHECK`.
  - No other write policies.

## 2. Atomic replace function (same migration)
- `public.replace_listing_media(_listing_id uuid, _media jsonb)`: SECURITY INVOKER, `search_path = public`, plpgsql.
  - Deletes the listing's `listing_media` rows, then inserts one row per array element. Each row gets `storage_path`, `type`, and `alt_text`, and `position` comes from the element's place in the array.
  - It runs as one statement, so it is one transaction: if any insert fails, the delete is rolled back too.
  - Because it is SECURITY INVOKER, the existing listing_media RLS and grants (SELECT, INSERT, DELETE) still apply to the caller. No UPDATE grant is added.
  - `REVOKE EXECUTE ... FROM PUBLIC, anon` and `GRANT EXECUTE ... TO authenticated`.
- This is the only change to the database tables or functions, beyond the storage policies above.

## 3. `setListingMedia` in `src/lib/vendor.functions.ts`
- Uses `requireSupabaseAuth` and zod: `{ listingId: uuid, media: array(max 10) of { storage_path: string max 500, type: literal "image" default "image", alt_text?: string max 200 } }`.
- Ownership check: load the listing's `vendor:vendors!inner(owner_id)` and reject unless `owner_id === context.userId`. This is stricter than updateListing's check, which relies on RLS alone.
- Path check: each `storage_path` must either start with `https://` and parse as a URL, or be a bucket path whose first segment is `context.userId`. Paths containing `..` or a leading `/` are rejected.
- Calls `context.supabase.rpc("replace_listing_media", { _listing_id, _media })`.
- It never touches `listings.status`. Returns `{ ok: true }`.

## 4. `getListingForEdit`
- Adds `listing_media(id, storage_path, type, position, alt_text)` to its select. Nothing else in that function changes.

## After the migration
- Regenerate the database types so the new rpc is typed.
- Live checks while signed in as a vendor:
  - Uploading to your own folder works, and uploading to another user's folder is refused.
  - `setListingMedia` replaces the photos in the given order.
  - A bad path is rejected, and the existing photos stay in place.
  - A live listing's status doesn't change.
