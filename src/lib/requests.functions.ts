import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

const requestSchema = z.object({
  listingId: z.string().uuid(),
  kind: z.enum(["booking_request", "enquiry"]),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  visitDate: z.string().optional(),
  visitTime: z.string().optional(),
  message: z.string().max(1000).optional(),
  guestCount: z.coerce.number().int().positive().optional(),
  customerName: z.string().min(1).max(100),
  customerPhone: z.string().min(10).max(20),
  customerPhoneConfirm: z.string().min(10).max(20),
});

type RequestInput = z.infer<typeof requestSchema>;

function publicClient() {
  return createClient<Database>(
    process.env["SUPABASE_URL"]!,
    process.env["SUPABASE_PUBLISHABLE_KEY"]!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

function buildRow(data: RequestInput, listing: { id: string; vendor_id: string }, customerId: string | null) {
  return {
    listing_id: listing.id,
    vendor_id: listing.vendor_id,
    customer_id: customerId,
    kind: data.kind,
    event_date: data.eventDate,
    visit_date: data.visitDate || null,
    visit_time: data.visitTime || null,
    message: data.message || null,
    guest_count: data.guestCount ?? null,
    consent_at: new Date().toISOString(),
    phone_snapshot: data.customerPhone,
  };
}

/** Guest submission (no session). */
export const submitRequest = createServerFn({ method: "POST" })
  .inputValidator((data) => requestSchema.parse(data))
  .handler(async ({ data }) => {
    if (data.customerPhone !== data.customerPhoneConfirm) {
      throw new Error("Phone numbers do not match");
    }

    const supabase = publicClient();

    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("id, vendor_id")
      .eq("id", data.listingId)
      .eq("status", "live")
      .single();

    if (listingError || !listing) throw new Error("Listing not found");

    const { error } = await supabase.from("requests").insert(buildRow(data, listing, null));
    if (error) throw error;
    return { ok: true };
  });

/** Signed-in submission — links the request to the customer and saves their phone on the profile. */
export const submitRequestAsUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => requestSchema.parse(data))
  .handler(async ({ data, context }) => {
    if (data.customerPhone !== data.customerPhoneConfirm) {
      throw new Error("Phone numbers do not match");
    }

    const { data: listing, error: listingError } = await context.supabase
      .from("listings")
      .select("id, vendor_id")
      .eq("id", data.listingId)
      .eq("status", "live")
      .single();

    if (listingError || !listing) throw new Error("Listing not found");

    const { error } = await context.supabase
      .from("requests")
      .insert(buildRow(data, listing, context.userId));
    if (error) throw error;

    await context.supabase
      .from("profiles")
      .update({ phone: data.customerPhone, full_name: data.customerName })
      .eq("id", context.userId);

    return { ok: true };
  });
