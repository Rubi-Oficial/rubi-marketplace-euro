import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { getSignedUrls } from "@/lib/storageUrls";

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

export async function fetchEligibleProfiles(filters?: {
  country?: string;
  country_name?: string;
  city?: string;
  city_slug?: string;
  city_slugs?: string[];
  category?: string;
  gender?: string;
  search?: string;
  service_slug?: string;
  limit?: number;
  offset?: number;
}): Promise<EligibleProfile[]> {
  try {
    const limit = Math.min(Math.max(filters?.limit ?? 50, 1), 100);
    const offset = Math.max(filters?.offset ?? 0, 0);

    const { data: rows, error } = await supabase.rpc("search_profiles", {
      p_country_name: filters?.country_name || filters?.country || null,
      p_city_slug: filters?.city_slug || filters?.city || null,
      p_city_slugs: filters?.city_slugs?.length ? filters.city_slugs : null,
      p_category: filters?.category || null,
      p_gender: filters?.gender || null,
      p_search: filters?.search || null,
      p_service_slug: filters?.service_slug || null,
      p_limit: limit,
      p_offset: offset,
    });

    if (error) {
      console.error("[profileApi] search_profiles RPC error:", error.message);
      return [];
    }
    if (!rows || rows.length === 0) return [];

    // Collect all image paths from the comma-separated strings
    const allPaths: string[] = [];
    const pathsByProfile: Record<string, string[]> = {};

    for (const row of rows as any[]) {
      const paths = row.image_paths ? (row.image_paths as string).split(",") : [];
      pathsByProfile[row.id] = paths;
      allPaths.push(...paths);
    }

    // Single batch call for signed URLs
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
  } catch (err) {
    console.error("[profileApi] Unexpected error in fetchEligibleProfiles:", err);
    return [];
  }
}

/**
 * Prefetch signed URLs for the next batch of profiles (warms the cache).
 */
export async function prefetchNextBatchUrls(filters?: {
  country?: string;
  country_name?: string;
  city?: string;
  city_slug?: string;
  city_slugs?: string[];
  category?: string;
  gender?: string;
  search?: string;
  service_slug?: string;
  limit?: number;
  offset?: number;
}): Promise<void> {
  try {
    const limit = Math.min(Math.max(filters?.limit ?? 50, 1), 100);
    const offset = Math.max(filters?.offset ?? 0, 0);

    // Use the same RPC to get image_paths in one call
    const { data: rows } = await supabase.rpc("search_profiles", {
      p_country_name: filters?.country_name || filters?.country || null,
      p_city_slug: filters?.city_slug || filters?.city || null,
      p_city_slugs: filters?.city_slugs?.length ? filters.city_slugs : null,
      p_category: filters?.category || null,
      p_gender: filters?.gender || null,
      p_search: filters?.search || null,
      p_service_slug: filters?.service_slug || null,
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

const FILTER_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let filterOptionsCache: { cities: string[]; categories: string[]; ts: number } | null = null;
let filterOptionsPromise: Promise<{ cities: string[]; categories: string[] }> | null = null;

export async function fetchFilterOptions() {
  // Return cached if fresh
  if (filterOptionsCache && Date.now() - filterOptionsCache.ts < FILTER_CACHE_TTL) {
    return { cities: filterOptionsCache.cities, categories: filterOptionsCache.categories };
  }

  // Deduplicate concurrent calls
  if (filterOptionsPromise) return filterOptionsPromise;

  filterOptionsPromise = (async () => {
    try {
      const [citiesRes, categoriesRes] = await Promise.all([
        supabase
          .from("eligible_profiles")
          .select("city")
          .not("city", "is", null)
          .order("city")
          .limit(200),
        supabase
          .from("eligible_profiles")
          .select("category")
          .not("category", "is", null)
          .order("category")
          .limit(100),
      ]);

      if (citiesRes.error) {
        console.error("[profileApi] Failed to fetch cities:", citiesRes.error.message);
      }
      if (categoriesRes.error) {
        console.error("[profileApi] Failed to fetch categories:", categoriesRes.error.message);
      }

      const cities = [...new Set(
        (citiesRes.data ?? []).map((r: { city: string | null }) => r.city).filter(Boolean)
      )] as string[];

      const categories = [...new Set(
        (categoriesRes.data ?? []).map((r: { category: string | null }) => r.category).filter(Boolean)
      )] as string[];

      filterOptionsCache = { cities, categories, ts: Date.now() };
      return { cities, categories };
    } catch (err) {
      console.error("[profileApi] Unexpected error in fetchFilterOptions:", err);
      return { cities: [], categories: [] };
    } finally {
      filterOptionsPromise = null;
    }
  })();

  return filterOptionsPromise;
}

const SERVICES_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let servicesCache: { data: { id: string; name: string; slug: string }[]; ts: number } | null = null;
let servicesPromise: Promise<{ id: string; name: string; slug: string }[]> | null = null;

export async function fetchServices() {
  // Return cached if fresh
  if (servicesCache && Date.now() - servicesCache.ts < SERVICES_CACHE_TTL) {
    return servicesCache.data;
  }

  // Deduplicate concurrent calls
  if (servicesPromise) return servicesPromise;

  servicesPromise = (async () => {
    try {
      const { data, error } = await supabase
        .from("services").select("id, name, slug").eq("is_active", true).order("sort_order", { ascending: true });
      if (error) {
        console.error("[profileApi] Failed to fetch services:", error.message);
        return [];
      }
      const result = (data || []) as { id: string; name: string; slug: string }[];
      servicesCache = { data: result, ts: Date.now() };
      return result;
    } catch (err) {
      console.error("[profileApi] Unexpected error in fetchServices:", err);
      return [];
    } finally {
      servicesPromise = null;
    }
  })();

  return servicesPromise;
}
