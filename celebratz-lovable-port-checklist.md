# Celebratz — AI Studio → Lovable Port Checklist
*Everything verified during AI Studio review that needs handling when rebuilding each screen in the `celebratz-d5181195` repo. Organized by area — check the relevant section before porting each screen.*

---

## ⚠️ On features.md
AI Studio's self-written `features.md` is a useful **scope inventory**, but its implementation-status claims are not fully reliable — e.g. it claims package pricing is "never stored statically," which is false (see below). Treat it as a checklist of what to look for, not proof that something works correctly.

---

## 1. Packages (cross-listing bundles) — needs real rework, not a straight port
- AI Studio's actual runtime type (`ComboPackage`) stores `comboPrice`, `totalOriginalPrice`, `savingsAmount`, `savingsPercentage` as **static saved fields**. Lovable's real schema only stores `discount_type` + `discount_value` on `packages`, and computes price live via `computePackagePrice()` in `src/lib/pricing.ts`. **Do not port the static price fields — rewire to the existing Lovable function.**
- Field mapping needed: `title`→`name` (also need a `slug`, which `ComboPackage` doesn't have), `vendorId`→`vendor_id` (via `vendors` table), `includedListingIds`→rows in `package_listings` join table, `includedServices` (richly embedded array) → drop entirely, re-derive from joined listings at read time.
- Status enum mapping: AI Studio's `'active' | 'pending_approval' | 'paused'` → Lovable's `'draft' | 'pending' | 'live' | 'rejected'`. Not a 1:1 map — decide how `'paused'` maps (Lovable doesn't have a distinct paused state for packages; check `listing_status` enum before assuming).
- There's an unused, already-correctly-shaped `Package` interface in `types.ts` (matches real schema) — it's dead code, nothing constructs it. Ignore it or use it as a starting point, don't assume it's wired to anything.
- Real backend already enforces: min 2 live components (constraint trigger), same-vendor-only components (constraint trigger), auto-hide when below 2 live components. AI Studio's UI-level validation should be checked against these — the backend is stricter than what the UI alone can guarantee.

## 2. Package Tiers — closely aligned, should port cleanly
- `ListingTier` type (`listing_id`, `name`, `description`, `price`, `features`, `sort_order`, `is_active`) matches the real `listing_tiers` table closely. Low-risk area.
- Effective price logic (lowest active tier, else `price_from`) matches Lovable's `effectiveListingPrice()` — reuse the real function rather than reimplementing.
- Real backend enforces 0-or-2+ tiers via a constraint trigger — don't rely on UI validation alone.

## 3. Requests / Enquiries — closely aligned, should port cleanly
- `kind` (`booking_request`/`enquiry`), exactly-one-of `listingId`/`packageId`, `selectedTierId` only valid with `listingId`, `customerPhoneConfirm` — all match the real `requestSchema` in `requests.functions.ts`. Confirmed the package-enquiry flow does send `package_id` correctly.
- Check for and remove any leftover unused `requestType` field if it still exists alongside `kind` in some components — `kind` is the only field the backend accepts.
- Real backend also sets `consent_at` and `phone_snapshot` server-side — no UI change needed, just make sure the consent checkbox actually fires before submission.

## 4. Colors / Theming
- AI Studio now uses semantic classes (`bg-primary`, `bg-teal`, etc.) via a `data-theme` attribute with 3 palettes — the class *names* will match Lovable's existing convention directly.
- BUT Lovable's `styles.css` already has its own real token *values* (OKLCH), set before AI Studio existed. Porting means: pick which of the 3 AI-Studio palettes (or a hybrid) becomes final, then update Lovable's actual CSS variable values to match — not a fresh design decision, a value-reconciliation one.
- Category-identity colors (photography=sky, DJ/Music=purple, catering=emerald, decoration=rose, pandit=orange) are intentionally fixed regardless of palette — port these as literal fixed classes, not tokens.

## 5. Event Types
- Now 6, not 5: Wedding, Birthday, Engagement, Naming Ceremony, Corporate, **Reception** (confirmed intentional addition). Check whether Lovable's DB has an `event_type` enum that needs a migration to add `Reception`, or if it's a free-text field needing no schema change.

## 6. Auth Modal — do not port as-is
- AI Studio simulates Email+Password, Mobile+OTP, and Google OAuth. Real Phase 1 backend only has phone OTP via Twilio Verify. **Only port the phone-OTP path for now** — Email/Password and Google OAuth would create UI for auth methods that don't exist in the backend yet.

## 7. Features to EXCLUDE from the port entirely
- **Role-Based Demo Switcher** (instant Customer/Vendor/Admin toggle) — testing-only, real app determines role from the authenticated user's actual DB role.
- **India Expansion (8 Cities) admin roadmap** — unrequested scope addition, Phase 1 is Pune-only. Skip this screen.
- **Design Preferences Modal** (palette/layout/hero-style switcher) — Pradip's internal comparison tool, not a real user-facing feature. Exclude from production, or keep behind a dev-only route at most.
- Given the above, the 3 card layouts and 3 hero styles were comparison variants — confirm which single version of each is final before porting; don't assume all variants ship.

## 8. Legitimately ready to port as-described
- Live availability calendar (green/amber/red, staleness detection)
- Staleness indicators on listing cards ("Updated X days ago")
- Comparison bar/matrix (up to 4 listings)
- Wishlist, review history, post-event review nudge
- WhatsApp direct-chat launcher, native share dialog
- Admin approval queue, rejection-reason modal, featured toggle
- 24-hour edit lock + submission confirmation modal flow

---

*Update this file as more screens get reviewed — treat it as the running source of truth for port gotchas, not a one-time checklist.*
