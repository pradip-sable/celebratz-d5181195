# Listings: featured flag, map link, category attributes

Adds three pieces of data to listings that the frontend already expects, plus the
read/write logic behind them. No UI in this pass.

## What changes

1. **Featured flag** — each listing can be marked as featured. Only an admin can
   set or clear it; a vendor saving their own listing can never change it, even
   if a request tries to.
2. **Google Maps link** — an optional map link on a listing, editable by the vendor.
3. **Category attributes** — a flexible set of category-specific values on a
   listing (for example veg type for catering, sound wattage for a DJ), keyed by
   the existing category field definitions. Vendor-editable.

Editing the map link or the category attributes does **not** send a live listing
back for review — they are treated like description and photo edits. Price,
tiers, title and category remain the only changes that trigger re-review.

The home page's featured row now shows admin-featured listings first (best rated
first) and, when there are fewer than six, fills the rest with the next
top-rated listings exactly as it does today.

## Technical details

### Migration

- `ALTER TABLE public.listings`
  - `is_featured boolean NOT NULL DEFAULT false`
  - `google_maps_url text NULL`
  - `category_attributes jsonb NULL DEFAULT '{}'::jsonb`
- Partial index on `is_featured` where `is_featured` and `status = 'live'` for the
  home query.
- Admin-only enforcement: RLS cannot restrict columns, and the existing
  `"Vendors can manage own listings"` policy is `FOR ALL`. Add a
  `BEFORE UPDATE` trigger (`SECURITY DEFINER`, `search_path = public`,
  `REVOKE EXECUTE ... FROM PUBLIC`) that forces
  `NEW.is_featured := OLD.is_featured` unless
  `public.has_role(auth.uid(), 'admin')` or the current role is `service_role`.
  A matching `BEFORE INSERT` branch forces `false` for non-admins.
- No new tables, so no new GRANT block; existing listings grants already cover
  the new columns.

### `src/lib/listings.functions.ts`

- Add `is_featured, google_maps_url, category_attributes` to the select lists in
  `searchListings` and `getHomeData` (and keep `getListingBySlug`'s `*` as is).
- `getHomeData` featured: one query ordered by
  `is_featured desc, rating_avg desc` limited to 6 over `status = 'live'`, which
  yields featured-first with top-rated fill in a single round trip. Effective
  price mapping stays unchanged.

### `src/lib/admin.functions.ts`

- New `setListingFeatured` server fn, same shape as `setPackageStatusAdmin`:
  `requireSupabaseAuth` → `assertAdmin` → validate
  `{ listingId: uuid, isFeatured: boolean }` → update `listings.is_featured`.

### `src/lib/vendor.functions.ts`

- `updateListing` / `createListing`: accept optional `google_maps_url` (trimmed
  URL or null) and `category_attributes` (record) and write them.
- Neither field participates in the `materialEdit` comparison, so status is
  untouched by those edits.
- `getListingForEdit` selects both new fields so the form can hydrate later.

### Types

`src/integrations/supabase/types.ts` is regenerated after the migration.
