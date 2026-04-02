import { supabase } from "@/integrations/supabase/client";

const SIGNED_URL_EXPIRY = 3600; // 1 hour
const BUCKET = "profile-images";

/**
 * Get a signed URL for a single storage path.
 * Returns empty string on failure.
 */
export async function getSignedUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_EXPIRY);
  if (error || !data?.signedUrl) {
    console.warn("Failed to get signed URL:", storagePath, error?.message);
    return "";
  }
  return data.signedUrl;
}

/**
 * Get signed URLs for multiple storage paths in a single batch call.
 * Returns a map of storagePath -> signedUrl.
 */
export async function getSignedUrls(
  storagePaths: string[]
): Promise<Record<string, string>> {
  if (storagePaths.length === 0) return {};

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(storagePaths, SIGNED_URL_EXPIRY);

  if (error || !data) {
    console.warn("Failed to get signed URLs:", error?.message);
    return {};
  }

  const urlMap: Record<string, string> = {};
  data.forEach((item) => {
    if (item.signedUrl && item.path) {
      urlMap[item.path] = item.signedUrl;
    }
  });
  return urlMap;
}
