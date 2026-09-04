import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Calendar, Phone, User, MessageSquare, Check, AlertCircle, Gift, Layers } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { getRequestTarget, submitRequest, submitRequestAsUser } from "@/lib/requests.functions";
import { Button } from "@/components/ui/button";
import { computePackagePrice, formatInr, unitLabel } from "@/lib/pricing";

const requestSchema = z.object({
  listing: z.string().optional(),
  pkg: z.string().optional(),
  tier: z.string().optional(),
  kind: z.enum(["booking_request", "enquiry"]).optional(),
});

export const Route = createFileRoute("/request")({
  component: RequestPage,
  validateSearch: requestSchema,
  head: () => ({
    meta: [
      { title: "Request to Book | Celebratz" },
      { name: "description", content: "Send a booking request or enquiry to a Pune celebration vendor." },
      { property: "og:title", content: "Request to Book | Celebratz" },
      { property: "og:description", content: "Send a booking request or enquiry to a Pune celebration vendor." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function RequestPage() {
  const search = useSearch({ from: "/request" });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTierId, setSelectedTierId] = useState<string>(search.tier ?? "");
  const [form, setForm] = useState({
    kind: search.kind ?? "booking_request",
    eventDate: "",
    visitDate: "",
    visitTime: "",
    message: "",
    guestCount: "",
    customerName: "",
    customerPhone: "",
    customerPhoneConfirm: "",
    consent: false,
  });

  const listingId = search.listing ?? "";
  const packageId = search.pkg ?? "";

  const fetchTarget = useServerFn(getRequestTarget);
  const { data: target } = useQuery({
    queryKey: ["request-target", listingId, packageId],
    queryFn: () => fetchTarget({ data: { listingId: listingId || undefined, packageId: packageId || undefined } }),
    enabled: Boolean(listingId || packageId),
  });

  const sendGuestRequest = useServerFn(submitRequest);
  const sendUserRequest = useServerFn(submitRequestAsUser);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSignedIn(Boolean(data.session));
      if (!data.session) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", data.session.user.id)
        .maybeSingle();
      if (!active || !profile) return;
      setForm((f) => ({
        ...f,
        customerName: f.customerName || profile.full_name || "",
        customerPhone: f.customerPhone || profile.phone || "",
        customerPhoneConfirm: f.customerPhoneConfirm || profile.phone || "",
      }));
    });
    return () => {
      active = false;
    };
  }, []);

  const tiers =
    target && target.type === "listing"
      ? ((target.listing as any).listing_tiers ?? [])
          .filter((t: any) => t.is_active)
          .sort((a: any, b: any) => a.sort_order - b.sort_order)
      : [];
  const hasTiers = tiers.length >= 2;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!listingId && !packageId) {
      setError("Nothing selected to request.");
      return;
    }
    if (form.customerPhone !== form.customerPhoneConfirm) {
      setError("Phone numbers do not match.");
      return;
    }
    if (hasTiers && !selectedTierId) {
      setError("Please choose a package tier.");
      return;
    }
    if (!form.consent) {
      setError("Please agree to share your contact details with the vendor.");
      return;
    }

    try {
      const send = signedIn ? sendUserRequest : sendGuestRequest;
      await send({
        data: {
          listingId: listingId || undefined,
          packageId: packageId || undefined,
          selectedTierId: listingId && selectedTierId ? selectedTierId : undefined,
          kind: form.kind as "booking_request" | "enquiry",
          eventDate: form.eventDate,
          visitDate: form.visitDate,
          visitTime: form.visitTime,
          message: form.message,
          guestCount: form.guestCount ? Number(form.guestCount) : undefined,
          customerName: form.customerName,
          customerPhone: form.customerPhone,
          customerPhoneConfirm: form.customerPhoneConfirm,
        },
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong. Please try again.");
    }
  };

  if (!listingId && !packageId) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-4 font-serif text-xl font-semibold">Nothing selected</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Browse listings or packages and choose one to request a booking or send an enquiry.
        </p>
        <Link to="/search" className="mt-6 inline-block rounded-xl bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground">
          Browse listings
        </Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
          <Check className="h-7 w-7 text-emerald-700" />
        </div>
        <h1 className="mt-4 font-serif text-xl font-semibold">Request sent!</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The vendor will contact you soon to discuss details. You can track your requests in your dashboard.
        </p>
        <Link to="/dashboard" className="mt-6 inline-block rounded-xl bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground">
          My requests
        </Link>
      </div>
    );
  }

  const returnTo = packageId
    ? `/request?pkg=${packageId}&kind=${form.kind}`
    : `/request?listing=${listingId}&kind=${form.kind}${selectedTierId ? `&tier=${selectedTierId}` : ""}`;

  return (
    <div className="mx-auto max-w-xl px-4 pb-28 pt-6 md:pb-12 md:pt-10">
      <h1 className="font-serif text-2xl font-semibold">
        {form.kind === "enquiry" ? "Send an enquiry" : "Request to book"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Fill in a few details and the vendor will reach out to confirm availability and pricing.
      </p>

      {target?.type === "listing" && (
        <div className="mt-4 rounded-2xl border border-border/60 bg-card p-4">
          <p className="text-xs text-muted-foreground">{(target.listing as any).categories?.name}</p>
          <p className="font-serif text-lg font-semibold">{(target.listing as any).title}</p>
        </div>
      )}

      {target?.type === "package" && (
        <div className="mt-4 rounded-2xl border border-border/60 bg-card p-4">
          <p className="flex items-center gap-1 text-xs font-medium text-primary">
            <Gift className="h-3.5 w-3.5" /> Package
          </p>
          <p className="font-serif text-lg font-semibold">{(target.pkg as any).name}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {(target.pkg as any).components.map((c: any) => c.title).join(" · ")}
          </p>
          <p className="mt-2 text-sm font-semibold">
            Indicative from{" "}
            {formatInr(
              computePackagePrice(
                (target.pkg as any).components,
                (target.pkg as any).discount_type,
                (target.pkg as any).discount_value,
              ).total,
            )}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5 rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium">Request type</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, kind: "booking_request" }))}
              className={`rounded-xl border px-4 py-2.5 text-sm font-medium ${form.kind === "booking_request" ? "border-primary bg-primary/10 text-primary" : "border-border"}`}
            >
              Request to Book
            </button>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, kind: "enquiry" }))}
              className={`rounded-xl border px-4 py-2.5 text-sm font-medium ${form.kind === "enquiry" ? "border-primary bg-primary/10 text-primary" : "border-border"}`}
            >
              Enquire
            </button>
          </div>
        </div>

        {hasTiers && (
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
              <Layers className="h-4 w-4 text-primary" /> Choose a package tier
            </label>
            <div className="space-y-2">
              {tiers.map((tier: any) => (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => setSelectedTierId(tier.id)}
                  className={`w-full rounded-xl border p-3 text-left ${selectedTierId === tier.id ? "border-primary bg-primary/5" : "border-border"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{tier.name}</span>
                    <span className="text-sm font-semibold">
                      {formatInr(Number(tier.price))}{" "}
                      <span className="text-xs font-normal text-muted-foreground">
                        {unitLabel((target as any).listing.price_unit)}
                      </span>
                    </span>
                  </div>
                  {tier.description && <p className="mt-1 text-sm text-muted-foreground">{tier.description}</p>}
                  {tier.features?.length ? (
                    <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                      {tier.features.map((feature: string, i: number) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <Check className="mt-0.5 h-3 w-3 text-primary" /> {feature}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium">Event date</label>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <input
              type="date"
              required
              value={form.eventDate}
              onChange={(e) => setForm((f) => ({ ...f, eventDate: e.target.value }))}
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Preferred visit date</label>
            <input
              type="date"
              value={form.visitDate}
              onChange={(e) => setForm((f) => ({ ...f, visitDate: e.target.value }))}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Preferred time</label>
            <input
              type="time"
              value={form.visitTime}
              onChange={(e) => setForm((f) => ({ ...f, visitTime: e.target.value }))}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Approximate guest count</label>
          <input
            inputMode="numeric"
            value={form.guestCount}
            onChange={(e) => setForm((f) => ({ ...f, guestCount: e.target.value.replace(/\D/g, "") }))}
            placeholder="e.g. 200"
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none"
          />
        </div>

        {signedIn === false && (
          <div className="rounded-xl border border-border/60 bg-muted/30 p-3 text-sm">
            <p className="font-medium">Continuing as a guest</p>
            <p className="mt-1 text-muted-foreground">
              <Link to="/auth" search={{ returnTo }} className="font-medium text-primary">
                Sign in
              </Link>{" "}
              to track this request in your dashboard and reuse your details next time.
            </p>
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium">Your name</label>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <input
              required
              value={form.customerName}
              onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
              placeholder="Full name"
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Phone number</label>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <input
              required
              type="tel"
              value={form.customerPhone}
              onChange={(e) => setForm((f) => ({ ...f, customerPhone: e.target.value }))}
              placeholder="+91 98765 43210"
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Confirm phone number</label>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <input
              required
              type="tel"
              value={form.customerPhoneConfirm}
              onChange={(e) => setForm((f) => ({ ...f, customerPhoneConfirm: e.target.value }))}
              placeholder="Type phone number again"
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Message</label>
          <div className="flex items-start gap-2 rounded-xl border border-border bg-background px-3 py-2">
            <MessageSquare className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <textarea
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              placeholder="Tell the vendor about your event, guest count, or any questions..."
              rows={3}
              className="w-full resize-none bg-transparent text-sm outline-none"
            />
          </div>
        </div>

        <label className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/30 p-3 text-sm">
          <input
            type="checkbox"
            checked={form.consent}
            onChange={(e) => setForm((f) => ({ ...f, consent: e.target.checked }))}
            className="mt-0.5 h-4 w-4"
          />
          <span>
            I agree that my name and phone number will be shared with the vendor so they can contact me about this request.
          </span>
        </label>

        <Button type="submit" className="w-full rounded-xl">
          {form.kind === "enquiry" ? "Send enquiry" : "Send request"}
        </Button>
      </form>
    </div>
  );
}
