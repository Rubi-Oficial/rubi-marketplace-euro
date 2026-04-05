import { supabase } from "@/integrations/supabase/client";

const SIGNED_URL_EXPIRY = 3600; // 1 hour
const BUCKET = "profile-images";

// In-memory LRU cache for signed URLs (avoids redundant API calls during same session)
const MAX_CACHE_SIZE = 500;
const urlCache = new Map<string, { url: string; expiresAt: number }>();
const CACHE_TTL = 50 * 60 * 1000; // 50 minutes (before the 1h expiry)

function getCached(path: string): string | null {
  const entry = urlCache.get(path);
  if (!entry) return null;
  if (Date.now() >= entry.expiresAt) {
    urlCache.delete(path);
    return null;
  }
  // Move to end for LRU ordering (Map preserves insertion order)
  urlCache.delete(path);
  urlCache.set(path, entry);
  return entry.url;
}

function setCache(path: string, url: string) {
  // Evict oldest entries if at capacity
  if (urlCache.size >= MAX_CACHE_SIZE) {
    const overflow = urlCache.size - MAX_CACHE_SIZE + 1;
    const iter = urlCache.keys();
    for (let i = 0; i < overflow; i++) {
      const oldest = iter.next().value;
      if (oldest) urlCache.delete(oldest);
    }
  }
  urlCache.set(path, { url, expiresAt: Date.now() + CACHE_TTL });
}

/**
 * Get a signed URL for a single storage path.
 * Returns empty string on failure.
 */
export async function getSignedUrl(storagePath: string): Promise<string> {
  if (!storagePath || storagePath.trim().length === 0) return "";

  const cached = getCached(storagePath);
  if (cached) return cached;

  try {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, SIGNED_URL_EXPIRY);
    if (error || !data?.signedUrl) {
      console.warn("[storageUrls] Failed to get signed URL:", storagePath, error?.message);
      return "";
    }
    setCache(storagePath, data.signedUrl);
    return data.signedUrl;
  } catch (err) {
    console.error("[storageUrls] Unexpected error getting signed URL:", storagePath, err);
    return "";
  }
}

/**
 * Get signed URLs for multiple storage paths in a single batch call.
 * Returns a map of storagePath -> signedUrl.
 */
export async function getSignedUrls(
  storagePaths: string[]
): Promise<Record<string, string>> {
  if (!storagePaths || storagePaths.length === 0) return {};

  // Filter out empty/invalid paths
  const validPaths = storagePaths.filter((p) => p && p.trim().length > 0);
  if (validPaths.length === 0) return {};

  // Check cache first, only fetch uncached paths
  const urlMap: Record<string, string> = {};
  const uncachedPaths: string[] = [];

  for (const path of validPaths) {
    const cached = getCached(path);
    if (cached) {
      urlMap[path] = cached;
    } else {
      uncachedPaths.push(path);
    }
  }

  if (uncachedPaths.length === 0) return urlMap;

  try {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrls(uncachedPaths, SIGNED_URL_EXPIRY);

    if (error || !data) {
      console.warn("[storageUrls] Failed to get signed URLs:", error?.message);
      return urlMap;
    }

    data.forEach((item) => {
      if (item.signedUrl && item.path) {
        urlMap[item.path] = item.signedUrl;
        setCache(item.path, item.signedUrl);
      }
    });
    return urlMap;
  } catch (err) {
    console.error("[storageUrls] Unexpected error getting signed URLs:", err);
    return urlMap;
  }
}