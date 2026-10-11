import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import {
  getAdminOverview,
  setListingFeatured,
  setListingStatusAdmin,
  setPackageStatusAdmin,
  setReviewStatus,
  setVendorStatus,
} from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { AlertCircle, AlertTriangle, ExternalLink, Loader2, ShieldAlert, Star } from "lucide-react";
import { useModalScrollLock } from "@/hooks/useModalScrollLock";
import { computePackagePrice, formatInr } from "@/lib/pricing";

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
  const listingFeatured = useServerFn(setListingFeatured);
  const packageStatus = useServerFn(setPackageStatusAdmin);
  const reviewStatus = useServerFn(setReviewStatus);

  const [rejectModalData, setRejectModalData] = useState<{
    packageId: string;
    title: string;
  } | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useModalScrollLock(Boolean(rejectModalData), () => setRejectModalData(null));

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
  const featuredMutation = useMutation({
    mutationFn: (vars: { listingId: string; isFeatured: boolean }) => listingFeatured({ data: vars }),
    onSuccess: () => {
      toast.success("Featured status updated");
      invalidate();
    },
    onError,
  });
  const packageMutation = useMutation({
    mutationFn: (vars: { packageId: string; status: "live" | "rejected" | "paused"; reason?: string }) =>
      packageStatus({ data: vars }),
    onSuccess: () => {
      toast.success("Package updated");
      invalidate();
      setRejectModalData(null);
      setRejectionReason("");
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

  const handleConfirmRejection = () => {
    if (!rejectModalData) return;
    const reason = rejectionReason.trim() || "Submission does not meet quality and verification standards.";
    packageMutation.mutate({
      packageId: rejectModalData.packageId,
      status: "rejected",
      reason,
    });
  };

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
  const pendingPackages = (data?.packages ?? []).filter((p: any) => p.status === "pending");
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
        <h2 className="font-serif text-xl font-semibold">Packages pending review ({pendingPackages.length})</h2>
        <div className="mt-4 space-y-3">
          {pendingPackages.length === 0 && <Empty>No packages waiting.</Empty>}
          {pendingPackages.map((pkg: any) => {
            const price = computePackagePrice(pkg.components, pkg.discount_type, pkg.discount_value);
            return (
              <Card key={pkg.id}>
                <div className="space-y-1.5 flex-1 min-w-0 pr-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-foreground">{pkg.name}</p>
                    <span className="rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-bold text-warning border border-warning/20 capitalize">
                      Pending
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {pkg.vendor?.business_name} • {pkg.components?.length || 0} services bundled
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-semibold text-foreground">{formatInr(price.total)}</span>
                    {price.discount > 0 && (
                      <>
                        <span className="line-through text-muted-foreground text-[11px]">{formatInr(price.base)}</span>
                        <span className="text-[11px] font-bold text-success">
                          Save {formatInr(price.discount)} (
                          {pkg.discount_type === "percentage"
                            ? `${pkg.discount_value}%`
                            : `${price.base > 0 ? Math.round((price.discount / price.base) * 100) : 0}%`}{" "}
                          OFF)
                        </span>
                      </>
                    )}
                  </div>
                  {pkg.rejection_reason && (
                    <div className="mt-2 rounded-xl border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive flex items-start gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Previous rejection reason:</span> {pkg.rejection_reason}
                      </div>
                    </div>
                  )}
                  {pkg.components && pkg.components.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {pkg.components.map((c: any) => (
                        <span key={c.id} className="rounded-lg bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                          {c.categories?.name ? `${c.categories.name}: ` : ""}
                          {c.title}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    className="rounded-xl"
                    disabled={packageMutation.isPending}
                    onClick={() => packageMutation.mutate({ packageId: pkg.id, status: "live" })}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl"
                    disabled={packageMutation.isPending}
                    onClick={() => {
                      setRejectModalData({ packageId: pkg.id, title: pkg.name });
                      setRejectionReason("");
                    }}
                  >
                    Reject
                  </Button>
                </div>
              </Card>
            );
          })}
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
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={featuredMutation.isPending}
                  onClick={() =>
                    featuredMutation.mutate({ listingId: l.id, isFeatured: !l.is_featured })
                  }
                  className={`rounded-xl px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer border flex items-center gap-1 ${
                    l.is_featured
                      ? "bg-accent text-accent-foreground border-accent shadow-xs"
                      : "bg-muted/60 text-muted-foreground border-border hover:bg-muted"
                  }`}
                  title={l.is_featured ? "Featured on home" : "Set as featured on home"}
                >
                  <Star className={`h-3 w-3 ${l.is_featured ? "fill-current" : ""}`} />
                  {l.is_featured ? "Featured" : "Set Featured"}
                </button>
                {l.status === "live" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl"
                    disabled={listingMutation.isPending}
                    onClick={() => listingMutation.mutate({ listingId: l.id, status: "paused" })}
                  >
                    Pause
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-xl font-semibold">All packages ({data?.packages.length ?? 0})</h2>
        <div className="mt-4 space-y-3">
          {(!data?.packages || data.packages.length === 0) && <Empty>No packages found.</Empty>}
          {(data?.packages ?? []).map((pkg: any) => {
            const price = computePackagePrice(pkg.components, pkg.discount_type, pkg.discount_value);
            return (
              <Card key={pkg.id}>
                <div className="space-y-1.5 flex-1 min-w-0 pr-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{pkg.name}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold border capitalize ${
                        pkg.status === "live"
                          ? "bg-success/10 text-success border-success/20"
                          : pkg.status === "pending"
                          ? "bg-warning/10 text-warning border-warning/20"
                          : pkg.status === "rejected"
                          ? "bg-destructive/10 text-destructive border-destructive/20"
                          : "bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      {pkg.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {pkg.vendor?.business_name} • {pkg.components?.length || 0} services bundled
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-semibold text-foreground">{formatInr(price.total)}</span>
                    {price.discount > 0 && (
                      <>
                        <span className="line-through text-muted-foreground text-[11px]">{formatInr(price.base)}</span>
                        <span className="text-[11px] font-bold text-success">
                          Save {formatInr(price.discount)} (
                          {pkg.discount_type === "percentage"
                            ? `${pkg.discount_value}%`
                            : `${price.base > 0 ? Math.round((price.discount / price.base) * 100) : 0}%`}{" "}
                          OFF)
                        </span>
                      </>
                    )}
                  </div>
                  {pkg.rejection_reason && (
                    <div className="mt-2 rounded-xl border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive flex items-start gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Rejection reason:</span> {pkg.rejection_reason}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {pkg.status === "live" && pkg.slug && (
                    <Button asChild size="sm" variant="ghost" className="rounded-xl text-xs">
                      <Link to="/packages/$slug" params={{ slug: pkg.slug }} target="_blank">
                        <ExternalLink className="mr-1 h-3.5 w-3.5" /> View Live
                      </Link>
                    </Button>
                  )}
                  {pkg.status === "live" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
                      disabled={packageMutation.isPending}
                      onClick={() => packageMutation.mutate({ packageId: pkg.id, status: "paused" })}
                    >
                      Pause
                    </Button>
                  )}
                  {pkg.status === "paused" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
                      disabled={packageMutation.isPending}
                      onClick={() => packageMutation.mutate({ packageId: pkg.id, status: "live" })}
                    >
                      Resume
                    </Button>
                  )}
                  {pkg.status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        className="rounded-xl"
                        disabled={packageMutation.isPending}
                        onClick={() => packageMutation.mutate({ packageId: pkg.id, status: "live" })}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl"
                        disabled={packageMutation.isPending}
                        onClick={() => {
                          setRejectModalData({ packageId: pkg.id, title: pkg.name });
                          setRejectionReason("");
                        }}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            );
          })}
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

      {/* Rejection Reason Modal (Packages only) */}
      {rejectModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-card rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-border animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-serif font-bold text-lg text-foreground">Reject Package</h3>
            </div>

            <p className="text-xs text-muted-foreground">
              Please provide feedback for <span className="font-bold text-foreground">"{rejectModalData.title}"</span>. The vendor will receive this note to fix and resubmit.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground block">Feedback / Reason for Rejection:</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Inaccurate pricing calculation, incomplete package inclusions, or phone number unverified."
                rows={3}
                className="w-full p-3 rounded-xl border border-input text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-destructive"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              <span className="text-[10px] text-muted-foreground block w-full">Quick Preset Reasons:</span>
              {[
                "Missing component breakdown",
                "Discount calculation disparity",
                "Incomplete feature bullets",
                "Unverified vendor contacts",
              ].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setRejectionReason(preset)}
                  className="px-2 py-1 bg-muted hover:bg-muted/80 text-[10px] text-foreground rounded-lg cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setRejectModalData(null)}
                className="rounded-xl text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={handleConfirmRejection}
                disabled={packageMutation.isPending}
                className="rounded-xl text-xs font-bold shadow-xs"
              >
                {packageMutation.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}
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
