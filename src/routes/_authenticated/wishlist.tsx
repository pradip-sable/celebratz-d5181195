import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { getWishlist, toggleWishlist } from "@/lib/engagement.functions";
import { Button } from "@/components/ui/button";
import { Heart, Loader2, Star } from "lucide-react";

export const Route = createFileRoute("/_authenticated/wishlist")({
  component: WishlistPage,
  head: () => ({
    meta: [
      { title: "My wishlist | Celebratz" },
      { name: "description", content: "Venues and services you saved while planning your celebration." },
      { property: "og:title", content: "My wishlist | Celebratz" },
      { property: "og:description", content: "Venues and services you saved while planning your celebration." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function WishlistPage() {
  const queryClient = useQueryClient();
  const fetchWishlist = useServerFn(getWishlist);
  const toggle = useServerFn(toggleWishlist);
  const { data, isLoading } = useQuery({ queryKey: ["wishlist"], queryFn: () => fetchWishlist() });

  const mutation = useMutation({
    mutationFn: (listingId: string) => toggle({ data: { listingId } }),
    onSuccess: () => {
      toast.success("Wishlist updated");
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not update wishlist"),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 pb-24 md:py-12">
      <h1 className="font-serif text-2xl font-semibold">My wishlist</h1>

      {(data ?? []).length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border p-10 text-center">
          <Heart className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-muted-foreground">Nothing saved yet.</p>
          <Button asChild className="mt-4 rounded-xl">
            <Link to="/search">Browse listings</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {(data ?? []).map((item: any) => {
            const listing = item.listing;
            const image = listing?.listing_media?.[0]?.storage_path;
            return (
              <div key={item.id} className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
                {image && <img src={image} alt={listing.title} loading="lazy" className="h-40 w-full object-cover" />}
                <div className="p-4">
                  <p className="font-medium">{listing?.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {listing?.category?.name} • {listing?.area?.name}
                  </p>
                  <p className="mt-2 text-sm">
                    ₹{Number(listing?.price_from ?? 0).toLocaleString("en-IN")}{" "}
                    <span className="text-muted-foreground">{String(listing?.price_unit).replace("per_", "per ")}</span>
                  </p>
                  {Number(listing?.review_count) > 0 && (
                    <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                      <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                      {listing.rating_avg} ({listing.review_count})
                    </p>
                  )}
                  <div className="mt-4 flex gap-2">
                    <Button asChild size="sm" className="rounded-xl">
                      <Link to="/listing/$slug" params={{ slug: listing.slug }}>
                        View
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
                      disabled={mutation.isPending}
                      onClick={() => mutation.mutate(listing.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
