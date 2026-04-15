import { supabase } from "@/integrations/supabase/client";

const FILTER_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let filterOptionsCache: { cities: string[]; categories: string[]; ts: number } | null = null;
let filterOptionsPromise: Promise<{ cities: string[]; categories: string[] }> | null = null;

export async function fetchFilterOptions() {
  if (filterOptionsCache && Date.now() - filterOptionsCache.ts < FILTER_CACHE_TTL) {
    return { cities: filterOptionsCache.cities, categories: filterOptionsCache.categories };
  }

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
        console.error("[profileFilters] Failed to fetch cities:", citiesRes.error.message);
      }
      if (categoriesRes.error) {
        console.error("[profileFilters] Failed to fetch categories:", categoriesRes.error.message);
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
      console.error("[profileFilters] Unexpected error in fetchFilterOptions:", err);
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
  if (servicesCache && Date.now() - servicesCache.ts < SERVICES_CACHE_TTL) {
    return servicesCache.data;
  }

  if (servicesPromise) return servicesPromise;

  servicesPromise = (async () => {
    try {
      const { data, error } = await supabase
        .from("services").select("id, name, slug").eq("is_active", true).order("sort_order", { ascending: true });
      if (error) {
        console.error("[profileFilters] Failed to fetch services:", error.message);
        return [];
      }
      const result = (data || []) as { id: string; name: string; slug: string }[];
      servicesCache = { data: result, ts: Date.now() };
      return result;
    } catch (err) {
      console.error("[profileFilters] Unexpected error in fetchServices:", err);
      return [];
    } finally {
      servicesPromise = null;
    }
  })();

  return servicesPromise;
}
