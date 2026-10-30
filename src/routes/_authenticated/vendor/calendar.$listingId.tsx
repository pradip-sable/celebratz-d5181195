import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { getListingAvailability, setAvailability } from "@/lib/vendor.functions";
import { getVendorDashboard } from "@/lib/dashboard.functions";
import { VendorShell } from "@/components/VendorShell";
import { Loader2, Calendar as CalendarIcon } from "lucide-react";

export const Route = createFileRoute("/_authenticated/vendor/calendar/$listingId")({
  component: VendorCalendar,
  head: () => ({
    meta: [
      { title: "Availability calendar | Celebratz" },
      { name: "description", content: "Tap a date to mark it available, tentative or booked for your listing." },
      { property: "og:title", content: "Availability calendar | Celebratz" },
      { property: "og:description", content: "Keep your Celebratz availability calendar up to date." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const NEXT: Record<string, "available" | "tentative" | "booked"> = {
  available: "tentative",
  tentative: "booked",
  booked: "available",
};

const STATE_CLASS: Record<string, string> = {
  available: "bg-primary/15 text-primary border-primary/30",
  tentative: "bg-accent/25 text-accent-foreground border-accent/40",
  booked: "bg-destructive/15 text-destructive border-destructive/30",
};

function VendorCalendar() {
  const { listingId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchAvailability = useServerFn(getListingAvailability);
  const fetchDashboard = useServerFn(getVendorDashboard);
  const save = useServerFn(setAvailability);

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-availability", listingId],
    queryFn: () => fetchAvailability({ data: { listingId } }),
  });

  const { data: dashboardData } = useQuery({
    queryKey: ["vendor-dashboard"],
    queryFn: () => fetchDashboard(),
  });

  const mutation = useMutation({
    mutationFn: (vars: { date: string; state: "available" | "tentative" | "booked" }) =>
      save({ data: { listingId, ...vars } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-availability", listingId] });
      queryClient.invalidateQueries({ queryKey: ["vendor-dashboard"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not update date"),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const stateByDate = new Map<string, string>((data?.availability ?? []).map((a: any) => [a.date, a.state]));
  const days = Array.from({ length: 60 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
  const updatedAt = data?.listing?.availability_updated_at;
  const vendorListings = dashboardData?.listings ?? [];

  return (
    <VendorShell>
      <div className="bg-card rounded-3xl border border-border p-6 space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-border-subtle">
          <div>
            <h2 className="font-serif font-bold text-xl text-foreground flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary" />
              <span>Tap-to-Toggle Availability Manager</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Click any calendar date to cycle:{" "}
              <span className="font-bold text-success">Available</span> ➔{" "}
              <span className="font-bold text-accent">Tentative</span> ➔{" "}
              <span className="font-bold text-destructive">Booked</span>. Updates your last-updated timestamp immediately.
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {data?.listing?.title ? <span className="font-semibold text-foreground">{data.listing.title}: </span> : null}
              {updatedAt ? `Last updated ${new Date(updatedAt).toLocaleDateString("en-IN")}.` : "Not updated yet."}
            </p>
          </div>

          {/* Listing Switcher */}
          {vendorListings.length > 0 && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label className="text-xs font-bold text-muted-foreground shrink-0">Listing:</label>
              <select
                value={listingId}
                onChange={(e) =>
                  navigate({
                    to: "/vendor/calendar/$listingId",
                    params: { listingId: e.target.value },
                  })
                }
                className="bg-muted/40 border border-border rounded-xl p-2 text-xs font-semibold text-foreground outline-hidden cursor-pointer w-full sm:w-auto"
              >
                {vendorListings.map((l: any) => (
                  <option key={l.id} value={l.id}>
                    {l.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3 text-xs">
          {(["available", "tentative", "booked"] as const).map((s) => (
            <span key={s} className={`rounded-full border px-2.5 py-1 capitalize ${STATE_CLASS[s]}`}>
              {s}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {days.map((date) => {
            const state = stateByDate.get(date) ?? "available";
            const d = new Date(date);
            return (
              <button
                key={date}
                type="button"
                disabled={mutation.isPending}
                onClick={() => mutation.mutate({ date, state: NEXT[state] ?? "available" })}
                className={`rounded-xl border p-2 text-center text-sm transition cursor-pointer hover:opacity-90 ${STATE_CLASS[state]}`}
              >
                <span className="block text-xs opacity-70">{d.toLocaleDateString("en-IN", { month: "short" })}</span>
                <span className="block font-semibold">{d.getDate()}</span>
              </button>
            );
          })}
        </div>
      </div>
    </VendorShell>
  );
}
