/** Shared, browser-safe pricing / availability helpers for listings, tiers and packages. */

export const UNIT_LABEL: Record<string, string> = {
  per_day: "per day",
  per_plate: "per plate",
  per_hour: "per hour",
  per_event: "per event",
};

export function unitLabel(unit?: string | null) {
  return unit ? UNIT_LABEL[unit] ?? unit.replace(/_/g, " ") : "";
}

export function formatInr(value: number | null | undefined) {
  if (value == null) return "—";
  return `₹${Number(value).toLocaleString("en-IN")}`;
}

export type TierLike = {
  id?: string;
  name?: string;
  price: number | string | null;
  is_active?: boolean | null;
};

export function activeTiers<T extends TierLike>(tiers?: T[] | null): T[] {
  return (tiers ?? [])
    .filter((t) => t.is_active !== false)
    .slice()
    .sort((a, b) => Number(a.price ?? 0) - Number(b.price ?? 0));
}

/**
 * A listing's displayed "starting from" price: the lowest active tier price when
 * the listing has tiers, otherwise its flat price_from. Computed at read time so
 * a tier edit can never leave a stale number showing elsewhere.
 */
export function effectiveListingPrice(listing: {
  price_from?: number | string | null;
  listing_tiers?: TierLike[] | null;
}): number | null {
  const tiers = activeTiers(listing.listing_tiers);
  if (tiers.length >= 2) return Number(tiers[0]!.price ?? 0);
  return listing.price_from == null ? null : Number(listing.price_from);
}

export function tierCount(listing: { listing_tiers?: TierLike[] | null }) {
  const tiers = activeTiers(listing.listing_tiers);
  return tiers.length >= 2 ? tiers.length : 0;
}

export type DiscountType = "fixed_amount" | "percentage";

/** Indicative package price: sum of component effective prices, then the vendor's discount. */
export function computePackagePrice(
  components: { price_from?: number | string | null; listing_tiers?: TierLike[] | null }[],
  discountType: DiscountType,
  discountValue: number | string | null,
) {
  const prices = components
    .map((c) => effectiveListingPrice(c))
    .filter((p): p is number => p != null);
  const base = prices.reduce((sum, p) => sum + p, 0);
  const value = Number(discountValue ?? 0);
  const discount =
    discountType === "percentage" ? (base * Math.min(Math.max(value, 0), 90)) / 100 : Math.min(value, base);
  return {
    base,
    discount,
    total: Math.max(base - discount, 0),
    pricedComponents: prices.length,
    missingPrices: components.length - prices.length,
  };
}

/** Read-only ratings rollup across a package's component listings. */
export function rollupRatings(components: { rating_avg?: number | string | null; review_count?: number | null }[]) {
  let weighted = 0;
  let count = 0;
  for (const c of components) {
    const reviews = Number(c.review_count ?? 0);
    const avg = Number(c.rating_avg ?? 0);
    if (reviews > 0 && avg > 0) {
      weighted += avg * reviews;
      count += reviews;
    }
  }
  return { rating: count > 0 ? weighted / count : null, reviewCount: count };
}

export type AvailabilityState = "available" | "tentative" | "booked" | "unknown";

const STALE_DAYS = 30;

export function isStale(updatedAt: string | null | undefined) {
  if (!updatedAt) return true;
  const days = (Date.now() - new Date(updatedAt).getTime()) / 86_400_000;
  return days > STALE_DAYS;
}

export type ComponentAvailability = {
  availability_updated_at: string | null;
  states: Record<string, string>;
};

/**
 * Derived package availability for one date:
 * any component stale -> unknown ("Check with vendor"),
 * any booked -> booked, all available -> available, otherwise tentative.
 */
export function derivePackageAvailability(
  components: ComponentAvailability[],
  date: string,
): AvailabilityState {
  if (components.length === 0) return "unknown";
  if (components.some((c) => isStale(c.availability_updated_at))) return "unknown";
  const states = components.map((c) => c.states[date] ?? "available");
  if (states.includes("booked")) return "booked";
  if (states.every((s) => s === "available")) return "available";
  return "tentative";
}
