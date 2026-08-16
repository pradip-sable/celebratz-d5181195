import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Search, MapPin, Calendar, PartyPopper, Star } from "lucide-react";
import { getHomeData } from "@/lib/listings.functions";

export const Route = createFileRoute("/")({
  component: Home,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData({
      queryKey: ["home"],
      queryFn: getHomeData,
    });
  },
  head: () => ({
    meta: [
      { title: "Celebratz — Discover venues & services for celebrations in Pune" },
      { name: "description", content: "Find and compare banquet halls, photographers, caterers, decorators, DJs and pandits for weddings, birthdays, engagements and corporate events in Pune." },
      { property: "og:title", content: "Celebratz — Discover venues & services for celebrations in Pune" },
      { property: "og:description", content: "Find and compare banquet halls, photographers, caterers, decorators, DJs and pandits for weddings, birthdays, engagements and corporate events in Pune." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function Home() {
  const { data } = useSuspenseQuery({
    queryKey: ["home"],
    queryFn: getHomeData,
  });

  return (
    <div className="pb-24 md:pb-0">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/20 px-4 pb-12 pt-10 md:pt-16">
        <div className="mx-auto max-w-5xl text-center">
          <h1 className="font-serif text-3xl font-semibold leading-tight text-foreground md:text-5xl">
            Plan your perfect celebration <br className="hidden md:block" /> in Pune
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground md:text-lg">
            Discover and compare venues, photographers, caterers, decorators, DJs and pandits — all in one place.
          </p>

          <form
            action="/search"
            className="mx-auto mt-8 flex max-w-2xl flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm md:flex-row md:items-center"
          >
            <div className="flex flex-1 items-center gap-2 rounded-xl bg-muted/50 px-3 py-2.5">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                name="q"
                placeholder="Search banquet halls, DJs..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex flex-1 items-center gap-2 rounded-xl bg-muted/50 px-3 py-2.5">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <select name="area" className="w-full bg-transparent text-sm outline-none">
                <option value="">Any area</option>
                {data.areas.map((area) => (
                  <option key={area.slug} value={area.slug}>
                    {area.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-1 items-center gap-2 rounded-xl bg-muted/50 px-3 py-2.5">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <input
                type="date"
                name="date"
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
            <button
              type="submit"
              className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-5xl px-4 py-10">
        <h2 className="font-serif text-xl font-semibold md:text-2xl">Browse by category</h2>
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {data.categories.map((cat) => (
            <Link
              key={cat.slug}
              to="/search"
              search={{ category: cat.slug }}
              className="group rounded-2xl border border-border/60 bg-card p-4 text-center shadow-sm transition hover:border-primary/30 hover:shadow-md"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-2xl group-hover:bg-primary/20">
                {cat.icon}
              </div>
              <p className="mt-3 text-sm font-medium leading-tight">{cat.name}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Event types */}
      <section className="mx-auto max-w-5xl px-4 pb-10">
        <h2 className="font-serif text-xl font-semibold md:text-2xl">Planning for</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {data.eventTypes.map((et) => (
            <Link
              key={et.slug}
              to="/search"
              search={{ eventType: et.slug }}
              className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-4 py-2 text-sm font-medium hover:border-primary/30 hover:bg-primary/5"
            >
              <PartyPopper className="h-3.5 w-3.5 text-primary" />
              {et.name}
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-5xl px-4 pb-12">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-semibold md:text-2xl">Featured listings</h2>
          <Link to="/search" className="text-sm font-medium text-primary hover:underline">
            View all
          </Link>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.featured.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>
    </div>
  );
}

function ListingCard({ listing }: { listing: any }) {
  const image = listing.listing_media?.[0]?.storage_path ?? "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600&q=80";
  return (
    <Link to="/listing/$slug" params={{ slug: listing.slug }} className="group overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition hover:shadow-md">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={image}
          alt={listing.title}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium backdrop-blur">
          {listing.categories?.name}
        </span>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 font-medium">{listing.title}</h3>
          {listing.rating_avg ? (
            <span className="flex shrink-0 items-center gap-1 text-xs font-medium">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {listing.rating_avg.toFixed(1)}
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{listing.areas?.name}</p>
        <p className="mt-3 text-sm font-semibold text-primary">
          ₹{Number(listing.price_from).toLocaleString("en-IN")}
          <span className="font-normal text-muted-foreground"> / {listing.price_unit.replace("_", " ")}</span>
        </p>
      </div>
    </Link>
  );
}
