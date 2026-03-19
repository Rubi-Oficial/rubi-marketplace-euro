import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Upload, Trash2, ImageIcon, Film, Play } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MediaItem {
  id: string;
  storage_path: string;
  moderation_status: "pending" | "approved" | "rejected";
  sort_order: number;
  url: string;
  type: "image" | "video";
  duration_seconds?: number;
}

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendente", variant: "outline" },
  approved: { label: "Aprovada", variant: "default" },
  rejected: { label: "Rejeitada", variant: "destructive" },
};

export default function EscortPhotos() {
  const { user } = useAuth();
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [images, setImages] = useState<MediaItem[]>([]);
  const [videos, setVideos] = useState<MediaItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchMedia = async (pid: string) => {
    // Fetch images
    const { data: imgData } = await supabase
      .from("profile_images")
      .select("*")
      .eq("profile_id", pid)
      .order("sort_order");

    if (imgData) {
      setImages(imgData.map((img) => ({
        ...img,
        moderation_status: img.moderation_status as MediaItem["moderation_status"],
        url: supabase.storage.from("profile-images").getPublicUrl(img.storage_path).data.publicUrl,
        type: "image" as const,
      })));
    }

    // Fetch videos
    const { data: vidData } = await supabase
      .from("profile_videos")
      .select("*")
      .eq("profile_id", pid)
      .order("sort_order");

    if (vidData) {
      setVideos(vidData.map((v) => ({
        ...v,
        moderation_status: v.moderation_status as MediaItem["moderation_status"],
        url: supabase.storage.from("profile-images").getPublicUrl(v.storage_path).data.publicUrl,
        type: "video" as const,
        duration_seconds: v.duration_seconds,
      })));
    }
  };

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("id").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setProfileId(data.id);
          fetchMedia(data.id);
        }
        setLoading(false);
      });
  }, [user]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user || !profileId) return;

    setUploading(true);
    const maxOrder = images.length > 0 ? Math.max(...images.map((i) => i.sort_order)) : -1;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) { toast.error(`${file.name} não é uma imagem.`); continue; }
      if (file.size > 5 * 1024 * 1024) { toast.error(`${file.name} excede 5MB.`); continue; }

      const ext = file.name.split(".").pop();
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-images").upload(path, file, { cacheControl: "3600", upsert: false });
      if (uploadError) { toast.error("Erro no upload: " + uploadError.message); continue; }

      const { error: dbError } = await supabase.from("profile_images").insert({
        profile_id: profileId, storage_path: path, sort_order: maxOrder + 1 + i,
      });
      if (dbError) toast.error("Erro ao salvar imagem: " + dbError.message);
    }

    await fetchMedia(profileId);
    setUploading(false);
    toast.success("Upload concluído!");
    if (imageRef.current) imageRef.current.value = "";
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user || !profileId) return;

    setUploading(true);
    const maxOrder = videos.length > 0 ? Math.max(...videos.map((v) => v.sort_order)) : -1;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("video/")) { toast.error(`${file.name} não é um vídeo.`); continue; }
      if (file.size > 50 * 1024 * 1024) { toast.error(`${file.name} excede 50MB.`); continue; }

      const ext = file.name.split(".").pop();
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-images").upload(path, file, { cacheControl: "3600", upsert: false });
      if (uploadError) { toast.error("Erro no upload: " + uploadError.message); continue; }

      const { error: dbError } = await supabase.from("profile_videos").insert({
        profile_id: profileId, storage_path: path, sort_order: maxOrder + 1 + i,
      });
      if (dbError) toast.error("Erro ao salvar vídeo: " + dbError.message);
    }

    await fetchMedia(profileId);
    setUploading(false);
    toast.success("Upload de vídeo concluído!");
    if (videoRef.current) videoRef.current.value = "";
  };

  const handleDeleteImage = async (item: MediaItem) => {
    await supabase.storage.from("profile-images").remove([item.storage_path]);
    await supabase.from("profile_images").delete().eq("id", item.id);
    setImages((prev) => prev.filter((i) => i.id !== item.id));
    toast.success("Foto removida.");
  };

  const handleDeleteVideo = async (item: MediaItem) => {
    await supabase.storage.from("profile-images").remove([item.storage_path]);
    await supabase.from("profile_videos").delete().eq("id", item.id);
    setVideos((prev) => prev.filter((v) => v.id !== item.id));
    toast.success("Vídeo removido.");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!profileId) {
    return (
      <div className="animate-fade-in text-center py-20">
        <p className="text-muted-foreground">Crie seu perfil antes de adicionar mídia.</p>
      </div>
    );
  }

  const approvedImages = images.filter((i) => i.moderation_status === "approved").length;
  const pendingImages = images.filter((i) => i.moderation_status === "pending").length;
  const approvedVideos = videos.filter((v) => v.moderation_status === "approved").length;
  const pendingVideos = videos.filter((v) => v.moderation_status === "pending").length;

  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-2xl font-bold text-foreground">Fotos & Vídeos</h1>
      <p className="mt-1 text-muted-foreground text-sm">
        Gerencie suas fotos e vídeos. Todo conteúdo passa por moderação antes de ficar visível.
      </p>

      <Tabs defaultValue="photos" className="mt-6">
        <TabsList>
          <TabsTrigger value="photos" className="gap-1.5">
            <ImageIcon className="h-3.5 w-3.5" />
            Fotos ({images.length})
          </TabsTrigger>
          <TabsTrigger value="videos" className="gap-1.5">
            <Film className="h-3.5 w-3.5" />
            Vídeos ({videos.length})
          </TabsTrigger>
        </TabsList>

        {/* Photos Tab */}
        <TabsContent value="photos" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-muted-foreground">
              {approvedImages} aprovada(s) • {pendingImages} pendente(s)
            </p>
            <div>
              <input ref={imageRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
              <Button size="sm" onClick={() => imageRef.current?.click()} disabled={uploading}>
                <Upload className="mr-1.5 h-3.5 w-3.5" />
                {uploading ? "Enviando..." : "Enviar fotos"}
              </Button>
            </div>
          </div>

          {images.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-16">
              <ImageIcon className="h-12 w-12 text-muted-foreground/40" />
              <p className="mt-4 text-muted-foreground">Nenhuma foto ainda.</p>
              <Button variant="outline" className="mt-4" onClick={() => imageRef.current?.click()}>
                <Upload className="mr-1.5 h-4 w-4" /> Enviar primeira foto
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {images.map((img) => {
                const badge = STATUS_BADGE[img.moderation_status] || STATUS_BADGE.pending;
                return (
                  <div key={img.id} className="group relative overflow-hidden rounded-lg border border-border bg-card">
                    <div className="aspect-[3/4] w-full">
                      <img src={img.url} alt="Foto do perfil" loading="lazy" className="h-full w-full object-cover" />
                    </div>
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-background/90 to-transparent p-3 pt-8">
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                      <Button variant="destructive" size="icon" className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => handleDeleteImage(img)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <p className="mt-4 text-xs text-muted-foreground">
            Máximo 5MB por foto. Formatos aceitos: JPG, PNG, WebP.
          </p>
        </TabsContent>

        {/* Videos Tab */}
        <TabsContent value="videos" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-muted-foreground">
              {approvedVideos} aprovado(s) • {pendingVideos} pendente(s)
            </p>
            <div>
              <input ref={videoRef} type="file" accept="video/*" multiple className="hidden" onChange={handleVideoUpload} />
              <Button size="sm" onClick={() => videoRef.current?.click()} disabled={uploading}>
                <Upload className="mr-1.5 h-3.5 w-3.5" />
                {uploading ? "Enviando..." : "Enviar vídeos"}
              </Button>
            </div>
          </div>

          {videos.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-16">
              <Film className="h-12 w-12 text-muted-foreground/40" />
              <p className="mt-4 text-muted-foreground">Nenhum vídeo ainda.</p>
              <Button variant="outline" className="mt-4" onClick={() => videoRef.current?.click()}>
                <Upload className="mr-1.5 h-4 w-4" /> Enviar primeiro vídeo
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {videos.map((vid) => {
                const badge = STATUS_BADGE[vid.moderation_status] || STATUS_BADGE.pending;
                return (
                  <div key={vid.id} className="group relative overflow-hidden rounded-lg border border-border bg-card">
                    <div className="aspect-[3/4] w-full relative bg-muted">
                      <video
                        src={vid.url}
                        className="h-full w-full object-cover"
                        preload="metadata"
                        muted
                        playsInline
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/80 text-primary-foreground">
                          <Play className="h-4 w-4 ml-0.5" fill="currentColor" />
                        </div>
                      </div>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-background/90 to-transparent p-3 pt-8">
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                      <Button variant="destructive" size="icon" className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => handleDeleteVideo(vid)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <p className="mt-4 text-xs text-muted-foreground">
            Máximo 50MB por vídeo. Formatos aceitos: MP4, MOV, WebM.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
