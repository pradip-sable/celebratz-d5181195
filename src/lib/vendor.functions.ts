import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getVendorFormOptions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: categories }, { data: fields }, { data: areas }, { data: eventTypes }] = await Promise.all([
      context.supabase.from("categories").select("id, name, slug").eq("is_active", true).order("sort_order"),
      context.supabase
        .from("category_fields")
        .select("id, category_id, key, label, field_type, options, unit, sort_order")
        .order("sort_order"),
      context.supabase.from("areas").select("id, name").order("name"),
      context.supabase.from("event_types").select("id, name").eq("is_active", true).order("sort_order"),
    ]);

    return {
      categories: categories ?? [],
      fields: fields ?? [],
      areas: areas ?? [],
      eventTypes: eventTypes ?? [],
    };
  });

export const upsertVendorProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        business_name: z.string().min(2).max(160),
        about: z.string().max(2000).optional(),
        contact_phone: z.string().min(8).max(20),
        contact_email: z.string().email().optional().or(z.literal("")),
        area_id: z.string().uuid().optional(),
        address: z.string().max(300).optional(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    const { data: existing } = await context.supabase
      .from("vendors")
      .select("id")
      .eq("owner_id", context.userId)
      .maybeSingle();

    const payload = {
      owner_id: context.userId,
      business_name: data.business_name,
      about: data.about || null,
      contact_phone: data.contact_phone,
      contact_email: data.contact_email || null,
      area_id: data.area_id || null,
      address: data.address || null,
    };

    if (existing) {
      const { error } = await context.supabase.from("vendors").update(payload).eq("id", existing.id);
      if (error) throw error;
      return { ok: true, vendorId: existing.id };
    }

    const { data: created, error } = await context.supabase
      .from("vendors")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw error;
    return { ok: true, vendorId: created.id };
  });

export const getListingAvailability = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ listingId: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    const { data: listing, error: listingError } = await context.supabase
      .from("listings")
      .select("id, title, availability_updated_at, vendor:vendors!inner(id, owner_id)")
      .eq("id", data.listingId)
      .single();
    if (listingError) throw listingError;

    const today = new Date().toISOString().slice(0, 10);
    const { data: availability, error } = await context.supabase
      .from("availability")
      .select("date, state")
      .eq("listing_id", data.listingId)
      .gte("date", today)
      .order("date");
    if (error) throw error;

    return { listing, availability: availability ?? [] };
  });

export const setAvailability = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        listingId: z.string().uuid(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        state: z.enum(["available", "tentative", "booked"]),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("availability")
      .upsert(
        { listing_id: data.listingId, date: data.date, state: data.state, updated_at: new Date().toISOString() },
        { onConflict: "listing_id,date" },
      );
    if (error) throw error;

    await context.supabase
      .from("listings")
      .update({ availability_updated_at: new Date().toISOString() })
      .eq("id", data.listingId);

    return { ok: true };
  });

export const updateListingStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ listingId: z.string().uuid(), status: z.enum(["draft", "pending", "paused"]) }).parse(data),
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("listings")
      .update({ status: data.status })
      .eq("id", data.listingId);
    if (error) throw error;
    return { ok: true };
  });

export const getListingForEdit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ listingId: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    const { data: listing, error } = await context.supabase
      .from("listings")
      .select(
        "id, title, description, category_id, area_id, address, price_from, price_unit, status, listing_attributes(field_key, value), listing_event_types(event_type_id)",
      )
      .eq("id", data.listingId)
      .single();
    if (error) throw error;
    return listing;
  });

export const updateListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        listingId: z.string().uuid(),
        title: z.string().min(3).max(160),
        description: z.string().min(20).max(4000),
        area_id: z.string().uuid(),
        address: z.string().max(300).optional(),
        price_from: z.coerce.number().nonnegative(),
        price_unit: z.enum(["per_day", "per_plate", "per_hour", "per_event"]),
        attributes: z.record(z.any()),
        event_type_ids: z.array(z.string().uuid()).min(1),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("listings")
      .update({
        title: data.title,
        description: data.description,
        area_id: data.area_id,
        address: data.address ?? null,
        price_from: data.price_from,
        price_unit: data.price_unit,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.listingId);
    if (error) throw error;

    await context.supabase.from("listing_attributes").delete().eq("listing_id", data.listingId);
    const rows = Object.entries(data.attributes)
      .filter(([, value]) => value !== "" && value !== null && value !== undefined)
      .map(([field_key, value]) => ({ listing_id: data.listingId, field_key, value: value as never }));
    if (rows.length) await context.supabase.from("listing_attributes").insert(rows);

    await context.supabase.from("listing_event_types").delete().eq("listing_id", data.listingId);
    await context.supabase
      .from("listing_event_types")
      .insert(data.event_type_ids.map((event_type_id) => ({ listing_id: data.listingId, event_type_id })));

    return { ok: true };
  });

export const getVendorLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: vendor } = await context.supabase
      .from("vendors")
      .select("id, business_name, status")
      .eq("owner_id", context.userId)
      .maybeSingle();
    if (!vendor) return { vendor: null, leads: [] };

    const { data: leads, error } = await context.supabase
      .from("requests")
      .select("*, listing:listings(id, title, slug)")
      .eq("vendor_id", vendor.id)
      .order("created_at", { ascending: false });
    if (error) throw error;

    const customerIds = [...new Set((leads ?? []).map((l) => l.customer_id).filter(Boolean))] as string[];
    let nameById: Record<string, string | null> = {};
    if (customerIds.length) {
      const { data: profiles } = await context.supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", customerIds);
      nameById = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name]));
    }

    return {
      vendor,
      leads: (leads ?? []).map((l) => ({
        ...l,
        customer_name: l.customer_id ? nameById[l.customer_id] ?? null : null,
      })),
    };
  });

export const getMyVendor = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("vendors")
      .select("*, area:areas(id, name)")
      .eq("owner_id", context.userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  });
