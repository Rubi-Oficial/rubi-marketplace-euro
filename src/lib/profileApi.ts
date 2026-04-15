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

type EligibleProfileRow = Database["public"]["Views"]["eligible_profiles"]["Row"];
type ProfileImageRow = Pick<Database["public"]["Tables"]["profile_images"]["Row"], "profile_id" | "storage_path">;
type ProfileServiceRow = Pick<Database["public"]["Tables"]["profile_services"]["Row"], "profile_id">;

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

    let serviceProfileIds: string[] | null = null;
    if (filters?.service_slug) {
      const { data: serviceData, error: svcErr } = await supabase
        .from("services")
        .select("id")
        .eq("slug", filters.service_slug)
        .single();

      if (svcErr || !serviceData) return [];

      const { data: profileServiceRows, error: psErr } = await supabase
        .from("profile_services")
        .select("profile_id")
        .eq("service_id", serviceData.id);

      if (psErr) {
        console.error("[profileApi] Failed to fetch profile_services:", psErr.message);
        return [];
      }

      serviceProfileIds = (profileServiceRows || [])
        .map((row: ProfileServiceRow) => row.profile_id)
        .filter(Boolean);

      if (serviceProfileIds.length === 0) return [];
    }

    let query = supabase
      .from("eligible_profiles")
      .select("id, display_name, age, city, city_slug, category, gender, slug, pricing_from, is_featured, highlight_tier, highlight_expires_at, bio, has_whatsapp, tier_rank, effective_sort_key, created_at, languages")
      .order("tier_rank" as any, { ascending: false })
      .order("effective_sort_key" as any, { ascending: false })
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .order("id", { ascending: false });

    if (serviceProfileIds) query = query.in("id", serviceProfileIds);
    if (filters?.country_name) query = query.ilike("country", filters.country_name);
    else if (filters?.country) query = query.ilike("country", filters.country);
    if (filters?.city_slugs && filters.city_slugs.length > 0) query = query.in("city_slug", filters.city_slugs);

    if (filters?.city_slug) {
      query = query.eq("city_slug", filters.city_slug);
    } else if (filters?.city) {
      query = query.ilike("city", filters.city);
    }
    if (filters?.category) query = query.ilike("category", filters.category);
    if (filters?.gender) query = query.ilike("gender", filters.gender);
    if (filters?.search) {
      const sanitized = filters.search
        .replace(/[%_\\(),."']/g, "")
        .trim()
        .slice(0, 100);
      if (sanitized.length > 0) {
        query = query.or(
          `display_name.ilike.%${sanitized}%,city.ilike.%${sanitized}%,category.ilike.%${sanitized}%`
        );
      }
    }

    const { data: profiles, error: profilesErr } = await query.range(offset, offset + limit - 1);
    if (profilesErr) {
      console.error("[profileApi] Failed to fetch profiles:", profilesErr.message);
      return [];
    }
    if (!profiles || profiles.length === 0) return [];

    const filteredProfileIds = (profiles as unknown as EligibleProfileRow[]).map((p) => p.id).filter(Boolean) as string[];

    // Fetch images and service counts in parallel
    const [imagesResult, servicesResult] = await Promise.all([
      supabase
        .from("profile_images").select("profile_id, storage_path")
        .in("profile_id", filteredProfileIds).eq("moderation_status", "approved")
        .order("sort_order", { ascending: true }),
      supabase
        .from("profile_services").select("profile_id")
        .in("profile_id", filteredProfileIds),
    ]);

    if (imagesResult.error) {
      console.error("[profileApi] Failed to fetch images:", imagesResult.error.message);
    }

    const imgRows = (imagesResult.data ?? []) as ProfileImageRow[];
    const allPaths = imgRows.map((img) => img.storage_path);
    const signedUrlMap = await getSignedUrls(allPaths);

    const imageMap: Record<string, string[]> = {};
    imgRows.forEach((img) => {
      if (!imageMap[img.profile_id]) imageMap[img.profile_id] = [];
      const url = signedUrlMap[img.storage_path];
      if (url) imageMap[img.profile_id].push(url);
    });

    // Count services per profile
    const serviceCountMap: Record<string, number> = {};
    (servicesResult.data ?? []).forEach((row: ProfileServiceRow) => {
      serviceCountMap[row.profile_id] = (serviceCountMap[row.profile_id] || 0) + 1;
    });

    const profileMap = new Map((profiles as unknown as EligibleProfileRow[]).map((p) => [p.id, p]));

    return filteredProfileIds.map((id) => {
      const p = profileMap.get(id)!;
      const pAny = p as any;
      return {
        id: p.id!, display_name: p.display_name ?? "", age: p.age ?? null, gender: p.gender ?? null,
        city: p.city ?? null, city_slug: p.city_slug ?? null, category: p.category ?? null,
        slug: p.slug ?? null, pricing_from: p.pricing_from ?? null,
        is_featured: p.is_featured ?? false,
        highlight_tier: (pAny.highlight_tier as string) ?? "standard",
        highlight_expires_at: (pAny.highlight_expires_at as string | null) ?? null,
        image_urls: imageMap[p.id!] || [],
        bio: p.bio ?? null, has_whatsapp: p.has_whatsapp ?? false,
        created_at: p.created_at ?? null,
        languages: p.languages ?? null,
        service_count: serviceCountMap[p.id!] || 0,
      };
    });
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

    let query = supabase
      .from("eligible_profiles")
      .select("id")
      .order("tier_rank" as any, { ascending: false })
      .order("effective_sort_key" as any, { ascending: false })
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(offset, offset + limit - 1);

    if (filters?.country_name) query = query.ilike("country", filters.country_name);
    else if (filters?.country) query = query.ilike("country", filters.country);
    if (filters?.city_slugs && filters.city_slugs.length > 0) query = query.in("city_slug", filters.city_slugs);
    if (filters?.city_slug) query = query.eq("city_slug", filters.city_slug);
    if (filters?.category) query = query.ilike("category", filters.category);

    const { data: profiles } = await query;
    if (!profiles || profiles.length === 0) return;

    const ids = profiles.map((p) => p.id).filter(Boolean) as string[];

    const { data: images } = await supabase
      .from("profile_images")
      .select("storage_path")
      .in("profile_id", ids)
      .eq("moderation_status", "approved");

    if (!images || images.length === 0) return;

    await getSignedUrls(images.map((img) => img.storage_path));
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
