import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const COMPONENT_SELECT = `
  listing_id,
  listing:listings(
    id, title, slug, status, price_from, price_unit, rating_avg, review_count, availability_updated_at,
    categories(name, slug),
    areas(name, slug),
    listing_media(storage_path, position),
    listing_tiers(id, name, price, is_active)
  )
`;

/** Public: all live packages with their live components. */
export const listPackages = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { data, error } = await supabase
    .from("packages")
    .select(
      `id, name, slug, description, cover_image, discount_type, discount_value, created_at,
       vendor:vendors(id, business_name),
       package_listings(${COMPONENT_SELECT})`,
    )
    .eq("status", "live")
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? [])
    .map((pkg) => ({
      ...pkg,
      components: (pkg.package_listings ?? [])
        .map((pl: any) => pl.listing)
        .filter((l: any) => l && l.status === "live"),
    }))
    .filter((pkg) => pkg.components.length >= 2);
});

/** Public: one live package, with per-component availability for the next 60 days. */
export const getPackageBySlug = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ slug: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { data: pkg, error } = await supabase
      .from("packages")
      .select(
        `id, name, slug, description, cover_image, discount_type, discount_value, created_at,
         vendor:vendors(id, business_name, about, contact_phone, contact_email),
         package_listings(${COMPONENT_SELECT})`,
      )
      .eq("slug", data.slug)
      .eq("status", "live")
      .single();
    if (error) throw error;

    const components = (pkg.package_listings ?? [])
      .map((pl: any) => pl.listing)
      .filter((l: any) => l && l.status === "live");

    const today = new Date().toISOString().slice(0, 10);
    const horizon = new Date(Date.now() + 60 * 86_400_000).toISOString().slice(0, 10);

    const componentAvailability: { listing_id: string; availability_updated_at: string | null; states: Record<string, string> }[] = [];
    for (const component of components) {
      const { data: rows, error: availError } = await supabase
        .from("availability")
        .select("date, state")
        .eq("listing_id", component.id)
        .gte("date", today)
        .lte("date", horizon);
      if (availError) throw availError;
      componentAvailability.push({
        listing_id: component.id,
        availability_updated_at: component.availability_updated_at,
        states: Object.fromEntries((rows ?? []).map((r) => [r.date, r.state as string])),
      });
    }

    return { pkg, components, componentAvailability };
  });

/** Public: live packages that contain a given listing (cross-sell block). */
export const getPackagesForListing = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ listingId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { data: links, error } = await supabase
      .from("package_listings")
      .select("package_id")
      .eq("listing_id", data.listingId);
    if (error) throw error;

    const ids = [...new Set((links ?? []).map((l) => l.package_id))];
    if (!ids.length) return [];

    const { data: packages, error: pkgError } = await supabase
      .from("packages")
      .select(
        `id, name, slug, description, cover_image, discount_type, discount_value,
         package_listings(${COMPONENT_SELECT})`,
      )
      .in("id", ids)
      .eq("status", "live");
    if (pkgError) throw pkgError;

    return (packages ?? [])
      .map((pkg) => ({
        ...pkg,
        components: (pkg.package_listings ?? [])
          .map((pl: any) => pl.listing)
          .filter((l: any) => l && l.status === "live"),
      }))
      .filter((pkg) => pkg.components.length >= 2);
  });

/** Vendor: own packages + which of their live listings can be bundled. */
export const getMyPackages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: vendor } = await context.supabase
      .from("vendors")
      .select("id, business_name, status")
      .eq("owner_id", context.userId)
      .maybeSingle();
    if (!vendor) return { vendor: null, packages: [], liveListings: [] };

    const [{ data: packages, error: pkgError }, { data: liveListings, error: listError }] = await Promise.all([
      context.supabase
        .from("packages")
        .select(
          `id, name, slug, description, cover_image, discount_type, discount_value, status, rejection_reason, created_at,
           package_listings(${COMPONENT_SELECT})`,
        )
        .eq("vendor_id", vendor.id)
        .order("created_at", { ascending: false }),
      context.supabase
        .from("listings")
        .select("id, title, price_from, price_unit, status, categories(name), listing_tiers(id, name, price, is_active)")
        .eq("vendor_id", vendor.id)
        .eq("status", "live")
        .order("title"),
    ]);
    if (pkgError) throw pkgError;
    if (listError) throw listError;

    return {
      vendor,
      packages: (packages ?? []).map((pkg) => ({
        ...pkg,
        components: (pkg.package_listings ?? []).map((pl: any) => pl.listing).filter(Boolean),
      })),
      liveListings: liveListings ?? [],
    };
  });

const packageInput = z.object({
  name: z.string().min(3).max(160),
  description: z.string().max(4000).optional(),
  cover_image: z.string().max(500).optional(),
  discount_type: z.enum(["fixed_amount", "percentage"]),
  discount_value: z.coerce.number().nonnegative(),
  listing_ids: z.array(z.string().uuid()).min(2),
  submit: z.boolean().optional(),
});

function slugify(name: string) {
  return `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

function assertDiscount(type: "fixed_amount" | "percentage", value: number) {
  if (type === "percentage" && value > 90) throw new Error("A percentage discount cannot exceed 90%");
}

export const createPackage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => packageInput.parse(data))
  .handler(async ({ context, data }) => {
    assertDiscount(data.discount_type, data.discount_value);

    const { data: vendor, error: vendorError } = await context.supabase
      .from("vendors")
      .select("id")
      .eq("owner_id", context.userId)
      .single();
    if (vendorError) throw vendorError;

    const { data: owned, error: ownedError } = await context.supabase
      .from("listings")
      .select("id")
      .eq("vendor_id", vendor.id)
      .eq("status", "live")
      .in("id", data.listing_ids);
    if (ownedError) throw ownedError;
    if ((owned ?? []).length !== data.listing_ids.length) {
      throw new Error("A package can only bundle your own live listings");
    }

    const { data: pkg, error } = await context.supabase
      .from("packages")
      .insert({
        vendor_id: vendor.id,
        name: data.name,
        slug: slugify(data.name),
        description: data.description || null,
        cover_image: data.cover_image || null,
        discount_type: data.discount_type,
        discount_value: data.discount_value,
        status: "draft",
      })
      .select("id")
      .single();
    if (error) throw error;

    const { error: linkError } = await context.supabase
      .from("package_listings")
      .insert(data.listing_ids.map((listing_id) => ({ package_id: pkg.id, listing_id })));
    if (linkError) throw linkError;

    if (data.submit !== false) {
      const { error: statusError } = await context.supabase
        .from("packages")
        .update({ status: "pending" })
        .eq("id", pkg.id);
      if (statusError) throw statusError;
    }

    return { ok: true, packageId: pkg.id };
  });

export const getPackageForEdit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ packageId: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    const { data: pkg, error } = await context.supabase
      .from("packages")
      .select(
        "id, name, description, cover_image, discount_type, discount_value, status, package_listings(listing_id)",
      )
      .eq("id", data.packageId)
      .single();
    if (error) throw error;
    return pkg;
  });

export const updatePackage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => packageInput.extend({ packageId: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    assertDiscount(data.discount_type, data.discount_value);

    const { data: existing, error: existingError } = await context.supabase
      .from("packages")
      .select("id, status, vendor_id")
      .eq("id", data.packageId)
      .single();
    if (existingError) throw existingError;

    const { data: owned, error: ownedError } = await context.supabase
      .from("listings")
      .select("id")
      .eq("vendor_id", existing.vendor_id)
      .eq("status", "live")
      .in("id", data.listing_ids);
    if (ownedError) throw ownedError;
    if ((owned ?? []).length !== data.listing_ids.length) {
      throw new Error("A package can only bundle your own live listings");
    }

    // Any edit to a live package returns it to review.
    const nextStatus = existing.status === "live" || existing.status === "rejected" ? "pending" : existing.status;

    await context.supabase.from("package_listings").delete().eq("package_id", data.packageId);
    const { error: linkError } = await context.supabase
      .from("package_listings")
      .insert(data.listing_ids.map((listing_id) => ({ package_id: data.packageId, listing_id })));
    if (linkError) throw linkError;

    const { error } = await context.supabase
      .from("packages")
      .update({
        name: data.name,
        description: data.description || null,
        cover_image: data.cover_image || null,
        discount_type: data.discount_type,
        discount_value: data.discount_value,
        status: nextStatus,
        rejection_reason: null,
      })
      .eq("id", data.packageId);
    if (error) throw error;

    return { ok: true, status: nextStatus };
  });

export const setMyPackageStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ packageId: z.string().uuid(), status: z.enum(["draft", "pending", "paused"]) }).parse(data),
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("packages")
      .update({ status: data.status })
      .eq("id", data.packageId);
    if (error) throw error;
    return { ok: true };
  });
