import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { getMyReviewData, submitReview } from "@/lib/engagement.functions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Star } from "lucide-react";

export const Route = createFileRoute("/_authenticated/reviews")({
  component: MyReviews,
  head: () => ({
    meta: [
      { title: "My reviews | Celebratz" },
      { name: "description", content: "Rate the venues and services you booked through Celebratz." },
      { property: "og:title", content: "My reviews | Celebratz" },
      { property: "og:description", content: "Rate the venues and services you booked through Celebratz." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function MyReviews() {
  const fetchData = useServerFn(getMyReviewData);
  const { data, isLoading } = useQuery({ queryKey: ["my-reviews"], queryFn: () => fetchData() });

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 pb-24 md:py-12">
      <h1 className="font-serif text-2xl font-semibold">My reviews</h1>

      <section className="mt-8">
        <h2 className="font-serif text-lg font-semibold">Waiting for your review</h2>
        {(data?.pending ?? []).length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-border p-6 text-center text-muted-foreground">
            Nothing to review right now. We'll prompt you once your event date has passed.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {(data?.pending ?? []).map((request: any) => (
              <ReviewForm key={request.id} request={request} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-lg font-semibold">Submitted</h2>
        {(data?.reviews ?? []).length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-border p-6 text-center text-muted-foreground">
            You haven't written a review yet.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {(data?.reviews ?? []).map((review: any) => (
              <div key={review.id} className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{review.listing?.title}</p>
                  <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium capitalize">
                    {review.status}
                  </span>
                </div>
                <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <Star className="h-3.5 w-3.5 fill-accent text-accent" /> {review.rating}/5
                </p>
                {review.body && <p className="mt-2 text-sm text-muted-foreground">“{review.body}”</p>}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ReviewForm({ request }: { request: any }) {
  const queryClient = useQueryClient();
  const send = useServerFn(submitReview);
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");

  const mutation = useMutation({
    mutationFn: () => send({ data: { requestId: request.id, rating, body: body || undefined } }),
    onSuccess: () => {
      toast.success("Thanks! Your review is pending moderation.");
      queryClient.invalidateQueries({ queryKey: ["my-reviews"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not submit review"),
  });

  return (
    <form
      className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm"
      onSubmit={(e) => {
        e.preventDefault();
        if (!rating) {
          toast.error("Pick a star rating");
          return;
        }
        mutation.mutate();
      }}
    >
      <p className="font-medium">{request.listing?.title}</p>
      <p className="text-sm text-muted-foreground">Event on {request.event_date}</p>

      <div className="mt-3 flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} star`}>
            <Star className={`h-6 w-6 ${n <= rating ? "fill-accent text-accent" : "text-muted-foreground"}`} />
          </button>
        ))}
      </div>

      <Textarea
        className="mt-3"
        rows={3}
        placeholder="How was your experience?"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />

      <Button type="submit" size="sm" className="mt-3 rounded-xl" disabled={mutation.isPending}>
        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Submit review
      </Button>
    </form>
  );
}
