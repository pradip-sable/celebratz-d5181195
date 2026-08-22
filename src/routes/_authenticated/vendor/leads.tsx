import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { getVendorLeads } from "@/lib/vendor.functions";
import { updateRequestStatus } from "@/lib/dashboard.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Phone, CalendarDays, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/_authenticated/vendor/leads")({
  component: VendorLeads,
  head: () => ({
    meta: [
      { title: "Leads & enquiries | Celebratz" },
      { name: "description", content: "Review booking requests and enquiries from customers on Celebratz." },
      { property: "og:title", content: "Leads & enquiries | Celebratz" },
      { property: "og:description", content: "Review booking requests and enquiries from customers on Celebratz." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const FILTERS = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "accepted", label: "Accepted" },
  { value: "declined", label: "Declined" },
  { value: "closed", label: "Closed" },
];

function VendorLeads() {
  const fetchLeads = useServerFn(getVendorLeads);
  const setStatus = useServerFn(updateRequestStatus);
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");

  const { data, isLoading } = useQuery({ queryKey: ["vendor-leads"], queryFn: () => fetchLeads() });

  const mutation = useMutation({
    mutationFn: (vars: { requestId: string; status: "accepted" | "declined" | "closed" }) =>
      setStatus({ data: vars }),
    onSuccess: () => {
      toast.success("Lead updated");
      queryClient.invalidateQueries({ queryKey: ["vendor-leads"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-dashboard"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not update lead"),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data?.vendor) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-serif text-2xl font-semibold">Set up your business first</h1>
        <p className="mt-2 text-sm text-muted-foreground">Create your vendor profile to start receiving leads.</p>
        <Button asChild className="mt-6 rounded-xl">
          <Link to="/vendor">Go to vendor hub</Link>
        </Button>
      </div>
    );
  }

  const leads = data.leads.filter((l: any) => filter === "all" || l.status === filter);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 pb-24 md:py-12">
      <h1 className="font-serif text-2xl font-semibold">Leads & enquiries</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Accept a lead to unlock the review request after the event date, or decline to keep your pipeline clean.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-full border px-3 py-1.5 text-sm ${
              filter === f.value ? "border-primary bg-primary/10 text-primary" : "border-border/60 text-muted-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {leads.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">No leads in this view yet.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {leads.map((lead: any) => (
            <div key={lead.id} className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{lead.customer_name ?? "Guest customer"}</p>
                  <p className="text-sm text-muted-foreground">{lead.listing?.title}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {lead.kind === "booking_request" ? "Booking request" : "Enquiry"}
                  </Badge>
                  <Badge variant={lead.status === "accepted" ? "default" : "outline"}>{lead.status}</Badge>
                </div>
              </div>

              <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                {lead.event_date && (
                  <span className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" /> Event: {lead.event_date}
                  </span>
                )}
                {lead.visit_date && (
                  <span className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" /> Visit: {lead.visit_date}
                    {lead.visit_time ? ` at ${String(lead.visit_time).slice(0, 5)}` : ""}
                  </span>
                )}
                {lead.guest_count && <span>Guests: {lead.guest_count}</span>}
                {lead.phone_snapshot && (
                  <a href={`tel:${lead.phone_snapshot}`} className="flex items-center gap-2 text-primary">
                    <Phone className="h-4 w-4" /> {lead.phone_snapshot}
                  </a>
                )}
              </div>

              {lead.message && (
                <p className="mt-3 flex gap-2 rounded-xl bg-muted/50 p-3 text-sm">
                  <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  {lead.message}
                </p>
              )}

              {lead.status === "new" && (
                <div className="mt-4 flex gap-2">
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
              {lead.status === "accepted" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-4 rounded-xl"
                  disabled={mutation.isPending}
                  onClick={() => mutation.mutate({ requestId: lead.id, status: "closed" })}
                >
                  Mark as closed
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
