import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { MapPin, Phone, Mail, Star, Clock, Check, AlertCircle, ChevronLeft, ChevronRight, Layers, Gift } from "lucide-react";
import { format, differenceInDays, addDays } from "date-fns";
import { getListingBySlug } from "@/lib/listings.functions";
import { getPackagesForListing } from "@/lib/packages.functions";
import { PackageCard } from "@/components/PackageCard";
import { effectiveListingPrice, formatInr, unitLabel } from "@/lib/pricing";


export const Route = createFileRoute("/listing/$slug")({
  component: ListingPage,
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData({
      queryKey: ["listing", params.slug],
      queryFn: () => getListingBySlug({ data: { slug: params.slug } }),
    });
  },
  head: ({ params }) => ({
    meta: [
      { title: `Celebratz Listing | ${params.slug}` },
      { name: "description", content: "View details, pricing, availability and reviews for this Pune celebration vendor." },
      { property: "og:title", content: `Celebratz Listing | ${params.slug}` },
      { property: "og:description", content: "View details, pricing, availability and reviews for this Pune celebration vendor." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function ListingPage() {
  const { slug } = useParams({ from: "/listing/$slug" });
  const { data } = useSuspenseQuery({
    queryKey: ["listing", slug],
    queryFn: () => getListingBySlug({ data: { slug } }),
  });

  const { listing, availability, reviews } = data;
  const [activeImage, setActiveImage] = useState(0);
  const images = listing.listing_media?.length ? listing.listing_media : [{ storage_path: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80" }];

  const attributes = listing.listing_attributes?.reduce((acc: Record<string, any>, attr: any) => {
    acc[attr.field_key] = attr.value;
    return acc;
  }, {}) ?? {};

  const eventTypes = listing.listing_event_types?.map((et: any) => et.event_types?.name).filter(Boolean) ?? [];

  const stale = listing.availability_updated_at
    ? differenceInDays(new Date(), new Date(listing.availability_updated_at)) > 30
    : true;

  return (
    <div className="mx-auto max-w-5xl px-4 pb-28 pt-4 md:pb-12 md:pt-8">
      <a href="/search" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Back to search
      </a>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Main column */}
        <div>
          {/* Gallery */}
          <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-muted">
            <img
              src={images[activeImage]?.storage_path}
              alt={listing.title}
              className="aspect-[16/10] w-full object-cover"
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImage((i) => (i === 0 ? images.length - 1 : i - 1))}
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 backdrop-blur"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setActiveImage((i) => (i === images.length - 1 ? 0 : i + 1))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 backdrop-blur"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
            {images.map((img: any, idx: number) => (
              <button
                key={idx}
                onClick={() => setActiveImage(idx)}
                className={`relative shrink-0 overflow-hidden rounded-xl border-2 ${activeImage === idx ? "border-primary" : "border-transparent"}`}
              >
                <img src={img.storage_path} alt="" className="h-16 w-16 object-cover" />
              </button>
            ))}
          </div>

          {/* Header */}
          <div className="mt-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className="text-sm font-medium text-primary">{listing.categories?.name}</span>
                <h1 className="font-serif text-2xl font-semibold md:text-3xl">{listing.title}</h1>
                <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" /> {listing.areas?.name}, {listing.address}
                </p>
              </div>
              {listing.rating_avg ? (
                <div className="flex items-center gap-1 rounded-xl bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {Number(listing.rating_avg).toFixed(1)}
                  <span className="text-amber-600/70">({listing.review_count})</span>
                </div>
              ) : null}
            </div>

            <p className="mt-4 leading-relaxed text-foreground/90">{listing.description}</p>

            {/* Event types */}
            {eventTypes.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {eventTypes.map((name: string) => (
                  <span key={name} className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">
                    {name}
                  </span>
                ))}
              </div>
            )}

            {/* Package Tiers */}
            {tiers.length >= 2 && (
              <div className="mt-8">
                <h2 className="flex items-center gap-2 font-serif text-lg font-semibold">
                  <Layers className="h-5 w-5 text-primary" /> Package Tiers
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Pick the tier that suits your celebration — all prices are {unitLabel(listing.price_unit)}.
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {tiers.map((tier: any) => (
                    <div key={tier.id} className="flex flex-col rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
                      <p className="font-serif text-base font-semibold">{tier.name}</p>
                      <p className="mt-1 text-xl font-semibold text-primary">{formatInr(Number(tier.price))}</p>
                      <p className="text-xs text-muted-foreground">{unitLabel(listing.price_unit)}</p>
                      {tier.description && <p className="mt-2 text-sm text-muted-foreground">{tier.description}</p>}
                      {tier.features?.length ? (
                        <ul className="mt-3 space-y-1 text-sm">
                          {tier.features.map((feature: string, i: number) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      <Link
                        to="/request"
                        search={{ listing: listing.id, tier: tier.id, kind: "booking_request" }}
                        className="mt-4 block rounded-xl bg-primary px-4 py-2 text-center text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                      >
                        Choose this tier
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}


            <div className="mt-8 rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
              <h2 className="font-serif text-lg font-semibold">Details</h2>
              <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {Object.entries(attributes).map(([key, value]) => {
                  const label = key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
                  let display = String(value);
                  if (typeof value === "boolean") display = value ? "Yes" : "No";
                  if (Array.isArray(value)) display = value.join(", ");
                  return (
                    <div key={key} className="flex justify-between gap-4 border-b border-border/40 pb-2 last:border-0">
                      <dt className="text-sm text-muted-foreground">{label}</dt>
                      <dd className="text-sm font-medium">{display}</dd>
                    </div>
                  );
                })}
              </dl>
            </div>

            {/* Availability */}
            <div className="mt-8 rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-lg font-semibold">Availability</h2>
                {listing.availability_updated_at && !stale && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    Updated {differenceInDays(new Date(), new Date(listing.availability_updated_at))} days ago
                  </span>
                )}
              </div>
              {stale ? (
                <div className="mt-4 flex items-start gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>This calendar has not been updated recently. Please check availability directly with the vendor.</p>
                </div>
              ) : (
                <AvailabilityCalendar availability={availability} />
              )}
            </div>

            {/* Reviews */}
            <div className="mt-8 rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
              <h2 className="font-serif text-lg font-semibold">Reviews</h2>
              {reviews.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">No reviews yet.</p>
              ) : (
                <div className="mt-4 space-y-4">
                  {reviews.map((review: any, idx: number) => (
                    <div key={idx} className="border-b border-border/40 pb-4 last:border-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{review.profiles?.full_name ?? "Customer"}</span>
                        <span className="flex items-center gap-1 text-sm font-medium">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          {review.rating}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{format(new Date(review.created_at), "dd MMM yyyy")}</p>
                      <p className="mt-2 text-sm">{review.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {relatedPackages && relatedPackages.length > 0 && (
              <div className="mt-8 rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
                <h2 className="flex items-center gap-2 font-serif text-lg font-semibold">
                  <Gift className="h-5 w-5 text-primary" /> Also part of a package
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  This vendor bundles this service with others — often at a lower combined price.
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {relatedPackages.map((pkg: any) => (
                    <PackageCard key={pkg.id} pkg={pkg} />
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Sidebar */}
        <aside className="lg:sticky lg:top-20 lg:h-fit">
          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">Starting from</p>
            <p className="font-serif text-3xl font-semibold text-primary">{formatInr(effectivePrice)}</p>
            <p className="text-sm text-muted-foreground">{unitLabel(listing.price_unit)}</p>
            {tiers.length >= 2 && (
              <p className="mt-1 text-xs text-muted-foreground">
                Lowest of {tiers.length} package tiers · choose your tier on the request form
              </p>
            )}


            <div className="mt-5 space-y-3">
              <Link
                to="/request"
                search={{ listing: listing.id, kind: "booking_request" }}
                className="block w-full rounded-xl bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Request to Book
              </Link>
              <Link
                to="/request"
                search={{ listing: listing.id, kind: "enquiry" }}
                className="block w-full rounded-xl border border-primary px-4 py-3 text-center text-sm font-semibold text-primary hover:bg-primary/5"
              >
                Enquire
              </Link>
            </div>


            <div className="mt-6 border-t border-border/40 pt-5">
              <h3 className="font-medium">Vendor</h3>
              <p className="mt-1 font-serif text-lg font-semibold">{listing.vendors?.business_name}</p>
              <p className="mt-2 text-sm text-muted-foreground">{listing.vendors?.about}</p>
              <div className="mt-3 space-y-1 text-sm">
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" /> {listing.vendors?.contact_phone}
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" /> {listing.vendors?.contact_email}
                </p>
              </div>
            </div>

            <p className="mt-5 text-xs text-muted-foreground">
              Your contact details will be shared with the vendor when you submit a request.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function AvailabilityCalendar({ availability }: { availability: any[] }) {
  const today = new Date();
  const [monthOffset, setMonthOffset] = useState(0);
  const start = addDays(today, monthOffset * 30);
  const days = Array.from({ length: 30 }, (_, i) => addDays(start, i));

  const stateMap = availability.reduce((acc: Record<string, string>, cur: any) => {
    acc[cur.date] = cur.state;
    return acc;
  }, {});

  return (
    <div className="mt-4">
      <div className="mb-3 flex items-center justify-between">
        <button onClick={() => setMonthOffset((o) => o - 1)} className="rounded-lg p-1 hover:bg-muted">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-sm font-medium">{format(start, "MMMM yyyy")}</span>
        <button onClick={() => setMonthOffset((o) => o + 1)} className="rounded-lg p-1 hover:bg-muted">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="py-1 font-medium text-muted-foreground">{d}</div>
        ))}
        {days.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const state = stateMap[dateKey] ?? "available";
          const color =
            state === "booked" ? "bg-rose-100 text-rose-700" : state === "tentative" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700";
          return (
            <div
              key={dateKey}
              className={`flex flex-col items-center justify-center rounded-lg py-2 text-xs font-medium ${color}`}
              title={`${format(day, "dd MMM")}: ${state}`}
            >
              <span>{format(day, "d")}</span>
              <span className="mt-0.5 text-[10px] capitalize">{state}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Available</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Tentative</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Booked</span>
      </div>
    </div>
  );
}
