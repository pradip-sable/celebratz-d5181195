import { createFileRoute, Link } from "@tanstack/react-router";
import { getHomeData, searchListings } from "@/lib/listings.functions";
import { ListingCard } from "@/components/ListingCard";

export const Route = createFileRoute("/category/$slug")({
  loader: async ({ params }) => {
    const [home, listings] = await Promise.all([
      getHomeData(),
      searchListings({ data: { category: params.slug } }),
    ]);
    const category = home.categories.find((c) => c.slug === params.slug) ?? null;
    return { category, listings, categories: home.categories };
  },
  head: ({ loaderData }) => {
    const name = loaderData?.category?.name;
    if (!name) {
      return { meta: [{ title: "Category not found | Celebratz" }, { name: "robots", content: "noindex" }] };
    }
    const title = `${name} in Pune | Celebratz`;
    const description = `Compare ${name.toLowerCase()} options in Pune — pricing, availability and reviews for weddings, birthdays and more.`;
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
    <div className="px-4 py-20 text-center text-sm text-muted-foreground">Could not load this category.</div>
  ),
  notFoundComponent: () => (
    <div className="px-4 py-20 text-center text-sm text-muted-foreground">Category not found.</div>
  ),
  component: CategoryPage,
});

function CategoryPage() {
  const { category, listings, categories } = Route.useLoaderData();

  return (
    <div className="mx-auto max-w-6xl px-4 pb-28 pt-6 md:pb-16">
      <h1 className="font-serif text-2xl font-semibold md:text-3xl">
        {category?.name ?? "Category"} in Pune
      </h1>
      {category?.description ? (
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{category.description}</p>
      ) : null}

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {categories.map((c) => (
          <Link
            key={c.id}
            to="/category/$slug"
            params={{ slug: c.slug }}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-sm ${
              c.slug === category?.slug ? "border-primary bg-primary/10 text-primary" : "border-border"
            }`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      {listings.length === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">No listings live in this category yet.</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l as never} />
          ))}
        </div>
      )}

      <Link
        to="/search"
        search={{ category: category?.slug }}
        className="mt-8 inline-block rounded-xl border border-border px-5 py-2 text-sm font-medium"
      >
        Refine with filters
      </Link>
    </div>
  );
}
