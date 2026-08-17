import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw error;
  if (!data) throw new Error("Forbidden");
}

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);

    const [{ data: vendors }, { data: listings }, { data: requests }, { data: reviews }] = await Promise.all([
      context.supabase
        .from("vendors")
        .select("id, business_name, status, contact_phone, contact_email, about, created_at")
        .order("created_at", { ascending: false }),
      context.supabase
        .from("listings")
        .select("id, title, slug, status, price_from, price_unit, created_at, category:categories(name), vendor:vendors(business_name)")
        .order("created_at", { ascending: false }),
      context.supabase
        .from("requests")
        .select("id, kind, status, event_date, created_at, phone_snapshot, listing:listings(title)")
        .order("created_at", { ascending: false })
        .limit(50),
      context.supabase
        .from("reviews")
        .select("id, rating, body, status, created_at, listing:listings(title)")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    return {
      vendors: vendors ?? [],
      listings: listings ?? [],
      requests: requests ?? [],
      reviews: reviews ?? [],
    };
  });

export const setVendorStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        vendorId: z.string().uuid(),
        status: z.enum(["approved", "rejected", "pending"]),
        reason: z.string().max(500).optional(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("vendors")
      .update({
        status: data.status,
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
        rejection_reason: data.status === "rejected" ? data.reason ?? null : null,
      })
      .eq("id", data.vendorId);
    if (error) throw error;
    return { ok: true };
  });

export const setListingStatusAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        listingId: z.string().uuid(),
        status: z.enum(["live", "rejected", "pending", "paused", "draft"]),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("listings")
      .update({ status: data.status })
      .eq("id", data.listingId);
    if (error) throw error;
    return { ok: true };
  });

export const setReviewStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ reviewId: z.string().uuid(), status: z.enum(["approved", "rejected", "pending"]) }).parse(data),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("reviews")
      .update({ status: data.status })
      .eq("id", data.reviewId);
    if (error) throw error;
    return { ok: true };
  });

export const getIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { isAdmin: Boolean(data) };
  });
