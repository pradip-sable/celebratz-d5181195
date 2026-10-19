import { supabase } from "@/integrations/supabase/client";

export function resolveMediaUrl(storagePathOrUrl: string | null | undefined): string | null {
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
