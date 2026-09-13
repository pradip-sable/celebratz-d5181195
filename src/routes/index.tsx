import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getHomeData } from "@/lib/listings.functions";
import { HomeHero } from "@/components/HomeHero";
import { ListingCard } from "@/components/ListingCard";

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
    <div className="mx-auto max-w-5xl px-4 pb-24 md:pb-12 pt-6 space-y-12">
      <HomeHero
        categories={data.categories}
        eventTypes={data.eventTypes}
        areas={data.areas}
      />

      {/* Featured */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-xl font-bold md:text-2xl text-foreground">
              Featured listings
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Top rated venues &amp; services in Pune
            </p>
          </div>
          <Link to="/search" className="text-sm font-medium text-primary hover:underline">
            View all
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.featured.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>
    </div>
  );
}
