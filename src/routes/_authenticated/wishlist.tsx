import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { getWishlist, toggleWishlist } from "@/lib/engagement.functions";
import { ListingCard } from "@/components/ListingCard";
import { RequestEnquireModal } from "@/components/RequestEnquireModal";
import { Button } from "@/components/ui/button";
import { Heart, Loader2 } from "lucide-react";

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
  const [enquiringListingId, setEnquiringListingId] = useState<string | null>(null);

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
    <div className="mx-auto max-w-5xl px-4 py-8 pb-24 md:py-12">
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
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(data ?? []).map((item: any) => {
            const listing = item.listing;
            if (!listing) return null;
            const listingData = {
              ...listing,
              categories: listing.category,
              areas: listing.area,
            };
            return (
              <ListingCard
                key={item.id}
                listing={listingData}
                isSaved={true}
                onToggleWishlist={() => mutation.mutate(listing.id)}
                onEnquire={(listing) => setEnquiringListingId(listing.id)}
              />
            );
          })}
        </div>
      )}

      <RequestEnquireModal
        listingId={enquiringListingId}
        isOpen={!!enquiringListingId}
        onClose={() => setEnquiringListingId(null)}
      />
    </div>
  );
}
