import React, { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Heart, MapPin, Star, Users, Scale, Clock, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { effectiveListingPrice, formatInr, unitLabel, type TierLike } from "@/lib/pricing";
import { toggleWishlist, getWishlist } from "@/lib/engagement.functions";

export type ListingCardData = {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  price_from?: number | null;
  price_unit?: string | null;
  rating_avg?: number | null;
  review_count?: number | null;
  effective_price?: number | null;
  availability_updated_at?: string | null;
  calendarLastUpdatedAt?: string | null;
  capacity_min?: number | null;
  capacity_max?: number | null;
  address?: string | null;
  googleMapsUrl?: string | null;
  isFeatured?: boolean | null;
  categories?: { id?: string; name: string; slug?: string } | null;
  category?: string | null;
  areas?: { id?: string; name: string; slug?: string } | null;
  locality?: string | null;
  listing_media?: { storage_path: string; alt_text?: string | null }[] | null;
  coverImage?: string | null;
  listing_tiers?: TierLike[] | null;
  listing_event_types?: { event_types?: { name?: string; slug?: string } | null }[] | null;
  eventTypes?: string[] | null;
  categoryAttributes?: Record<string, unknown> | null;
};

export interface ListingCardProps {
  listing: ListingCardData;
  isFeatured?: boolean;
  isSaved?: boolean;
  isCompared?: boolean;
  onToggleWishlist?: (listingId: string) => void;
  onToggleComparison?: (listingId: string) => void;
  onEnquire?: (listing: ListingCardData) => void;
}

function resolveListingMediaUrl(storagePathOrUrl: string | null | undefined): string | null {
  if (!storagePathOrUrl) return null;
  if (storagePathOrUrl.startsWith("http://") || storagePathOrUrl.startsWith("https://")) {
    return storagePathOrUrl;
  }
  const bucket = "listing-media";
  const cleanPath = storagePathOrUrl.startsWith(`${bucket}/`)
    ? storagePathOrUrl.slice(bucket.length + 1)
    : storagePathOrUrl;
  return supabase.storage.from(bucket).getPublicUrl(cleanPath).data.publicUrl;
}

function getDaysAgoText(isoString: string | null | undefined): {
  text: string;
  isStale: boolean;
} {
  if (!isoString) return { text: "Update pending", isStale: true };
  const diffTime = Math.abs(Date.now() - new Date(isoString).getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return { text: "Updated today", isStale: false };
  if (diffDays === 1) return { text: "Updated yesterday", isStale: false };
  if (diffDays <= 30) return { text: `Updated ${diffDays} days ago`, isStale: false };
  return { text: `Updated ${diffDays} days ago`, isStale: true };
}

function getGoogleMapsDirectionsUrl(item: {
  title?: string;
  address?: string | null;
  locality?: string | null;
  googleMapsUrl?: string | null;
}): string {
  if (item.googleMapsUrl && item.googleMapsUrl.trim().length > 0) {
    return item.googleMapsUrl.trim();
  }
  const queryParts = [item.title, item.address || item.locality, "Pune", "Maharashtra"].filter(
    Boolean,
  );
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    queryParts.join(", "),
  )}`;
}

export function ListingCard({
  listing,
  isFeatured: isFeaturedProp,
  isSaved: isSavedProp,
  isCompared: isComparedProp,
  onToggleWishlist,
  onToggleComparison,
  onEnquire,
}: ListingCardProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toggleWishlistFn = useServerFn(toggleWishlist);
  const fetchWishlistFn = useServerFn(getWishlist);

  // Optional query cache sync for wishlist state when not explicitly provided
  const { data: wishlistData } = useQuery({
    queryKey: ["wishlist"],
    queryFn: () => fetchWishlistFn(),
    staleTime: 60_000,
    retry: false,
    enabled: isSavedProp === undefined,
  });

  const wishlistMutation = useMutation({
    mutationFn: (listingId: string) => toggleWishlistFn({ data: { listingId } }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success(res.saved ? "Added to wishlist" : "Removed from wishlist");
    },
    onError: () => {
      toast.info("Please sign in to save listings to your wishlist");
    },
  });

  // Client-side comparison state fallback
  const [localCompared, setLocalCompared] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      const list = JSON.parse(localStorage.getItem("celebratz_comparison") || "[]");
      return Array.isArray(list) && list.includes(listing.id);
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handleStorage = () => {
      try {
        const list = JSON.parse(localStorage.getItem("celebratz_comparison") || "[]");
        setLocalCompared(Array.isArray(list) && list.includes(listing.id));
      } catch {
        // ignore
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [listing.id]);

  const isSaved =
    isSavedProp !== undefined
      ? isSavedProp
      : Boolean(
          wishlistData?.some(
            (item: { listing?: { id: string }; listing_id?: string }) =>
              item.listing?.id === listing.id || item.listing_id === listing.id,
          ),
        );

  const isCompared = isComparedProp !== undefined ? isComparedProp : localCompared;

  // Resolved fields
  const rawCoverPath = listing.coverImage || listing.listing_media?.[0]?.storage_path;
  const coverImage =
    resolveListingMediaUrl(rawCoverPath) ||
    "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600&q=80";

  const categoryName = listing.categories?.name || listing.category || "Celebration Service";
  const categorySlug = (
    listing.categories?.slug || (typeof listing.category === "string" ? listing.category : "")
  ).toLowerCase();

  const locality = listing.areas?.name || listing.locality || "Pune";
  const price = listing.effective_price ?? effectiveListingPrice(listing);
  const formattedPrice = formatInr(price);
  const priceUnitStr = unitLabel(listing.price_unit || "per_day");

  const { text: daysAgoText, isStale } = getDaysAgoText(
    listing.availability_updated_at || listing.calendarLastUpdatedAt,
  );

  const isFeatured = isFeaturedProp ?? listing.isFeatured ?? false;
  const ratingValue = listing.rating_avg ? Number(listing.rating_avg).toFixed(1) : "4.8";
  const reviewCount = listing.review_count ?? 0;

  const capacityMin =
    listing.capacity_min ??
    (typeof listing.categoryAttributes?.capacityMin === "number"
      ? listing.categoryAttributes.capacityMin
      : undefined);

  const capacityMax =
    listing.capacity_max ??
    (typeof listing.categoryAttributes?.capacityMax === "number"
      ? listing.categoryAttributes.capacityMax
      : undefined);

  const vegType =
    typeof listing.categoryAttributes?.vegType === "string"
      ? listing.categoryAttributes.vegType
      : undefined;
  const deliveryTimelineDays =
    typeof listing.categoryAttributes?.deliveryTimelineDays === "number" ||
    typeof listing.categoryAttributes?.deliveryTimelineDays === "string"
      ? String(listing.categoryAttributes.deliveryTimelineDays)
      : undefined;
  const soundWattage =
    typeof listing.categoryAttributes?.soundWattage === "string"
      ? listing.categoryAttributes.soundWattage
      : undefined;

  const handleCardClick = () => {
    navigate({
      to: "/listing/$slug",
      params: { slug: listing.slug },
    });
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleWishlist) {
      onToggleWishlist(listing.id);
    } else {
      wishlistMutation.mutate(listing.id);
    }
  };

  const handleComparisonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleComparison) {
      onToggleComparison(listing.id);
      return;
    }
    try {
      const list: string[] = JSON.parse(localStorage.getItem("celebratz_comparison") || "[]");
      const next = list.includes(listing.id)
        ? list.filter((id) => id !== listing.id)
        : [...list, listing.id];
      localStorage.setItem("celebratz_comparison", JSON.stringify(next));
      const nowCompared = next.includes(listing.id);
      setLocalCompared(nowCompared);
      toast.success(nowCompared ? "Added to comparison" : "Removed from comparison");
      window.dispatchEvent(new Event("storage"));
    } catch {
      toast.error("Could not update comparison list");
    }
  };

  const handleEnquireClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEnquire) {
      onEnquire(listing);
    } else {
      navigate({
        to: "/request",
        search: { listing: listing.id, kind: "enquiry" },
      });
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="group bg-card rounded-2xl border border-border hover:border-accent/80 hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer flex flex-col justify-between relative select-none"
    >
      {/* Top Media Banner */}
      <div className="h-56 relative overflow-hidden">
        <img
          src={coverImage}
          alt={listing.title}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Gradient Shadow Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-primary-dark/90 text-accent border border-accent/30 backdrop-blur-xs shadow-xs">
            {categoryName}
          </span>
          {isFeatured && (
            <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-accent text-accent-foreground shadow-xs">
              Featured
            </span>
          )}
        </div>

        {/* Wishlist Floating Button */}
        <button
          type="button"
          onClick={handleWishlistClick}
          aria-label={isSaved ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute top-3 right-3 p-2 rounded-full bg-white/90 hover:bg-white text-foreground hover:text-destructive backdrop-blur-xs shadow-md transition-transform active:scale-90 cursor-pointer"
        >
          <Heart className={`w-4 h-4 ${isSaved ? "fill-destructive text-destructive" : ""}`} />
        </button>

        {/* Bottom Locality & Staleness info over image */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
          <a
            href={getGoogleMapsDirectionsUrl({
              title: listing.title,
              locality,
              address: listing.address,
              googleMapsUrl: listing.googleMapsUrl,
            })}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 drop-shadow-xs font-medium hover:text-accent transition-colors group/pin cursor-pointer"
            title="Open in Google Maps"
          >
            <MapPin className="w-3.5 h-3.5 text-accent group-hover/pin:scale-110 transition-transform" />
            <span className="group-hover/pin:underline">{locality}, Pune</span>
          </a>

          <div
            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold backdrop-blur-xs ${
              isStale
                ? "bg-primary-dark/80 text-accent border border-accent/40"
                : "bg-black/50 text-white/90"
            }`}
          >
            {daysAgoText}
          </div>
        </div>
      </div>

      {/* Card Body Details */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="font-serif font-bold text-base sm:text-lg text-foreground group-hover:text-primary transition-colors leading-snug">
              {listing.title}
            </h3>
            {/* Star Rating */}
            <div className="flex items-center gap-1 bg-accent-subtle/40 px-2 py-0.5 rounded-md border border-accent/30 shrink-0">
              <Star className="w-3.5 h-3.5 fill-accent text-accent" />
              <span className="text-xs font-bold text-foreground">{ratingValue}</span>
            </div>
          </div>

          {listing.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-light">
              {listing.description}
            </p>
          )}

          {/* Quick Specifications */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {(categorySlug === "venues" || categorySlug === "venue") &&
              (capacityMin || capacityMax) && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-foreground flex items-center gap-1">
                  <Users className="w-3 h-3 text-muted-foreground" />
                  {capacityMin && capacityMax
                    ? `${capacityMin}-${capacityMax} Guests`
                    : `Up to ${capacityMax || capacityMin} Guests`}
                </span>
              )}

            {categorySlug === "catering" && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                {vegType || "Pure Veg & Multi-Cuisine"}
              </span>
            )}

            {categorySlug === "photography" && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200">
                ⚡{" "}
                {deliveryTimelineDays
                  ? `${deliveryTimelineDays} Days Delivery`
                  : "High-Res Candid & Drone"}
              </span>
            )}

            {categorySlug === "decoration" && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
                ✨ Custom Mandap &amp; Floral
              </span>
            )}

            {(categorySlug === "music_dj" || categorySlug === "dj-music") && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200">
                🔊 {soundWattage || "Pro Sound &amp; Live DJ"}
              </span>
            )}

            {(categorySlug === "pandit_priest" || categorySlug === "pandit") && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-orange-50 text-orange-800 border border-orange-200">
                🔥 Vedic Vivah &amp; Rituals
              </span>
            )}
          </div>

          {/* Subtle Response Time Badge */}
          <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-primary bg-primary-subtle px-2.5 py-0.5 rounded-full border border-border-subtle font-medium">
            <Clock className="w-3 h-3 text-primary shrink-0" />
            <span>Response time: Usually within 2 hours</span>
          </div>
        </div>

        {/* Card Footer: Pricing & Compare Button */}
        <div className="pt-3.5 border-t border-border-subtle flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] uppercase font-bold text-muted-foreground block tracking-wider">
              Starting Price
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-extrabold text-base sm:text-lg text-foreground font-serif">
                {formattedPrice}
              </span>
              <span className="text-[11px] text-muted-foreground font-medium">
                /{priceUnitStr.replace("per ", "")}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleComparisonClick}
              title="Add to side-by-side comparison"
              className={`p-2 rounded-xl text-xs border transition-colors cursor-pointer ${
                isCompared
                  ? "bg-accent-subtle text-accent-dark border-accent font-bold"
                  : "bg-muted/40 hover:bg-muted text-foreground border-border"
              }`}
            >
              <Scale className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleEnquireClick}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>Enquire</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
