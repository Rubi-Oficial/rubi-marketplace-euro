import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

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
  image_urls: string[];
  bio: string | null;
  has_whatsapp: boolean;
}

type EligibleProfileRow = Database["public"]["Views"]["eligible_profiles"]["Row"];
type ProfileImageRow = Pick<Database["public"]["Tables"]["profile_images"]["Row"], "profile_id" | "storage_path">;
type ProfileServiceRow = Pick<Database["public"]["Tables"]["profile_services"]["Row"], "profile_id">;

export async function fetchEligibleProfiles(filters?: {
  country?: string;
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
  const limit = Math.min(Math.max(filters?.limit ?? 50, 1), 100);
  const offset = Math.max(filters?.offset ?? 0, 0);

  let serviceProfileIds: string[] | null = null;
  if (filters?.service_slug) {
    const { data: serviceData } = await supabase
      .from("services")
      .select("id")
      .eq("slug", filters.service_slug)
      .single();

    if (!serviceData) return [];

    const { data: profileServiceRows } = await supabase
      .from("profile_services")
      .select("profile_id")
      .eq("service_id", serviceData.id);

    serviceProfileIds = (profileServiceRows || [])
      .map((row: ProfileServiceRow) => row.profile_id)
      .filter(Boolean);

    if (serviceProfileIds.length === 0) return [];
  }

  let query = supabase
    .from("eligible_profiles")
    .select("id, display_name, age, city, city_slug, category, gender, slug, pricing_from, is_featured, bio, has_whatsapp")
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (serviceProfileIds) query = query.in("id", serviceProfileIds);
  if (filters?.country) query = query.ilike("country", filters.country);
  if (filters?.city_slugs && filters.city_slugs.length > 0) query = query.in("city_slug", filters.city_slugs);

  if (filters?.city_slug) {
    query = query.eq("city_slug", filters.city_slug);
  } else if (filters?.city) {
    query = query.ilike("city", filters.city);
  }
  if (filters?.category) query = query.ilike("category", filters.category);
  if (filters?.gender) query = query.ilike("gender", filters.gender);
  if (filters?.search) {
    query = query.or(
      `display_name.ilike.%${filters.search}%,city.ilike.%${filters.search}%,category.ilike.%${filters.search}%`
    );
  }

  const { data: profiles } = await query.range(offset, offset + limit - 1);
  if (!profiles || profiles.length === 0) return [];

  const filteredProfileIds = (profiles as EligibleProfileRow[]).map((p) => p.id).filter(Boolean) as string[];

  const { data: images } = await supabase
    .from("profile_images").select("profile_id, storage_path")
    .in("profile_id", filteredProfileIds).eq("moderation_status", "approved")
    .order("sort_order", { ascending: true });

  const imageMap: Record<string, string[]> = {};
  const profileImages = (images ?? []) as ProfileImageRow[];
  profileImages.forEach((img) => {
    if (!imageMap[img.profile_id]) imageMap[img.profile_id] = [];
    imageMap[img.profile_id].push(
      supabase.storage.from("profile-images").getPublicUrl(img.storage_path).data.publicUrl
    );
  });

  const profileMap = new Map((profiles as EligibleProfileRow[]).map((p) => [p.id, p]));

  return filteredProfileIds.map((id) => {
    const p = profileMap.get(id)!;
    return {
      id: p.id!, display_name: p.display_name ?? "", age: p.age ?? null, gender: p.gender ?? null,
      city: p.city ?? null, city_slug: p.city_slug ?? null, category: p.category ?? null,
      slug: p.slug ?? null, pricing_from: p.pricing_from ?? null,
      is_featured: p.is_featured ?? false, image_urls: imageMap[p.id!] || [],
      bio: p.bio ?? null, has_whatsapp: p.has_whatsapp ?? false,
    };
  });
}

export async function fetchFilterOptions() {
  const { data: profiles } = await supabase
    .from("eligible_profiles").select("city, city_slug, category");
  const rows = (profiles ?? []) as Pick<EligibleProfileRow, "city" | "category">[];
  const cities = [...new Set(rows.map((p) => p.city).filter(Boolean))] as string[];
  const categories = [...new Set(rows.map((p) => p.category).filter(Boolean))] as string[];
  return { cities: cities.sort(), categories: categories.sort() };
}

export async function fetchServices() {
  const { data } = await supabase
    .from("services").select("id, name, slug").eq("is_active", true).order("sort_order", { ascending: true });
  return (data || []) as { id: string; name: string; slug: string }[];
}
