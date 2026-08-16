-- Enums
CREATE TYPE public.app_role AS ENUM ('customer', 'vendor', 'admin');
CREATE TYPE public.listing_status AS ENUM ('draft', 'pending', 'live', 'paused', 'rejected');
CREATE TYPE public.vendor_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.request_kind AS ENUM ('booking_request', 'enquiry');
CREATE TYPE public.request_status AS ENUM ('new', 'accepted', 'declined', 'closed');
CREATE TYPE public.review_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.price_unit AS ENUM ('per_day', 'per_plate', 'per_event', 'per_hour');
CREATE TYPE public.availability_state AS ENUM ('available', 'tentative', 'booked');

-- Profiles: extends auth.users
CREATE TABLE public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text,
    email text,
    phone text,
    phone_verified_at timestamptz,
    avatar_url text,
    account_type public.app_role NOT NULL DEFAULT 'customer',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Service role can manage profiles" ON public.profiles FOR ALL TO service_role USING (true) WITH CHECK (true);

-- User roles (separate table per security guidance)
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);
GRANT SELECT, INSERT, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage roles" ON public.user_roles FOR ALL TO service_role USING (true) WITH CHECK (true);

-- has_role security definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, account_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'account_type')::public.app_role, 'customer')
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'account_type')::public.app_role, 'customer')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Categories
CREATE TABLE public.categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text UNIQUE NOT NULL,
    name text NOT NULL,
    icon text,
    description text,
    sort_order int NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon;
GRANT SELECT ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are publicly readable" ON public.categories FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Category fields (adaptive forms/filters)
CREATE TABLE public.category_fields (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id uuid REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
    key text NOT NULL,
    label text NOT NULL,
    field_type text NOT NULL CHECK (field_type IN ('text', 'number', 'boolean', 'enum', 'multi')),
    options jsonb DEFAULT '[]'::jsonb,
    unit text,
    is_filterable boolean NOT NULL DEFAULT true,
    sort_order int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (category_id, key)
);
GRANT SELECT ON public.category_fields TO anon;
GRANT SELECT ON public.category_fields TO authenticated;
GRANT ALL ON public.category_fields TO service_role;
ALTER TABLE public.category_fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Category fields are publicly readable" ON public.category_fields FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can manage category fields" ON public.category_fields FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Event types
CREATE TABLE public.event_types (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text UNIQUE NOT NULL,
    name text NOT NULL,
    sort_order int NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true
);
GRANT SELECT ON public.event_types TO anon;
GRANT SELECT ON public.event_types TO authenticated;
GRANT ALL ON public.event_types TO service_role;
ALTER TABLE public.event_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Event types are publicly readable" ON public.event_types FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Admins can manage event types" ON public.event_types FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Areas (Pune neighborhoods now, expandable)
CREATE TABLE public.areas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text UNIQUE NOT NULL,
    name text NOT NULL,
    city text NOT NULL DEFAULT 'Pune',
    state text NOT NULL DEFAULT 'Maharashtra',
    country text NOT NULL DEFAULT 'India',
    sort_order int NOT NULL DEFAULT 0
);
GRANT SELECT ON public.areas TO anon;
GRANT SELECT ON public.areas TO authenticated;
GRANT ALL ON public.areas TO service_role;
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Areas are publicly readable" ON public.areas FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can manage areas" ON public.areas FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Vendors
CREATE TABLE public.vendors (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    business_name text NOT NULL,
    about text,
    contact_phone text,
    contact_email text,
    area_id uuid REFERENCES public.areas(id),
    address text,
    status public.vendor_status NOT NULL DEFAULT 'pending',
    reviewed_by uuid REFERENCES auth.users(id),
    reviewed_at timestamptz,
    rejection_reason text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.vendors TO authenticated;
GRANT ALL ON public.vendors TO service_role;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Vendors can read own vendor record" ON public.vendors FOR SELECT TO authenticated USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Vendors can update own record" ON public.vendors FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Admins can manage vendors" ON public.vendors FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Listings
CREATE TABLE public.listings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id uuid REFERENCES public.vendors(id) ON DELETE CASCADE NOT NULL,
    category_id uuid REFERENCES public.categories(id) ON DELETE RESTRICT NOT NULL,
    title text NOT NULL,
    slug text UNIQUE NOT NULL,
    description text,
    area_id uuid REFERENCES public.areas(id),
    address text,
    price_from numeric(12,2),
    price_unit public.price_unit NOT NULL DEFAULT 'per_event',
    capacity_min int,
    capacity_max int,
    status public.listing_status NOT NULL DEFAULT 'draft',
    rating_avg numeric(2,1) DEFAULT 0,
    review_count int NOT NULL DEFAULT 0,
    availability_updated_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.listings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listings TO authenticated;
GRANT ALL ON public.listings TO service_role;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Live listings are publicly readable" ON public.listings FOR SELECT TO anon USING (status = 'live');
CREATE POLICY "Authenticated public read of live listings" ON public.listings FOR SELECT TO authenticated USING (status = 'live' OR vendor_id IN (SELECT id FROM public.vendors WHERE owner_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Vendors can manage own listings" ON public.listings FOR ALL TO authenticated USING (vendor_id IN (SELECT id FROM public.vendors WHERE owner_id = auth.uid())) WITH CHECK (vendor_id IN (SELECT id FROM public.vendors WHERE owner_id = auth.uid()));
CREATE POLICY "Admins can manage listings" ON public.listings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Listing attributes
CREATE TABLE public.listing_attributes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id uuid REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
    field_key text NOT NULL,
    value jsonb NOT NULL,
    UNIQUE (listing_id, field_key)
);
GRANT SELECT ON public.listing_attributes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listing_attributes TO authenticated;
GRANT ALL ON public.listing_attributes TO service_role;
ALTER TABLE public.listing_attributes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read of live listing attributes" ON public.listing_attributes FOR SELECT TO anon USING (listing_id IN (SELECT id FROM public.listings WHERE status = 'live'));
CREATE POLICY "Authenticated read of listing attributes" ON public.listing_attributes FOR SELECT TO authenticated USING (listing_id IN (SELECT id FROM public.listings WHERE status = 'live' UNION SELECT id FROM public.listings WHERE vendor_id IN (SELECT id FROM public.vendors WHERE owner_id = auth.uid())) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Vendors can manage own listing attributes" ON public.listing_attributes FOR ALL TO authenticated USING (listing_id IN (SELECT id FROM public.listings WHERE vendor_id IN (SELECT id FROM public.vendors WHERE owner_id = auth.uid()))) WITH CHECK (listing_id IN (SELECT id FROM public.listings WHERE vendor_id IN (SELECT id FROM public.vendors WHERE owner_id = auth.uid())));
CREATE POLICY "Admins can manage listing attributes" ON public.listing_attributes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Listing event types
CREATE TABLE public.listing_event_types (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id uuid REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
    event_type_id uuid REFERENCES public.event_types(id) ON DELETE CASCADE NOT NULL,
    UNIQUE (listing_id, event_type_id)
);
GRANT SELECT ON public.listing_event_types TO anon;
GRANT SELECT, INSERT, DELETE ON public.listing_event_types TO authenticated;
GRANT ALL ON public.listing_event_types TO service_role;
ALTER TABLE public.listing_event_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read of live listing event types" ON public.listing_event_types FOR SELECT TO anon USING (listing_id IN (SELECT id FROM public.listings WHERE status = 'live'));
CREATE POLICY "Authenticated read of listing event types" ON public.listing_event_types FOR SELECT TO authenticated USING (listing_id IN (SELECT id FROM public.listings WHERE status = 'live' UNION SELECT id FROM public.listings WHERE vendor_id IN (SELECT id FROM public.vendors WHERE owner_id = auth.uid())) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Vendors can manage own listing event types" ON public.listing_event_types FOR ALL TO authenticated USING (listing_id IN (SELECT id FROM public.listings WHERE vendor_id IN (SELECT id FROM public.vendors WHERE owner_id = auth.uid()))) WITH CHECK (listing_id IN (SELECT id FROM public.listings WHERE vendor_id IN (SELECT id FROM public.vendors WHERE owner_id = auth.uid())));
CREATE POLICY "Admins can manage listing event types" ON public.listing_event_types FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Listing media
CREATE TABLE public.listing_media (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id uuid REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
    storage_path text NOT NULL,
    type text NOT NULL CHECK (type IN ('image', 'video')),
    position int NOT NULL DEFAULT 0,
    alt_text text,
    created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.listing_media TO anon;
GRANT SELECT, INSERT, DELETE ON public.listing_media TO authenticated;
GRANT ALL ON public.listing_media TO service_role;
ALTER TABLE public.listing_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read of live listing media" ON public.listing_media FOR SELECT TO anon USING (listing_id IN (SELECT id FROM public.listings WHERE status = 'live'));
CREATE POLICY "Authenticated read of listing media" ON public.listing_media FOR SELECT TO authenticated USING (listing_id IN (SELECT id FROM public.listings WHERE status = 'live' UNION SELECT id FROM public.listings WHERE vendor_id IN (SELECT id FROM public.vendors WHERE owner_id = auth.uid())) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Vendors can manage own listing media" ON public.listing_media FOR ALL TO authenticated USING (listing_id IN (SELECT id FROM public.listings WHERE vendor_id IN (SELECT id FROM public.vendors WHERE owner_id = auth.uid()))) WITH CHECK (listing_id IN (SELECT id FROM public.listings WHERE vendor_id IN (SELECT id FROM public.vendors WHERE owner_id = auth.uid())));
CREATE POLICY "Admins can manage listing media" ON public.listing_media FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Availability calendar
CREATE TABLE public.availability (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id uuid REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
    date date NOT NULL,
    state public.availability_state NOT NULL DEFAULT 'available',
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (listing_id, date)
);
GRANT SELECT ON public.availability TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.availability TO authenticated;
GRANT ALL ON public.availability TO service_role;
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read of live listing availability" ON public.availability FOR SELECT TO anon USING (listing_id IN (SELECT id FROM public.listings WHERE status = 'live'));
CREATE POLICY "Authenticated read of availability" ON public.availability FOR SELECT TO authenticated USING (listing_id IN (SELECT id FROM public.listings WHERE status = 'live' UNION SELECT id FROM public.listings WHERE vendor_id IN (SELECT id FROM public.vendors WHERE owner_id = auth.uid())) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Vendors can manage own availability" ON public.availability FOR ALL TO authenticated USING (listing_id IN (SELECT id FROM public.listings WHERE vendor_id IN (SELECT id FROM public.vendors WHERE owner_id = auth.uid()))) WITH CHECK (listing_id IN (SELECT id FROM public.listings WHERE vendor_id IN (SELECT id FROM public.vendors WHERE owner_id = auth.uid())));
CREATE POLICY "Admins can manage availability" ON public.availability FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Requests (leads)
CREATE TABLE public.requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id uuid REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
    customer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    vendor_id uuid REFERENCES public.vendors(id) ON DELETE CASCADE NOT NULL,
    kind public.request_kind NOT NULL,
    event_date date,
    visit_date date,
    visit_time time,
    message text,
    guest_count int,
    status public.request_status NOT NULL DEFAULT 'new',
    consent_at timestamptz,
    phone_snapshot text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.requests TO authenticated;
GRANT ALL ON public.requests TO service_role;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers can read own requests" ON public.requests FOR SELECT TO authenticated USING (customer_id = auth.uid());
CREATE POLICY "Vendors can read requests for their listings" ON public.requests FOR SELECT TO authenticated USING (vendor_id IN (SELECT id FROM public.vendors WHERE owner_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Customers can create requests" ON public.requests FOR INSERT TO authenticated WITH CHECK (customer_id = auth.uid());
CREATE POLICY "Vendors can update request status" ON public.requests FOR UPDATE TO authenticated USING (vendor_id IN (SELECT id FROM public.vendors WHERE owner_id = auth.uid()) OR public.has_role(auth.uid(), 'admin')) WITH CHECK (vendor_id IN (SELECT id FROM public.vendors WHERE owner_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'));

-- Request messages
CREATE TABLE public.request_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id uuid REFERENCES public.requests(id) ON DELETE CASCADE NOT NULL,
    sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    body text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.request_messages TO authenticated;
GRANT ALL ON public.request_messages TO service_role;
ALTER TABLE public.request_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants can read request messages" ON public.request_messages FOR SELECT TO authenticated USING (request_id IN (SELECT id FROM public.requests WHERE customer_id = auth.uid() UNION SELECT id FROM public.requests WHERE vendor_id IN (SELECT id FROM public.vendors WHERE owner_id = auth.uid())) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Participants can send request messages" ON public.request_messages FOR INSERT TO authenticated WITH CHECK (request_id IN (SELECT id FROM public.requests WHERE customer_id = auth.uid() UNION SELECT id FROM public.requests WHERE vendor_id IN (SELECT id FROM public.vendors WHERE owner_id = auth.uid())) OR public.has_role(auth.uid(), 'admin'));

-- Wishlists
CREATE TABLE public.wishlists (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    listing_id uuid REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (customer_id, listing_id)
);
GRANT SELECT, INSERT, DELETE ON public.wishlists TO authenticated;
GRANT ALL ON public.wishlists TO service_role;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own wishlist" ON public.wishlists FOR ALL TO authenticated USING (customer_id = auth.uid()) WITH CHECK (customer_id = auth.uid());

-- Reviews
CREATE TABLE public.reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id uuid REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
    customer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    request_id uuid REFERENCES public.requests(id) ON DELETE SET NULL,
    rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
    body text,
    event_date date,
    status public.review_status NOT NULL DEFAULT 'pending',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved reviews are publicly readable" ON public.reviews FOR SELECT TO anon USING (status = 'approved');
CREATE POLICY "Authenticated review read" ON public.reviews FOR SELECT TO authenticated USING ((status = 'approved' AND listing_id IN (SELECT id FROM public.listings WHERE status = 'live')) OR customer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Customers can create reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK (customer_id = auth.uid());
CREATE POLICY "Admins can moderate reviews" ON public.reviews FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Review media
CREATE TABLE public.review_media (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id uuid REFERENCES public.reviews(id) ON DELETE CASCADE NOT NULL,
    storage_path text NOT NULL,
    position int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.review_media TO anon;
GRANT SELECT, INSERT, DELETE ON public.review_media TO authenticated;
GRANT ALL ON public.review_media TO service_role;
ALTER TABLE public.review_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read of approved review media" ON public.review_media FOR SELECT TO anon USING (review_id IN (SELECT id FROM public.reviews WHERE status = 'approved'));
CREATE POLICY "Authenticated review media read" ON public.review_media FOR SELECT TO authenticated USING (review_id IN (SELECT id FROM public.reviews WHERE customer_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Customers can manage own review media" ON public.review_media FOR ALL TO authenticated USING (review_id IN (SELECT id FROM public.reviews WHERE customer_id = auth.uid())) WITH CHECK (review_id IN (SELECT id FROM public.reviews WHERE customer_id = auth.uid()));

-- Notifications
CREATE TABLE public.notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    body text,
    data jsonb,
    is_read boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own notifications" ON public.notifications FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Rating update function and trigger
CREATE OR REPLACE FUNCTION public.update_listing_rating(_listing_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  avg_rating numeric(2,1);
  cnt int;
BEGIN
  SELECT AVG(rating), COUNT(*) INTO avg_rating, cnt FROM public.reviews WHERE listing_id = _listing_id AND status = 'approved';
  UPDATE public.listings SET rating_avg = COALESCE(avg_rating, 0), review_count = COALESCE(cnt, 0), updated_at = now() WHERE id = _listing_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_review_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.update_listing_rating(OLD.listing_id);
    RETURN OLD;
  ELSE
    PERFORM public.update_listing_rating(NEW.listing_id);
    RETURN NEW;
  END IF;
END;
$$;

CREATE TRIGGER on_review_change
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.handle_review_change();

-- Seed data
INSERT INTO public.categories (slug, name, icon, description, sort_order) VALUES
('venues', 'Venues', 'building', 'Banquet halls, farmhouses, resorts, marriage gardens, hotels, terraces', 1),
('photography', 'Photography & Videography', 'camera', 'Coverage, hours, delivery timeline, portfolio', 2),
('catering', 'Catering', 'utensils', 'Cuisine types, veg/non-veg/Jain, price per plate', 3),
('decoration', 'Decoration', 'flower', 'Floral, theme, balloon, mandap decor and packages', 4),
('dj-music', 'DJ / Music / Live Band', 'music', 'Genre, equipment, hours included', 5),
('pandit', 'Pandit / Priest', 'book-open', 'Ceremony types, languages, rituals', 6);

INSERT INTO public.event_types (slug, name, sort_order) VALUES
('wedding', 'Wedding', 1),
('birthday', 'Birthday', 2),
('engagement', 'Engagement', 3),
('naming-ceremony', 'Naming Ceremony', 4),
('corporate', 'Corporate', 5);

INSERT INTO public.areas (slug, name, sort_order) VALUES
('koregaon-park', 'Koregaon Park', 1),
('baner', 'Baner', 2),
('kothrud', 'Kothrud', 3),
('viman-nagar', 'Viman Nagar', 4),
('hadapsar', 'Hadapsar', 5),
('wakad', 'Wakad', 6),
('aundh', 'Aundh', 7),
('magarpatta', 'Magarpatta', 8),
('hinjewadi', 'Hinjewadi', 9),
('pimple-saudagar', 'Pimple Saudagar', 10),
('shivajinagar', 'Shivajinagar', 11),
('kalyani-nagar', 'Kalyani Nagar', 12),
('camp', 'Camp', 13),
('pune-central', 'Pune Central', 14);

-- Category fields
INSERT INTO public.category_fields (category_id, key, label, field_type, options, unit, is_filterable, sort_order)
SELECT c.id, 'capacity', 'Capacity', 'number', '[]'::jsonb, 'guests', true, 1
FROM public.categories c WHERE c.slug = 'venues';

INSERT INTO public.category_fields (category_id, key, label, field_type, options, unit, is_filterable, sort_order)
SELECT c.id, 'venue_type', 'Venue Type', 'enum', '["Banquet Hall","Farmhouse","Resort","Marriage Garden","Hotel","Terrace","Lawn"]', null, true, 2
FROM public.categories c WHERE c.slug = 'venues';

INSERT INTO public.category_fields (category_id, key, label, field_type, options, unit, is_filterable, sort_order)
SELECT c.id, 'indoor_outdoor', 'Indoor / Outdoor', 'enum', '["Indoor","Outdoor","Both"]', null, true, 3
FROM public.categories c WHERE c.slug = 'venues';

INSERT INTO public.category_fields (category_id, key, label, field_type, options, unit, is_filterable, sort_order)
SELECT c.id, 'parking', 'Parking Available', 'boolean', '[]'::jsonb, null, true, 4
FROM public.categories c WHERE c.slug = 'venues';

INSERT INTO public.category_fields (category_id, key, label, field_type, options, unit, is_filterable, sort_order)
SELECT c.id, 'catering_policy', 'Catering Policy', 'enum', '["In-house only","Outside allowed","Both"]', null, true, 5
FROM public.categories c WHERE c.slug = 'venues';

INSERT INTO public.category_fields (category_id, key, label, field_type, options, unit, is_filterable, sort_order)
SELECT c.id, 'ac_available', 'Air Conditioning', 'boolean', '[]'::jsonb, null, true, 6
FROM public.categories c WHERE c.slug = 'venues';

INSERT INTO public.category_fields (category_id, key, label, field_type, options, unit, is_filterable, sort_order)
SELECT c.id, 'coverage_type', 'Coverage Type', 'enum', '["Photography","Videography","Both"]', null, true, 1
FROM public.categories c WHERE c.slug = 'photography';

INSERT INTO public.category_fields (category_id, key, label, field_type, options, unit, is_filterable, sort_order)
SELECT c.id, 'hours_included', 'Hours Included', 'number', '[]'::jsonb, 'hours', true, 2
FROM public.categories c WHERE c.slug = 'photography';

INSERT INTO public.category_fields (category_id, key, label, field_type, options, unit, is_filterable, sort_order)
SELECT c.id, 'delivery_days', 'Delivery Timeline', 'number', '[]'::jsonb, 'days', false, 3
FROM public.categories c WHERE c.slug = 'photography';

INSERT INTO public.category_fields (category_id, key, label, field_type, options, unit, is_filterable, sort_order)
SELECT c.id, 'cuisine_types', 'Cuisine Types', 'multi', '["North Indian","South Indian","Maharashtrian","Chinese","Italian","Continental","Thai","Mexican"]', null, true, 1
FROM public.categories c WHERE c.slug = 'catering';

INSERT INTO public.category_fields (category_id, key, label, field_type, options, unit, is_filterable, sort_order)
SELECT c.id, 'food_types', 'Food Types', 'multi', '["Vegetarian","Non-Vegetarian","Jain"]', null, true, 2
FROM public.categories c WHERE c.slug = 'catering';

INSERT INTO public.category_fields (category_id, key, label, field_type, options, unit, is_filterable, sort_order)
SELECT c.id, 'min_guests', 'Minimum Guest Count', 'number', '[]'::jsonb, 'guests', false, 3
FROM public.categories c WHERE c.slug = 'catering';

INSERT INTO public.category_fields (category_id, key, label, field_type, options, unit, is_filterable, sort_order)
SELECT c.id, 'styles', 'Decoration Styles', 'multi', '["Floral","Theme","Balloon","Mandap","Lighting","Stage"]', null, true, 1
FROM public.categories c WHERE c.slug = 'decoration';

INSERT INTO public.category_fields (category_id, key, label, field_type, options, unit, is_filterable, sort_order)
SELECT c.id, 'setup_included', 'Setup Included', 'boolean', '[]'::jsonb, null, false, 2
FROM public.categories c WHERE c.slug = 'decoration';

INSERT INTO public.category_fields (category_id, key, label, field_type, options, unit, is_filterable, sort_order)
SELECT c.id, 'genres', 'Genres', 'multi', '["Bollywood","EDM","Hip Hop","Retro","Classical","Regional","Rock","Pop"]', null, true, 1
FROM public.categories c WHERE c.slug = 'dj-music';

INSERT INTO public.category_fields (category_id, key, label, field_type, options, unit, is_filterable, sort_order)
SELECT c.id, 'equipment_included', 'Equipment Included', 'boolean', '[]'::jsonb, null, true, 2
FROM public.categories c WHERE c.slug = 'dj-music';

INSERT INTO public.category_fields (category_id, key, label, field_type, options, unit, is_filterable, sort_order)
SELECT c.id, 'hours_included', 'Hours Included', 'number', '[]'::jsonb, 'hours', true, 3
FROM public.categories c WHERE c.slug = 'dj-music';

INSERT INTO public.category_fields (category_id, key, label, field_type, options, unit, is_filterable, sort_order)
SELECT c.id, 'ceremony_types', 'Ceremony Types', 'multi', '["Hindu","Sikh","Christian","Muslim Nikah","Interfaith","Griha Pravesh","Satyanarayan"]', null, true, 1
FROM public.categories c WHERE c.slug = 'pandit';

INSERT INTO public.category_fields (category_id, key, label, field_type, options, unit, is_filterable, sort_order)
SELECT c.id, 'languages', 'Languages', 'multi', '["Hindi","Marathi","Sanskrit","English","Punjabi","Gujarati","Tamil","Telugu"]', null, true, 2
FROM public.categories c WHERE c.slug = 'pandit';

INSERT INTO public.category_fields (category_id, key, label, field_type, options, unit, is_filterable, sort_order)
SELECT c.id, 'rituals_included', 'Rituals Included', 'boolean', '[]'::jsonb, null, false, 3
FROM public.categories c WHERE c.slug = 'pandit';
