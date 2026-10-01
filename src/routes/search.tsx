import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Search, SlidersHorizontal, X, MapPin, Calendar, Users } from "lucide-react";
import { z } from "zod";
import { searchListings, getHomeData } from "@/lib/listings.functions";
import { ListingCard } from "@/components/ListingCard";
import { SearchFiltersBottomSheet } from "@/components/SearchFiltersBottomSheet";
import { formatInr } from "@/lib/pricing";

const searchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  eventType: z.string().optional(),
  area: z.string().optional(),
  date: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  minCapacity: z.coerce.number().optional(),
  maxCapacity: z.coerce.number().optional(),
});

export const Route = createFileRoute("/search")({
  component: SearchPage,
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    await Promise.all([
      context.queryClient.ensureQueryData({
        queryKey: ["listings", deps],
        queryFn: () => searchListings({ data: deps }),
      }),
      context.queryClient.ensureQueryData({
        queryKey: ["home"],
        queryFn: getHomeData,
      }),
    ]);
  },
  head: () => ({
    meta: [
      { title: "Search celebrations in Pune | Celebratz" },
      {
        name: "description",
        content:
          "Search and compare venues, photographers, caterers, decorators, DJs and pandits for your celebration in Pune.",
      },
      { property: "og:title", content: "Search celebrations in Pune | Celebratz" },
      {
        property: "og:description",
        content:
          "Search and compare venues, photographers, caterers, decorators, DJs and pandits for your celebration in Pune.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function SearchPage() {
  const search = useSearch({ from: "/search" });
  const navigate = useNavigate();

  const { data: listings } = useSuspenseQuery({
    queryKey: ["listings", search],
    queryFn: () => searchListings({ data: search }),
  });

  const { data: homeData } = useSuspenseQuery({
    queryKey: ["home"],
    queryFn: getHomeData,
  });

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(search.q ?? "");

  // Sync search input with search.q query param
  useEffect(() => {
    setSearchInput(search.q ?? "");
  }, [search.q]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({
      to: "/search",
      search: {
        ...search,
        q: searchInput.trim() || undefined,
      },
    });
  };

  const handleClearSearch = () => {
    setSearchInput("");
    navigate({
      to: "/search",
      search: {
        ...search,
        q: undefined,
      },
    });
  };

  const hasActiveFilters = Boolean(
    (search.category && search.category !== "all") ||
      (search.area && search.area !== "all") ||
      (search.eventType && search.eventType !== "all") ||
      search.date ||
      search.minCapacity ||
      search.maxPrice ||
      search.q,
  );

  const selectedAreaName = homeData.areas.find((a) => a.slug === search.area)?.name;
  const selectedEventTypeName = homeData.eventTypes.find((e) => e.slug === search.eventType)?.name;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-28 pt-6 md:pb-12 space-y-6">
      {/* Search Header Bar (matching AI Studio App.tsx:206-241 & 293-322) */}
      <div className="bg-card rounded-3xl p-4 sm:p-6 border border-border shadow-2xs space-y-4">
        <form
          onSubmit={handleSearchSubmit}
          className="flex flex-col sm:flex-row gap-3 items-center justify-between"
        >
          {/* Keyword Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder='Search with phrases like "Wedding venue in Baner", "Kothrud banquet", "Catering in Hadapsar"...'
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-muted/40 border border-border rounded-2xl text-xs sm:text-sm text-foreground font-medium placeholder:text-muted-foreground focus:outline-hidden focus:border-primary transition-colors"
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 cursor-pointer"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Trigger Button */}
          <button
            type="button"
            onClick={() => setIsFiltersOpen(true)}
            className="w-full sm:w-auto px-4 py-2.5 bg-primary hover:bg-primary-dark text-accent-subtle rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all shrink-0 cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4 text-accent" />
            <span>Filter Options</span>
            {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-accent" />}
          </button>
        </form>

        {/* Category Quick Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() =>
              navigate({
                to: "/search",
                search: { ...search, category: undefined },
              })
            }
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              !search.category || search.category === "all"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted text-foreground hover:bg-muted"
            }`}
          >
            ✨ All Categories ({listings.length})
          </button>
          {homeData.categories.map((c) => {
            const isSelected = search.category === c.slug;
            return (
              <button
                key={c.slug}
                type="button"
                onClick={() =>
                  navigate({
                    to: "/search",
                    search: {
                      ...search,
                      category: isSelected ? undefined : c.slug,
                    },
                  })
                }
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted text-foreground hover:bg-muted"
                }`}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Counter & Active Filter Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>
            Showing <strong className="text-foreground font-bold">{listings.length}</strong> Pune venue &amp; vendor listings
            {selectedAreaName && (
              <span className="ml-1 text-primary font-bold">in {selectedAreaName}</span>
            )}
          </span>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => navigate({ to: "/search", search: {} })}
            className="text-accent-dark hover:underline font-bold cursor-pointer self-start sm:self-auto"
          >
            Clear All Filters
          </button>
        )}
      </div>

      {/* Active Filter Chips */}
      {(search.area || search.eventType || search.date || search.minCapacity || search.maxPrice) && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {search.area && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted border border-border text-foreground text-xs font-medium">
              <MapPin className="w-3 h-3 text-accent" />
              <span>{selectedAreaName || search.area}</span>
              <button
                type="button"
                onClick={() =>
                  navigate({
                    to: "/search",
                    search: { ...search, area: undefined },
                  })
                }
                className="hover:text-foreground text-muted-foreground cursor-pointer"
                title="Remove area filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {search.eventType && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted border border-border text-foreground text-xs font-medium">
              <span>🎉 {selectedEventTypeName || search.eventType}</span>
              <button
                type="button"
                onClick={() =>
                  navigate({
                    to: "/search",
                    search: { ...search, eventType: undefined },
                  })
                }
                className="hover:text-foreground text-muted-foreground cursor-pointer"
                title="Remove event type filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {search.date && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted border border-border text-foreground text-xs font-medium">
              <Calendar className="w-3 h-3 text-accent" />
              <span>{search.date}</span>
              <button
                type="button"
                onClick={() =>
                  navigate({
                    to: "/search",
                    search: { ...search, date: undefined },
                  })
                }
                className="hover:text-foreground text-muted-foreground cursor-pointer"
                title="Remove date filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {search.minCapacity && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted border border-border text-foreground text-xs font-medium">
              <Users className="w-3 h-3 text-accent" />
              <span>{search.minCapacity}+ Pax</span>
              <button
                type="button"
                onClick={() =>
                  navigate({
                    to: "/search",
                    search: { ...search, minCapacity: undefined },
                  })
                }
                className="hover:text-foreground text-muted-foreground cursor-pointer"
                title="Remove guest count filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {search.maxPrice && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted border border-border text-foreground text-xs font-medium">
              <span>≤ {formatInr(search.maxPrice)}</span>
              <button
                type="button"
                onClick={() =>
                  navigate({
                    to: "/search",
                    search: { ...search, maxPrice: undefined },
                  })
                }
                className="hover:text-foreground text-muted-foreground cursor-pointer"
                title="Remove budget filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Listings Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map((listing: any) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>

      {/* Empty State (matching AI Studio App.tsx:362-380) */}
      {listings.length === 0 && (
        <div className="bg-card rounded-3xl border border-border p-12 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-full bg-muted text-muted-foreground flex items-center justify-center mx-auto">
            <Search className="w-7 h-7" />
          </div>
          <h3 className="font-serif font-bold text-xl text-foreground">
            No matching Pune listings found
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Try adjusting your budget range, clearing locality filters, or searching for other event categories.
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => navigate({ to: "/search", search: {} })}
              className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary-dark transition-colors cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        </div>
      )}

      {/* Modal Bottom Sheet */}
      <SearchFiltersBottomSheet
        isOpen={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
        categories={homeData.categories}
        eventTypes={homeData.eventTypes}
        areas={homeData.areas}
        totalResults={listings.length}
      />
    </div>
  );
}
