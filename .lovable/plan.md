# Celebratz — Phase 1 Additions: Vendor Packages + Package Tiers

Two distinct features, deliberately named apart:
- **Packages** — a cross-listing bundle: a vendor combines 2+ of their own live listings (any categories) into one offering with its own name, description, and discounted indicative price. Same admin-approval lifecycle as listings.
- **Package Tiers** — optional pricing tiers *inside a single listing* (e.g. Basic / Premium / Deluxe), each with its own price and included-features list.


## Sitemap changes

Public:
- `/packages` — browse all live packages (card grid: cover or component photos, vendor, component category chips, "Package starting from ₹X", rolled-up rating)
- `/package/$slug` — package detail: gallery (cover image first, then component listings' photos), description, component listing cards with each one's own price + unit, indicative package price with the "final price depends on guest count and customization" note, derived availability calendar, read-only ratings rollup, single "Enquire about this package" CTA
- `/listing/$slug` — gains an "Also available as a package" cross-sell block linking to each live package containing that listing
- `/request` — accepts `packageId` in place of `listingId` (same single-screen form, same consent text naming the vendor)

Vendor (`/vendor/*`):
- `/vendor/packages` — list own packages with status badges, edit/pause actions
- `/vendor/packages/new` — create flow
- `/vendor/packages/$id/edit` — edit while draft/pending/paused
- Vendor overview gains a "Create Package" entry point, disabled with an explanatory note when the vendor has fewer than 2 live listings

Admin:
- `/admin` moderation queue gains a Packages tab (approve → live, reject with reason), reusing the existing listing-moderation patterns

Packages are intentionally **not** merged into `/search` results or filters in Phase 1.

## Schema changes

New `packages`:
- `vendor_id` → vendors, `name`, `slug` (unique), `description`, `cover_image` (nullable storage path), `discount_type` enum (`fixed_amount` | `percentage`), `discount_value` numeric, `status` reusing the existing `listing_status` enum (draft | pending | live | paused | rejected), `rejection_reason`, timestamps + updated_at trigger

New `package_listings`:
- `package_id` → packages (cascade), `listing_id` → listings, unique(package_id, listing_id)
- A validation trigger enforces: the listing's vendor matches the package's vendor, and a package cannot be submitted for approval or set live with fewer than 2 component listings

`requests`:
- add nullable `package_id` → packages
- make `listing_id` nullable and add a check constraint that exactly one of `listing_id` / `package_id` is set
- `vendor_id` continues to be set from whichever target was chosen, so vendor lead queries need no change

Access rules:
- Anyone may read live packages and their component links; vendors read/write only their own packages; admins see and moderate everything. Grants issued for `anon` (live reads), `authenticated`, and `service_role` on both new tables.

## Pricing

Base figure = sum of each component listing's `price_from` (components missing a price are excluded and flagged). Discount applied on top (fixed amount or percentage) yields "Package starting from ₹X". The package page always also shows each component's own price with its unit, plus a persistent note that the number is indicative and the final price depends on guest count and customization. No stored denormalized total — it is computed at read time so listing price edits stay in sync.

## Availability (derived, never manually maintained)

For a given date, across all component listings:
- any component `availability_updated_at` older than 30 days → "Check with vendor"
- any component Booked → Booked
- all components Available → Available
- otherwise → Tentative

## Media

No mandatory package upload. Gallery = optional cover image first, then component listings' photos in listing order. If no cover is set, the first component photo becomes the card image.

## Reviews

Read-only rollup: weighted average of component listings' `rating_avg` (weighted by their `review_count`) plus a total review count, with a line clarifying the ratings come from the individual services. No package-level review writing or moderation surface.

## Vendor flow

Vendor overview → Create Package → pick 2+ of their own live listings (grouped by category, with each listing's price/unit visible) → name + description → discount type and value → optional cover image → Submit for review → status `pending` (visible in `/vendor/packages`, not public) → admin approves → `live`, appears on `/packages` and in the cross-sell block on each component listing. Vendors can pause a live package; editing a live package returns it to `pending`.

## Admin flow

Packages tab in the moderation queue: sees package name, vendor, components with prices, computed indicative price, discount. Approve or reject with a reason. Rejected packages return to the vendor as editable drafts.

## Things I'd handle differently / worth knowing

1. **Component listing goes non-live.** A package can silently break when a vendor pauses or an admin rejects one of its listings. Recommendation: `/packages` and the package page only count live components; if a package drops below 2 live components it is automatically hidden from public browse (status untouched) and shown to the vendor with an "inactive — a component listing is not live" warning.
2. **Percentage discount sanity.** Cap `discount_value` at 0–90% for percentages and require the discounted total to stay above zero for fixed amounts, otherwise "starting from ₹0" packages appear.
3. **Mixed units make the summed figure genuinely rough** (a per-plate caterer plus a per-day venue). Beyond the note, the package card will label the price "indicative" rather than only "starting from", so the caveat travels with the number into browse listings.
4. **Requests reporting.** With `listing_id` now nullable, existing vendor/customer lead views and the admin requests view must render package leads too — those surfaces are updated in the same change rather than left to fail on a null listing join.

## Technical notes

- Availability and price rollups live in a new `src/lib/packages.functions.ts` (public server fns via the publishable client for browse/detail, `requireSupabaseAuth` fns for vendor CRUD), matching the existing `listings.functions.ts` / `vendor.functions.ts` split.
- `/packages` and `/package/$slug` are public SSR routes with their own `head()` metadata; vendor package routes live under `_authenticated/vendor/`.
- The `requests` change needs a migration that relaxes `listing_id` and adds the check constraint before `src/lib/requests.functions.ts` and the request form gain the package path.
