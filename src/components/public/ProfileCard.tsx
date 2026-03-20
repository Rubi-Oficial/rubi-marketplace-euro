import { forwardRef, useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Sparkles, ChevronLeft, ChevronRight, DollarSign, Heart, ArrowRight } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { Button } from "@/components/ui/button";
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
  image_urls: string[];
  bio: string | null;
  whatsapp: string | null;
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
    .select("id, display_name, age, city, city_slug, category, slug, pricing_from, is_featured, bio, whatsapp")
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

  const imageMap: Record<string, string[]> = {};
  (images || []).forEach((img: any) => {
    if (!imageMap[img.profile_id]) imageMap[img.profile_id] = [];
    imageMap[img.profile_id].push(
      supabase.storage.from("profile-images").getPublicUrl(img.storage_path).data.publicUrl
    );
  });

  const profileMap = new Map(profiles.map((p: any) => [p.id, p]));

  return filteredProfileIds.map((id) => {
    const p = profileMap.get(id)!;
    return {
      id: p.id!, display_name: p.display_name ?? "", age: p.age ?? null,
      city: p.city ?? null, city_slug: p.city_slug ?? null, category: p.category ?? null,
      slug: p.slug ?? null, pricing_from: p.pricing_from ?? null,
      is_featured: p.is_featured ?? false, image_urls: imageMap[p.id!] || [],
      bio: p.bio ?? null, whatsapp: p.whatsapp ?? null,
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

const ROTATION_INTERVAL = 5000;
const PAUSE_AFTER_MANUAL = 10000;
const BIO_MAX_LENGTH = 150;

export const ProfileCard = forwardRef<HTMLDivElement, { profile: EligibleProfile }>(({ profile }, ref) => {
  const navigate = useNavigate();
  const urls = profile.image_urls;
  const hasMultiple = urls.length > 1;
  const [activeIdx, setActiveIdx] = useState(0);
  const [hovered, setHovered] = useState(false);
  const { isFavorited, toggleFavorite, isToggling } = useFavorites();
  const favorited = isFavorited(profile.id);
  const pausedUntilRef = useRef(0);

  const truncatedBio = profile.bio
    ? profile.bio.length > BIO_MAX_LENGTH
      ? profile.bio.slice(0, BIO_MAX_LENGTH).trimEnd() + "…"
      : profile.bio
    : null;

  useEffect(() => {
    if (!hasMultiple) return;
    const id = setInterval(() => {
      if (hovered) return;
      if (Date.now() < pausedUntilRef.current) return;
      setActiveIdx((i) => (i + 1) % urls.length);
    }, ROTATION_INTERVAL);
    return () => clearInterval(id);
  }, [hasMultiple, hovered, urls.length]);

  const goTo = useCallback(
    (idx: number, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setActiveIdx(idx);
      pausedUntilRef.current = Date.now() + PAUSE_AFTER_MANUAL;
    },
    []
  );

  const goPrev = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setActiveIdx((i) => (i - 1 + urls.length) % urls.length);
      pausedUntilRef.current = Date.now() + PAUSE_AFTER_MANUAL;
    },
    [urls.length]
  );

  const goNext = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setActiveIdx((i) => (i + 1) % urls.length);
      pausedUntilRef.current = Date.now() + PAUSE_AFTER_MANUAL;
    },
    [urls.length]
  );

  const handleWhatsApp = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!profile.whatsapp) return;
      const msg = encodeURIComponent("Olá! Gostaria de mais informações sobre seus serviços.");
      window.open(`https://wa.me/${profile.whatsapp.replace(/\D/g, "")}?text=${msg}`, "_blank");
    },
    [profile.whatsapp]
  );

  if (!profile.slug) return null;

  return (
    <div
      ref={ref}
      className="group relative flex flex-col overflow-hidden rounded-xl bg-white shadow-sm border border-border/40 transition-shadow duration-300 hover:shadow-xl hover:shadow-primary/8 cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate(`/perfil/${profile.slug}`)}
    >
      {/* Image section */}
      <div className="relative h-[300px] sm:h-[320px] overflow-hidden bg-muted">
        {urls.length > 0 ? (
          urls.map((url, idx) => (
            <img
              key={url}
              src={url}
              alt={`${profile.display_name} — ${idx + 1}`}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                idx === activeIdx ? "opacity-100" : "opacity-0"
              }`}
              loading={idx === 0 ? "eager" : "lazy"}
            />
          ))
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground/20">
            <div className="h-14 w-14 rounded-full bg-muted-foreground/10" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {hasMultiple && (
          <>
            <button
              onClick={goPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white/90 opacity-0 transition-opacity duration-200 group-hover:opacity-100 hover:bg-black/60 active:scale-95"
              aria-label="Previous"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={goNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white/90 opacity-0 transition-opacity duration-200 group-hover:opacity-100 hover:bg-black/60 active:scale-95"
              aria-label="Next"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        {hasMultiple && (
          <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-1.5 z-10">
            {urls.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => goTo(idx, e)}
                className={`rounded-full transition-all duration-300 ${
                  idx === activeIdx
                    ? "h-2.5 w-2.5 bg-primary shadow-[0_0_6px_hsl(var(--primary)/0.6)]"
                    : "h-1.5 w-1.5 bg-white/50 hover:bg-white/80"
                }`}
                aria-label={`Image ${idx + 1}`}
              />
            ))}
          </div>
        )}

        {profile.is_featured && (
          <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full gold-gradient px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-md">
            <Sparkles className="h-2.5 w-2.5" />
            Featured
          </div>
        )}

        {profile.category && (
          <div className="absolute top-3 right-3 rounded-full bg-black/50 backdrop-blur-sm px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/90">
            {profile.category}
          </div>
        )}
      </div>

      {/* Info sections */}
      <div className="flex flex-1 flex-col px-5 py-4 space-y-3">
        <div className="flex items-baseline gap-2">
          <h3 className="font-display text-xl font-bold text-foreground leading-tight truncate">
            {profile.display_name}
          </h3>
          {profile.age && (
            <span className="text-lg font-bold text-primary shrink-0">{profile.age}</span>
          )}
        </div>

        {profile.city && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 text-primary/60 shrink-0" />
            <span>{profile.city}</span>
          </div>
        )}

        {truncatedBio && (
          <div className="rounded-lg bg-surface-light px-3 py-2.5">
            <p className="text-sm leading-relaxed text-foreground/80 line-clamp-3">
              {truncatedBio}
            </p>
          </div>
        )}

        {profile.pricing_from != null && profile.pricing_from > 0 && (
          <div className="flex items-center gap-1.5 text-base font-semibold text-primary">
            <DollarSign className="h-4 w-4" />
            <span>A partir de R$ {profile.pricing_from}</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2 pt-1 mt-auto" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            className="flex-1 gap-1.5 rounded-lg text-sm font-semibold"
            onClick={() => navigate(`/perfil/${profile.slug}`)}
            aria-label={`Ver perfil de ${profile.display_name}`}
          >
            Ver Perfil
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>

          <Button
            size="sm"
            variant="outline"
            className={`shrink-0 rounded-lg px-3 transition-colors duration-200 ${
              favorited
                ? "bg-primary/10 border-primary/30 text-primary"
                : "bg-surface-light border-border/60 text-muted-foreground hover:text-primary hover:border-primary/30"
            }`}
            disabled={isToggling}
            onClick={() => toggleFavorite(profile.id)}
            aria-label={favorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          >
            <Heart className={`h-4 w-4 ${favorited ? "fill-primary" : ""}`} />
          </Button>

          {profile.whatsapp ? (
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 rounded-lg px-3 border-border/60 text-[#25D366] hover:bg-[#25D366]/10 hover:border-[#25D366]/40 transition-colors duration-200"
              onClick={handleWhatsApp}
              aria-label="Contato via WhatsApp"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.553 4.12 1.52 5.857L.057 23.648l5.944-1.56A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.82c-1.97 0-3.867-.53-5.52-1.53l-.396-.236-3.525.925.94-3.44-.258-.41A9.79 9.79 0 012.18 12C2.18 6.58 6.58 2.18 12 2.18S21.82 6.58 21.82 12 17.42 21.82 12 21.82z" />
              </svg>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
});
ProfileCard.displayName = "ProfileCard";
