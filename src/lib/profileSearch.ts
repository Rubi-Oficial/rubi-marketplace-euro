import { supabase } from "@/integrations/supabase/client";
import { getSignedUrls } from "@/lib/storageUrls";

/** Retry a function with exponential backoff */
async function withRetry<T>(
  fn: () => Promise<T>,
  { retries = 2, baseDelay = 500 }: { retries?: number; baseDelay?: number } = {}
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 200;
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}

export interface EligibleProfile {
  id: string;
  display_name: string;
  age: number | null;
  city: string | null;
  city_slug: string | null;
  category: string | null;
  gender: string | null;
  slug: string | null;
  pricing_from: number | null;
  is_featured: boolean;
  highlight_tier: string;
  highlight_expires_at: string | null;
  image_urls: string[];
  bio: string | null;
  has_whatsapp: boolean;
  created_at: string | null;
  languages: string[] | null;
  service_count: number;
}

export interface ProfileSearchParams {
  country?: string;
  country_name?: string;
  city?: string;
  city_slug?: string;
  city_slugs?: string[];
  category?: string;
  gender?: string;
  search?: string;
  service_slug?: string;
  service_slugs?: string[];
  limit?: number;
  offset?: number;
}

export async function fetchEligibleProfiles(filters?: ProfileSearchParams): Promise<EligibleProfile[]> {
  const limit = Math.min(Math.max(filters?.limit ?? 50, 1), 100);
  const offset = Math.max(filters?.offset ?? 0, 0);

  try {
    return await withRetry(async () => {
      const { data: rows, error } = await supabase.rpc("search_profiles", {
        p_country_name: filters?.country_name || filters?.country || null,
        p_city_slug: filters?.city_slug || filters?.city || null,
        p_city_slugs: filters?.city_slugs?.length ? filters.city_slugs : null,
        p_category: filters?.category || null,
        p_gender: filters?.gender || null,
        p_search: filters?.search || null,
        p_service_slug: filters?.service_slug || null,
        p_service_slugs: filters?.service_slugs?.length ? filters.service_slugs : null,
        p_limit: limit,
        p_offset: offset,
      });

      if (error) {
        throw new Error(`search_profiles RPC error: ${error.message}`);
      }
      if (!rows || rows.length === 0) return [];

      const allPaths: string[] = [];
      const pathsByProfile: Record<string, string[]> = {};

      for (const row of rows as any[]) {
        const paths = row.image_paths ? (row.image_paths as string).split(",") : [];
        pathsByProfile[row.id] = paths;
        allPaths.push(...paths);
      }

      const signedUrlMap = allPaths.length > 0 ? await getSignedUrls(allPaths) : {};

      return (rows as any[]).map((r) => ({
        id: r.id,
        display_name: r.display_name ?? "",
        age: r.age ?? null,
        gender: r.gender ?? null,
        city: r.city ?? null,
        city_slug: r.city_slug ?? null,
        category: r.category ?? null,
        slug: r.slug ?? null,
        pricing_from: r.pricing_from ?? null,
        is_featured: r.is_featured ?? false,
        highlight_tier: (r.highlight_tier as string) ?? "standard",
        highlight_expires_at: r.highlight_expires_at ?? null,
        image_urls: (pathsByProfile[r.id] || []).map((p) => signedUrlMap[p]).filter(Boolean),
        bio: r.bio ?? null,
        has_whatsapp: r.has_whatsapp ?? false,
        created_at: r.created_at ?? null,
        languages: r.languages ?? null,
        service_count: Number(r.service_count) || 0,
      }));
    });
  } catch (err) {
    console.error("[profileSearch] fetchEligibleProfiles failed after retries:", err);
    return [];
  }
}

/**
 * Prefetch signed URLs for the next batch of profiles (warms the cache).
 */
export async function prefetchNextBatchUrls(filters?: ProfileSearchParams): Promise<void> {
  try {
    const limit = Math.min(Math.max(filters?.limit ?? 50, 1), 100);
    const offset = Math.max(filters?.offset ?? 0, 0);

    const { data: rows } = await supabase.rpc("search_profiles", {
      p_country_name: filters?.country_name || filters?.country || null,
      p_city_slug: filters?.city_slug || filters?.city || null,
      p_city_slugs: filters?.city_slugs?.length ? filters.city_slugs : null,
      p_category: filters?.category || null,
      p_gender: filters?.gender || null,
      p_search: filters?.search || null,
      p_service_slug: filters?.service_slug || null,
      p_service_slugs: filters?.service_slugs?.length ? filters.service_slugs : null,
      p_limit: limit,
      p_offset: offset,
    });

    if (!rows || rows.length === 0) return;

    const allPaths: string[] = [];
    for (const row of rows as any[]) {
      if (row.image_paths) allPaths.push(...(row.image_paths as string).split(","));
    }
    if (allPaths.length > 0) await getSignedUrls(allPaths);
  } catch {
    // Prefetch is best-effort
  }
}
