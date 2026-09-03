import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Gift } from "lucide-react";
import { listPackages } from "@/lib/packages.functions";
import { PackageCard } from "@/components/PackageCard";

const packagesQuery = {
  queryKey: ["packages"],
  queryFn: () => listPackages(),
};

export const Route = createFileRoute("/packages")({
  component: PackagesLayout,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(packagesQuery);
  },
  head: () => ({
    meta: [
      { title: "Celebration packages in Pune | Celebratz" },
      {
        name: "description",
        content:
          "Browse bundled celebration packages from Pune vendors — catering, decor, photography and more combined into one offering.",
      },
      { property: "og:title", content: "Celebration packages in Pune | Celebratz" },
      {
        property: "og:description",
        content: "Bundled celebration packages from Pune vendors, with indicative package pricing.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function PackagesLayout() {
  const isChild = useRouterState({
    select: (state) => state.location.pathname.replace(/\/$/, "") !== "/packages",
  });
  if (isChild) return <Outlet />;
  return <PackagesIndex />;
}

function PackagesIndex() {
  const { data: packages } = useSuspenseQuery(packagesQuery);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-28 pt-6 md:pb-12 md:pt-10">
      <div className="flex items-start gap-3">
        <Gift className="mt-1 h-6 w-6 text-primary" />
        <div>
          <h1 className="font-serif text-2xl font-semibold md:text-3xl">Packages</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Vendors who offer more than one service can bundle them into a single package. Prices shown are indicative —
            the final figure depends on your guest count and customisation.
          </p>
        </div>
      </div>

      {packages.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
          No packages are live yet. Check back soon.
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg: any) => (
            <PackageCard key={pkg.id} pkg={pkg} />
          ))}
        </div>
      )}
    </div>
  );
}
