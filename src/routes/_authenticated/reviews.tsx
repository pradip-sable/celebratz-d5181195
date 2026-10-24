import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { getMyReviewData, submitReview } from "@/lib/engagement.functions";
import { CustomerShell } from "@/components/CustomerShell";
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

  const pending = data?.pending ?? [];
  const reviews = data?.reviews ?? [];

  return (
    <CustomerShell>
      {isLoading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-6 max-w-3xl">
          {pending.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-serif font-bold text-xl text-foreground">Waiting for your review</h2>
              <div className="space-y-4">
                {pending.map((request: any) => (
                  <ReviewForm key={request.id} request={request} />
                ))}
              </div>
            </section>
          )}

          <section className="space-y-3">
            <h2 className="font-serif font-bold text-xl text-foreground">
              My Published Reviews ({reviews.length})
            </h2>

            {reviews.length === 0 ? (
              <div className="bg-card rounded-2xl border border-border p-12 text-center space-y-3">
                <Star className="w-10 h-10 text-muted-foreground mx-auto" />
                <h3 className="font-serif font-bold text-base text-foreground">No reviews published yet</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Reviews become eligible once your event date has passed after vendor acceptance.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((review: any) => (
                  <div key={review.id} className="rounded-2xl border border-border/60 bg-card p-5 shadow-xs space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-bold text-sm text-foreground">{review.listing?.title}</p>
                      <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold capitalize text-muted-foreground">
                        {review.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-accent">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < review.rating ? "fill-accent" : "text-muted-foreground/40"}`}
                        />
                      ))}
                      <span className="text-xs text-muted-foreground ml-1.5">{review.rating}/5</span>
                    </div>
                    {review.body && <p className="text-xs text-muted-foreground pt-1">“{review.body}”</p>}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </CustomerShell>
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
      className="rounded-2xl border border-border/60 bg-card p-5 shadow-xs space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!rating) {
          toast.error("Pick a star rating");
          return;
        }
        mutation.mutate();
      }}
    >
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-serif font-bold text-base text-foreground">{request.listing?.title}</h4>
          <p className="text-xs text-muted-foreground">Event date: {request.event_date}</p>
        </div>
      </div>

      <div className="flex items-center gap-1 text-accent pt-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            aria-label={`${n} star`}
            className="p-1 hover:scale-110 transition-transform"
          >
            <Star className={`w-5 h-5 ${n <= rating ? "fill-accent" : "text-muted-foreground/40"}`} />
          </button>
        ))}
      </div>

      <Textarea
        className="rounded-xl border border-border bg-muted/40 text-xs"
        rows={3}
        placeholder="Tell other Pune families about the management, parking, hospitality, food, or service quality..."
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />

      <Button type="submit" size="sm" className="rounded-xl font-bold text-xs" disabled={mutation.isPending}>
        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Submit Verified Review
      </Button>
    </form>
  );
}
