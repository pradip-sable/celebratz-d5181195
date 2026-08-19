import { Link } from "@tanstack/react-router";
import { Star, MapPin } from "lucide-react";

const UNIT_LABEL: Record<string, string> = {
  per_day: "per day",
  per_plate: "per plate",
  per_hour: "per hour",
  per_event: "per event",
};

export type ListingCardData = {
  id: string;
  title: string;
  slug: string;
  price_from: number | null;
  price_unit: string;
  rating_avg: number | null;
  review_count?: number | null;
  categories?: { name: string } | null;
  areas?: { name: string } | null;
  listing_media?: { storage_path: string }[] | null;
};

export function ListingCard({ listing }: { listing: ListingCardData }) {
  const image = listing.listing_media?.[0]?.storage_path;
  return (
    <Link
      to="/listing/$slug"
      params={{ slug: listing.slug }}
      className="group overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition hover:shadow-md"
    >
      <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
        {image ? (
          <img
            src={image}
            alt={listing.title}
            loading="lazy"
            className="h-full w-full object-cover transition group-hover:scale-[1.03]"
          />
        ) : null}
      </div>
      <div className="space-y-1.5 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-serif text-base font-semibold leading-tight">{listing.title}</h3>
          {listing.rating_avg ? (
            <span className="flex shrink-0 items-center gap-1 text-sm font-medium">
              <Star className="h-3.5 w-3.5 fill-accent text-accent" />
              {Number(listing.rating_avg).toFixed(1)}
            </span>
          ) : null}
        </div>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          {listing.areas?.name ?? "Pune"}
          {listing.categories?.name ? ` · ${listing.categories.name}` : ""}
        </p>
        {listing.price_from ? (
          <p className="pt-1 text-sm font-semibold">
            From ₹{Number(listing.price_from).toLocaleString("en-IN")}{" "}
            <span className="text-xs font-normal text-muted-foreground">
              {UNIT_LABEL[listing.price_unit] ?? ""}
            </span>
          </p>
        ) : null}
      </div>
    </Link>
  );
}
