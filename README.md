# Celebratz

I'm building "Celebratz" — a marketplace web app for discovering and comparing venues and services for celebrations in India, launching first in Pune. I'd like your help planning the structure before we build anything — please don't generate code yet, just help me think through the plan and flag anything unclear or missing.



THE CONCEPT

Celebratz helps people planning a wedding, birthday, engagement, naming ceremony, or corporate event find and compare venues and services in one place. Importantly: this is NOT a checkout/booking platform. Users search, check availability, compare pricing and reviews, and then either request a booking or send an enquiry — which notifies the vendor so they can follow up and finalize details (pricing negotiation, contracts, payment) outside the app. Venues especially are big-ticket enough that people want to visit and negotiate in person; smaller services may move toward in-app booking in a future phase, but not now.



USER ROLES

1. Customer — searches, browses listings, checks availability, requests bookings/enquiries, leaves reviews after their event date

2. Vendor (business owner) — lists their venue or service, manages their availability calendar, receives and responds to leads

3. Admin (me, for now) — manually approves new vendor listings before they go live, manages categories, oversees listings/users



PHASE 1 SCOPE — service categories (exactly these 6 for now, but structure the data model so more can be added later without rebuilding):

1. Venues (banquet halls, farmhouses, resorts, marriage gardens, hotels, terraces) — capacity, indoor/outdoor, parking, in-house vs outside catering allowed, AC/non-AC, price per day

2. Photography & Videography — coverage type, hours/day, delivery timeline, portfolio

3. Catering — cuisine types, veg/non-veg/Jain, price per plate, minimum guest count

4. Decoration — style specialties (floral/theme/balloon/mandap), sample themes, package pricing

5. DJ/Music/Live Band — genre, equipment included, hours included

6. Pandit/Priest — ceremony types supported (Hindu, Sikh, Christian, Muslim Nikah, etc.), languages, rituals included



Event types to tag every listing with: Wedding, Birthday, Engagement, Naming Ceremony, Corporate.



CORE FEATURES FOR PHASE 1



Home page: prominent search bar (location within Pune, event type, date), browse-by-category tiles for the 6 services, browse-by-event-type tiles, a few featured listings. No login required to browse.



Search results: card grid (photo, name, area, starting price, rating). Filters (location/area, event type, date, category, budget/capacity) shown as a bottom sheet on mobile, not a sidebar.



Listing detail page: photo/video gallery, description, category-specific details, pricing, an availability calendar showing Available/Tentative/Booked per date with a visible "Last updated X days ago" indicator, reviews and ratings, and two clear buttons: "Request to Book" and "Enquire."



Request to Book / Enquire flow: a single-screen form (date, preferred visit date/time, short message). If the user isn't logged in or hasn't verified their phone number yet, trigger that here — not earlier in the flow. Show explicit consent text before submitting: "Your name and phone number will be shared with [Vendor Name] so they can contact you about this request."



Authentication: Google sign-in, email sign-in, and phone number sign-in with OTP verification. Separate account types for customers and vendors. Every user needs a verified phone number before their first enquiry/booking request can be submitted, regardless of which method they signed up with — if it's missing (e.g., they used Google), prompt for it at that point.



Customer dashboard: My Bookings/Enquiries, Wishlist, My Reviews, Profile.



Vendor dashboard: Overview, My Listings, Add/Edit Listing (form fields adapt to the category selected), Leads/Enquiries received (accept/decline), and a simple tap-to-toggle availability calendar (Available/Tentative/Booked) with a visible last-updated timestamp.



Admin panel: queue of vendors pending approval (approve/reject), manage all listings, manage categories, view all users and bookings/enquiries.



Reviews: once an event date has passed, prompt the customer to rate 1–5 stars, leave a written review, and optionally add photos.



DESIGN DIRECTION

Clean, modern, warm and celebratory but professional — avoid a generic blue SaaS look. Consider a palette like soft gold, blush, and deep teal. Card-based layouts, large clear buttons, fully mobile-first (most users will be on phones). A bottom navigation bar on mobile with Home, Search, My Bookings, Wishlist, Profile.



DATA FOR NOW

Since we're validating the product before onboarding real vendors, please populate the app with realistic sample data — a handful of believable venues and vendors across all 6 categories, in real Pune neighborhoods, with plausible pricing — rather than generic placeholder text, so I can properly evaluate the UI and flows.



EXPLICITLY OUT OF SCOPE FOR NOW

No online payments. No combining multiple services into one bundled booking. No verified-vendor badges. No WhatsApp OTP. No number-masking for calls. No native mobile app — responsive web only.



Please propose: the full page/sitemap structure, the database schema (main tables and how they relate), and the key user flows for customer, vendor, and admin — and flag anything in this brief that's ambiguous or that you'd recommend handling differently before we move to building.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/20371e15-072f-4ffe-9088-ffcba4206ecc).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
