/**
 * Helper utilities for folding and formatting listing attributes.
 * Per-listing attribute values live in listing_attributes rows { field_key, value (jsonb) }.
 */

export function foldListingAttributes(
  listingAttributes?: Array<{ field_key: string; value: any }> | null,
): Record<string, any> {
  if (!listingAttributes || !Array.isArray(listingAttributes)) {
    return {};
  }
  return listingAttributes.reduce((acc: Record<string, any>, attr) => {
    if (attr && attr.field_key) {
      acc[attr.field_key] = attr.value;
    }
    return acc;
  }, {});
}

/**
 * catering: food_types (array).
 * "Pure Veg" if it has no "Non-Vegetarian"; "Veg + Non-Veg" if it includes both.
 * Returns null if missing or empty (badge must be hidden).
 */
export function getCateringBadgeText(foodTypes: unknown): string | null {
  if (!Array.isArray(foodTypes) || foodTypes.length === 0) return null;

  const validItems = foodTypes
    .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
    .map((t) => t.trim());

  if (validItems.length === 0) return null;

  const hasNonVeg = validItems.some((t) => t.toLowerCase().includes("non-vegetarian"));
  const hasVeg = validItems.some(
    (t) => t.toLowerCase() === "vegetarian" || t.toLowerCase() === "jain",
  );

  if (!hasNonVeg) {
    return "Pure Veg";
  }
  if (hasNonVeg && hasVeg) {
    return "Veg + Non-Veg";
  }
  return "Non-Veg";
}

/**
 * photography: delivery_days (number).
 * Shown as "{n} Days Delivery".
 * Returns null if missing or invalid (badge must be hidden).
 */
export function getPhotographyBadgeText(deliveryDays: unknown): string | null {
  if (deliveryDays === null || deliveryDays === undefined || deliveryDays === "") return null;
  const num = Number(deliveryDays);
  if (Number.isNaN(num) || num <= 0) return null;
  return `${num} Days Delivery`;
}

/**
 * dj-music: first two genres joined with " · ".
 * Returns null if missing or empty (badge must be hidden).
 */
export function getDjMusicBadgeText(genres: unknown): string | null {
  if (!Array.isArray(genres) || genres.length === 0) return null;

  const validGenres = genres
    .filter((g): g is string => typeof g === "string" && g.trim().length > 0)
    .map((g) => g.trim());

  if (validGenres.length === 0) return null;
  return validGenres.slice(0, 2).join(" · ");
}

/**
 * decoration: first value of styles.
 * Returns null if missing or empty (badge must be hidden).
 */
export function getDecorationBadgeText(styles: unknown): string | null {
  if (!Array.isArray(styles) || styles.length === 0) return null;

  const validStyle = styles.find((s): s is string => typeof s === "string" && s.trim().length > 0);
  return validStyle ? validStyle.trim() : null;
}

/**
 * pandit: first value of ceremony_types.
 * Returns null if missing or empty (badge must be hidden).
 */
export function getPanditBadgeText(ceremonyTypes: unknown): string | null {
  if (!Array.isArray(ceremonyTypes) || ceremonyTypes.length === 0) return null;

  const validCeremony = ceremonyTypes.find(
    (c): c is string => typeof c === "string" && c.trim().length > 0,
  );
  return validCeremony ? validCeremony.trim() : null;
}
