-- =========================================================
-- Enum for package discounts + shared updated_at helper
-- =========================================================
CREATE TYPE public.discount_type AS ENUM ('fixed_amount', 'percentage');

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =========================================================
-- packages (cross-listing bundles)
-- =========================================================
CREATE TABLE public.packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  cover_image text,
  discount_type public.discount_type NOT NULL DEFAULT 'percentage',
  discount_value numeric NOT NULL DEFAULT 0 CHECK (discount_value >= 0),
  status public.listing_status NOT NULL DEFAULT 'draft',
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT packages_percentage_range CHECK (
    discount_type <> 'percentage' OR discount_value <= 90
  )
);

GRANT SELECT ON public.packages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.packages TO authenticated;
GRANT ALL ON public.packages TO service_role;

ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Live packages are public" ON public.packages
  FOR SELECT USING (status = 'live');

CREATE POLICY "Vendors view own packages" ON public.packages
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = packages.vendor_id AND v.owner_id = auth.uid())
  );

CREATE POLICY "Vendors manage own packages" ON public.packages
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = packages.vendor_id AND v.owner_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = packages.vendor_id AND v.owner_id = auth.uid())
  );

CREATE POLICY "Admins manage packages" ON public.packages
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_packages_updated_at
  BEFORE UPDATE ON public.packages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- package_listings (bundle components)
-- =========================================================
CREATE TABLE public.package_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (package_id, listing_id)
);

GRANT SELECT ON public.package_listings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.package_listings TO authenticated;
GRANT ALL ON public.package_listings TO service_role;

ALTER TABLE public.package_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Components of live packages are public" ON public.package_listings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.packages p WHERE p.id = package_listings.package_id AND p.status = 'live')
  );

CREATE POLICY "Vendors view own package components" ON public.package_listings
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.packages p
      JOIN public.vendors v ON v.id = p.vendor_id
      WHERE p.id = package_listings.package_id AND v.owner_id = auth.uid()
    )
  );

CREATE POLICY "Vendors manage own package components" ON public.package_listings
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.packages p
      JOIN public.vendors v ON v.id = p.vendor_id
      WHERE p.id = package_listings.package_id AND v.owner_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.packages p
      JOIN public.vendors v ON v.id = p.vendor_id
      WHERE p.id = package_listings.package_id AND v.owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins manage package components" ON public.package_listings
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.validate_package_listing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pkg_vendor uuid;
  lst_vendor uuid;
BEGIN
  SELECT vendor_id INTO pkg_vendor FROM public.packages WHERE id = NEW.package_id;
  SELECT vendor_id INTO lst_vendor FROM public.listings WHERE id = NEW.listing_id;
  IF pkg_vendor IS NULL OR lst_vendor IS NULL OR pkg_vendor <> lst_vendor THEN
    RAISE EXCEPTION 'A package can only contain listings owned by the same vendor';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_package_listing_trg
  BEFORE INSERT OR UPDATE ON public.package_listings
  FOR EACH ROW EXECUTE FUNCTION public.validate_package_listing();

CREATE OR REPLACE FUNCTION public.validate_package_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cnt int;
BEGIN
  IF NEW.status IN ('pending', 'live') THEN
    SELECT COUNT(*) INTO cnt FROM public.package_listings WHERE package_id = NEW.id;
    IF cnt < 2 THEN
      RAISE EXCEPTION 'A package needs at least 2 listings before it can be submitted or published';
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

CREATE CONSTRAINT TRIGGER validate_package_status_trg
  AFTER INSERT OR UPDATE OF status ON public.packages
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION public.validate_package_status();

-- =========================================================
-- listing_tiers (pricing tiers inside one listing)
-- =========================================================
CREATE TABLE public.listing_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric NOT NULL CHECK (price >= 0),
  features text[] NOT NULL DEFAULT '{}',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX listing_tiers_listing_idx ON public.listing_tiers(listing_id);

GRANT SELECT ON public.listing_tiers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listing_tiers TO authenticated;
GRANT ALL ON public.listing_tiers TO service_role;

ALTER TABLE public.listing_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tiers of live listings are public" ON public.listing_tiers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_tiers.listing_id AND l.status = 'live')
  );

CREATE POLICY "Vendors view own listing tiers" ON public.listing_tiers
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      JOIN public.vendors v ON v.id = l.vendor_id
      WHERE l.id = listing_tiers.listing_id AND v.owner_id = auth.uid()
    )
  );

CREATE POLICY "Vendors manage own listing tiers" ON public.listing_tiers
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      JOIN public.vendors v ON v.id = l.vendor_id
      WHERE l.id = listing_tiers.listing_id AND v.owner_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.listings l
      JOIN public.vendors v ON v.id = l.vendor_id
      WHERE l.id = listing_tiers.listing_id AND v.owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins manage listing tiers" ON public.listing_tiers
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_listing_tiers_updated_at
  BEFORE UPDATE ON public.listing_tiers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.validate_listing_tier_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target uuid;
  cnt int;
BEGIN
  target := COALESCE(NEW.listing_id, OLD.listing_id);
  IF NOT EXISTS (SELECT 1 FROM public.listings WHERE id = target) THEN
    RETURN NULL;
  END IF;
  SELECT COUNT(*) INTO cnt FROM public.listing_tiers WHERE listing_id = target AND is_active;
  IF cnt = 1 THEN
    RAISE EXCEPTION 'A listing must have either no tiers or at least 2 active tiers';
  END IF;
  RETURN NULL;
END;
$$;

CREATE CONSTRAINT TRIGGER validate_listing_tier_count_trg
  AFTER INSERT OR UPDATE OR DELETE ON public.listing_tiers
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION public.validate_listing_tier_count();

-- =========================================================
-- requests: package or listing target, optional selected tier
-- =========================================================
ALTER TABLE public.requests
  ALTER COLUMN listing_id DROP NOT NULL,
  ADD COLUMN package_id uuid REFERENCES public.packages(id) ON DELETE SET NULL,
  ADD COLUMN selected_tier_id uuid REFERENCES public.listing_tiers(id) ON DELETE SET NULL;

ALTER TABLE public.requests
  ADD CONSTRAINT requests_one_target CHECK (
    (listing_id IS NOT NULL AND package_id IS NULL)
    OR (listing_id IS NULL AND package_id IS NOT NULL)
  ),
  ADD CONSTRAINT requests_tier_requires_listing CHECK (
    selected_tier_id IS NULL OR listing_id IS NOT NULL
  );

CREATE OR REPLACE FUNCTION public.validate_request_tier()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.selected_tier_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.listing_tiers t
      WHERE t.id = NEW.selected_tier_id AND t.listing_id = NEW.listing_id
    ) THEN
      RAISE EXCEPTION 'The selected tier does not belong to this listing';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_request_tier_trg
  BEFORE INSERT OR UPDATE ON public.requests
  FOR EACH ROW EXECUTE FUNCTION public.validate_request_tier();

-- =========================================================
-- Effective price view: lowest active tier price, else price_from
-- =========================================================
CREATE VIEW public.listing_effective_prices
WITH (security_invoker = on) AS
SELECT
  l.id AS listing_id,
  l.status,
  COALESCE(t.min_tier_price, l.price_from) AS effective_price_from,
  COALESCE(t.tier_count, 0) AS tier_count
FROM public.listings l
LEFT JOIN (
  SELECT listing_id, MIN(price) AS min_tier_price, COUNT(*) AS tier_count
  FROM public.listing_tiers
  WHERE is_active
  GROUP BY listing_id
) t ON t.listing_id = l.id;

GRANT SELECT ON public.listing_effective_prices TO anon, authenticated, service_role;