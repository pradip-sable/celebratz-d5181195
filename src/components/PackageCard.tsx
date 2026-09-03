import { Link } from "@tanstack/react-router";
import { Gift, Star } from "lucide-react";
import { computePackagePrice, formatInr, rollupRatings, type DiscountType, type TierLike } from "@/lib/pricing";

export type PackageCardData = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  cover_image?: string | null;
  discount_type: DiscountType;
  discount_value: number | string | null;
  components: {
    id: string;
    title: string;
    price_from: number | null;
    rating_avg?: number | null;
    review_count?: number | null;
    categories?: { name: string } | null;
    listing_media?: { storage_path: string }[] | null;
    listing_tiers?: TierLike[] | null;
  }[];
};

export function PackageCard({ pkg }: { pkg: PackageCardData }) {
  const price = computePackagePrice(pkg.components, pkg.discount_type, pkg.discount_value);
  const ratings = rollupRatings(pkg.components);
  const image = pkg.cover_image ?? pkg.components.find((c) => c.listing_media?.length)?.listing_media?.[0]?.storage_path;

  return (
    <Link
      to="/packages/$slug"
      params={{ slug: pkg.slug }}
      className="group overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition hover:shadow-md"
    >
      <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
        {image ? (
          <img
            src={image}
            alt={pkg.name}
            loading="lazy"
            className="h-full w-full object-cover transition group-hover:scale-[1.03]"
          />
        ) : null}
      </div>
      <div className="space-y-1.5 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-serif text-base font-semibold leading-tight">{pkg.name}</h3>
          {ratings.rating ? (
            <span className="flex shrink-0 items-center gap-1 text-sm font-medium">
              <Star className="h-3.5 w-3.5 fill-accent text-accent" />
              {ratings.rating.toFixed(1)}
            </span>
          ) : null}
        </div>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <Gift className="h-3.5 w-3.5" />
          {pkg.components.map((c) => c.categories?.name).filter(Boolean).join(" + ")}
        </p>
        <p className="pt-1 text-sm font-semibold">
          Package starting from {formatInr(price.total)}
          {price.discount > 0 && (
            <span className="ml-2 text-xs font-normal text-muted-foreground line-through">
              {formatInr(price.base)}
            </span>
          )}
        </p>
        <p className="text-xs text-muted-foreground">Indicative — final price depends on guest count</p>
      </div>
    </Link>
  );
}
