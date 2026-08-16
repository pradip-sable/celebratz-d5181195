# Celebratz — Phase 1 Structure Plan

A mobile-first marketplace for discovering and comparing celebration venues/services in Pune. Lead-generation model: no checkout, no payments. Backend on Lovable Cloud (database, auth, storage, server functions).

## Sitemap

Public (no login):
- `/` Home — search bar (Pune area, event type, date), 6 category tiles, 5 event-type tiles, featured listings
- `/search` Results — card grid + filter bottom sheet (area, event type, date, category, budget, capacity), sort
- `/listing/$slug` Detail — gallery, description, category-specific specs, pricing, availability calendar (Available/Tentative/Booked + "Last updated X days ago"), reviews, sticky "Request to Book" / "Enquire" bar
- `/category/$slug` and `/events/$slug` — pre-filtered browse landing pages (own SEO metadata)
- `/auth` — Google, email, phone OTP; account-type choice (customer/vendor) on signup
- `/for-vendors` — vendor pitch + signup entry

Customer (`/account/*`, gated):
- `/account` Bookings & Enquiries (status timeline), `/account/wishlist`, `/account/reviews` (incl. pending review prompts), `/account/profile` (phone verification lives here too)

Vendor (`/vendor/*`, gated + approval-aware):
- `/vendor` Overview (leads, views, listing status), `/vendor/listings`, `/vendor/listings/new`, `/vendor/listings/$id/edit` (category-adaptive form), `/vendor/leads` (accept/decline/respond), `/vendor/calendar/$listingId` (tap-to-cycle availability), `/vendor/profile`
- Pending-approval state: vendor can build listings but they aren't publicly visible

Admin (`/admin/*`, role-gated):
- `/admin` queue of pending vendors/listings, `/admin/listings`, `/admin/categories`, `/admin/users`, `/admin/requests`

Mobile bottom nav: Home, Search, Bookings, Wishlist, Profile. Vendors get a separate nav set.

## Database schema (main tables)

- `profiles` — id (= auth user), full_name, email, phone, phone_verified_at, avatar_url, account_type (customer | vendor)
- `user_roles` — user_id, role enum (customer | vendor | admin); roles never on profiles
- `categories` — slug, name, icon, sort_order, is_active (rows seeded, admin-manageable → new categories need no rebuild)
- `category_fields` — category_id, key, label, field_type (number/enum/multi/bool/text), options[], unit, is_filterable, sort_order — drives both the vendor form and filters for any future category
- `event_types` — slug, name (Wedding, Birthday, Engagement, Naming Ceremony, Corporate)
- `areas` — Pune neighborhoods (Koregaon Park, Baner, Kothrud, Viman Nagar, Hadapsar, Wakad…), city field for later expansion
- `vendors` — owner_id → profiles, business_name, about, contact_phone/email, area_id, status (pending | approved | rejected), reviewed_by/at, rejection_reason
- `listings` — vendor_id, category_id, title, slug, description, area_id, address, price_from, price_unit (per_day | per_plate | per_event | per_hour), capacity_min/max, status (draft | pending | live | paused | rejected), rating_avg, review_count, availability_updated_at
- `listing_attributes` — listing_id, field_key, value (jsonb) — category-specific specs, queryable for filters
- `listing_event_types` — join table (listing ↔ event type)
- `listing_media` — listing_id, storage path, type (image | video), position, alt text
- `availability` — listing_id, date, state (available | tentative | booked), unique(listing_id, date); absence = unknown/available
- `requests` — listing_id, customer_id, vendor_id, kind (booking_request | enquiry), event_date, visit_date/time, message, guest_count, status (new | accepted | declined | closed), consent_at, phone_snapshot
- `request_messages` — optional lightweight vendor↔customer notes on a request
- `reviews` — listing_id, customer_id, request_id (nullable), rating 1-5, body, event_date, status, created_at; `review_media`
- `wishlists` — customer_id, listing_id, unique pair
- Notifications table for vendor lead alerts (in-app; email later)

Security: RLS everywhere. Public read only for `status = 'live'` listings and their media/attributes/availability/reviews. Vendors read/write only their own rows. Customers read only their own requests/wishlist/reviews. Admin access via `has_role(auth.uid(), 'admin')` security-definer function. Explicit grants on every table.

## Key flows

Customer: browse → filter → listing detail → tap Request/Enquire → single-screen form → if not signed in, auth prompt inline; if phone unverified, OTP step → consent text shown → submit → request appears in My Bookings as "Sent"; vendor accept/decline updates status. After event date passes, a review prompt appears in the app.

Vendor: signup as vendor → business profile → status pending (visible banner) → admin approves → create listing (category picks the field set) → upload media → submit for review → live → manage calendar (tap a date to cycle Available → Tentative → Booked, stamping `availability_updated_at`) → receive leads → accept/decline with a note.

Admin: pending vendor queue → view business details → approve/reject with reason → listing moderation → category & field management → user and request oversight.

## Design direction

Warm celebratory palette: deep teal base, soft gold accent, blush support; a display serif for headings paired with a clean sans for body. Card-based, generous radii, large tap targets, bottom sheets over sidebars, mobile-first throughout. All colors as semantic tokens in `src/styles.css` — no generic blue SaaS look.

## Sample data

Seeded via migration INSERTs: ~18-24 listings across all 6 categories in real Pune areas with plausible pricing (banquet halls ₹1.2-3.5L/day, catering ₹450-1,200/plate, photography ₹60k-2.5L/event, decor ₹35k-1.5L, DJ ₹25k-80k, pandit ₹5k-21k), realistic reviews, and partially filled availability calendars. Demo vendor + customer accounts so dashboards aren't empty.

## Things to decide / recommendations

1. **Phone OTP needs an SMS provider.** Built-in auth supports Google and email out of the box; SMS OTP requires a third-party account (MSG91/Twilio, and India needs DLT registration). Recommendation for Phase 1: ship Google + email auth, and treat phone verification as its own step that we can wire to a real SMS provider when you have credentials — with a dev-mode bypass until then. Alternative: skip OTP and just collect a phone number with consent.
2. **"Request to Book" vs "Enquire" are near-identical** in a no-checkout model. Recommendation: one form, two intents stored on the record — booking request requires an event date, enquiry doesn't. Keeps the UI honest without duplicate flows.
3. **Availability trust.** Vendor-maintained calendars go stale. The "last updated" stamp helps; I'd also suggest hiding calendar dates older than ~30 days behind "Check with vendor" rather than showing possibly-wrong "Available".
4. **Reviews without verified attendance** invite fake reviews. Recommendation: only allow a review when the customer has an accepted request whose event date has passed; admin moderation queue for the rest.
5. **Vendor notification channel.** Leads are worthless if vendors don't see them. Phase 1 = in-app + email. Confirm email is acceptable (WhatsApp is out of scope per brief).
6. **Pricing display** — "starting price" units differ per category (per plate vs per day). I'll store a unit and render it explicitly so comparisons aren't misleading.
7. **Unspecified:** vendor self-serve signup or admin-invited only? Multiple listings per vendor (assuming yes)? Do you want a contact/about page and basic legal pages (privacy/terms) since you're collecting phone numbers and sharing them with vendors — I'd recommend including at least a privacy page in Phase 1.
