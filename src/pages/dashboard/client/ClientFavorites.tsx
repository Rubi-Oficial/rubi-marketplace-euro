import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Heart, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getSignedUrls } from "@/lib/storageUrls";
import { useAuth } from "@/contexts/AuthContext";
import { ProfileCard, EligibleProfile } from "@/components/public/ProfileCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function ClientFavorites() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["favorite-profiles", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data: favs, error } = await supabase
        .from("user_favorites")
        .select("profile_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!favs.length) return [];

      const ids = favs.map((f) => f.profile_id);

      const { data: profileData } = await supabase
        .from("eligible_profiles")
        .select("id, display_name, age, city, city_slug, category, slug, pricing_from, is_featured, bio, has_whatsapp")
        .in("id", ids);

      if (!profileData?.length) return [];

      const { data: images } = await supabase
        .from("profile_images")
        .select("profile_id, storage_path")
        .in("profile_id", ids)
        .eq("moderation_status", "approved")
        .order("sort_order", { ascending: true });

      const allPaths = (images || []).map((img: any) => img.storage_path);
      const urlMap = await getSignedUrls(allPaths);

      const imageMap: Record<string, string[]> = {};
      (images || []).forEach((img: any) => {
        if (!imageMap[img.profile_id]) imageMap[img.profile_id] = [];
        const url = urlMap[img.storage_path];
        if (url) imageMap[img.profile_id].push(url);
      });

      // Maintain favorites order
      const profileMap = new Map(profileData.map((p: any) => [p.id, p]));
      return ids
        .map((id) => {
          const p = profileMap.get(id);
          if (!p) return null;
          return {
            id: p.id!, display_name: p.display_name ?? "", age: p.age ?? null,
            city: p.city ?? null, city_slug: p.city_slug ?? null, category: p.category ?? null,
            gender: p.gender ?? null,
            slug: p.slug ?? null, pricing_from: p.pricing_from ?? null,
            is_featured: p.is_featured ?? false, image_urls: imageMap[p.id!] || [],
            bio: p.bio ?? null, has_whatsapp: p.has_whatsapp ?? false,
          } as EligibleProfile;
        })
        .filter(Boolean) as EligibleProfile[];
    },
    enabled: !!user?.id,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Meus Favoritos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isLoading ? "Carregando..." : `${profiles.length} perfil(is) favoritado(s)`}
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[460px] rounded-xl" />
          ))}
        </div>
      ) : profiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
            <Heart className="h-7 w-7 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-1">Nenhum favorito ainda</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs">
            Explore perfis e toque no coração para salvar seus favoritos aqui.
          </p>
          <Button onClick={() => navigate("/buscar")} className="gap-2">
            <Search className="h-4 w-4" />
            Explorar Perfis
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {profiles.map((p) => (
            <ProfileCard key={p.id} profile={p} />
          ))}
        </div>
      )}
    </div>
  );
}
