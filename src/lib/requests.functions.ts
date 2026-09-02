import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

const requestSchema = z
  .object({
    listingId: z.string().uuid().optional(),
    packageId: z.string().uuid().optional(),
    selectedTierId: z.string().uuid().optional(),
    kind: z.enum(["booking_request", "enquiry"]),
    eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
    visitDate: z.string().optional(),
    visitTime: z.string().optional(),
    message: z.string().max(1000).optional(),
    guestCount: z.coerce.number().int().positive().optional(),
    customerName: z.string().min(1).max(100),
    customerPhone: z.string().min(10).max(20),
    customerPhoneConfirm: z.string().min(10).max(20),
  })
  .refine((d) => Boolean(d.listingId) !== Boolean(d.packageId), {
    message: "A request must target exactly one listing or one package",
  })
  .refine((d) => !d.selectedTierId || Boolean(d.listingId), {
    message: "A package tier can only be selected on a single-listing request",
  });

type RequestInput = z.infer<typeof requestSchema>;

function publicClient() {
  return createClient<Database>(
    process.env["SUPABASE_URL"]!,
    process.env["SUPABASE_PUBLISHABLE_KEY"]!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

function buildRow(
  data: RequestInput,
  target: { listingId: string | null; packageId: string | null; vendorId: string },
  customerId: string | null,
) {
  return {
    listing_id: target.listingId,
    package_id: target.packageId,
    selected_tier_id: target.listingId ? data.selectedTierId ?? null : null,
    vendor_id: target.vendorId,
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

type AnySupabase = ReturnType<typeof publicClient>;

/** Resolves the request target (a live listing or a live package) to its vendor. */
async function resolveTarget(supabase: AnySupabase, data: RequestInput) {
  if (data.listingId) {
    const { data: listing, error } = await supabase
      .from("listings")
      .select("id, vendor_id")
      .eq("id", data.listingId)
      .eq("status", "live")
      .single();
    if (error || !listing) throw new Error("Listing not found");

    if (data.selectedTierId) {
      const { data: tier } = await supabase
        .from("listing_tiers")
        .select("id")
        .eq("id", data.selectedTierId)
        .eq("listing_id", listing.id)
        .eq("is_active", true)
        .maybeSingle();
      if (!tier) throw new Error("Selected package tier is no longer available");
    }

    return { listingId: listing.id, packageId: null, vendorId: listing.vendor_id };
  }

  const { data: pkg, error } = await supabase
    .from("packages")
    .select("id, vendor_id")
    .eq("id", data.packageId!)
    .eq("status", "live")
    .single();
  if (error || !pkg) throw new Error("Package not found");
  return { listingId: null, packageId: pkg.id, vendorId: pkg.vendor_id };
}


/** Guest submission (no session). */
export const submitRequest = createServerFn({ method: "POST" })
  .inputValidator((data) => requestSchema.parse(data))
  .handler(async ({ data }) => {
    if (data.customerPhone !== data.customerPhoneConfirm) {
      throw new Error("Phone numbers do not match");
    }

    const supabase = publicClient();
    const target = await resolveTarget(supabase, data);

    const { error } = await supabase.from("requests").insert(buildRow(data, target, null));
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

    const target = await resolveTarget(context.supabase as unknown as AnySupabase, data);

    const { error } = await context.supabase
      .from("requests")
      .insert(buildRow(data, target, context.userId));
    if (error) throw error;


    await context.supabase
      .from("profiles")
      .update({ phone: data.customerPhone, full_name: data.customerName })
      .eq("id", context.userId);

    return { ok: true };
  });
