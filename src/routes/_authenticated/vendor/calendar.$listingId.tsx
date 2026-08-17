import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { getListingAvailability, setAvailability } from "@/lib/vendor.functions";
import { Loader2 } from "lucide-react";

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
  const queryClient = useQueryClient();
  const fetchAvailability = useServerFn(getListingAvailability);
  const save = useServerFn(setAvailability);

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-availability", listingId],
    queryFn: () => fetchAvailability({ data: { listingId } }),
  });

  const mutation = useMutation({
    mutationFn: (vars: { date: string; state: "available" | "tentative" | "booked" }) =>
      save({ data: { listingId, ...vars } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vendor-availability", listingId] }),
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

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 pb-24 md:py-12">
      <h1 className="font-serif text-2xl font-semibold">{data?.listing?.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Tap a date to cycle Available → Tentative → Booked.{" "}
        {updatedAt ? `Last updated ${new Date(updatedAt).toLocaleDateString("en-IN")}.` : "Not updated yet."}
      </p>

      <div className="mt-4 flex flex-wrap gap-3 text-xs">
        {(["available", "tentative", "booked"] as const).map((s) => (
          <span key={s} className={`rounded-full border px-2.5 py-1 capitalize ${STATE_CLASS[s]}`}>
            {s}
          </span>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-4 gap-2 sm:grid-cols-6">
        {days.map((date) => {
          const state = stateByDate.get(date) ?? "available";
          const d = new Date(date);
          return (
            <button
              key={date}
              type="button"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate({ date, state: NEXT[state] ?? "available" })}
              className={`rounded-xl border p-2 text-center text-sm transition ${STATE_CLASS[state]}`}
            >
              <span className="block text-xs opacity-70">{d.toLocaleDateString("en-IN", { month: "short" })}</span>
              <span className="block font-semibold">{d.getDate()}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
