-- Demo users
INSERT INTO auth.users (id, email, raw_user_meta_data, email_confirmed_at, created_at, updated_at, last_sign_in_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'demo.customer@celebratz.test', '{"full_name":"Aarav Mehta","account_type":"customer"}'::jsonb, now(), now(), now(), now()),
  ('22222222-2222-2222-2222-222222222222', 'demo.vendor@celebratz.test', '{"full_name":"Priya Sharma","account_type":"vendor"}'::jsonb, now(), now(), now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'demo.admin@celebratz.test', '{"full_name":"Celebratz Admin","account_type":"admin"}'::jsonb, now(), now(), now(), now())
ON CONFLICT (id) DO NOTHING;

-- Demo vendors
INSERT INTO public.vendors (id, owner_id, business_name, about, contact_phone, contact_email, area_id, address, status)
SELECT 'a0000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Royal Gardens Banquets', 'Elegant banquet halls and marriage gardens in Pune with in-house catering and valet parking.', '+91 98765 43210', 'bookings@royalgardens.example', a.id, '123 MG Road, Pune', 'approved'
FROM public.areas a WHERE a.slug = 'camp';

INSERT INTO public.vendors (id, owner_id, business_name, about, contact_phone, contact_email, area_id, address, status)
SELECT 'a0000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'Shutterbug Weddings', 'Candid wedding photography and cinematic films across Pune.', '+91 98234 56789', 'hello@shutterbug.example', a.id, 'Studio 7, Koregaon Park, Pune', 'approved'
FROM public.areas a WHERE a.slug = 'koregaon-park';

INSERT INTO public.vendors (id, owner_id, business_name, about, contact_phone, contact_email, area_id, address, status)
SELECT 'a0000000-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'Spice Route Catering', 'Multi-cuisine catering with veg, non-veg and Jain options.', '+91 98123 45678', 'orders@spiceroute.example', a.id, 'Baner, Pune', 'approved'
FROM public.areas a WHERE a.slug = 'baner';

INSERT INTO public.vendors (id, owner_id, business_name, about, contact_phone, contact_email, area_id, address, status)
SELECT 'a0000000-0000-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222', 'Bloom & Bow Decor', 'Floral, theme and mandap decoration for weddings and celebrations.', '+91 98345 67890', 'design@bloombow.example', a.id, 'Kalyani Nagar, Pune', 'approved'
FROM public.areas a WHERE a.slug = 'kalyani-nagar';

INSERT INTO public.vendors (id, owner_id, business_name, about, contact_phone, contact_email, area_id, address, status)
SELECT 'a0000000-0000-0000-0000-000000000005', '22222222-2222-2222-2222-222222222222', 'BeatBlast DJs', 'Professional DJ and sound for weddings, sangeets and corporate events.', '+91 98456 78901', 'dj@beatblast.example', a.id, 'Wakad, Pune', 'approved'
FROM public.areas a WHERE a.slug = 'wakad';

INSERT INTO public.vendors (id, owner_id, business_name, about, contact_phone, contact_email, area_id, address, status)
SELECT 'a0000000-0000-0000-0000-000000000006', '22222222-2222-2222-2222-222222222222', 'Pandit Ramesh Joshi', 'Experienced Hindi and Marathi pandit for weddings, griha pravesh and satyanarayan pujas.', '+91 98567 89012', 'pandit.ramesh@example.com', a.id, 'Kothrud, Pune', 'approved'
FROM public.areas a WHERE a.slug = 'kothrud';

-- Listings
INSERT INTO public.listings (id, vendor_id, category_id, title, slug, description, area_id, address, price_from, price_unit, capacity_min, capacity_max, status, availability_updated_at)
SELECT 'b0000000-0000-0000-0000-000000000001', v.id, c.id, 'Royal Gardens Banquet Hall', 'royal-gardens-banquet-hall', 'A grand air-conditioned banquet hall in Camp with capacity up to 800 guests. In-house catering available; outside caterers permitted with corkage. Ample parking and bridal suite included.', a.id, '123 MG Road, Camp, Pune', 185000, 'per_day', 300, 800, 'live', now() - interval '2 days'
FROM public.vendors v, public.categories c, public.areas a
WHERE v.business_name = 'Royal Gardens Banquets' AND c.slug = 'venues' AND a.slug = 'camp';

INSERT INTO public.listings (id, vendor_id, category_id, title, slug, description, area_id, address, price_from, price_unit, capacity_min, capacity_max, status, availability_updated_at)
SELECT 'b0000000-0000-0000-0000-000000000002', v.id, c.id, 'The Fern Resort Lawn', 'the-fern-resort-lawn', 'Beautiful outdoor lawn attached to a boutique resort in Koregaon Park. Ideal for sunset weddings and engagement parties. Capacity 200-500.', a.id, 'Koregaon Park, Pune', 245000, 'per_day', 200, 500, 'live', now() - interval '5 days'
FROM public.vendors v, public.categories c, public.areas a
WHERE v.business_name = 'Royal Gardens Banquets' AND c.slug = 'venues' AND a.slug = 'koregaon-park';

INSERT INTO public.listings (id, vendor_id, category_id, title, slug, description, area_id, address, price_from, price_unit, capacity_min, capacity_max, status, availability_updated_at)
SELECT 'b0000000-0000-0000-0000-000000000003', v.id, c.id, 'Shutterbug Cinematic Wedding Package', 'shutterbug-cinematic-wedding-package', 'Full-day candid photography + cinematic highlight film. Two senior photographers, one videographer, drone add-on available. Delivered within 30 days.', a.id, 'Koregaon Park, Pune', 95000, 'per_event', NULL, NULL, 'live', now() - interval '1 day'
FROM public.vendors v, public.categories c, public.areas a
WHERE v.business_name = 'Shutterbug Weddings' AND c.slug = 'photography' AND a.slug = 'koregaon-park';

INSERT INTO public.listings (id, vendor_id, category_id, title, slug, description, area_id, address, price_from, price_unit, capacity_min, capacity_max, status, availability_updated_at)
SELECT 'b0000000-0000-0000-0000-000000000004', v.id, c.id, 'Spice Route Premium Thali', 'spice-route-premium-thali', 'North Indian and Maharashtrian thali with live counters. Vegetarian, non-vegetarian and Jain options. Minimum 100 guests.', a.id, 'Baner, Pune', 650, 'per_plate', 100, 2000, 'live', now() - interval '3 days'
FROM public.vendors v, public.categories c, public.areas a
WHERE v.business_name = 'Spice Route Catering' AND c.slug = 'catering' AND a.slug = 'baner';

INSERT INTO public.listings (id, vendor_id, category_id, title, slug, description, area_id, address, price_from, price_unit, capacity_min, capacity_max, status, availability_updated_at)
SELECT 'b0000000-0000-0000-0000-000000000005', v.id, c.id, 'Bloom & Bow Floral Mandap', 'bloom-bow-floral-mandap', 'Elegant floral mandap with matching stage and entrance décor. Includes setup and teardown. Custom themes available.', a.id, 'Kalyani Nagar, Pune', 85000, 'per_event', NULL, NULL, 'live', now() - interval '4 days'
FROM public.vendors v, public.categories c, public.areas a
WHERE v.business_name = 'Bloom & Bow Decor' AND c.slug = 'decoration' AND a.slug = 'kalyani-nagar';

INSERT INTO public.listings (id, vendor_id, category_id, title, slug, description, area_id, address, price_from, price_unit, capacity_min, capacity_max, status, availability_updated_at)
SELECT 'b0000000-0000-0000-0000-000000000006', v.id, c.id, 'BeatBlast Wedding DJ Package', 'beatblast-wedding-dj-package', '4-hour Bollywood and EDM set with premium sound, lights and one MC. Equipment included; extendable to 6 hours.', a.id, 'Wakad, Pune', 35000, 'per_event', NULL, NULL, 'live', now() - interval '6 days'
FROM public.vendors v, public.categories c, public.areas a
WHERE v.business_name = 'BeatBlast DJs' AND c.slug = 'dj-music' AND a.slug = 'wakad';

INSERT INTO public.listings (id, vendor_id, category_id, title, slug, description, area_id, address, price_from, price_unit, capacity_min, capacity_max, status, availability_updated_at)
SELECT 'b0000000-0000-0000-0000-000000000007', v.id, c.id, 'Pandit Ramesh Joshi — Hindu Wedding Rituals', 'pandit-ramesh-joshi-hindu-wedding', 'Complete Hindu wedding rituals in Hindi and Marathi. Includes pre-wedding pujas, haldi, sangeet blessings and griha pravesh.', a.id, 'Kothrud, Pune', 12000, 'per_event', NULL, NULL, 'live', now() - interval '7 days'
FROM public.vendors v, public.categories c, public.areas a
WHERE v.business_name = 'Pandit Ramesh Joshi' AND c.slug = 'pandit' AND a.slug = 'kothrud';

-- Listing attributes
INSERT INTO public.listing_attributes (listing_id, field_key, value)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'capacity', '800'),
  ('b0000000-0000-0000-0000-000000000001', 'venue_type', '"Banquet Hall"'),
  ('b0000000-0000-0000-0000-000000000001', 'indoor_outdoor', '"Indoor"'),
  ('b0000000-0000-0000-0000-000000000001', 'parking', 'true'),
  ('b0000000-0000-0000-0000-000000000001', 'catering_policy', '"Both"'),
  ('b0000000-0000-0000-0000-000000000001', 'ac_available', 'true'),
  ('b0000000-0000-0000-0000-000000000002', 'capacity', '500'),
  ('b0000000-0000-0000-0000-000000000002', 'venue_type', '"Lawn"'),
  ('b0000000-0000-0000-0000-000000000002', 'indoor_outdoor', '"Outdoor"'),
  ('b0000000-0000-0000-0000-000000000002', 'parking', 'true'),
  ('b0000000-0000-0000-0000-000000000002', 'catering_policy', '"Outside allowed"'),
  ('b0000000-0000-0000-0000-000000000002', 'ac_available', 'false'),
  ('b0000000-0000-0000-0000-000000000003', 'coverage_type', '"Both"'),
  ('b0000000-0000-0000-0000-000000000003', 'hours_included', '10'),
  ('b0000000-0000-0000-0000-000000000003', 'delivery_days', '30'),
  ('b0000000-0000-0000-0000-000000000004', 'cuisine_types', '["North Indian","Maharashtrian","Chinese"]'),
  ('b0000000-0000-0000-0000-000000000004', 'food_types', '["Vegetarian","Non-Vegetarian","Jain"]'),
  ('b0000000-0000-0000-0000-000000000004', 'min_guests', '100'),
  ('b0000000-0000-0000-0000-000000000005', 'styles', '["Floral","Mandap","Stage"]'),
  ('b0000000-0000-0000-0000-000000000005', 'setup_included', 'true'),
  ('b0000000-0000-0000-0000-000000000006', 'genres', '["Bollywood","EDM","Retro"]'),
  ('b0000000-0000-0000-0000-000000000006', 'equipment_included', 'true'),
  ('b0000000-0000-0000-0000-000000000006', 'hours_included', '4'),
  ('b0000000-0000-0000-0000-000000000007', 'ceremony_types', '["Hindu","Griha Pravesh","Satyanarayan"]'),
  ('b0000000-0000-0000-0000-000000000007', 'languages', '["Hindi","Marathi","Sanskrit"]'),
  ('b0000000-0000-0000-0000-000000000007', 'rituals_included', 'true');

-- Listing event types
INSERT INTO public.listing_event_types (listing_id, event_type_id)
SELECT 'b0000000-0000-0000-0000-000000000001', et.id FROM public.event_types et WHERE et.slug IN ('wedding','engagement','corporate','birthday');
INSERT INTO public.listing_event_types (listing_id, event_type_id)
SELECT 'b0000000-0000-0000-0000-000000000002', et.id FROM public.event_types et WHERE et.slug IN ('wedding','engagement','naming-ceremony');
INSERT INTO public.listing_event_types (listing_id, event_type_id)
SELECT 'b0000000-0000-0000-0000-000000000003', et.id FROM public.event_types et WHERE et.slug IN ('wedding','engagement');
INSERT INTO public.listing_event_types (listing_id, event_type_id)
SELECT 'b0000000-0000-0000-0000-000000000004', et.id FROM public.event_types et WHERE et.slug IN ('wedding','engagement','corporate','birthday','naming-ceremony');
INSERT INTO public.listing_event_types (listing_id, event_type_id)
SELECT 'b0000000-0000-0000-0000-000000000005', et.id FROM public.event_types et WHERE et.slug IN ('wedding','engagement','birthday');
INSERT INTO public.listing_event_types (listing_id, event_type_id)
SELECT 'b0000000-0000-0000-0000-000000000006', et.id FROM public.event_types et WHERE et.slug IN ('wedding','engagement','corporate','birthday');
INSERT INTO public.listing_event_types (listing_id, event_type_id)
SELECT 'b0000000-0000-0000-0000-000000000007', et.id FROM public.event_types et WHERE et.slug IN ('wedding','naming-ceremony');

-- Availability (next 60 days)
INSERT INTO public.availability (listing_id, date, state)
SELECT 'b0000000-0000-0000-0000-000000000001', d, (CASE WHEN random() < 0.2 THEN 'booked' WHEN random() < 0.5 THEN 'tentative' ELSE 'available' END)::public.availability_state
FROM generate_series(current_date, current_date + interval '60 days', interval '1 day') d;

INSERT INTO public.availability (listing_id, date, state)
SELECT 'b0000000-0000-0000-0000-000000000002', d, (CASE WHEN random() < 0.15 THEN 'booked' WHEN random() < 0.4 THEN 'tentative' ELSE 'available' END)::public.availability_state
FROM generate_series(current_date, current_date + interval '60 days', interval '1 day') d;

INSERT INTO public.availability (listing_id, date, state)
SELECT 'b0000000-0000-0000-0000-000000000003', d, (CASE WHEN random() < 0.25 THEN 'booked' ELSE 'available' END)::public.availability_state
FROM generate_series(current_date, current_date + interval '60 days', interval '1 day') d;

INSERT INTO public.availability (listing_id, date, state)
SELECT 'b0000000-0000-0000-0000-000000000004', d, (CASE WHEN random() < 0.1 THEN 'booked' ELSE 'available' END)::public.availability_state
FROM generate_series(current_date, current_date + interval '60 days', interval '1 day') d;

INSERT INTO public.availability (listing_id, date, state)
SELECT 'b0000000-0000-0000-0000-000000000005', d, (CASE WHEN random() < 0.2 THEN 'booked' ELSE 'available' END)::public.availability_state
FROM generate_series(current_date, current_date + interval '60 days', interval '1 day') d;

INSERT INTO public.availability (listing_id, date, state)
SELECT 'b0000000-0000-0000-0000-000000000006', d, (CASE WHEN random() < 0.3 THEN 'booked' ELSE 'available' END)::public.availability_state
FROM generate_series(current_date, current_date + interval '60 days', interval '1 day') d;

INSERT INTO public.availability (listing_id, date, state)
SELECT 'b0000000-0000-0000-0000-000000000007', d, (CASE WHEN random() < 0.15 THEN 'booked' ELSE 'available' END)::public.availability_state
FROM generate_series(current_date, current_date + interval '60 days', interval '1 day') d;

-- Sample reviews
INSERT INTO public.reviews (listing_id, customer_id, rating, body, event_date, status)
VALUES
  ('b0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 5, 'The hall was beautiful and the staff very cooperative. Parking was a huge plus.', current_date - interval '45 days', 'approved'),
  ('b0000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 4, 'Great candid shots and the highlight film was lovely. Delivery took a bit longer than promised.', current_date - interval '60 days', 'approved'),
  ('b0000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 5, 'Food was excellent and the Jain options were appreciated by our guests.', current_date - interval '30 days', 'approved'),
  ('b0000000-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 4, 'DJ kept the dance floor full. Sound system was top notch.', current_date - interval '20 days', 'approved');

-- Listing media placeholders
INSERT INTO public.listing_media (listing_id, storage_path, type, position, alt_text)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80', 'image', 0, 'Royal Gardens banquet hall interior'),
  ('b0000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80', 'image', 0, 'Outdoor resort lawn setup'),
  ('b0000000-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1520854221256-17451cc330e7?w=800&q=80', 'image', 0, 'Wedding photography couple portrait'),
  ('b0000000-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1555244162-803834f70033?w=800&q=80', 'image', 0, 'Catering spread with Indian dishes'),
  ('b0000000-0000-0000-0000-000000000005', 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80', 'image', 0, 'Floral mandap decoration'),
  ('b0000000-0000-0000-0000-000000000006', 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=800&q=80', 'image', 0, 'DJ setup with lights'),
  ('b0000000-0000-0000-0000-000000000007', 'https://images.unsplash.com/photo-1606293459339-9b0f7be207c4?w=800&q=80', 'image', 0, 'Hindu wedding ceremony rituals');
