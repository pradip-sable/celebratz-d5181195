import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const requestSchema = z.object({
  listingId: z.string().uuid(),
  kind: z.enum(["booking_request", "enquiry"]),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  visitDate: z.string().optional(),
  visitTime: z.string().optional(),
  message: z.string().max(1000).optional(),
  customerName: z.string().min(1).max(100),
  customerPhone: z.string().min(10).max(20),
  customerPhoneConfirm: z.string().min(10).max(20),
});

function publicClient() {
  return createClient<Database>(
    process.env["SUPABASE_URL"]!,
    process.env["SUPABASE_PUBLISHABLE_KEY"]!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

export const submitRequest = createServerFn({ method: "POST" })
  .inputValidator((data) => requestSchema.parse(data))
  .handler(async ({ data }) => {
    if (data.customerPhone !== data.customerPhoneConfirm) {
      throw new Error("Phone numbers do not match");
    }

    const supabase = publicClient();

    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("id, title, vendor_id")
      .eq("id", data.listingId)
      .eq("status", "live")
      .single();

    if (listingError || !listing) {
      throw new Error("Listing not found");
    }

    const { error } = await supabase.from("requests").insert({
      listing_id: listing.id,
      vendor_id: listing.vendor_id,
      kind: data.kind,
      event_date: data.eventDate,
      visit_date: data.visitDate || null,
      visit_time: data.visitTime || null,
      message: data.message || null,
      phone_snapshot: data.customerPhone,
    });

    if (error) throw error;
    return { ok: true };
  });
