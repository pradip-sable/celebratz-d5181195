import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  getAdminOverview,
  setListingStatusAdmin,
  setReviewStatus,
  setVendorStatus,
} from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPanel,
  head: () => ({
    meta: [
      { title: "Admin panel | Celebratz" },
      { name: "description", content: "Approve vendors, moderate listings and reviews across Celebratz." },
      { property: "og:title", content: "Admin panel | Celebratz" },
      { property: "og:description", content: "Approve vendors, moderate listings and reviews across Celebratz." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function AdminPanel() {
  const queryClient = useQueryClient();
  const fetchOverview = useServerFn(getAdminOverview);
  const vendorStatus = useServerFn(setVendorStatus);
  const listingStatus = useServerFn(setListingStatusAdmin);
  const reviewStatus = useServerFn(setReviewStatus);

  const { data, isLoading, error } = useQuery({ queryKey: ["admin-overview"], queryFn: () => fetchOverview() });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
  const onError = (e: any) => toast.error(e?.message ?? "Action failed");

  const vendorMutation = useMutation({
    mutationFn: (vars: { vendorId: string; status: "approved" | "rejected" }) => vendorStatus({ data: vars }),
    onSuccess: () => {
      toast.success("Vendor updated");
      invalidate();
    },
    onError,
  });
  const listingMutation = useMutation({
    mutationFn: (vars: { listingId: string; status: "live" | "rejected" | "paused" }) => listingStatus({ data: vars }),
    onSuccess: () => {
      toast.success("Listing updated");
      invalidate();
    },
    onError,
  });
  const reviewMutation = useMutation({
    mutationFn: (vars: { reviewId: string; status: "approved" | "rejected" }) => reviewStatus({ data: vars }),
    onSuccess: () => {
      toast.success("Review updated");
      invalidate();
    },
    onError,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <ShieldAlert className="mx-auto h-8 w-8 text-muted-foreground" />
        <h1 className="mt-4 font-serif text-xl font-semibold">Admins only</h1>
        <p className="mt-2 text-sm text-muted-foreground">This area is restricted to Celebratz administrators.</p>
      </div>
    );
  }

  const pendingVendors = (data?.vendors ?? []).filter((v: any) => v.status === "pending");
  const pendingListings = (data?.listings ?? []).filter((l: any) => l.status === "pending");
  const pendingReviews = (data?.reviews ?? []).filter((r: any) => r.status === "pending");

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 pb-24 md:py-12">
      <h1 className="font-serif text-2xl font-semibold">Admin panel</h1>

      <section className="mt-8">
        <h2 className="font-serif text-xl font-semibold">Vendors pending approval ({pendingVendors.length})</h2>
        <div className="mt-4 space-y-3">
          {pendingVendors.length === 0 && <Empty>No vendors waiting.</Empty>}
          {pendingVendors.map((v: any) => (
            <Card key={v.id}>
              <div>
                <p className="font-medium">{v.business_name}</p>
                <p className="text-sm text-muted-foreground">
                  {v.contact_phone} {v.contact_email ? `• ${v.contact_email}` : ""}
                </p>
                {v.about && <p className="mt-2 text-sm text-muted-foreground">{v.about}</p>}
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="rounded-xl" onClick={() => vendorMutation.mutate({ vendorId: v.id, status: "approved" })}>
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => vendorMutation.mutate({ vendorId: v.id, status: "rejected" })}
                >
                  Reject
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-xl font-semibold">Listings pending review ({pendingListings.length})</h2>
        <div className="mt-4 space-y-3">
          {pendingListings.length === 0 && <Empty>No listings waiting.</Empty>}
          {pendingListings.map((l: any) => (
            <Card key={l.id}>
              <div>
                <p className="font-medium">{l.title}</p>
                <p className="text-sm text-muted-foreground">
                  {l.vendor?.business_name} • {l.category?.name}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="rounded-xl" onClick={() => listingMutation.mutate({ listingId: l.id, status: "live" })}>
                  Publish
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => listingMutation.mutate({ listingId: l.id, status: "rejected" })}
                >
                  Reject
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-xl font-semibold">Reviews to moderate ({pendingReviews.length})</h2>
        <div className="mt-4 space-y-3">
          {pendingReviews.length === 0 && <Empty>No reviews waiting.</Empty>}
          {pendingReviews.map((r: any) => (
            <Card key={r.id}>
              <div>
                <p className="font-medium">
                  {r.rating}★ — {r.listing?.title}
                </p>
                {r.body && <p className="mt-1 text-sm text-muted-foreground">“{r.body}”</p>}
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="rounded-xl" onClick={() => reviewMutation.mutate({ reviewId: r.id, status: "approved" })}>
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => reviewMutation.mutate({ reviewId: r.id, status: "rejected" })}
                >
                  Reject
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-xl font-semibold">All listings ({data?.listings.length ?? 0})</h2>
        <div className="mt-4 space-y-3">
          {(data?.listings ?? []).map((l: any) => (
            <Card key={l.id}>
              <div>
                <p className="font-medium">{l.title}</p>
                <p className="text-sm capitalize text-muted-foreground">
                  {l.vendor?.business_name} • {l.status}
                </p>
              </div>
              {l.status === "live" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => listingMutation.mutate({ listingId: l.id, status: "paused" })}
                >
                  Pause
                </Button>
              )}
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-xl font-semibold">Recent requests</h2>
        <div className="mt-4 space-y-3">
          {(data?.requests ?? []).map((r: any) => (
            <Card key={r.id}>
              <div>
                <p className="font-medium">{r.listing?.title}</p>
                <p className="text-sm capitalize text-muted-foreground">
                  {String(r.kind).replace("_", " ")} • {r.status} {r.event_date ? `• ${r.event_date}` : ""}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-2xl border border-dashed border-border p-6 text-center text-muted-foreground">{children}</p>
  );
}
