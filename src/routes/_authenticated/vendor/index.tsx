import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { getVendorDashboard, updateRequestStatus } from "@/lib/dashboard.functions";
import { getVendorFormOptions, upsertVendorProfile } from "@/lib/vendor.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CalendarDays, Plus, Store } from "lucide-react";

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

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 pb-24 md:py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold">{vendor.business_name}</h1>
          <p className="mt-1 text-sm capitalize text-muted-foreground">Account status: {vendor.status}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="rounded-xl">
            <Link to="/vendor/profile">Business profile</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl">
            <Link to="/vendor/leads">All leads</Link>
          </Button>
          <Button asChild className="rounded-xl">
            <Link to="/vendor/listings/new">
              <Plus className="mr-2 h-4 w-4" /> New listing
            </Link>
          </Button>
        </div>

      </div>

      {vendor.status === "pending" && (
        <div className="mt-6 rounded-2xl border border-accent/40 bg-accent/10 p-4 text-sm">
          Your business is awaiting approval. You can create listings now — they go live once we approve your account.
        </div>
      )}
      {vendor.status === "rejected" && (
        <div className="mt-6 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm">
          Your application was not approved. {vendor.rejection_reason ?? "Please contact support."}
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Listings" value={data.listings.length} />
        <Stat label="Total leads" value={data.leads.length} />
        <Stat label="New leads" value={newLeads} />
      </div>

      <section className="mt-10">
        <h2 className="font-serif text-xl font-semibold">My listings</h2>
        {data.listings.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-border p-6 text-center text-muted-foreground">
            No listings yet. Create your first one to start receiving leads.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {data.listings.map((listing: any) => (
              <div key={listing.id} className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{listing.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {listing.category?.name} • ₹{Number(listing.price_from ?? 0).toLocaleString("en-IN")}{" "}
                      {String(listing.price_unit).replace("per_", "per ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium capitalize">
                      {listing.status}
                    </span>
                    <Button asChild variant="outline" size="sm" className="rounded-xl">
                      <Link to="/vendor/calendar/$listingId" params={{ listingId: listing.id }}>
                        <CalendarDays className="mr-1.5 h-4 w-4" /> Calendar
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <LeadsSection leads={data.leads} />
    </div>
  );
}

function LeadsSection({ leads }: { leads: any[] }) {
  const queryClient = useQueryClient();
  const update = useServerFn(updateRequestStatus);
  const mutation = useMutation({
    mutationFn: (vars: { requestId: string; status: "accepted" | "declined" }) => update({ data: vars }),
    onSuccess: () => {
      toast.success("Lead updated");
      queryClient.invalidateQueries({ queryKey: ["vendor-dashboard"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not update lead"),
  });

  return (
    <section className="mt-10">
      <h2 className="font-serif text-xl font-semibold">Leads &amp; enquiries</h2>
      {leads.length === 0 ? (
        <p className="mt-3 rounded-2xl border border-dashed border-border p-6 text-center text-muted-foreground">
          No leads yet.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {leads.map((lead) => (
            <div key={lead.id} className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{lead.listing?.title}</p>
                  <p className="text-sm capitalize text-muted-foreground">
                    {String(lead.kind).replace("_", " ")} • {lead.status}
                  </p>
                  {lead.event_date && <p className="mt-1 text-sm">Event date: {lead.event_date}</p>}
                  {lead.visit_date && (
                    <p className="text-sm">
                      Visit: {lead.visit_date} {lead.visit_time ?? ""}
                    </p>
                  )}
                  {lead.phone_snapshot && <p className="text-sm">Phone: {lead.phone_snapshot}</p>}
                  {lead.message && <p className="mt-2 text-sm text-muted-foreground">“{lead.message}”</p>}
                </div>
                {lead.status === "new" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="rounded-xl"
                      disabled={mutation.isPending}
                      onClick={() => mutation.mutate({ requestId: lead.id, status: "accepted" })}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
                      disabled={mutation.isPending}
                      onClick={() => mutation.mutate({ requestId: lead.id, status: "declined" })}
                    >
                      Decline
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
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
        Tell us about your venue or service. We review every business before listings go live.
      </p>

      <form
        className="mt-6 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
      >
        <div>
          <Label htmlFor="business_name">Business name</Label>
          <Input
            id="business_name"
            required
            value={form.business_name}
            onChange={(e) => setForm({ ...form, business_name: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="contact_phone">Contact phone</Label>
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
        <div>
          <Label htmlFor="area">Primary area</Label>
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
          <Input id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="about">About your business</Label>
          <Textarea id="about" rows={4} value={form.about} onChange={(e) => setForm({ ...form, about: e.target.value })} />
        </div>
        <Button type="submit" className="w-full rounded-xl" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create business profile
        </Button>
      </form>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
