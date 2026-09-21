import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, MapPin, Calendar, SlidersHorizontal } from "lucide-react";
import { z } from "zod";
import { searchListings } from "@/lib/listings.functions";
import { ListingCard } from "@/components/ListingCard";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

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
    await context.queryClient.ensureQueryData({
      queryKey: ["listings", deps],
      queryFn: () => searchListings({ data: deps }),
    });
  },
  head: () => ({
    meta: [
      { title: "Search celebrations in Pune | Celebratz" },
      { name: "description", content: "Search and compare venues, photographers, caterers, decorators, DJs and pandits for your celebration in Pune." },
      { property: "og:title", content: "Search celebrations in Pune | Celebratz" },
      { property: "og:description", content: "Search and compare venues, photographers, caterers, decorators, DJs and pandits for your celebration in Pune." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function SearchPage() {
  const search = useSearch({ from: "/search" });
  const { data: listings } = useSuspenseQuery({
    queryKey: ["listings", search],
    queryFn: () => searchListings({ data: search }),
  });

  const [filters, setFilters] = useState({
    q: search.q ?? "",
    area: search.area ?? "",
    date: search.date ?? "",
    minPrice: search.minPrice?.toString() ?? "",
    maxPrice: search.maxPrice?.toString() ?? "",
    minCapacity: search.minCapacity?.toString() ?? "",
    maxCapacity: search.maxCapacity?.toString() ?? "",
  });

  const updateSearch = () => {
    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    if (filters.area) params.set("area", filters.area);
    if (filters.date) params.set("date", filters.date);
    if (filters.minPrice) params.set("minPrice", filters.minPrice);
    if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
    if (filters.minCapacity) params.set("minCapacity", filters.minCapacity);
    if (filters.maxCapacity) params.set("maxCapacity", filters.maxCapacity);
    if (search.category) params.set("category", search.category);
    if (search.eventType) params.set("eventType", search.eventType);
    window.location.href = `/search?${params.toString()}`;
  };

  const FilterForm = () => (
    <div className="space-y-5">
      <div>
        <label className="mb-1.5 block text-sm font-medium">Keyword</label>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            placeholder="Banquet hall, DJ..."
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Area in Pune</label>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <input
            value={filters.area}
            onChange={(e) => setFilters((f) => ({ ...f, area: e.target.value }))}
            placeholder="e.g. Koregaon Park"
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Date</label>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <input
            type="date"
            value={filters.date}
            onChange={(e) => setFilters((f) => ({ ...f, date: e.target.value }))}
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Min price</label>
          <input
            type="number"
            value={filters.minPrice}
            onChange={(e) => setFilters((f) => ({ ...f, minPrice: e.target.value }))}
            placeholder="₹"
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Max price</label>
          <input
            type="number"
            value={filters.maxPrice}
            onChange={(e) => setFilters((f) => ({ ...f, maxPrice: e.target.value }))}
            placeholder="₹"
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Min capacity</label>
          <input
            type="number"
            value={filters.minCapacity}
            onChange={(e) => setFilters((f) => ({ ...f, minCapacity: e.target.value }))}
            placeholder="Guests"
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Max capacity</label>
          <input
            type="number"
            value={filters.maxCapacity}
            onChange={(e) => setFilters((f) => ({ ...f, maxCapacity: e.target.value }))}
            placeholder="Guests"
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none"
          />
        </div>
      </div>

      <Button onClick={updateSearch} className="w-full rounded-xl">
        Apply filters
      </Button>
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 pb-28 pt-6 md:pb-12">
      <div className="flex flex-col gap-6 md:flex-row">
        <aside className="hidden w-72 shrink-0 md:block">
          <div className="sticky top-20 rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
            <h2 className="font-serif text-lg font-semibold">Filters</h2>
            <div className="mt-4">
              <FilterForm />
            </div>
          </div>
        </aside>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-2xl font-semibold">
                {search.category ? listings[0]?.categories?.name ?? "Listings" : "All listings"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {listings.length} result{listings.length !== 1 ? "s" : ""}
              </p>
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="rounded-xl md:hidden">
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-2xl pb-8">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <FilterForm />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing: any) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>

          {listings.length === 0 && (
            <div className="mt-12 rounded-2xl border border-dashed border-border p-10 text-center">
              <p className="text-muted-foreground">No listings match your filters.</p>
              <Button variant="outline" onClick={() => (window.location.href = "/search")} className="mt-4 rounded-xl">
                Clear filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

