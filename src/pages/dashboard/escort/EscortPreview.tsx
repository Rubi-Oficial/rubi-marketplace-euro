import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Pencil } from "lucide-react";
import { ProfileSkeleton } from "@/components/profile/ProfileSkeleton";
import { ProfileGallery } from "@/components/profile/ProfileGallery";
import { ProfileInfo } from "@/components/profile/ProfileInfo";

interface MediaItem {
  id: string;
  storage_path: string;
  sort_order: number;
  url: string;
}

export default function EscortPreview() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [images, setImages] = useState<MediaItem[]>([]);
  const [videos, setVideos] = useState<MediaItem[]>([]);
  const [services, setServices] = useState<{ name: string; slug: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!prof) { setLoading(false); return; }
      setProfile(prof);

      const [imgRes, vidRes, psRes] = await Promise.all([
        supabase.from("profile_images").select("id, storage_path, sort_order, moderation_status")
          .eq("profile_id", prof.id).order("sort_order"),
        supabase.from("profile_videos").select("id, storage_path, sort_order, moderation_status")
          .eq("profile_id", prof.id).order("sort_order"),
        supabase.from("profile_services").select("service_id").eq("profile_id", prof.id),
      ]);

      if (imgRes.data) {
        setImages(imgRes.data.map((img) => ({
          ...img,
          url: supabase.storage.from("profile-images").getPublicUrl(img.storage_path).data.publicUrl,
        })));
      }

      if (vidRes.data) {
        setVideos(vidRes.data.map((v) => ({
          ...v,
          url: supabase.storage.from("profile-images").getPublicUrl(v.storage_path).data.publicUrl,
        })));
      }

      if (psRes.data && psRes.data.length > 0) {
        const serviceIds = psRes.data.map((r: any) => r.service_id);
        const { data: svcData } = await supabase
          .from("services").select("name, slug")
          .in("id", serviceIds).eq("is_active", true).order("sort_order");
        if (svcData) setServices(svcData);
      }

      setLoading(false);
    };

    load();
  }, [user]);

  if (loading) return <ProfileSkeleton />;

  if (!profile) {
    return (
      <div className="animate-fade-in text-center py-20">
        <p className="text-muted-foreground">Nenhum perfil encontrado.</p>
        <Button asChild className="mt-4">
          <Link to="/app/onboarding">Criar perfil</Link>
        </Button>
      </div>
    );
  }

  const STATUS_LABELS: Record<string, string> = {
    draft: "Rascunho",
    pending_review: "Em análise",
    approved: "Aprovado — aguardando ativação",
    rejected: "Rejeitado",
    paused: "Pausado",
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/app/perfil"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-2 transition-colors"
          >
            <ArrowLeft className="h-3 w-3" /> Voltar ao perfil
          </Link>
          <h1 className="font-display text-2xl font-bold text-foreground">Pré-visualização</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            É assim que o seu perfil aparece para os visitantes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline">{STATUS_LABELS[profile.status] || profile.status}</Badge>
          <Button variant="outline" size="sm" asChild>
            <Link to="/app/perfil"><Pencil className="mr-1.5 h-4 w-4" /> Editar</Link>
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-1">
        <div className="rounded-md bg-background p-4 sm:p-6">
          <div className="grid gap-8 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <ProfileGallery images={images} videos={videos} name={profile.display_name || "Sem nome"} />
            </div>
            <div className="lg:col-span-2">
              <ProfileInfo
                profile={{
                  display_name: profile.display_name || "Sem nome",
                  age: profile.age,
                  city: profile.city,
                  country: profile.country,
                  category: profile.category,
                  bio: profile.bio,
                  languages: profile.languages,
                  pricing_from: profile.pricing_from,
                  whatsapp: profile.whatsapp,
                  telegram: profile.telegram,
                  is_featured: profile.is_featured,
                }}
                services={services}
              />
            </div>
          </div>
        </div>
      </div>

      {images.length === 0 && (
        <div className="mt-4 rounded-lg border border-border bg-card p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Ainda não tem fotos. <Link to="/app/fotos" className="text-primary underline">Adicionar fotos</Link> para melhorar o seu perfil.
          </p>
        </div>
      )}
    </div>
  );
}
