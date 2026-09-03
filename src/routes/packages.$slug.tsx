import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { addDays, format } from "date-fns";
import { AlertCircle, ChevronLeft, ChevronRight, Gift, Mail, Phone, Star } from "lucide-react";
import { getPackageBySlug } from "@/lib/packages.functions";
import {
  computePackagePrice,
  derivePackageAvailability,
  effectiveListingPrice,
  formatInr,
  rollupRatings,
  tierCount,
  unitLabel,
} from "@/lib/pricing";

export const Route = createFileRoute("/packages/$slug")({
  component: PackageDetail,
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData({
      queryKey: ["package", params.slug],
      queryFn: () => getPackageBySlug({ data: { slug: params.slug } }),
    });
  },
  errorComponent: () => (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground" />
      <h1 className="mt-4 font-serif text-xl font-semibold">Package unavailable</h1>
      <p className="mt-2 text-sm text-muted-foreground">This package may have been paused or removed.</p>
      <Link to="/packages" className="mt-6 inline-block rounded-xl bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground">
        Browse packages
      </Link>
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <h1 className="font-serif text-xl font-semibold">Package not found</h1>
    </div>
  ),
  head: ({ params }) => ({
    meta: [
      { title: `Package | Celebratz Pune` },
      { name: "description", content: `Details, component services and indicative pricing for the ${params.slug} celebration package in Pune.` },
      { property: "og:title", content: `Package | Celebratz Pune` },
      { property: "og:description", content: `Component services and indicative pricing for this Pune celebration package.` },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function PackageDetail() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery({
    queryKey: ["package", slug],
    queryFn: () => getPackageBySlug({ data: { slug } }),
  });

  const { pkg, components, componentAvailability } = data as any;
  const price = computePackagePrice(components, pkg.discount_type, pkg.discount_value);
  const ratings = rollupRatings(components);

  const gallery: string[] = pkg.cover_image
    ? [pkg.cover_image]
    : components.flatMap((c: any) => (c.listing_media ?? []).map((m: any) => m.storage_path));
  const [activeImage, setActiveImage] = useState(0);

  return (
    <div className="mx-auto max-w-5xl px-4 pb-28 pt-4 md:pb-12 md:pt-8">
      <Link to="/packages" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> All packages
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          {gallery.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-muted">
              <img src={gallery[activeImage]} alt={pkg.name} className="aspect-[16/10] w-full object-cover" />
            </div>
          )}
          {gallery.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
              {gallery.map((src, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`shrink-0 overflow-hidden rounded-xl border-2 ${activeImage === idx ? "border-primary" : "border-transparent"}`}
                >
                  <img src={src} alt="" className="h-16 w-16 object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="mt-6">
            <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
              <Gift className="h-4 w-4" /> Package by {pkg.vendor?.business_name}
            </span>
            <h1 className="font-serif text-2xl font-semibold md:text-3xl">{pkg.name}</h1>
            {ratings.rating ? (
              <p className="mt-2 flex items-center gap-1 text-sm">
                <Star className="h-4 w-4 fill-accent text-accent" />
                {ratings.rating.toFixed(1)}
                <span className="text-muted-foreground">
                  from {ratings.reviewCount} review{ratings.reviewCount === 1 ? "" : "s"} across the included services
                </span>
              </p>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">No reviews on the included services yet.</p>
            )}
            {pkg.description && <p className="mt-4 leading-relaxed text-foreground/90">{pkg.description}</p>}
          </div>

          <section className="mt-8 rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
            <h2 className="font-serif text-lg font-semibold">What's included</h2>
            <div className="mt-4 space-y-3">
              {components.map((component: any) => {
                const componentPrice = effectiveListingPrice(component);
                const tiers = tierCount(component);
                return (
                  <Link
                    key={component.id}
                    to="/listing/$slug"
                    params={{ slug: component.slug }}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 p-4 transition hover:bg-muted/40"
                  >
                    <div>
                      <p className="text-xs font-medium text-primary">{component.categories?.name}</p>
                      <p className="font-medium">{component.title}</p>
                      <p className="text-sm text-muted-foreground">{component.areas?.name}</p>
                      {tiers > 0 && <p className="text-xs text-muted-foreground">{tiers} package tiers available</p>}
                    </div>
                    <p className="text-sm font-semibold">
                      {formatInr(componentPrice)}{" "}
                      <span className="font-normal text-muted-foreground">{unitLabel(component.price_unit)}</span>
                    </p>
                  </Link>
                );
              })}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Component services use different price units, so the package figure is an indicative starting point — not a
              firm quote.
            </p>
          </section>

          <section className="mt-8 rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
            <h2 className="font-serif text-lg font-semibold">Availability</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Derived from each included service's own calendar — the package is only available when every service is.
            </p>
            <DerivedCalendar componentAvailability={componentAvailability} />
          </section>
        </div>

        <aside className="lg:sticky lg:top-20 lg:h-fit">
          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">Package starting from</p>
            <p className="font-serif text-3xl font-semibold text-primary">{formatInr(price.total)}</p>
            {price.discount > 0 && (
              <p className="text-sm text-muted-foreground">
                <span className="line-through">{formatInr(price.base)}</span>{" "}
                {pkg.discount_type === "percentage"
                  ? `· ${Number(pkg.discount_value)}% package discount`
                  : `· ${formatInr(Number(pkg.discount_value))} off`}
              </p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              Indicative total across {components.length} services. Final pricing depends on guest count and
              customisation.
            </p>

            <div className="mt-5 space-y-3">
              <Link
                to="/request"
                search={{ pkg: pkg.id, kind: "booking_request" }}
                className="block w-full rounded-xl bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Request to Book
              </Link>
              <Link
                to="/request"
                search={{ pkg: pkg.id, kind: "enquiry" }}
                className="block w-full rounded-xl border border-primary px-4 py-3 text-center text-sm font-semibold text-primary hover:bg-primary/5"
              >
                Enquire
              </Link>
            </div>

            <div className="mt-6 border-t border-border/40 pt-5 text-sm">
              <h3 className="font-medium">Vendor</h3>
              <p className="mt-1 font-serif text-lg font-semibold">{pkg.vendor?.business_name}</p>
              {pkg.vendor?.about && <p className="mt-2 text-muted-foreground">{pkg.vendor.about}</p>}
              {pkg.vendor?.contact_phone && (
                <p className="mt-3 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" /> {pkg.vendor.contact_phone}
                </p>
              )}
              {pkg.vendor?.contact_email && (
                <p className="mt-1 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" /> {pkg.vendor.contact_email}
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function DerivedCalendar({ componentAvailability }: { componentAvailability: any[] }) {
  const [offset, setOffset] = useState(0);
  const start = addDays(new Date(), offset * 30);
  const days = Array.from({ length: 30 }, (_, i) => addDays(start, i));

  return (
    <div className="mt-4">
      <div className="mb-3 flex items-center justify-between">
        <button onClick={() => setOffset((o) => o - 1)} className="rounded-lg p-1 hover:bg-muted">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-sm font-medium">{format(start, "MMMM yyyy")}</span>
        <button onClick={() => setOffset((o) => o + 1)} className="rounded-lg p-1 hover:bg-muted">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const state = derivePackageAvailability(componentAvailability, key);
          const color =
            state === "booked"
              ? "bg-rose-100 text-rose-700"
              : state === "tentative"
                ? "bg-amber-100 text-amber-700"
                : state === "available"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-muted text-muted-foreground";
          return (
            <div key={key} className={`flex flex-col items-center rounded-lg py-2 font-medium ${color}`}>
              <span>{format(day, "d")}</span>
              <span className="mt-0.5 text-[10px]">{state === "unknown" ? "Check" : state}</span>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        "Check" means one of the included services hasn't updated its calendar in over 30 days — confirm with the vendor.
      </p>
    </div>
  );
}
