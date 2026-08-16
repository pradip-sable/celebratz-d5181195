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
        listing:listings(id, title, slug, primary_image_url, category:categories(name))
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
      .select("id, title, slug, status, starting_price, pricing_unit, rating_avg, review_count, primary_image_url, category:categories(name)")
      .eq("vendor_id", vendor?.id ?? "00000000-0000-0000-0000-000000000000")
      .order("created_at", { ascending: false });
    if (listingsError) throw listingsError;

    const { data: leads, error: leadsError } = await context.supabase
      .from("requests")
      .select(`
        *,
        listing:listings(id, title, slug, primary_image_url)
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
    const { error } = await context.supabase
      .from("requests")
      .update({ status: data.status })
      .eq("id", data.requestId)
      .eq("vendor_id", (await context.supabase.from("vendors").select("id").eq("owner_id", context.userId).single()).data?.id ?? "");
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
      starting_price: z.coerce.number().nonnegative(),
      pricing_unit: z.enum(["per_day", "per_plate", "per_hour", "per_event", "per_piece"]),
      address: z.string().max(300).optional(),
      attributes: z.record(z.any()),
      event_type_ids: z.array(z.string().uuid()).min(1),
    }).parse(data)
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
        starting_price: data.starting_price,
        pricing_unit: data.pricing_unit,
        address: data.address,
        status: "pending_review",
      })
      .select("id")
      .single();
    if (error) throw error;

    await context.supabase.from("listing_attributes").insert({ listing_id: listing.id, data: data.attributes });
    await context.supabase.from("listing_event_types").insert(
      data.event_type_ids.map((event_type_id) => ({ listing_id: listing.id, event_type_id }))
    );

    return { ok: true, listingId: listing.id };
  });
