import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getMyProfile, getMyRequests } from "@/lib/dashboard.functions";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
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
    <div className="mx-auto max-w-5xl px-4 py-8 md:py-12">
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}

function DashboardContent() {
  const { data: profile } = useSuspenseQuery({
    queryKey: ["profile"],
    queryFn: () => getMyProfile(),
  });
  const { data: requests } = useSuspenseQuery({
    queryKey: ["my-requests"],
    queryFn: () => getMyRequests(),
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-semibold">My Dashboard</h1>
        <p className="mt-1 text-muted-foreground">{profile?.full_name ?? profile?.email}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Total requests</p>
          <p className="mt-1 text-2xl font-semibold">{requests.length}</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Account type</p>
          <p className="mt-1 text-2xl font-semibold capitalize">{profile?.account_type}</p>
        </div>
      </div>

      <div>
        <h2 className="font-serif text-xl font-semibold">My Bookings / Enquiries</h2>
        {requests.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-border p-8 text-center">
            <p className="text-muted-foreground">You haven't sent any requests yet.</p>
            <Button asChild className="mt-4 rounded-xl">
              <Link to="/search">Start exploring</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {requests.map((req: any) => (
              <div key={req.id} className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{req.listing?.title ?? "Listing"}</p>
                    <p className="text-sm text-muted-foreground capitalize">{req.kind.replace("_", " ")} • {req.status}</p>
                  </div>
                  <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium capitalize">
                    {req.status}
                  </span>
                </div>
                {req.event_date && (
                  <p className="mt-2 text-sm text-muted-foreground">Event date: {req.event_date}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}
