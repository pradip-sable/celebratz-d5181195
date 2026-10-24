import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { getWishlist, toggleWishlist } from "@/lib/engagement.functions";
import { ListingCard } from "@/components/ListingCard";
import { RequestEnquireModal } from "@/components/RequestEnquireModal";
import { CustomerShell } from "@/components/CustomerShell";
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

  const validItems = (data ?? []).filter((item: any) => Boolean(item.listing));

  return (
    <CustomerShell>
      {isLoading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="font-serif font-bold text-xl text-foreground">
            Saved Venues & Vendors ({validItems.length})
          </h2>

          {validItems.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-12 text-center space-y-3">
              <Heart className="w-10 h-10 text-muted-foreground mx-auto" />
              <h3 className="font-serif font-bold text-base text-foreground">No saved favorites yet</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Tap the heart icon on any venue or vendor card to save it for quick comparison.
              </p>
              <Button asChild className="rounded-xl text-xs font-bold">
                <Link to="/search">Browse Pune Vendors</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {validItems.map((item: any) => {
                const listing = item.listing;
                const listingData = {
                  ...listing,
                  capacity_min: listing.capacity_min,
                  capacity_max: listing.capacity_max,
                  availability_updated_at: listing.availability_updated_at,
                  is_featured: listing.is_featured,
                  google_maps_url: listing.google_maps_url,
                  listing_tiers: listing.listing_tiers,
                  listing_attributes: listing.listing_attributes,
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
      )}
    </CustomerShell>
  );
}
