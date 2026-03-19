import { Link } from "react-router-dom";
import { MapPin, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Tables } from "@/integrations/supabase/types";

type EligibleProfileRow = Tables<"eligible_profiles">;

export interface EligibleProfile {
  id: string;
  display_name: string;
  age: number | null;
  city: string | null;
  category: string | null;
  slug: string | null;
  pricing_from: number | null;
  is_featured: boolean;
  thumb_url: string | null;
}

/**
 * Fetch profiles using the centralized eligible_profiles view.
 * Optionally filter by city, category, or search term.
 */
export async function fetchEligibleProfiles(filters?: {
  city?: string;
  category?: string;
  search?: string;
}): Promise<EligibleProfile[]> {
  let query = supabase
    .from("eligible_profiles")
    .select("id, display_name, age, city, category, slug, pricing_from, is_featured")
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters?.city) {
    query = query.ilike("city", filters.city);
  }
  if (filters?.category) {
    query = query.ilike("category", filters.category);
  }
  if (filters?.search) {
    query = query.or(
      `display_name.ilike.%${filters.search}%,city.ilike.%${filters.search}%,category.ilike.%${filters.search}%`
    );
  }

  const { data: profiles } = await query.limit(50);
  if (!profiles || profiles.length === 0) return [];

  const profileIds = profiles.map((p) => p.id).filter(Boolean) as string[];
  const { data: images } = await supabase
    .from("profile_images")
    .select("profile_id, storage_path")
    .in("profile_id", profileIds)
    .eq("moderation_status", "approved")
    .order("sort_order", { ascending: true });

  const thumbMap: Record<string, string> = {};
  (images || []).forEach((img) => {
    if (!thumbMap[img.profile_id]) {
      thumbMap[img.profile_id] = supabase.storage
        .from("profile-images")
        .getPublicUrl(img.storage_path).data.publicUrl;
    }
  });

  return profiles.map((p) => ({
    id: p.id!,
    display_name: p.display_name ?? "",
    age: p.age ?? null,
    city: p.city ?? null,
    category: p.category ?? null,
    slug: p.slug ?? null,
    pricing_from: p.pricing_from ?? null,
    is_featured: p.is_featured ?? false,
    thumb_url: thumbMap[p.id!] || null,
  }));
}

/**
 * Fetch distinct cities and categories from eligible profiles.
 */
export async function fetchFilterOptions() {
  const { data: profiles } = await supabase
    .from("eligible_profiles")
    .select("city, category");

  const rows = profiles ?? [];
  const cities = [...new Set(rows.map((p) => p.city).filter(Boolean))] as string[];
  const categories = [...new Set(rows.map((p) => p.category).filter(Boolean))] as string[];

  return { cities: cities.sort(), categories: categories.sort() };
}

export function ProfileCard({ profile }: { profile: EligibleProfile }) {
  return (
    <Link
      to={`/perfil/${profile.slug}`}
      className="group relative block overflow-hidden rounded-xl bg-card transition-all duration-300 hover:ring-1 hover:ring-primary/30"
    >
      {/* Image */}
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        {profile.thumb_url ? (
          <img
            src={profile.thumb_url}
            alt={`${profile.display_name}`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground/40">
            <div className="h-12 w-12 rounded-full bg-muted-foreground/10" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-90" />

        {/* Featured badge */}
        {profile.is_featured && (
          <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full gold-gradient px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-lg">
            <Sparkles className="h-3 w-3" />
            Featured
          </div>
        )}

        {/* Price badge */}
        {profile.pricing_from && (
          <div className="absolute top-3 right-3 rounded-full bg-background/70 backdrop-blur-sm px-2.5 py-1 text-xs font-semibold text-primary">
            €{Number(profile.pricing_from).toLocaleString("de-DE")}
          </div>
        )}

        {/* Bottom info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="font-display text-base font-semibold text-foreground truncate leading-tight">
            {profile.display_name}
            {profile.age && (
              <span className="ml-1.5 text-sm font-normal text-muted-foreground">{profile.age}</span>
            )}
          </h3>
          {profile.city && (
            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 text-primary/70" />
              <span>{profile.city}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
