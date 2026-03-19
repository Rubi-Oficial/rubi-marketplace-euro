import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { supabase } from "@/lib/supabase";

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
    .from("eligible_profiles" as any)
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

  // Get first approved image for each profile
  const profileIds = (profiles as any[]).map((p) => p.id);
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

  return (profiles as any[]).map((p) => ({
    ...p,
    thumb_url: thumbMap[p.id] || null,
  }));
}

/**
 * Fetch distinct cities and categories from eligible profiles.
 */
export async function fetchFilterOptions() {
  const { data: profiles } = await supabase
    .from("eligible_profiles" as any)
    .select("city, category");

  const cities = [...new Set((profiles as any[] || []).map((p: any) => p.city).filter(Boolean))] as string[];
  const categories = [...new Set((profiles as any[] || []).map((p: any) => p.category).filter(Boolean))] as string[];

  return { cities: cities.sort(), categories: categories.sort() };
}

export function ProfileCard({ profile }: { profile: EligibleProfile }) {
  return (
    <Link
      to={`/perfil/${profile.slug}`}
      className="group block overflow-hidden rounded-lg border border-border bg-card transition-all hover:border-primary/30 hover:glow-gold"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        {profile.thumb_url ? (
          <img
            src={profile.thumb_url}
            alt={`Foto de ${profile.display_name}`}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
            Sem foto
          </div>
        )}
        {profile.is_featured && (
          <div className="absolute top-2 left-2 rounded-full gold-gradient px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
            Destaque
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-display text-base font-semibold text-foreground truncate">
          {profile.display_name}
        </h3>
        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          {profile.city && (
            <>
              <MapPin className="h-3 w-3" />
              <span>{profile.city}</span>
            </>
          )}
          {profile.age && <span className="ml-auto">{profile.age} anos</span>}
        </div>
        {profile.pricing_from && (
          <p className="mt-2 text-sm font-semibold text-primary">
            From €{Number(profile.pricing_from).toLocaleString("en-EU")}
          </p>
        )}
      </div>
    </Link>
  );
}
