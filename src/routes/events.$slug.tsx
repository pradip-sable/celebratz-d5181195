import { createFileRoute, Link } from "@tanstack/react-router";
import { getHomeData, searchListings } from "@/lib/listings.functions";
import { ListingCard } from "@/components/ListingCard";

export const Route = createFileRoute("/events/$slug")({
  loader: async ({ params }) => {
    const [home, listings] = await Promise.all([
      getHomeData(),
      searchListings({ data: { eventType: params.slug } }),
    ]);
    const eventType = home.eventTypes.find((e) => e.slug === params.slug) ?? null;
    return { eventType, listings, eventTypes: home.eventTypes, categories: home.categories };
  },
  head: ({ loaderData }) => {
    const name = loaderData?.eventType?.name;
    if (!name) {
      return { meta: [{ title: "Event not found | Celebratz" }, { name: "robots", content: "noindex" }] };
    }
    const title = `${name} venues & services in Pune | Celebratz`;
    const description = `Discover venues, catering, photography, decor and more for your ${name.toLowerCase()} in Pune. Compare pricing, availability and reviews.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  errorComponent: () => (
    <div className="px-4 py-20 text-center text-sm text-muted-foreground">Could not load this event type.</div>
  ),
  notFoundComponent: () => (
    <div className="px-4 py-20 text-center text-sm text-muted-foreground">Event type not found.</div>
  ),
  component: EventTypePage,
});

function EventTypePage() {
  const { eventType, listings, eventTypes, categories } = Route.useLoaderData();

  return (
    <div className="mx-auto max-w-6xl px-4 pb-28 pt-6 md:pb-16">
      <h1 className="font-serif text-2xl font-semibold md:text-3xl">
        Planning a {eventType?.name ?? "celebration"} in Pune?
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Everything you need in one place — compare vendors, check availability and send a request.
      </p>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {eventTypes.map((e) => (
          <Link
            key={e.id}
            to="/events/$slug"
            params={{ slug: e.slug }}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-sm ${
              e.slug === eventType?.slug ? "border-primary bg-primary/10 text-primary" : "border-border"
            }`}
          >
            {e.name}
          </Link>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {categories.map((c) => (
          <Link
            key={c.id}
            to="/search"
            search={{ category: c.slug, eventType: eventType?.slug }}
            className="rounded-xl bg-muted/50 px-3 py-1.5 text-xs font-medium"
          >
            {c.name}
          </Link>
        ))}
      </div>

      {listings.length === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">No listings tagged for this event type yet.</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l as never} />
          ))}
        </div>
      )}
    </div>
  );
}
