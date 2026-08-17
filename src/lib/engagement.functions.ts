import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getWishlist = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("wishlists")
      .select(
        "id, created_at, listing:listings(id, title, slug, price_from, price_unit, rating_avg, review_count, category:categories(name), area:areas(name), listing_media(storage_path))",
      )
      .eq("customer_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const toggleWishlist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ listingId: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    const { data: existing } = await context.supabase
      .from("wishlists")
      .select("id")
      .eq("customer_id", context.userId)
      .eq("listing_id", data.listingId)
      .maybeSingle();

    if (existing) {
      const { error } = await context.supabase.from("wishlists").delete().eq("id", existing.id);
      if (error) throw error;
      return { saved: false };
    }

    const { error } = await context.supabase
      .from("wishlists")
      .insert({ customer_id: context.userId, listing_id: data.listingId });
    if (error) throw error;
    return { saved: true };
  });

export const getMyReviewData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const today = new Date().toISOString().slice(0, 10);

    const [{ data: reviews }, { data: eligible }] = await Promise.all([
      context.supabase
        .from("reviews")
        .select("id, rating, body, status, created_at, request_id, listing:listings(title, slug)")
        .eq("customer_id", context.userId)
        .order("created_at", { ascending: false }),
      context.supabase
        .from("requests")
        .select("id, event_date, listing:listings(id, title, slug)")
        .eq("customer_id", context.userId)
        .eq("status", "accepted")
        .lt("event_date", today),
    ]);

    const reviewedRequestIds = new Set((reviews ?? []).map((r: any) => r.request_id));
    const pending = (eligible ?? []).filter((r: any) => !reviewedRequestIds.has(r.id));

    return { reviews: reviews ?? [], pending };
  });

export const submitReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        requestId: z.string().uuid(),
        rating: z.coerce.number().int().min(1).max(5),
        body: z.string().max(2000).optional(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    const { data: request, error: reqError } = await context.supabase
      .from("requests")
      .select("id, listing_id, event_date, status, customer_id")
      .eq("id", data.requestId)
      .eq("customer_id", context.userId)
      .single();
    if (reqError) throw reqError;
    if (request.status !== "accepted") throw new Error("You can only review accepted bookings");
    if (!request.event_date || request.event_date >= new Date().toISOString().slice(0, 10)) {
      throw new Error("You can review after your event date has passed");
    }

    const { error } = await context.supabase.from("reviews").insert({
      listing_id: request.listing_id,
      customer_id: context.userId,
      request_id: request.id,
      rating: data.rating,
      body: data.body || null,
      event_date: request.event_date,
      status: "pending",
    });
    if (error) throw error;
    return { ok: true };
  });
