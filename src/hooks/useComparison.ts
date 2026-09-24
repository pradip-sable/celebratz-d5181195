import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { effectiveListingPrice, type TierLike } from "@/lib/pricing";

export const COMPARISON_STORAGE_KEY = "celebratz_comparison";
export const MAX_COMPARISON_ITEMS = 3;

export type ComparedListing = {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  price_from?: number | null;
  price_unit?: string | null;
  effective_price?: number | null;
  capacity_min?: number | null;
  capacity_max?: number | null;
  rating_avg?: number | null;
  review_count?: number | null;
  availability_updated_at?: string | null;
  is_featured?: boolean | null;
  google_maps_url?: string | null;
  category_attributes?: Record<string, unknown> | null;
  categories?: { name: string; slug: string; icon?: string | null } | null;
  areas?: { name: string; slug: string } | null;
  listing_media?: { storage_path: string; type?: string | null; position?: number | null }[] | null;
  listing_tiers?: TierLike[] | null;
  listing_event_types?:
    { event_types?: { name?: string | null; slug?: string | null } | null }[] | null;
};

export function resolveListingMediaUrl(storagePathOrUrl: string | null | undefined): string | null {
  if (!storagePathOrUrl) return null;
  if (storagePathOrUrl.startsWith("http://") || storagePathOrUrl.startsWith("https://")) {
    return storagePathOrUrl;
  }
  const bucket = "listing-media";
  const cleanPath = storagePathOrUrl.startsWith(`${bucket}/`)
    ? storagePathOrUrl.slice(bucket.length + 1)
    : storagePathOrUrl;
  return supabase.storage.from(bucket).getPublicUrl(cleanPath).data.publicUrl;
}

export function getComparisonIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(COMPARISON_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveComparisonIds(ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(COMPARISON_STORAGE_KEY, JSON.stringify(ids));
    window.dispatchEvent(new Event("storage"));
  } catch (e) {
    console.error("Failed to save comparison to localStorage", e);
  }
}

export function toggleComparisonId(id: string): { success: boolean; isCompared: boolean } {
  const current = getComparisonIds();
  if (current.includes(id)) {
    const next = current.filter((item) => item !== id);
    saveComparisonIds(next);
    toast.success("Removed from comparison");
    return { success: true, isCompared: false };
  }

  if (current.length >= MAX_COMPARISON_ITEMS) {
    toast.error("You can compare up to 3 listings at a time");
    return { success: false, isCompared: false };
  }

  const next = [...current, id];
  saveComparisonIds(next);
  toast.success("Added to comparison");
  return { success: true, isCompared: true };
}

export function removeComparisonId(id: string): void {
  const current = getComparisonIds();
  if (!current.includes(id)) return;
  const next = current.filter((item) => item !== id);
  saveComparisonIds(next);
  toast.success("Removed from comparison");
}

export function clearComparisonList(): void {
  const current = getComparisonIds();
  if (current.length === 0) return;
  saveComparisonIds([]);
  toast.success("Comparison tray cleared");
}

export function useComparison() {
  const [comparisonIds, setComparisonIds] = useState<string[]>(() => getComparisonIds());

  useEffect(() => {
    const handleStorage = () => {
      setComparisonIds(getComparisonIds());
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const { data: listings = [], isLoading } = useQuery<ComparedListing[]>({
    queryKey: ["compared-listings", comparisonIds],
    queryFn: async () => {
      if (comparisonIds.length === 0) return [];

      const { data, error } = await supabase
        .from("listings")
        .select(
          `
          id,
          title,
          slug,
          description,
          price_from,
          price_unit,
          capacity_min,
          capacity_max,
          rating_avg,
          review_count,
          availability_updated_at,
          is_featured,
          google_maps_url,
          category_attributes,
          categories(name, slug, icon),
          areas(name, slug),
          listing_media(storage_path, type, position),
          listing_tiers(id, name, price, is_active, sort_order),
          listing_event_types(event_types(name, slug))
        `,
        )
        .in("id", comparisonIds)
        .eq("status", "live");

      if (error) {
        console.error("Error fetching comparison listings:", error);
        return [];
      }

      // Preserve comparisonIds insertion order and compute effective prices
      const listingMap = new Map((data || []).map((l) => [l.id, l]));
      return comparisonIds
        .map((id) => listingMap.get(id))
        .filter((l): l is NonNullable<typeof l> => Boolean(l))
        .map((item) => {
          // Sort media by position
          const sortedMedia = [...(item.listing_media || [])].sort(
            (a, b) => (a.position ?? 0) - (b.position ?? 0),
          );
          return {
            ...item,
            listing_media: sortedMedia,
            category_attributes: item.category_attributes as Record<string, unknown> | null,
            effective_price: effectiveListingPrice(item as never),
          };
        });
    },
    enabled: comparisonIds.length > 0,
    staleTime: 60_000,
  });

  return {
    comparisonIds,
    listings,
    isLoading,
    isCompared: (id: string) => comparisonIds.includes(id),
    toggleComparison: (id: string) => toggleComparisonId(id),
    removeComparison: (id: string) => removeComparisonId(id),
    clearComparison: () => clearComparisonList(),
  };
}
