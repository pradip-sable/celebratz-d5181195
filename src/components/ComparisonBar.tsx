import React from "react";
import { Link } from "@tanstack/react-router";
import { Scale, X, ArrowRight, Star } from "lucide-react";
import { useComparison, resolveListingMediaUrl, type ComparedListing } from "@/hooks/useComparison";
import { formatInr, unitLabel } from "@/lib/pricing";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=800";

export const ComparisonBar: React.FC = () => {
  const { comparisonIds, listings, removeComparison, clearComparison } = useComparison();

  if (comparisonIds.length === 0) return null;

  const listingMap = new Map<string, ComparedListing>(listings.map((l) => [l.id, l]));

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 bg-surface-dark text-surface-dark-foreground rounded-2xl px-4 py-3 shadow-2xl border border-white/15 flex items-center gap-3 sm:gap-6 max-w-xl w-[92%] sm:w-auto animate-in fade-in slide-in-from-bottom-5 duration-200 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <Scale className="w-5 h-5 text-accent shrink-0" />
        <span className="text-xs font-bold text-white/70 hidden sm:inline">
          Compare ({comparisonIds.length}/3):
        </span>
      </div>

      {/* Mini Thumbnails */}
      <div className="flex items-center gap-2 overflow-x-auto py-0.5">
        {comparisonIds.map((id) => {
          const item = listingMap.get(id);
          const coverMedia = item?.listing_media?.[0];
          const coverUrl = resolveListingMediaUrl(coverMedia?.storage_path) || FALLBACK_IMAGE;

          return (
            <div key={id} className="relative group shrink-0">
              <img
                src={coverUrl}
                alt={item?.title || "Listing thumbnail"}
                className="w-9 h-9 rounded-lg object-cover border border-white/20 bg-white/10"
                referrerPolicy="no-referrer"
              />
              <button
                type="button"
                onClick={() => removeComparison(id)}
                aria-label={
                  item?.title ? `Remove ${item.title} from comparison` : "Remove from comparison"
                }
                className="absolute -top-1.5 -right-1.5 bg-neutral-900 text-white/70 hover:text-white rounded-full p-0.5 border border-white/20 transition-colors shadow-xs"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}

        {comparisonIds.length < 3 && (
          <div className="text-[11px] text-white/50 italic hidden md:block whitespace-nowrap">
            + Select up to {3 - comparisonIds.length} more
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 ml-auto shrink-0">
        <button
          type="button"
          onClick={clearComparison}
          className="text-white/70 hover:text-white text-xs px-2 py-1 transition-colors"
        >
          Clear
        </button>
        <Link
          to="/compare"
          className="px-3.5 py-1.5 bg-accent hover:bg-accent-hover text-accent-foreground rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1 shadow-xs"
        >
          <span>Compare Now</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};

export const ComparisonView: React.FC = () => {
  const { comparisonIds, listings, isLoading, removeComparison, clearComparison } = useComparison();

  if (comparisonIds.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-muted text-muted-foreground flex items-center justify-center mx-auto">
          <Scale className="w-8 h-8" />
        </div>
        <h2 className="font-serif font-bold text-2xl text-foreground">
          Your Comparison Tray is Empty
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
          Browse venues and services, then click the scale icon on any listing card to compare
          pricing, capacity, and features side-by-side.
        </p>
        <Link
          to="/search"
          className="inline-flex items-center px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-bold transition-colors"
        >
          Explore Pune Listings
        </Link>
      </div>
    );
  }

  const comparedItems = listings;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif font-extrabold text-2xl sm:text-3xl text-foreground">
            Side-by-Side Comparison
          </h1>
          <p className="text-xs text-muted-foreground">
            Evaluating {comparisonIds.length} shortlisted Pune{" "}
            {comparisonIds.length === 1 ? "vendor" : "vendors"}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={clearComparison}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear All
          </button>
          <Link to="/search" className="text-xs font-semibold text-primary hover:underline">
            &larr; Add more listings
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 min-w-[700px]">
          {isLoading && comparedItems.length === 0
            ? Array.from({ length: comparisonIds.length }).map((_, idx) => (
                <div
                  key={idx}
                  className="bg-card rounded-2xl border border-border p-5 space-y-4 shadow-sm animate-pulse"
                >
                  <div className="h-48 rounded-xl bg-muted" />
                  <div className="h-5 bg-muted rounded-md w-3/4" />
                  <div className="h-4 bg-muted rounded-md w-1/2" />
                  <div className="space-y-3 pt-3 border-t border-border-subtle">
                    <div className="h-4 bg-muted rounded-md w-2/3" />
                    <div className="h-4 bg-muted rounded-md w-1/2" />
                    <div className="h-4 bg-muted rounded-md w-3/4" />
                  </div>
                </div>
              ))
            : comparedItems.map((item) => {
                const coverMedia = item.listing_media?.[0];
                const coverUrl = resolveListingMediaUrl(coverMedia?.storage_path) || FALLBACK_IMAGE;
                const locality = item.areas?.name;
                const categoryName = item.categories?.name || "Service";
                const categorySlug = item.categories?.slug || "";
                const priceDisplay = item.effective_price
                  ? formatInr(item.effective_price)
                  : formatInr(item.price_from ?? 0);
                const unitDisplay = unitLabel(item.price_unit);

                const categoryAttrs = (item.category_attributes || {}) as Record<string, unknown>;
                const dietaryOptions =
                  (categoryAttrs.veg_type as string) ||
                  (categoryAttrs.vegType as string) ||
                  (categoryAttrs.dietary as string);
                const photographyStyle =
                  (categoryAttrs.style as string) || (categoryAttrs.photography_style as string);

                const eventTypes = (item.listing_event_types || [])
                  .map((et) => et.event_types?.name)
                  .filter((name): name is string => Boolean(name));

                return (
                  <div
                    key={item.id}
                    className="bg-card rounded-2xl border border-border p-5 space-y-4 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative h-48 rounded-xl overflow-hidden mb-3 bg-muted">
                        <img
                          src={coverUrl}
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeComparison(item.id)}
                          aria-label={`Remove ${item.title} from comparison`}
                          className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        {locality && (
                          <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-black/70 text-accent">
                            {locality}
                          </span>
                        )}
                      </div>

                      <h3 className="font-serif font-bold text-base text-foreground line-clamp-1">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Star className="w-3.5 h-3.5 fill-accent text-accent" />
                        <span className="font-bold text-foreground">
                          {item.rating_avg ? Number(item.rating_avg).toFixed(1) : "New"}
                        </span>
                        <span>
                          ({item.review_count ?? 0} {item.review_count === 1 ? "review" : "reviews"}
                          )
                        </span>
                      </div>
                    </div>

                    {/* Spec Comparison Matrix */}
                    <div className="space-y-3 pt-3 border-t border-border-subtle text-xs">
                      <div>
                        <span className="text-[10px] text-muted-foreground font-bold uppercase block">
                          Starting Rate
                        </span>
                        <span className="font-serif font-extrabold text-lg text-primary">
                          {priceDisplay}
                        </span>
                        <span className="text-[10px] text-muted-foreground"> /{unitDisplay}</span>
                      </div>

                      <div>
                        <span className="text-[10px] text-muted-foreground font-bold uppercase block">
                          Service Category
                        </span>
                        <span className="capitalize font-semibold text-foreground">
                          {categoryName}
                        </span>
                      </div>

                      {categorySlug === "venues" &&
                        (item.capacity_min != null || item.capacity_max != null) && (
                          <div>
                            <span className="text-[10px] text-muted-foreground font-bold uppercase block">
                              Guest Capacity
                            </span>
                            <span className="font-semibold text-foreground">
                              {item.capacity_min ?? 0} - {item.capacity_max ?? "—"} Guests
                            </span>
                          </div>
                        )}

                      {categorySlug === "catering" && dietaryOptions && (
                        <div>
                          <span className="text-[10px] text-muted-foreground font-bold uppercase block">
                            Dietary Options
                          </span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {dietaryOptions}
                          </span>
                        </div>
                      )}

                      {categorySlug === "photography" && photographyStyle && (
                        <div>
                          <span className="text-[10px] text-muted-foreground font-bold uppercase block">
                            Style
                          </span>
                          <span className="font-semibold text-foreground">{photographyStyle}</span>
                        </div>
                      )}

                      {eventTypes.length > 0 && (
                        <div>
                          <span className="text-[10px] text-muted-foreground font-bold uppercase block">
                            Suitable For
                          </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {eventTypes.map((t) => (
                              <span
                                key={t}
                                className="text-[10px] px-2 py-0.5 bg-muted rounded-md font-medium text-foreground"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-border-subtle flex gap-2">
                      <Link
                        to="/listing/$slug"
                        params={{ slug: item.slug || item.id }}
                        className="flex-1 py-2 text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground rounded-xl text-center transition-colors"
                      >
                        View Details
                      </Link>
                      <Link
                        to="/request"
                        search={{ listing: item.id, kind: "enquiry" }}
                        className="flex-1 py-2 text-xs font-bold bg-primary hover:bg-primary-dark text-primary-foreground rounded-xl text-center transition-colors"
                      >
                        Enquire
                      </Link>
                    </div>
                  </div>
                );
              })}
        </div>
      </div>
    </div>
  );
};
