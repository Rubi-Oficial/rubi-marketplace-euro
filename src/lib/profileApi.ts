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
      .select("id, display_name, age, city, city_slug, category, gender, slug, pricing_from, is_featured, highlight_tier, highlight_expires_at, bio, has_whatsapp, tier_rank, effective_sort_key, created_at")
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
      // Sanitize search input: remove PostgREST special characters to prevent filter injection
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

    const { data: images, error: imgErr } = await supabase
      .from("profile_images").select("profile_id, storage_path")
      .in("profile_id", filteredProfileIds).eq("moderation_status", "approved")
      .order("sort_order", { ascending: true });

    if (imgErr) {
      console.error("[profileApi] Failed to fetch images:", imgErr.message);
    }

    const imgRows = (images ?? []) as ProfileImageRow[];
    const allPaths = imgRows.map((img) => img.storage_path);
    const signedUrlMap = await getSignedUrls(allPaths);

    const imageMap: Record<string, string[]> = {};
    imgRows.forEach((img) => {
      if (!imageMap[img.profile_id]) imageMap[img.profile_id] = [];
      const url = signedUrlMap[img.storage_path];
      if (url) imageMap[img.profile_id].push(url);
    });

    const profileMap = new Map((profiles as unknown as EligibleProfileRow[]).map((p) => [p.id, p]));

    return filteredProfileIds.map((id) => {
      const p = profileMap.get(id)!;
      // deno-lint-ignore no-explicit-any
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
      };
    });
  } catch (err) {
    console.error("[profileApi] Unexpected error in fetchEligibleProfiles:", err);
    return [];
  }
}

/**
 * Prefetch signed URLs for the next batch of profiles (warms the cache).
 * Call this after loading a batch so signed URLs are ready before the user scrolls.
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

    // Just warm the signed URL cache — result is discarded
    await getSignedUrls(images.map((img) => img.storage_path));
  } catch {
    // Prefetch is best-effort, never block UI
  }
}

export async function fetchFilterOptions() {
  try {
    const { data: profiles, error } = await supabase
      .from("eligible_profiles").select("city, city_slug, category");
    if (error) {
      console.error("[profileApi] Failed to fetch filter options:", error.message);
      return { cities: [], categories: [] };
    }
    const rows = (profiles ?? []) as Pick<EligibleProfileRow, "city" | "category">[];
    const cities = [...new Set(rows.map((p) => p.city).filter(Boolean))] as string[];
    const categories = [...new Set(rows.map((p) => p.category).filter(Boolean))] as string[];
    return { cities: cities.sort(), categories: categories.sort() };
  } catch (err) {
    console.error("[profileApi] Unexpected error in fetchFilterOptions:", err);
    return { cities: [], categories: [] };
  }
}

export async function fetchServices() {
  try {
    const { data, error } = await supabase
      .from("services").select("id, name, slug").eq("is_active", true).order("sort_order", { ascending: true });
    if (error) {
      console.error("[profileApi] Failed to fetch services:", error.message);
      return [];
    }
    return (data || []) as { id: string; name: string; slug: string }[];
  } catch (err) {
    console.error("[profileApi] Unexpected error in fetchServices:", err);
    return [];
  }
}
