import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import {
  MapPin,
  Phone,
  Mail,
  Star,
  Clock,
  Check,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Layers,
  Gift,
  Heart,
  Scale,
  Share2,
  Maximize2,
  Copy,
  MessageSquare,
  Send,
  Globe,
  X,
} from "lucide-react";
import { format, differenceInDays, addDays } from "date-fns";
import { toast } from "sonner";
import { getListingBySlug } from "@/lib/listings.functions";
import { getPackagesForListing } from "@/lib/packages.functions";
import { toggleWishlist, getWishlist } from "@/lib/engagement.functions";
import { useComparison, toggleComparisonId } from "@/hooks/useComparison";
import { useModalScrollLock } from "@/hooks/useModalScrollLock";
import { PackageCard } from "@/components/PackageCard";
import { effectiveListingPrice, formatInr, unitLabel } from "@/lib/pricing";


export const Route = createFileRoute("/listing/$slug")({
  component: ListingPage,
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData({
      queryKey: ["listing", params.slug],
      queryFn: () => getListingBySlug({ data: { slug: params.slug } }),
    });
  },
  head: ({ params }) => ({
    meta: [
      { title: `Celebratz Listing | ${params.slug}` },
      { name: "description", content: "View details, pricing, availability and reviews for this Pune celebration vendor." },
      { property: "og:title", content: `Celebratz Listing | ${params.slug}` },
      { property: "og:description", content: "View details, pricing, availability and reviews for this Pune celebration vendor." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function ListingPage() {
  const { slug } = useParams({ from: "/listing/$slug" });
  const { data } = useSuspenseQuery({
    queryKey: ["listing", slug],
    queryFn: () => getListingBySlug({ data: { slug } }),
  });

  const { listing, availability, reviews } = data;
  const [activeImage, setActiveImage] = useState(0);
  const images = listing.listing_media?.length ? listing.listing_media : [{ storage_path: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80" }];

  const attributes = listing.listing_attributes?.reduce((acc: Record<string, any>, attr: any) => {
    acc[attr.field_key] = attr.value;
    return acc;
  }, {}) ?? {};

  const eventTypes = listing.listing_event_types?.map((et: any) => et.event_types?.name).filter(Boolean) ?? [];

  const stale = listing.availability_updated_at
    ? differenceInDays(new Date(), new Date(listing.availability_updated_at)) > 30
    : true;

  const tiers = ((listing as any).listing_tiers ?? [])
    .filter((tier: any) => tier.is_active)
    .sort((a: any, b: any) => a.sort_order - b.sort_order);
  const effectivePrice = (data as any).effective_price ?? effectiveListingPrice(listing as any);

  const { data: relatedPackages } = useQuery({
    queryKey: ["packages-for-listing", listing.id],
    queryFn: () => getPackagesForListing({ data: { listingId: listing.id } }),
  });

  const queryClient = useQueryClient();
  const toggleWishlistFn = useServerFn(toggleWishlist);
  const fetchWishlistFn = useServerFn(getWishlist);

  // 1. Wishlist state & mutation
  const { data: wishlistData } = useQuery({
    queryKey: ["wishlist"],
    queryFn: () => fetchWishlistFn(),
    staleTime: 60_000,
    retry: false,
  });

  const isSaved = wishlistData?.some((item: any) => item.listing?.id === listing.id);

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

  const handleToggleWishlist = () => {
    wishlistMutation.mutate(listing.id);
  };

  // 2. Comparison state
  const { comparisonIds } = useComparison();
  const isCompared = comparisonIds.includes(listing.id);

  const handleToggleComparison = () => {
    toggleComparisonId(listing.id);
  };

  // 3. Share state & handlers
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const getShareUrl = () => {
    if (typeof window !== "undefined") {
      return window.location.href;
    }
    return `https://celebratz.com/listing/${listing.slug}`;
  };

  const shareTitle = `${listing.title} | Celebratz Pune`;
  const shareText = `Check out ${listing.title} (${listing.categories?.name ?? ""}) in ${listing.areas?.name ?? ""}, Pune on Celebratz!`;

  const handleCopyLink = async () => {
    const url = getShareUrl();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const input = document.createElement("textarea");
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
      }
      setCopiedLink(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (e) {
      console.error("Failed to copy link", e);
    }
  };

  const handleShare = async () => {
    const url = getShareUrl();
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: url,
        });
        return;
      } catch (e: any) {
        if (e.name === "AbortError") return;
      }
    }
    setIsShareModalOpen(true);
  };

  // 4. Lightbox state & handlers
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useModalScrollLock(isLightboxOpen, () => setIsLightboxOpen(false));
  useModalScrollLock(isShareModalOpen, () => setIsShareModalOpen(false));

  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsLightboxOpen(false);
      } else if (e.key === "ArrowLeft") {
        setActiveImage((i) => (i === 0 ? images.length - 1 : i - 1));
      } else if (e.key === "ArrowRight") {
        setActiveImage((i) => (i === images.length - 1 ? 0 : i + 1));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen, images.length]);

  return (
    <div className="mx-auto max-w-5xl px-4 pb-28 pt-4 md:pb-12 md:pt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/search"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> Back to search
        </Link>

        {/* Action Buttons: Share, Compare, Wishlist */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="p-2 rounded-xl bg-card hover:bg-muted text-foreground hover:text-primary border border-border transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs text-xs font-semibold"
            title="Share listing"
          >
            <Share2 className="w-4 h-4 text-muted-foreground" />
            <span className="hidden sm:inline">Share</span>
          </button>

          <button
            type="button"
            onClick={handleToggleComparison}
            className={`p-2 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs ${
              isCompared
                ? "bg-accent-subtle text-accent-dark border-accent font-bold"
                : "bg-card hover:bg-muted text-foreground border-border"
            }`}
            title={isCompared ? "Remove from comparison" : "Add to comparison"}
          >
            <Scale className="w-4 h-4" />
            <span className="hidden sm:inline">{isCompared ? "In Compare Tray" : "Compare"}</span>
          </button>

          <button
            type="button"
            onClick={handleToggleWishlist}
            className="p-2 rounded-xl bg-card hover:bg-muted text-foreground hover:text-destructive border border-border transition-colors cursor-pointer shadow-xs"
            title={isSaved ? "Remove from wishlist" : "Add to wishlist"}
            aria-label="Wishlist toggle"
          >
            <Heart className={`w-4 h-4 ${isSaved ? "fill-destructive text-destructive" : ""}`} />
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Main column */}
        <div>
          {/* Gallery */}
          <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-muted group">
            <img
              src={images[activeImage]?.storage_path}
              alt={listing.title}
              className="aspect-[16/10] w-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-[1.01]"
              onClick={() => setIsLightboxOpen(true)}
            />

            {/* "Photo X of Y" counter overlay */}
            <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/60 text-white text-xs font-semibold backdrop-blur-xs select-none pointer-events-none z-10">
              Photo {activeImage + 1} of {images.length}
            </div>

            {/* Zoom / Fullscreen overlay button */}
            <button
              type="button"
              onClick={() => setIsLightboxOpen(true)}
              className="absolute bottom-3 right-3 p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-medium z-10 shadow-sm"
              title="View fullscreen photo"
            >
              <Maximize2 className="h-4 w-4" />
              <span className="hidden sm:inline">Fullscreen</span>
            </button>

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImage((i) => (i === 0 ? images.length - 1 : i - 1));
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 backdrop-blur hover:bg-background transition-colors cursor-pointer z-10 shadow-sm"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImage((i) => (i === images.length - 1 ? 0 : i + 1));
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 backdrop-blur hover:bg-background transition-colors cursor-pointer z-10 shadow-sm"
                  aria-label="Next photo"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
            {images.map((img: any, idx: number) => (
              <button
                key={idx}
                onClick={() => setActiveImage(idx)}
                className={`relative shrink-0 overflow-hidden rounded-xl border-2 ${activeImage === idx ? "border-primary" : "border-transparent"}`}
              >
                <img src={img.storage_path} alt="" className="h-16 w-16 object-cover" />
              </button>
            ))}
          </div>

          {/* Header */}
          <div className="mt-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className="text-sm font-medium text-primary">{listing.categories?.name}</span>
                <h1 className="font-serif text-2xl font-semibold md:text-3xl">{listing.title}</h1>
                <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" /> {listing.areas?.name}, {listing.address}
                </p>
              </div>
              {listing.rating_avg ? (
                <div className="flex items-center gap-1 rounded-xl bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {Number(listing.rating_avg).toFixed(1)}
                  <span className="text-amber-600/70">({listing.review_count})</span>
                </div>
              ) : null}
            </div>

            <p className="mt-4 leading-relaxed text-foreground/90">{listing.description}</p>

            {/* Event types */}
            {eventTypes.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {eventTypes.map((name: string) => (
                  <span key={name} className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">
                    {name}
                  </span>
                ))}
              </div>
            )}

            {/* Package Tiers */}
            {tiers.length >= 2 && (
              <div className="mt-8">
                <h2 className="flex items-center gap-2 font-serif text-lg font-semibold">
                  <Layers className="h-5 w-5 text-primary" /> Package Tiers
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Pick the tier that suits your celebration — all prices are {unitLabel(listing.price_unit)}.
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {tiers.map((tier: any) => (
                    <div key={tier.id} className="flex flex-col rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
                      <p className="font-serif text-base font-semibold">{tier.name}</p>
                      <p className="mt-1 text-xl font-semibold text-primary">{formatInr(Number(tier.price))}</p>
                      <p className="text-xs text-muted-foreground">{unitLabel(listing.price_unit)}</p>
                      {tier.description && <p className="mt-2 text-sm text-muted-foreground">{tier.description}</p>}
                      {tier.features?.length ? (
                        <ul className="mt-3 space-y-1 text-sm">
                          {tier.features.map((feature: string, i: number) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      <Link
                        to="/request"
                        search={{ listing: listing.id, tier: tier.id, kind: "booking_request" }}
                        className="mt-4 block rounded-xl bg-primary px-4 py-2 text-center text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                      >
                        Choose this tier
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}


            <div className="mt-8 rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
              <h2 className="font-serif text-lg font-semibold">Details</h2>
              <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {Object.entries(attributes).map(([key, value]) => {
                  const label = key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
                  let display = String(value);
                  if (typeof value === "boolean") display = value ? "Yes" : "No";
                  if (Array.isArray(value)) display = value.join(", ");
                  return (
                    <div key={key} className="flex justify-between gap-4 border-b border-border/40 pb-2 last:border-0">
                      <dt className="text-sm text-muted-foreground">{label}</dt>
                      <dd className="text-sm font-medium">{display}</dd>
                    </div>
                  );
                })}
              </dl>
            </div>

            {/* Availability */}
            <div className="mt-8 rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-lg font-semibold">Availability</h2>
                {listing.availability_updated_at && !stale && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    Updated {differenceInDays(new Date(), new Date(listing.availability_updated_at))} days ago
                  </span>
                )}
              </div>
              {stale ? (
                <div className="mt-4 flex items-start gap-3 rounded-xl bg-warning/15 p-4 text-sm text-warning border border-warning/30">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>This calendar has not been updated recently. Please check availability directly with the vendor.</p>
                </div>
              ) : (
                <AvailabilityCalendar availability={availability} />
              )}
            </div>

            {/* Reviews */}
            <div className="mt-8 rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
              <h2 className="font-serif text-lg font-semibold">Reviews</h2>
              {reviews.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">No reviews yet.</p>
              ) : (
                <div className="mt-4 space-y-4">
                  {reviews.map((review: any, idx: number) => (
                    <div key={idx} className="border-b border-border/40 pb-4 last:border-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{review.profiles?.full_name ?? "Customer"}</span>
                        <span className="flex items-center gap-1 text-sm font-medium">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          {review.rating}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{format(new Date(review.created_at), "dd MMM yyyy")}</p>
                      <p className="mt-2 text-sm">{review.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {relatedPackages && relatedPackages.length > 0 && (
              <div className="mt-8 rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
                <h2 className="flex items-center gap-2 font-serif text-lg font-semibold">
                  <Gift className="h-5 w-5 text-primary" /> Also part of a package
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  This vendor bundles this service with others — often at a lower combined price.
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {relatedPackages.map((pkg: any) => (
                    <PackageCard key={pkg.id} pkg={pkg} />
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Sidebar */}
        <aside className="lg:sticky lg:top-20 lg:h-fit">
          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">Starting from</p>
            <p className="font-serif text-3xl font-semibold text-primary">{formatInr(effectivePrice)}</p>
            <p className="text-sm text-muted-foreground">{unitLabel(listing.price_unit)}</p>
            {tiers.length >= 2 && (
              <p className="mt-1 text-xs text-muted-foreground">
                Lowest of {tiers.length} package tiers · choose your tier on the request form
              </p>
            )}


            <div className="mt-5 space-y-3">
              <Link
                to="/request"
                search={{ listing: listing.id, kind: "booking_request" }}
                className="block w-full rounded-xl bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Request to Book
              </Link>
              <Link
                to="/request"
                search={{ listing: listing.id, kind: "enquiry" }}
                className="block w-full rounded-xl border border-primary px-4 py-3 text-center text-sm font-semibold text-primary hover:bg-primary/5"
              >
                Enquire
              </Link>
            </div>


            <div className="mt-6 border-t border-border/40 pt-5">
              <h3 className="font-medium">Vendor</h3>
              <p className="mt-1 font-serif text-lg font-semibold">{listing.vendors?.business_name}</p>
              <p className="mt-2 text-sm text-muted-foreground">{listing.vendors?.about}</p>
              <div className="mt-3 space-y-1 text-sm">
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" /> {listing.vendors?.contact_phone}
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" /> {listing.vendors?.contact_email}
                </p>
              </div>
            </div>

            <p className="mt-5 text-xs text-muted-foreground">
              Your contact details will be shared with the vendor when you submit a request.
            </p>
          </div>
        </aside>
      </div>

      {/* Image Gallery Lightbox Modal */}
      {isLightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Photo gallery lightbox"
          className="fixed inset-0 z-50 flex flex-col justify-between bg-black/95 p-3 sm:p-6 backdrop-blur-md animate-in fade-in select-none"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Top Bar */}
          <div
            className="flex items-center justify-between text-white pb-3 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold backdrop-blur-xs">
                Photo {activeImage + 1} of {images.length}
              </span>
              <span className="text-xs text-white/70 hidden sm:inline truncate max-w-md">
                {listing.title}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Close fullscreen view (Esc)"
              aria-label="Close fullscreen view"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Main Photo Center */}
          <div
            className="relative flex flex-1 items-center justify-center p-2 min-h-0"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={images[activeImage]?.storage_path}
              alt={listing.title}
              className="max-h-[75vh] sm:max-h-[80vh] max-w-full object-contain rounded-xl shadow-2xl select-none"
            />

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveImage((i) => (i === 0 ? images.length - 1 : i - 1))}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/60 hover:bg-black/80 text-white p-3 backdrop-blur-xs transition-colors cursor-pointer"
                  title="Previous photo (Left arrow)"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveImage((i) => (i === images.length - 1 ? 0 : i + 1))}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/60 hover:bg-black/80 text-white p-3 backdrop-blur-xs transition-colors cursor-pointer"
                  title="Next photo (Right arrow)"
                  aria-label="Next photo"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnail Strip */}
          {images.length > 1 && (
            <div
              className="flex justify-center gap-2 overflow-x-auto pt-3 pb-1 z-10 max-w-3xl mx-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {images.map((img: any, idx: number) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImage(idx)}
                  className={`relative shrink-0 overflow-hidden rounded-lg border-2 transition-all cursor-pointer ${
                    activeImage === idx
                      ? "border-primary scale-105 shadow-md opacity-100"
                      : "border-transparent opacity-50 hover:opacity-100"
                  }`}
                >
                  <img src={img.storage_path} alt="" className="h-12 w-16 object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Share Listing Modal */}
      {isShareModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Share celebration listing"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs animate-in fade-in"
          onClick={() => setIsShareModalOpen(false)}
        >
          <div
            className="bg-card rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-border space-y-5 relative animate-in zoom-in-95 text-foreground"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-accent-subtle text-accent-dark">
                  <Share2 className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-foreground">Share Celebration Listing</h3>
                  <p className="text-[11px] text-muted-foreground">Send to family, partner, or event planning groups</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="p-1.5 rounded-xl bg-muted hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                aria-label="Close share dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Listing Preview Snippet */}
            <div className="p-3 bg-muted/40 rounded-2xl border border-border flex gap-3 items-center">
              <img
                src={images[0]?.storage_path}
                alt={listing.title}
                className="w-16 h-16 rounded-xl object-cover shrink-0 shadow-2xs"
              />
              <div className="min-w-0 space-y-0.5">
                <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-primary-subtle text-primary">
                  {listing.categories?.name ?? "Listing"}
                </span>
                <h4 className="font-bold text-xs text-foreground truncate">{listing.title}</h4>
                <p className="text-[11px] text-muted-foreground truncate">
                  {listing.areas?.name ? `${listing.areas.name}, Pune` : "Pune"} &bull; {formatInr(effectivePrice)}/{unitLabel(listing.price_unit)}
                </p>
              </div>
            </div>

            {/* Direct Copy Link Box */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Direct Listing Link
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={getShareUrl()}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-xs font-mono text-foreground select-all outline-hidden truncate"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-xs ${
                    copiedLink
                      ? "bg-success text-success-foreground"
                      : "bg-primary hover:bg-primary/90 text-primary-foreground"
                  }`}
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick 1-Tap Sharing Channels */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Share via 1-Tap
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {/* WhatsApp */}
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + " " + getShareUrl())}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-success/10 hover:bg-success/15 border border-success/30 text-success text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-2xs cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 text-success" />
                  <span>WhatsApp</span>
                </a>

                {/* Email */}
                <a
                  href={`mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(shareText + "\n\n" + getShareUrl())}`}
                  className="p-2.5 rounded-xl bg-muted hover:bg-muted/80 border border-border text-foreground text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>Email</span>
                </a>

                {/* Twitter / X */}
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(getShareUrl())}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-surface-dark hover:bg-surface-dark/80 text-surface-dark-foreground text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-2xs cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-accent" />
                  <span>X (Twitter)</span>
                </a>

                {/* Facebook */}
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareUrl())}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Globe className="w-4 h-4 text-primary" />
                  <span>Facebook</span>
                </a>
              </div>
            </div>

            {/* Close Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="w-full py-2.5 bg-muted hover:bg-muted text-foreground rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AvailabilityCalendar({ availability }: { availability: any[] }) {
  const today = new Date();
  const [monthOffset, setMonthOffset] = useState(0);
  const start = addDays(today, monthOffset * 30);
  const days = Array.from({ length: 30 }, (_, i) => addDays(start, i));

  const stateMap = availability.reduce((acc: Record<string, string>, cur: any) => {
    acc[cur.date] = cur.state;
    return acc;
  }, {});

  return (
    <div className="mt-4">
      <div className="mb-3 flex items-center justify-between">
        <button onClick={() => setMonthOffset((o) => o - 1)} className="rounded-lg p-1 hover:bg-muted cursor-pointer transition-colors" aria-label="Previous month">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-sm font-medium">{format(start, "MMMM yyyy")}</span>
        <button onClick={() => setMonthOffset((o) => o + 1)} className="rounded-lg p-1 hover:bg-muted cursor-pointer transition-colors" aria-label="Next month">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="py-1 font-medium text-muted-foreground">{d}</div>
        ))}
        {days.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const state = stateMap[dateKey] ?? "available";
          const color =
            state === "booked"
              ? "bg-destructive/15 text-destructive"
              : state === "tentative"
              ? "bg-warning/15 text-warning"
              : "bg-success/15 text-success";
          return (
            <div
              key={dateKey}
              className={`flex flex-col items-center justify-center rounded-lg py-2 text-xs font-medium ${color}`}
              title={`${format(day, "dd MMM")}: ${state}`}
            >
              <span>{format(day, "d")}</span>
              <span className="mt-0.5 text-[10px] capitalize">{state}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-success" /> Available</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-warning" /> Tentative</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-destructive" /> Booked</span>
      </div>
    </div>
  );
}
