import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("id", context.userId)
      .single();
    if (error) throw error;
    return data;
  });

export const getMyRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("requests")
      .select(`
        *,
        listing:listings(id, title, slug, category:categories(name))
      `)
      .eq("customer_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const getVendorDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: vendor, error: vendorError } = await context.supabase
      .from("vendors")
      .select("*")
      .eq("owner_id", context.userId)
      .maybeSingle();
    if (vendorError) throw vendorError;

    const { data: listings, error: listingsError } = await context.supabase
      .from("listings")
      .select("id, title, slug, status, price_from, price_unit, rating_avg, review_count, category:categories(name)")
      .eq("vendor_id", vendor?.id ?? "00000000-0000-0000-0000-000000000000")
      .order("created_at", { ascending: false });
    if (listingsError) throw listingsError;

    const { data: leads, error: leadsError } = await context.supabase
      .from("requests")
      .select(`
        *,
        listing:listings(id, title, slug)
      `)
      .eq("vendor_id", vendor?.id ?? "00000000-0000-0000-0000-000000000000")
      .order("created_at", { ascending: false });
    if (leadsError) throw leadsError;

    return { vendor, listings: listings ?? [], leads: leads ?? [] };
  });

export const updateRequestStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ requestId: z.string().uuid(), status: z.enum(["accepted", "declined"]) }).parse(data))
  .handler(async ({ context, data }) => {
    const { data: vendor } = await context.supabase.from("vendors").select("id").eq("owner_id", context.userId).single();
    if (!vendor) throw new Error("Vendor not found");
    const { error } = await context.supabase
      .from("requests")
      .update({ status: data.status })
      .eq("id", data.requestId)
      .eq("vendor_id", vendor.id);
    if (error) throw error;
    return { ok: true };
  });

export const createListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({
      title: z.string().min(3).max(160),
      category_id: z.string().uuid(),
      area_id: z.string().uuid(),
      description: z.string().min(20).max(4000),
      price_from: z.coerce.number().nonnegative(),
      price_unit: z.enum(["per_day", "per_plate", "per_hour", "per_event"]),
      address: z.string().max(300).optional(),
      attributes: z.record(z.any()),
      event_type_ids: z.array(z.string().uuid()).min(1),
      tiers: z
        .array(
          z.object({
            name: z.string().min(1).max(80),
            description: z.string().max(600).optional(),
            price: z.coerce.number().nonnegative(),
            features: z.array(z.string().min(1).max(160)).max(20),
          }),
        )
        .default([]),
    })
      .refine((d) => d.tiers.length === 0 || d.tiers.length >= 2, {
        message: "Package Tiers need at least 2 tiers — leave the section empty for flat pricing",
      })
      .parse(data)
  )
  .handler(async ({ context, data }) => {
    const { data: vendor, error: vendorError } = await context.supabase
      .from("vendors")
      .select("id")
      .eq("owner_id", context.userId)
      .single();
    if (vendorError) throw vendorError;

    const { data: listing, error } = await context.supabase
      .from("listings")
      .insert({
        vendor_id: vendor.id,
        category_id: data.category_id,
        area_id: data.area_id,
        title: data.title,
        slug: data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
        description: data.description,
        price_from: data.price_from,
        price_unit: data.price_unit,
        address: data.address ?? null,
        status: "pending",
      })
      .select("id")
      .single();
    if (error) throw error;

    const attributeRows = Object.entries(data.attributes).map(([field_key, value]) => ({
      listing_id: listing.id,
      field_key,
      value: value as any,
    }));
    if (attributeRows.length) {
      await context.supabase.from("listing_attributes").insert(attributeRows);
    }

    await context.supabase.from("listing_event_types").insert(
      data.event_type_ids.map((event_type_id) => ({ listing_id: listing.id, event_type_id }))
    );

    if (data.tiers.length) {
      const { error: tierError } = await context.supabase.from("listing_tiers").insert(
        data.tiers.map((tier, index) => ({
          listing_id: listing.id,
          name: tier.name,
          description: tier.description || null,
          price: tier.price,
          features: tier.features,
          sort_order: index,
          is_active: true,
        })),
      );
      if (tierError) throw tierError;
    }

    return { ok: true, listingId: listing.id };
  });


export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        full_name: z.string().min(1).max(120),
        phone: z.string().min(10).max(20),
      })
      .parse(data)
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({ full_name: data.full_name, phone: data.phone })
      .eq("id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

/** Dev-mode phone "verification" — real SMS OTP lands once DLT registration completes. */
export const devVerifyPhone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ code: z.string().min(4) }).parse(data))
  .handler(async ({ context, data }) => {
    if (data.code !== "000000") throw new Error("Invalid code. Use 000000 while OTP is in dev mode.");
    const { error } = await context.supabase
      .from("profiles")
      .update({ phone_verified_at: new Date().toISOString() })
      .eq("id", context.userId);
    if (error) throw error;
    return { ok: true };
  });
