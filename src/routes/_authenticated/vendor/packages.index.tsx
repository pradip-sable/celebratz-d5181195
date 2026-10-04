import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  getMyPackages,
  setMyPackageStatus,
} from "@/lib/packages.functions";
import { computePackagePrice, effectiveListingPrice, formatInr } from "@/lib/pricing";
import { Button } from "@/components/ui/button";
import {
  Layers,
  Plus,
  ArrowLeft,
  Loader2,
  AlertCircle,
  PauseCircle,
  PlayCircle,
  ExternalLink,
  Edit3,
  Gift,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/vendor/packages/")({
  component: VendorPackagesIndex,
  head: () => ({
    meta: [
      { title: "My Packages | Celebratz" },
      { name: "description", content: "Manage your multi-service celebration packages on Celebratz." },
      { property: "og:title", content: "My Packages | Celebratz" },
      { property: "og:description", content: "Manage your multi-service celebration packages on Celebratz." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function VendorPackagesIndex() {
  const queryClient = useQueryClient();
  const fetchPackages = useServerFn(getMyPackages);
  const updateStatus = useServerFn(setMyPackageStatus);

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-packages"],
    queryFn: () => fetchPackages(),
  });

  const statusMutation = useMutation({
    mutationFn: (vars: { packageId: string; status: "draft" | "pending" | "paused" }) =>
      updateStatus({ data: vars }),
    onSuccess: (_, vars) => {
      const label =
        vars.status === "paused"
          ? "Package paused"
          : vars.status === "pending"
          ? "Package submitted for review"
          : "Status updated";
      toast.success(label);
      queryClient.invalidateQueries({ queryKey: ["vendor-packages"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not update package status"),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const packages = data?.packages ?? [];
  const liveListings = data?.liveListings ?? [];
  const canCreate = liveListings.length >= 2;

  const liveCount = packages.filter((p: any) => p.status === "live").length;
  const pendingCount = packages.filter((p: any) => p.status === "pending").length;
  const pausedCount = packages.filter((p: any) => p.status === "paused").length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 pb-24 md:py-12">
      {/* Breadcrumb Back Link */}
      <Link
        to="/vendor"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Vendor dashboard</span>
      </Link>

      {/* Header Row */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold">My Packages</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Multi-service bundles offering seamless celebration solutions across Pune.
          </p>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          {canCreate ? (
            <Button asChild className="rounded-xl font-bold">
              <Link to="/vendor/packages/new">
                <Plus className="mr-1.5 h-4 w-4" /> Create Package
              </Link>
            </Button>
          ) : (
            <Button disabled className="rounded-xl opacity-60 cursor-not-allowed">
              <Plus className="mr-1.5 h-4 w-4" /> Create Package
            </Button>
          )}

          {!canCreate && (
            <span className="text-[11px] text-muted-foreground">
              Requires min. 2 live listings (currently {liveListings.length})
            </span>
          )}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="mt-8 grid gap-4 grid-cols-2 sm:grid-cols-4">
        <StatCard label="Total Packages" value={packages.length} />
        <StatCard label="Live Packages" value={liveCount} highlight="emerald" />
        <StatCard label="Pending Review" value={pendingCount} highlight="amber" />
        <StatCard label="Paused" value={pausedCount} />
      </div>

      {/* Packages List */}
      <section className="mt-10 space-y-4">
        {packages.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-10 text-center bg-card">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Layers className="h-6 w-6" />
            </div>
            <h3 className="mt-4 font-serif text-lg font-bold">No packages yet</h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
              Bundle your banquet hall, catering, decor, or photography into an attractive all-in-one
              package for event hosts.
            </p>
            {canCreate ? (
              <Button asChild className="mt-6 rounded-xl font-bold">
                <Link to="/vendor/packages/new">
                  <Plus className="mr-1.5 h-4 w-4" /> Create First Package
                </Link>
              </Button>
            ) : (
              <p className="mt-4 text-xs font-semibold text-accent">
                Publish at least 2 active listings to unlock package bundling.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {packages.map((pkg: any) => {
              const price = computePackagePrice(pkg.components, pkg.discount_type, pkg.discount_value);
              const isLive = pkg.status === "live";
              const isPaused = pkg.status === "paused";
              const isRejected = pkg.status === "rejected";
              const isPending = pkg.status === "pending";

              return (
                <div
                  key={pkg.id}
                  className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition hover:border-border space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      {/* Thumbnail */}
                      <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl overflow-hidden bg-muted border border-border shrink-0">
                        {pkg.cover_image ? (
                          <img
                            src={pkg.cover_image}
                            alt={pkg.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                            <Layers className="h-6 w-6" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-serif text-base sm:text-lg font-bold leading-tight">
                            {pkg.name}
                          </h3>
                          <StatusBadge status={pkg.status} />
                        </div>

                        {pkg.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 max-w-xl">
                            {pkg.description}
                          </p>
                        )}

                        {/* Components tag line */}
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                          <Gift className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="font-medium text-foreground">Bundled Services:</span>
                          <span className="line-clamp-1">
                            {(pkg.components ?? [])
                              .map((c: any) => c.categories?.name ?? c.title)
                              .filter(Boolean)
                              .join(" + ")}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Price Block */}
                    <div className="sm:text-right shrink-0">
                      <div className="text-xs text-muted-foreground line-through font-semibold">
                        {formatInr(price.base)}
                      </div>
                      <div className="font-serif text-lg sm:text-xl font-bold text-foreground">
                        {formatInr(price.total)}
                      </div>
                      <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                        Save {formatInr(price.discount)} (
                        {pkg.discount_type === "percentage"
                          ? `${pkg.discount_value}%`
                          : `${price.base > 0 ? Math.round((price.discount / price.base) * 100) : 0}%`}{" "}
                        OFF)
                      </div>
                    </div>
                  </div>

                  {/* Rejection notice */}
                  {isRejected && pkg.rejection_reason && (
                    <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Rejection Reason:</span> {pkg.rejection_reason}
                      </div>
                    </div>
                  )}

                  {/* Actions Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border/60">
                    <span className="text-[11px] text-muted-foreground">
                      Created on {new Date(pkg.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                    </span>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* View live public page */}
                      {isLive && pkg.slug && (
                        <Button asChild variant="ghost" size="sm" className="rounded-xl text-xs">
                          <Link to="/packages/$slug" params={{ slug: pkg.slug }} target="_blank">
                            <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> View Live
                          </Link>
                        </Button>
                      )}

                      {/* Pause / Resume action */}
                      {isLive && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={statusMutation.isPending}
                          onClick={() => statusMutation.mutate({ packageId: pkg.id, status: "paused" })}
                          className="rounded-xl text-xs"
                        >
                          <PauseCircle className="mr-1.5 h-3.5 w-3.5" /> Pause
                        </Button>
                      )}

                      {isPaused && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={statusMutation.isPending}
                          onClick={() => statusMutation.mutate({ packageId: pkg.id, status: "pending" })}
                          className="rounded-xl text-xs"
                        >
                          <PlayCircle className="mr-1.5 h-3.5 w-3.5" /> Resume
                        </Button>
                      )}

                      {/* Edit action */}
                      <Button asChild variant="outline" size="sm" className="rounded-xl text-xs font-semibold">
                        <Link to="/vendor/packages/$id/edit" params={{ id: pkg.id }}>
                          <Edit3 className="mr-1.5 h-3.5 w-3.5" /> Edit
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: "emerald" | "amber";
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-xs">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p
        className={`mt-1 font-serif text-2xl font-bold ${
          highlight === "emerald"
            ? "text-emerald-700 dark:text-emerald-400"
            : highlight === "amber"
            ? "text-amber-700 dark:text-amber-400"
            : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "live":
      return (
        <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 capitalize">
          Live
        </span>
      );
    case "pending":
      return (
        <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-400 border border-amber-500/20 capitalize">
          Pending Review
        </span>
      );
    case "paused":
      return (
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-bold text-muted-foreground border border-border capitalize">
          Paused
        </span>
      );
    case "rejected":
      return (
        <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-[11px] font-bold text-destructive border border-destructive/20 capitalize">
          Rejected
        </span>
      );
    default:
      return (
        <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-bold text-secondary-foreground capitalize">
          {status}
        </span>
      );
  }
}
