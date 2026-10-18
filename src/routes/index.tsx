import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { getHomeData } from "@/lib/listings.functions";
import { HomeHero } from "@/components/HomeHero";
import { ListingCard } from "@/components/ListingCard";
import { RequestEnquireModal } from "@/components/RequestEnquireModal";
import { PopularLocalities } from "@/components/PopularLocalities";
import { HowItWorks } from "@/components/HowItWorks";

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

  const [enquiringListingId, setEnquiringListingId] = useState<string | null>(null);

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 md:pb-12 space-y-12">
      <HomeHero
        categories={data.categories}
        eventTypes={data.eventTypes}
        areas={data.areas}
      />

      {/* Featured */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-accent uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-accent" />
              <span>Curated Pune Selections</span>
            </div>
            <h2 className="font-serif font-extrabold text-2xl sm:text-3xl text-foreground">
              Featured Venues &amp; Vendors
            </h2>
          </div>
          <Link
            to="/search"
            className="text-xs sm:text-sm font-bold text-primary hover:text-primary-dark flex items-center gap-1 group"
          >
            <span>Explore all Pune listings</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {data.featured.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onEnquire={(listing) => setEnquiringListingId(listing.id)}
            />
          ))}
        </div>
      </section>

      <PopularLocalities areas={data.areas} />

      <HowItWorks />

      <RequestEnquireModal
        listingId={enquiringListingId}
        isOpen={!!enquiringListingId}
        onClose={() => setEnquiringListingId(null)}
      />
    </div>
  );
}
