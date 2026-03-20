import { forwardRef } from "react";
import { Link } from "react-router-dom";
import { MapPin, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";

export interface EligibleProfile {
  id: string;
  display_name: string;
  age: number | null;
  city: string | null;
  city_slug: string | null;
  category: string | null;
  slug: string | null;
  pricing_from: number | null;
  is_featured: boolean;
  thumb_url: string | null;
}

export async function fetchEligibleProfiles(filters?: {
  city?: string;
  city_slug?: string;
  category?: string;
  search?: string;
  service_slug?: string;
}): Promise<EligibleProfile[]> {
  let query = supabase
    .from("eligible_profiles")
    .select("id, display_name, age, city, city_slug, category, slug, pricing_from, is_featured")
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters?.city_slug) {
    query = query.eq("city_slug", filters.city_slug);
  } else if (filters?.city) {
    query = query.ilike("city", filters.city);
  }
  if (filters?.category) query = query.ilike("category", filters.category);
  if (filters?.search) {
    query = query.or(
      `display_name.ilike.%${filters.search}%,city.ilike.%${filters.search}%,category.ilike.%${filters.search}%`
    );
  }

  const { data: profiles } = await query.limit(50);
  if (!profiles || profiles.length === 0) return [];

  let filteredProfileIds = profiles.map((p: any) => p.id).filter(Boolean) as string[];

  if (filters?.service_slug && filteredProfileIds.length > 0) {
    const { data: svcData } = await supabase
      .from("services").select("id").eq("slug", filters.service_slug).single();
    if (svcData) {
      const { data: psData } = await supabase
        .from("profile_services").select("profile_id").eq("service_id", svcData.id).in("profile_id", filteredProfileIds);
      const matchedIds = new Set((psData || []).map((r: any) => r.profile_id));
      filteredProfileIds = filteredProfileIds.filter((id) => matchedIds.has(id));
    } else {
      return [];
    }
  }

  const { data: images } = await supabase
    .from("profile_images").select("profile_id, storage_path")
    .in("profile_id", filteredProfileIds).eq("moderation_status", "approved")
    .order("sort_order", { ascending: true });

  const thumbMap: Record<string, string> = {};
  (images || []).forEach((img: any) => {
    if (!thumbMap[img.profile_id]) {
      thumbMap[img.profile_id] = supabase.storage
        .from("profile-images").getPublicUrl(img.storage_path).data.publicUrl;
    }
  });

  const profileMap = new Map(profiles.map((p: any) => [p.id, p]));

  return filteredProfileIds.map((id) => {
    const p = profileMap.get(id)!;
    return {
      id: p.id!, display_name: p.display_name ?? "", age: p.age ?? null,
      city: p.city ?? null, city_slug: p.city_slug ?? null, category: p.category ?? null,
      slug: p.slug ?? null, pricing_from: p.pricing_from ?? null,
      is_featured: p.is_featured ?? false, thumb_url: thumbMap[p.id!] || null,
    };
  });
}

export async function fetchFilterOptions() {
  const { data: profiles } = await supabase
    .from("eligible_profiles").select("city, city_slug, category");
  const rows = (profiles ?? []) as any[];
  const cities = [...new Set(rows.map((p) => p.city).filter(Boolean))] as string[];
  const categories = [...new Set(rows.map((p) => p.category).filter(Boolean))] as string[];
  return { cities: cities.sort(), categories: categories.sort() };
}

export async function fetchServices() {
  const { data } = await supabase
    .from("services").select("id, name, slug").eq("is_active", true).order("sort_order", { ascending: true });
  return (data || []) as { id: string; name: string; slug: string }[];
}

export const ProfileCard = forwardRef<HTMLAnchorElement, { profile: EligibleProfile }>(({ profile }, ref) => {
  return (
    <Link
      to={`/perfil/${profile.slug}`}
      className="group relative block overflow-hidden rounded-xl bg-card transition-all duration-300 hover:ring-1 hover:ring-primary/40 hover:shadow-[0_0_15px_hsl(350_65%_52%_/_0.1)]"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        {profile.thumb_url ? (
          <img
            src={profile.thumb_url}
            alt={profile.display_name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground/30">
            <div className="h-12 w-12 rounded-full bg-muted-foreground/10" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />

        {profile.is_featured && (
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1 rounded-full gold-gradient px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-lg">
            <Sparkles className="h-2.5 w-2.5" />
            Featured
          </div>
        )}

        {profile.pricing_from && (
          <div className="absolute top-2.5 right-2.5 rounded-full bg-background/60 backdrop-blur-sm px-2 py-0.5 text-[11px] font-semibold text-primary">
            €{Number(profile.pricing_from).toLocaleString("de-DE")}
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="font-display text-sm font-semibold text-foreground truncate leading-tight">
            {profile.display_name}
            {profile.age && <span className="ml-1 text-xs font-normal text-muted-foreground">{profile.age}</span>}
          </h3>
          {profile.city && (
            <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
              <MapPin className="h-2.5 w-2.5 text-primary/60" />
              {profile.city}
            </div>
          )}
        </div>
      </div>
    </Link>
});
ProfileCard.displayName = "ProfileCard";
