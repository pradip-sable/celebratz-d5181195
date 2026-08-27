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

## Package Tiers — schema

New `listing_tiers`:
- `listing_id` → listings (cascade), `name`, `description` (nullable), `price` numeric, `features` text[] (short "what's included" bullets), `sort_order`, `is_active` boolean default true, timestamps + updated_at trigger
- Tiers have **no** price unit of their own — they inherit the parent listing's `price_unit`
- Optional per listing, but never exactly one: a validation trigger rejects leaving a listing with a single active tier (0 = flat pricing, 2+ = tiered)
- Read access follows the parent listing (public read when the listing is live, vendor read/write for own listings, admin full); grants for `anon`, `authenticated`, `service_role`

`requests`:
- gains nullable `selected_tier_id` → listing_tiers
- check constraint: `selected_tier_id` may only be set when `listing_id` is set (never with `package_id`), and a trigger verifies the tier belongs to that listing

## Pricing (both features)

**Effective listing price** = lowest active tier price when the listing has tiers, else the stored `price_from`. Computed at read time everywhere it is shown — search cards, category/event pages, listing detail, and package sums — so editing a tier price can never leave a stale figure. Tiered listings show it as "From ₹X" with the listing's unit plus a "N tiers" hint on cards. Search budget filters use the same effective price, so min/max budget keeps behaving correctly for tiered listings (implemented as a database view or generated read column so filtering stays server-side rather than post-filtered in JS).

**Package (bundle) price**: base figure = sum of each component's *effective* price (lowest active tier if tiered, else `price_from`); a bundle always references a component listing as a whole and never pins one tier. Discount applied on top (fixed amount or percentage) yields "Package starting from ₹X". Components missing a price are excluded and flagged. The package page also shows each component's own price with its unit, plus a persistent note that the figure is indicative and the final price depends on guest count and customization. No stored denormalized total.

## Availability

Tiers: no change — one listing, one calendar; the calendar means the vendor is free that date at all, regardless of tier.

Packages — derived, never manually maintained. For a given date, across all component listings:

- any component `availability_updated_at` older than 30 days → "Check with vendor"
- any component Booked → Booked
- all components Available → Available
- otherwise → Tentative

## Media

No mandatory package upload. Gallery = optional cover image first, then component listings' photos in listing order. If no cover is set, the first component photo becomes the card image.

## Reviews

Read-only rollup: weighted average of component listings' `rating_avg` (weighted by their `review_count`) plus a total review count, with a line clarifying the ratings come from the individual services. No package-level review writing or moderation surface.

## Vendor flow

Packages: Vendor overview → Create Package → pick 2+ of their own live listings (grouped by category, with each listing's effective price/unit visible) → name + description → discount type and value → optional cover image → Submit for review → status `pending` (visible in `/vendor/packages`, not public) → admin approves → `live`, appears on `/packages` and in the cross-sell block on each component listing. Vendors can pause a live package; editing a live package returns it to `pending`.

Package Tiers: in the existing listing create/edit form, an optional "Package Tiers" section — add/remove tier rows, each with name, price (unit shown read-only from the listing), optional description, and an add/remove list of feature bullets, plus drag-free sort order and an active toggle. Leaving the section empty keeps flat `price_from` pricing exactly as today. Saving with exactly one tier is blocked inline ("add a second tier or remove this one").

## Customer flow

Listing detail with tiers: the single price block is replaced by tier comparison cards (name, price with the listing's unit, feature checklist, lowest tier marked "From"), each with a "Choose this tier" action that opens the existing merged Request/Enquire form with that tier pre-selected. Listings without tiers are unchanged.

Request/Enquire form: unchanged single-screen flow. When the target listing has tiers, it renders a selectable tier list — pre-selected from the tapped card, still changeable — and stores `selected_tier_id` on the request. Package enquiries never show tiers.

## Admin flow

Packages tab in the moderation queue: package name, vendor, components with prices, computed indicative price, discount. Approve or reject with a reason. Rejected packages return to the vendor as editable drafts. Tiers appear inline in the listing moderation view (name, price, features) so a reviewer sees what is being offered.

## Moderation rule for listing edits — decided (Option C)

One rule governs both the listing's own fields and its tiers:

- **Material changes send a live listing back to `pending`:** price (`price_from` or `price_unit`), title, category, and any tier change — adding, removing, renaming, reordering, activating/deactivating a tier, editing a tier price, or editing a tier's feature bullets.
- **Non-material changes stay live, no re-approval:** description, photos/media, address/area text, and other descriptive detail.

While a listing sits in `pending` after a material edit, the previously approved version stays publicly visible so the vendor never loses traffic mid-review; the pending version is what the admin sees in the queue. The vendor form states which edits will trigger re-approval before they save. Packages keep their existing rule (any edit on a live package returns it to `pending`), which is consistent with treating price and composition as material.


## Things I'd handle differently / worth knowing

1. **Component listing goes non-live.** A package can silently break when a vendor pauses or an admin rejects one of its listings. Recommendation: `/packages` and the package page only count live components; if a package drops below 2 live components it is automatically hidden from public browse (status untouched) and shown to the vendor with an "inactive — a component listing is not live" warning.
2. **Percentage discount sanity.** Cap `discount_value` at 0–90% for percentages and require the discounted total to stay above zero for fixed amounts, otherwise "starting from ₹0" packages appear.
3. **Mixed units make the summed figure genuinely rough** (a per-plate caterer plus a per-day venue). Beyond the note, the package card will label the price "indicative" rather than only "starting from", so the caveat travels with the number into browse listings.
4. **Requests reporting.** With `listing_id` now nullable and `selected_tier_id` added, existing vendor/customer lead views and the admin requests view must render package leads and show the chosen tier name — those surfaces are updated in the same change rather than left to fail on a null listing join.
5. **Deactivating a tier that a request points at.** `selected_tier_id` is kept as a historical reference, so tiers are soft-deactivated (`is_active = false`) rather than deleted when any request references them; the lead still shows the tier name the customer picked.
6. **`price_from` stays the source of truth for untiered listings** rather than being auto-overwritten by tier prices. Keeping one writable field and one computed read value avoids two numbers drifting apart; the vendor form greys out `price_from` while tiers are present and explains why.
7. **Features as `text[]` vs a child table.** An array is simpler and fine for display-only bullets; it just can't be filtered on later. If Phase 2 wants "filter by what's included", that becomes a structured amenities field, not a rework of tiers.

## Technical notes

- Package availability and both price rollups live in a new `src/lib/packages.functions.ts`; tier reads/writes extend `src/lib/listings.functions.ts` and `src/lib/vendor.functions.ts` (`getListingForEdit` / `updateListing` gain tier arrays, written in a transaction-style replace like the existing `listing_attributes` handling).
- Effective price is exposed through a database view (listing row + `effective_price_from`) so `searchListings` can keep filtering and ordering by price in SQL.
- `/packages` and `/package/$slug` are public SSR routes with their own `head()` metadata; vendor package routes live under `_authenticated/vendor/`.
- One migration covers: `packages`, `package_listings`, `listing_tiers`, the `requests` changes (`listing_id` nullable, `package_id`, `selected_tier_id`, check constraints), validation triggers, grants, RLS policies, and the effective-price view — applied before the UI work that depends on it.

