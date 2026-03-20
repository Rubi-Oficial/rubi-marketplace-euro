import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, ImageIcon, Film } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SortableMediaGrid } from "@/components/media/SortableMediaGrid";
import type { MediaItem } from "@/components/media/SortableMediaItem";

export default function EscortPhotos() {
  const { user } = useAuth();
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [images, setImages] = useState<MediaItem[]>([]);
  const [videos, setVideos] = useState<MediaItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchMedia = useCallback(async (pid: string) => {
    const [{ data: imgData }, { data: vidData }] = await Promise.all([
      supabase.from("profile_images").select("*").eq("profile_id", pid).order("sort_order"),
      supabase.from("profile_videos").select("*").eq("profile_id", pid).order("sort_order"),
    ]);

    if (imgData) {
      setImages(imgData.map((img) => ({
        ...img,
        moderation_status: img.moderation_status as MediaItem["moderation_status"],
        url: supabase.storage.from("profile-images").getPublicUrl(img.storage_path).data.publicUrl,
        type: "image" as const,
      })));
    }

    if (vidData) {
      setVideos(vidData.map((v) => ({
        ...v,
        moderation_status: v.moderation_status as MediaItem["moderation_status"],
        url: supabase.storage.from("profile-images").getPublicUrl(v.storage_path).data.publicUrl,
        type: "video" as const,
        duration_seconds: v.duration_seconds ?? undefined,
      })));
    }
  }, []);

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
  }, [user, fetchMedia]);

  // ── Persist sort order ──
  const persistOrder = useCallback(async (items: MediaItem[], table: "profile_images" | "profile_videos") => {
    const updates = items.map((item) =>
      supabase.from(table).update({ sort_order: item.sort_order }).eq("id", item.id)
    );
    const results = await Promise.all(updates);
    const failed = results.filter((r) => r.error);
    if (failed.length) toast.error("Erro ao salvar ordem.");
    else toast.success("Ordem atualizada!");
  }, []);

  const handleReorderImages = useCallback((reordered: MediaItem[]) => {
    setImages(reordered);
    persistOrder(reordered, "profile_images");
  }, [persistOrder]);

  const handleReorderVideos = useCallback((reordered: MediaItem[]) => {
    setVideos(reordered);
    persistOrder(reordered, "profile_videos");
  }, [persistOrder]);

  // ── Upload handlers ──
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

  // ── Delete handlers ──
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

  // ── Render ──
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
        Gerencie suas fotos e vídeos. Arraste para reordenar. Todo conteúdo passa por moderação.
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
            <SortableMediaGrid items={images} onReorder={handleReorderImages} onDelete={handleDeleteImage} />
          )}
          <p className="mt-4 text-xs text-muted-foreground">
            Máximo 5MB por foto. Formatos aceitos: JPG, PNG, WebP. Arraste os itens para reordenar.
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
            <SortableMediaGrid items={videos} onReorder={handleReorderVideos} onDelete={handleDeleteVideo} />
          )}
          <p className="mt-4 text-xs text-muted-foreground">
            Máximo 50MB por vídeo. Formatos aceitos: MP4, MOV, WebM. Arraste os itens para reordenar.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
