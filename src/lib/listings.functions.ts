import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

const rawSearchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  eventType: z.string().optional(),
  area: z.string().optional(),
  date: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  minCapacity: z.coerce.number().optional(),
  maxCapacity: z.coerce.number().optional(),
});

// GET server fns can arrive with an empty/string payload; normalize before parsing.
const searchInputSchema = z.preprocess((val) => {
  if (val == null || val === "") return {};
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch {
      return {};
    }
  }
  return val;
}, rawSearchSchema);

function publicClient() {
  return createClient<Database>(
    process.env["SUPABASE_URL"]!,
    process.env["SUPABASE_PUBLISHABLE_KEY"]!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

export const searchListings = createServerFn({ method: "GET" })
  .inputValidator((data) => searchInputSchema.parse(data))
  .handler(async ({ data }) => {
    const supabase = publicClient();

    const eventTypeJoin = data.eventType
      ? "listing_event_types!inner(event_types!inner(slug))"
      : "listing_event_types(event_types(slug))";

    let query = supabase
      .from("listings")
      .select(`
        id,
        title,
        slug,
        description,
        price_from,
        price_unit,
        capacity_min,
        capacity_max,
        rating_avg,
        review_count,
        availability_updated_at,
        categories!inner(name, slug, icon),
        areas!inner(name, slug),
        listing_media(storage_path, type, position),
        ${eventTypeJoin}
      `)
      .eq("status", "live")
      .order("rating_avg", { ascending: false });

    if (data.category) {
      query = query.eq("categories.slug", data.category);
    }
    if (data.area) {
      query = query.eq("areas.slug", data.area);
    }
    if (data.eventType) {
      query = query.eq("listing_event_types.event_types.slug", data.eventType);
    }

    if (data.minPrice) {
      query = query.gte("price_from", data.minPrice);
    }
    if (data.maxPrice) {
      query = query.lte("price_from", data.maxPrice);
    }
    if (data.minCapacity) {
      query = query.gte("capacity_max", data.minCapacity);
    }
    if (data.maxCapacity) {
      query = query.lte("capacity_min", data.maxCapacity);
    }
    if (data.q) {
      query = query.or(`title.ilike.%${data.q}%,description.ilike.%${data.q}%`);
    }

    const { data: rows, error } = await query;
    if (error) throw error;
    return rows ?? [];
  });

const slugSchema = z.object({ slug: z.string() });

export const getListingBySlug = createServerFn({ method: "GET" })
  .inputValidator((data) => slugSchema.parse(data))
  .handler(async ({ data }) => {
    const supabase = publicClient();

    const { data: listing, error } = await supabase
      .from("listings")
      .select(`
        *,
        categories(name, slug),
        areas(name, slug),
        vendors(id, business_name, about, contact_phone, contact_email),
        listing_attributes(field_key, value),
        listing_media(storage_path, type, position, alt_text),
        listing_event_types(event_types(name, slug))
      `)
      .eq("slug", data.slug)
      .eq("status", "live")
      .single();

    if (error) throw error;

    const { data: availability, error: availError } = await supabase
      .from("availability")
      .select("date, state")
      .eq("listing_id", listing.id)
      .gte("date", new Date().toISOString().split("T")[0])
      .lte("date", new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
      .order("date", { ascending: true });

    if (availError) throw availError;

    const { data: reviews, error: reviewError } = await supabase
      .from("reviews")
      .select("rating, body, created_at, customer_id")
      .eq("listing_id", listing.id)
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (reviewError) throw reviewError;

    // reviews.customer_id references auth.users, so there is no PostgREST
    // relationship to profiles; fetch reviewer names in a second query.
    const customerIds = [...new Set((reviews ?? []).map((r) => r.customer_id).filter(Boolean))];
    let nameById: Record<string, string | null> = {};
    if (customerIds.length > 0) {
      const { data: reviewers } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", customerIds as string[]);
      nameById = Object.fromEntries((reviewers ?? []).map((p) => [p.id, p.full_name]));
    }

    const reviewsWithNames = (reviews ?? []).map((r) => ({
      ...r,
      profiles: { full_name: r.customer_id ? nameById[r.customer_id] ?? null : null },
    }));

    return { listing, availability: availability ?? [], reviews: reviewsWithNames };
  });

export const getHomeData = createServerFn({ method: "GET" })
  .handler(async () => {
    const supabase = publicClient();

    const [{ data: categories }, { data: eventTypes }, { data: areas }, { data: featured }] = await Promise.all([
      supabase.from("categories").select("id, name, slug, icon, description").order("sort_order"),
      supabase.from("event_types").select("id, name, slug").order("name"),
      supabase.from("areas").select("id, name, slug").order("name"),
      supabase
        .from("listings")
        .select("id, title, slug, price_from, price_unit, rating_avg, review_count, categories(name, slug), areas(name, slug), listing_media(storage_path)")
        .eq("status", "live")
        .order("rating_avg", { ascending: false })
        .limit(6),
    ]);

    return {
      categories: categories ?? [],
      eventTypes: eventTypes ?? [],
      areas: areas ?? [],
      featured: featured ?? [],
    };
  });
