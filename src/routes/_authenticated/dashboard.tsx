import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyProfile, getMyRequests } from "@/lib/dashboard.functions";
import { getMyReviewData } from "@/lib/engagement.functions";
import { resolveMediaUrl } from "@/lib/media-url";
import { CustomerShell } from "@/components/CustomerShell";
import { Button } from "@/components/ui/button";
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Sparkles,
  Package as PackageIcon,
  Loader2,
} from "lucide-react";
import { Suspense } from "react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData({
      queryKey: ["profile"],
      queryFn: () => getMyProfile(),
    });
    await context.queryClient.ensureQueryData({
      queryKey: ["my-requests"],
      queryFn: () => getMyRequests(),
    });
  },
  head: () => ({
    meta: [
      { title: "Dashboard | Celebratz" },
      { name: "description", content: "Manage your Celebratz account, bookings and enquiries." },
    ],
  }),
});

function DashboardPage() {
  return (
    <CustomerShell>
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </CustomerShell>
  );
}

function DashboardContent() {
  const { data: requests } = useSuspenseQuery({
    queryKey: ["my-requests"],
    queryFn: () => getMyRequests(),
  });

  const fetchReviews = useServerFn(getMyReviewData);
  const { data: reviewData } = useQuery({
    queryKey: ["my-reviews"],
    queryFn: () => fetchReviews(),
  });

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif font-bold text-xl text-foreground">
          Celebration Enquiries & Booking Requests
        </h2>
        <Link to="/search" className="text-xs font-bold text-primary hover:underline">
          + Find another vendor
        </Link>
      </div>

      {requests.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center space-y-3">
          <CalendarCheck className="w-10 h-10 text-muted-foreground mx-auto" />
          <h3 className="font-serif font-bold text-base text-foreground">No requests sent yet</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Explore venues and vendors in Pune, check their availability calendar, and request a booking or walkthrough visit.
          </p>
          <Button asChild className="rounded-xl text-xs font-bold">
            <Link to="/search">Browse Pune Vendors</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req: any) => {
            const isEventPast = Boolean(req.event_date && req.event_date <= todayStr);
            const isAccepted = req.status === "accepted";
            const hasReviewed = (reviewData?.reviews ?? []).some((r: any) => r.request_id === req.id);

            const sortedMedia = (req.listing?.listing_media ?? []).slice().sort(
              (a: any, b: any) => (a.position ?? 0) - (b.position ?? 0)
            );
            const thumbnailPath = sortedMedia[0]?.storage_path;
            const thumbnailUrl = thumbnailPath ? resolveMediaUrl(thumbnailPath) : null;

            const isPackageRequest = Boolean(req.package_id || (!req.listing_id && req.package));
            const title = req.listing?.title || req.package?.name || "Booking Request";

            // Meta line parts
            const metaParts: string[] = [];
            if (req.event_type) metaParts.push(req.event_type);
            if (req.event_date) metaParts.push(`Date: ${req.event_date}`);
            if (req.guest_count) metaParts.push(`~${req.guest_count} Guests`);
            const metaText = metaParts.join(" • ");

            // Latest vendor reply (latest message where sender_id !== req.customer_id)
            const vendorMessages = (req.request_messages ?? []).filter(
              (m: any) => m.sender_id !== req.customer_id
            );
            const latestVendorReply = vendorMessages[vendorMessages.length - 1];

            return (
              <div key={req.id} className="bg-card rounded-2xl border border-border p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                  <div className="flex items-center gap-3">
                    {isPackageRequest || !thumbnailUrl ? (
                      <div className="w-14 h-14 rounded-xl bg-primary-subtle text-primary flex items-center justify-center border border-border-subtle shrink-0">
                        <PackageIcon className="w-6 h-6" />
                      </div>
                    ) : (
                      <img
                        src={thumbnailUrl}
                        alt=""
                        className="w-14 h-14 rounded-xl object-cover shrink-0 border border-border"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        {req.listing?.slug ? (
                          <Link
                            to="/listing/$slug"
                            params={{ slug: req.listing.slug }}
                            className="font-serif font-bold text-base text-foreground hover:text-primary transition-colors cursor-pointer"
                          >
                            {title}
                          </Link>
                        ) : (
                          <h3 className="font-serif font-bold text-base text-foreground">{title}</h3>
                        )}
                      </div>
                      {metaText && <p className="text-xs text-muted-foreground mt-0.5">{metaText}</p>}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {req.status === "new" && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-warning/15 text-warning border border-warning/30">
                        <Clock className="w-3.5 h-3.5" />
                        Pending Vendor Review
                      </span>
                    )}
                    {req.status === "accepted" && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-success-subtle text-success border border-success/30">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Request Accepted 🎉
                      </span>
                    )}
                    {req.status === "declined" && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-destructive-subtle text-destructive border border-destructive/30">
                        <XCircle className="w-3.5 h-3.5" />
                        Declined by Vendor
                      </span>
                    )}
                    {req.status === "closed" && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Closed
                      </span>
                    )}
                  </div>
                </div>

                {/* Attached Package / Combo Card for Customer */}
                {(req.package?.name || req.tier?.name) && (
                  <div className="p-3 bg-muted/40 border border-border rounded-xl flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-6 h-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shrink-0">
                        {req.package ? "🌟" : "🎁"}
                      </span>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                          {req.package ? "Requested Combo Bundle" : "Requested Package Tier"}
                        </span>
                        <span className="font-serif font-bold text-foreground truncate block">
                          {req.package?.name || req.tier?.name}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Customer Message & Vendor Response note */}
                <div className="bg-muted/40 rounded-xl p-3.5 border border-border text-xs space-y-2">
                  <div className="text-foreground">
                    <span className="font-bold text-foreground">Your Message:</span> "
                    {req.message || "No custom message provided"}"
                    {(req.visit_date || req.visit_time) && (
                      <span className="block text-[11px] text-muted-foreground mt-0.5">
                        Preferred Visit/Call:{" "}
                        {[req.visit_date, req.visit_time ? String(req.visit_time).slice(0, 5) : null]
                          .filter(Boolean)
                          .join(" ")}
                      </span>
                    )}
                  </div>

                  {latestVendorReply && (
                    <div className="pt-2 border-t border-border/80 text-primary font-medium">
                      <span className="font-bold text-foreground">Vendor Reply:</span> "{latestVendorReply.body}"
                    </div>
                  )}
                </div>

                {/* Post-Event Review Trigger (if accepted and date has passed) */}
                {isAccepted && isEventPast && !hasReviewed && (
                  <div className="p-4 bg-accent-subtle/50 border border-accent/30 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Sparkles className="w-5 h-5 text-accent shrink-0" />
                      <div>
                        <span className="font-bold text-xs text-foreground">Your event date has passed!</span>
                        <p className="text-[11px] text-muted-foreground">
                          How was your celebration with {req.listing?.title || req.package?.name || "the vendor"}? Leave a verified review.
                        </p>
                      </div>
                    </div>
                    <Button asChild size="sm" className="rounded-xl text-xs font-bold shrink-0">
                      <Link to="/reviews">Write Review</Link>
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex justify-center py-16">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}
