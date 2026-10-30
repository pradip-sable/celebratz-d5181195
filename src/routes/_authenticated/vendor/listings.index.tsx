import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { getVendorDashboard } from "@/lib/dashboard.functions";
import { updateListingStatus } from "@/lib/vendor.functions";
import { getMyPackages } from "@/lib/packages.functions";
import { VendorShell } from "@/components/VendorShell";
import { resolveMediaUrl } from "@/lib/media-url";
import { formatInr, unitLabel } from "@/lib/pricing";
import { Plus, Edit3, Calendar as CalendarIcon, Gift, Loader2, Pause, Play } from "lucide-react";

export const Route = createFileRoute("/_authenticated/vendor/listings/")({
  component: VendorListingsIndex,
  head: () => ({
    meta: [
      { title: "My listings | Celebratz" },
      { name: "description", content: "Manage your listed venues and services on Celebratz." },
      { property: "og:title", content: "My listings | Celebratz" },
      { property: "og:description", content: "Manage your listed venues and services on Celebratz." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function VendorListingsIndex() {
  const queryClient = useQueryClient();
  const fetchDashboard = useServerFn(getVendorDashboard);
  const fetchPackages = useServerFn(getMyPackages);
  const setListingStatus = useServerFn(updateListingStatus);

  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery({
    queryKey: ["vendor-dashboard"],
    queryFn: () => fetchDashboard(),
  });

  const { data: packagesData } = useQuery({
    queryKey: ["vendor-packages"],
    queryFn: () => fetchPackages(),
  });

  const statusMutation = useMutation({
    mutationFn: (vars: { listingId: string; status: "draft" | "pending" | "paused" }) =>
      setListingStatus({ data: vars }),
    onSuccess: (_, vars) => {
      if (vars.status === "paused") {
        toast.success("Listing paused");
      } else if (vars.status === "pending") {
        toast.success("Listing resumed — submitted for admin review");
      } else {
        toast.success("Listing status updated");
      }
      queryClient.invalidateQueries({ queryKey: ["vendor-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-packages"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not update listing status"),
  });

  if (isDashboardLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const listings = dashboardData?.listings ?? [];
  const packages = packagesData?.packages ?? [];

  return (
    <VendorShell>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="font-serif font-bold text-xl text-foreground">Your Listed Venues & Services</h2>
          <Link
            to="/vendor/listings/new"
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl text-xs font-bold flex items-center gap-1 transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Listing</span>
          </Link>
        </div>

        {listings.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground bg-muted/40 rounded-2xl border border-dashed border-border">
            No listings yet. Create your first listing to start receiving customer enquiries!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {listings.map((listing: any) => {
              // First photo sorted by position
              const sortedMedia = (listing.listing_media ?? [])
                .slice()
                .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0));
              const coverUrl = sortedMedia[0] ? resolveMediaUrl(sortedMedia[0].storage_path) : null;

              // Count packages including this listing
              const packageCount = packages.filter((pkg: any) =>
                (pkg.package_listings ?? []).some((pl: any) => pl.listing_id === listing.id),
              ).length;

              const areaName = listing.areas?.name || "Pune";
              const categoryName = listing.category?.name || "Service";
              const priceDisplay = formatInr(Number(listing.price_from ?? 0));
              const unitDisplay = unitLabel(listing.price_unit);

              return (
                <div
                  key={listing.id}
                  className="bg-card rounded-2xl border border-border p-4 flex flex-col justify-between shadow-xs gap-3"
                >
                  <div className="flex gap-3">
                    {coverUrl ? (
                      <img
                        src={coverUrl}
                        alt=""
                        className="w-24 h-24 rounded-xl object-cover shrink-0 bg-muted"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-xl bg-muted/70 flex items-center justify-center text-muted-foreground text-[10px] font-semibold shrink-0 text-center px-1">
                        No photo
                      </div>
                    )}

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-1 flex-wrap">
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-muted text-foreground">
                          {categoryName}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize ${
                            listing.status === "live"
                              ? "bg-success-subtle text-success border border-success/30"
                              : listing.status === "pending"
                                ? "bg-warning/15 text-warning border border-warning/30"
                                : listing.status === "rejected"
                                  ? "bg-destructive-subtle text-destructive border border-destructive/30"
                                  : "bg-muted text-muted-foreground border border-border"
                          }`}
                        >
                          {listing.status}
                        </span>
                      </div>

                      <h4 className="font-bold text-sm text-foreground truncate">{listing.title}</h4>
                      <p className="text-xs text-muted-foreground">
                        {areaName} &bull; {priceDisplay} {unitDisplay}
                      </p>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2 border-t border-border-subtle flex flex-wrap gap-2.5 items-center justify-between">
                    <div className="flex flex-wrap gap-2.5 items-center">
                      <Link
                        to="/vendor/listings/$listingId/edit"
                        params={{ listingId: listing.id }}
                        className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3 text-primary" />
                        <span>Edit Listing Details</span>
                      </Link>

                      <Link
                        to="/vendor/calendar/$listingId"
                        params={{ listingId: listing.id }}
                        className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <CalendarIcon className="w-3 h-3" />
                        <span>Manage Calendar</span>
                      </Link>

                      <Link
                        to="/vendor/packages"
                        className="text-[11px] font-bold text-accent-dark hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Gift className="w-3 h-3" />
                        <span>Manage Packages ({packageCount})</span>
                      </Link>
                    </div>

                    {/* Pause / Resume Controls */}
                    <div className="flex items-center gap-1.5">
                      {listing.status === "live" && (
                        <button
                          type="button"
                          disabled={statusMutation.isPending}
                          onClick={() => statusMutation.mutate({ listingId: listing.id, status: "paused" })}
                          className="px-2.5 py-1 rounded-lg border border-border text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Pause className="w-3 h-3" />
                          <span>Pause</span>
                        </button>
                      )}

                      {listing.status === "paused" && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={statusMutation.isPending}
                            onClick={() => statusMutation.mutate({ listingId: listing.id, status: "pending" })}
                            className="px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-[11px] font-bold hover:bg-primary-hover transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                          >
                            <Play className="w-3 h-3" />
                            <span>Resume</span>
                          </button>
                          <span className="text-[10px] text-muted-foreground">
                            (Re-queues for admin review)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </VendorShell>
  );
}
