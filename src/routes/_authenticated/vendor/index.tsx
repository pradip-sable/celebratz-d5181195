import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { getVendorDashboard } from "@/lib/dashboard.functions";
import { getVendorFormOptions, upsertVendorProfile } from "@/lib/vendor.functions";
import { VendorShell } from "@/components/VendorShell";
import { getDaysAgoText } from "@/components/ListingCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Store, Inbox, Clock, Package } from "lucide-react";

export const Route = createFileRoute("/_authenticated/vendor/")({
  component: VendorHome,
  head: () => ({
    meta: [
      { title: "Vendor dashboard | Celebratz" },
      { name: "description", content: "Manage your Celebratz listings, leads and availability calendar." },
      { property: "og:title", content: "Vendor dashboard | Celebratz" },
      { property: "og:description", content: "Manage your Celebratz listings, leads and availability calendar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function VendorHome() {
  const fetchDashboard = useServerFn(getVendorDashboard);
  const { data, isLoading } = useQuery({ queryKey: ["vendor-dashboard"], queryFn: () => fetchDashboard() });

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data?.vendor) return <VendorOnboarding />;

  const vendor = data.vendor;
  const newLeads = data.leads.filter((l: any) => l.status === "new").length;
  const liveListings = (data.listings ?? []).filter((l: any) => l.status === "live");

  // Staleness Radar: oldest availability_updated_at among live listings
  let staleness = { text: "No live listings", isStale: false };
  if (liveListings.length > 0) {
    const hasUnupdated = liveListings.some((l: any) => !l.availability_updated_at);
    if (hasUnupdated) {
      staleness = { text: "Update pending", isStale: true };
    } else {
      const timestamps = liveListings
        .map((l: any) => new Date(l.availability_updated_at).getTime())
        .filter((t: number) => !isNaN(t));
      if (timestamps.length > 0) {
        const oldestTime = Math.min(...timestamps);
        staleness = getDaysAgoText(new Date(oldestTime).toISOString());
      }
    }
  }

  return (
    <VendorShell>
      <div className="space-y-6">
        {/* Account status banners */}
        {vendor.status === "pending" && (
          <div className="rounded-2xl border border-accent/40 bg-accent/10 p-4 text-sm text-foreground">
            Your business is awaiting approval. You can create listings now — they go live once we approve your account.
          </div>
        )}
        {vendor.status === "rejected" && (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            Your application was not approved. {vendor.rejection_reason ?? "Please contact support."}
          </div>
        )}

        {/* 3 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* 1. Active Listings */}
          <div className="p-5 bg-card rounded-2xl border border-border shadow-2xs space-y-2">
            <div className="flex justify-between items-center text-muted-foreground text-xs font-semibold">
              <span>Active Listings</span>
              <Store className="w-4 h-4 text-primary" />
            </div>
            <div className="font-serif font-extrabold text-3xl text-foreground">
              {liveListings.length}
            </div>
            <p className="text-[11px] text-muted-foreground">Live in search results</p>
          </div>

          {/* 2. Total Leads Received */}
          <Link
            to="/vendor/leads"
            className="p-5 bg-card rounded-2xl border border-border shadow-2xs space-y-2 cursor-pointer hover:border-accent transition-colors group block"
          >
            <div className="flex justify-between items-center text-muted-foreground text-xs font-semibold">
              <span>Total Leads Received</span>
              <Inbox className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
            </div>
            <div className="font-serif font-extrabold text-3xl text-foreground flex items-center gap-2">
              <span>{data.leads.length}</span>
              {newLeads > 0 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-accent-subtle text-accent-dark border border-accent/40">
                  {newLeads} Pending
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground flex items-center justify-between">
              <span>{newLeads} awaiting vendor action</span>
              <span className="text-primary font-bold group-hover:underline">Open &rarr;</span>
            </p>
          </Link>

          {/* 3. Calendar Staleness Radar */}
          <div className="p-5 bg-card rounded-2xl border border-border shadow-2xs space-y-2">
            <div className="flex justify-between items-center text-muted-foreground text-xs font-semibold">
              <span>Calendar Staleness Radar</span>
              <Clock className={`w-4 h-4 ${staleness.isStale ? "text-warning" : "text-success"}`} />
            </div>
            <div
              className={`font-serif font-extrabold text-xl ${
                liveListings.length === 0
                  ? "text-muted-foreground"
                  : staleness.isStale
                    ? "text-warning"
                    : "text-success"
              }`}
            >
              {staleness.text}
            </div>
            <p className="text-[11px] text-muted-foreground">Tap dates regularly to keep availability fresh</p>
          </div>
        </div>

        {/* Recent Inquiries & Booking Requests */}
        <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-serif font-bold text-lg text-foreground">Recent Inquiries & Booking Requests</h3>
            <Link
              to="/vendor/leads"
              className="text-xs font-bold text-primary hover:underline cursor-pointer"
            >
              View & Manage All ({data.leads.length}) &rarr;
            </Link>
          </div>

          {data.leads.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground bg-muted/40 rounded-xl border border-border">
              No customer inquiries submitted yet. Explore listings on Celebratz and send a test request!
            </div>
          ) : (
            <div className="space-y-2.5">
              {data.leads.slice(0, 5).map((lead: any) => {
                const customerDisplay = lead.customer_name || lead.phone_snapshot || "Customer";
                const isPackage = Boolean(lead.package_id || lead.package?.name);
                const targetTitle = isPackage
                  ? lead.package?.name || "Package"
                  : lead.listing?.title || "Listing";

                return (
                  <div
                    key={lead.id}
                    className="p-3.5 bg-muted/40 hover:bg-muted/80 transition-colors rounded-xl border border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-foreground">{customerDisplay}</span>
                        <span className="text-muted-foreground">
                          &bull; {lead.event_type ? lead.event_type : String(lead.kind).replace("_", " ")}
                          {lead.event_date ? ` (${lead.event_date})` : ""}
                          {lead.phone_snapshot ? ` &bull; ${lead.phone_snapshot}` : ""}
                        </span>
                        <span className="text-foreground font-semibold">&rarr; {targetTitle}</span>
                        {lead.tier?.name && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-subtle text-primary border border-primary/30">
                            <span>{lead.tier.name}</span>
                          </span>
                        )}
                        {isPackage && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent-subtle text-accent-dark border border-accent/40">
                            <Package className="w-3 h-3 text-accent" />
                            <span>Package</span>
                          </span>
                        )}
                      </div>
                      {lead.message && (
                        <p className="text-[11px] text-muted-foreground italic">“{lead.message}”</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          lead.status === "accepted"
                            ? "bg-success-subtle text-success"
                            : lead.status === "declined"
                              ? "bg-destructive-subtle text-destructive"
                              : lead.status === "new"
                                ? "bg-warning/15 text-warning border border-warning/30"
                                : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {lead.status}
                      </span>
                      {lead.status === "new" && (
                        <Link
                          to="/vendor/leads"
                          className="px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-[11px] font-bold hover:bg-primary-hover cursor-pointer shadow-2xs"
                        >
                          Review & Accept
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </VendorShell>
  );
}

function VendorOnboarding() {
  const queryClient = useQueryClient();
  const fetchOptions = useServerFn(getVendorFormOptions);
  const save = useServerFn(upsertVendorProfile);
  const { data: options } = useQuery({ queryKey: ["vendor-form-options"], queryFn: () => fetchOptions() });
  const [form, setForm] = useState({
    business_name: "",
    contact_phone: "",
    contact_email: "",
    about: "",
    address: "",
    area_id: "",
  });

  const mutation = useMutation({
    mutationFn: () =>
      save({
        data: {
          business_name: form.business_name,
          contact_phone: form.contact_phone,
          contact_email: form.contact_email || undefined,
          about: form.about || undefined,
          address: form.address || undefined,
          area_id: form.area_id || undefined,
        },
      }),
    onSuccess: () => {
      toast.success("Business profile created — pending approval");
      queryClient.invalidateQueries({ queryKey: ["vendor-dashboard"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not save profile"),
  });

  return (
    <div className="mx-auto max-w-xl px-4 py-8 pb-24 md:py-12">
      <div className="flex items-center gap-3">
        <Store className="h-6 w-6 text-primary" />
        <h1 className="font-serif text-2xl font-semibold">Set up your business</h1>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Enter your details to create your Celebratz vendor profile. Once submitted, our team will review and approve
        your account.
      </p>

      <form
        className="mt-6 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
      >
        <div>
          <Label htmlFor="business_name">Business name *</Label>
          <Input
            id="business_name"
            required
            value={form.business_name}
            onChange={(e) => setForm({ ...form, business_name: e.target.value })}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="contact_phone">Contact phone *</Label>
            <Input
              id="contact_phone"
              required
              inputMode="tel"
              value={form.contact_phone}
              onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="contact_email">Contact email</Label>
            <Input
              id="contact_email"
              type="email"
              value={form.contact_email}
              onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="area">Primary area in Pune</Label>
          <select
            id="area"
            className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={form.area_id}
            onChange={(e) => setForm({ ...form, area_id: e.target.value })}
          >
            <option value="">Select an area</option>
            {(options?.areas ?? []).map((a: any) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="about">About your business</Label>
          <Textarea
            id="about"
            rows={3}
            value={form.about}
            onChange={(e) => setForm({ ...form, about: e.target.value })}
          />
        </div>

        <Button type="submit" disabled={mutation.isPending} className="w-full rounded-xl">
          {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit for review
        </Button>
      </form>
    </div>
  );
}
