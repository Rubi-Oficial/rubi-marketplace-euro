import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { getSignedUrls } from "@/lib/storageUrls";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, ImageIcon, Film, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { SortableMediaGrid } from "@/components/media/SortableMediaGrid";
import { compressImage } from "@/lib/imageCompression";
import type { MediaItem } from "@/components/media/SortableMediaItem";
import { useLanguage } from "@/i18n/LanguageContext";

const MAX_IMAGES = 10;
const MAX_IMAGE_SIZE_MB = 2;
const MAX_VIDEOS = 1;
const MAX_VIDEO_SIZE_MB = 100;
const MAX_VIDEO_DURATION_S = 20;

function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    video.onerror = () => reject(new Error("Não foi possível ler o vídeo."));
    video.src = URL.createObjectURL(file);
  });
}

export default function EscortPhotos() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [images, setImages] = useState<MediaItem[]>([]);
  const [videos, setVideos] = useState<MediaItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadTotal, setUploadTotal] = useState(0);
  const [uploadCurrent, setUploadCurrent] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchMedia = useCallback(async (pid: string) => {
    try {
      const [{ data: imgData, error: imgErr }, { data: vidData, error: vidErr }] = await Promise.all([
        supabase.from("profile_images").select("*").eq("profile_id", pid).order("sort_order"),
        supabase.from("profile_videos").select("*").eq("profile_id", pid).order("sort_order"),
      ]);

      if (imgErr) console.error("[EscortPhotos] Failed to fetch images:", imgErr.message);
      if (vidErr) console.error("[EscortPhotos] Failed to fetch videos:", vidErr.message);

      const allPaths = [
        ...(imgData ?? []).map((img) => img.storage_path),
        ...(vidData ?? []).map((v) => v.storage_path),
      ];
      const urlMap = await getSignedUrls(allPaths);

      if (imgData) {
        setImages(imgData.map((img) => ({
          ...img,
          moderation_status: img.moderation_status as MediaItem["moderation_status"],
          url: urlMap[img.storage_path] || "",
          type: "image" as const,
        })));
      }

      if (vidData) {
        setVideos(vidData.map((v) => ({
          ...v,
          moderation_status: v.moderation_status as MediaItem["moderation_status"],
          url: urlMap[v.storage_path] || "",
          type: "video" as const,
          duration_seconds: v.duration_seconds ?? undefined,
        })));
      }
    } catch (err) {
      console.error("[EscortPhotos] Unexpected error fetching media:", err);
      toast.error("Erro ao carregar mídia. Tente recarregar a página.");
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const loadProfile = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles").select("id").eq("user_id", user.id).maybeSingle();
        if (error) {
          console.error("[EscortPhotos] Profile fetch error:", error.message);
          toast.error("Não foi possível carregar o perfil. Tente novamente.");
          setLoading(false);
          return;
        }
        if (data) {
          setProfileId(data.id);
          fetchMedia(data.id);
        }
        setLoading(false);
      } catch (err) {
        console.error("[EscortPhotos] Unexpected error:", err);
        toast.error("Ocorreu um erro inesperado. Tente novamente.");
        setLoading(false);
      }
    };
    loadProfile();
  }, [user, fetchMedia]);

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

    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      toast.error(`Limite de ${MAX_IMAGES} fotos atingido.`);
      if (imageRef.current) imageRef.current.value = "";
      return;
    }

    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) { toast.error(`${file.name} não é uma imagem.`); continue; }
      if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) { toast.error(`${file.name} excede ${MAX_IMAGE_SIZE_MB}MB.`); continue; }
      const compressed = await compressImage(file);
      validFiles.push(compressed);
    }

    const toUpload = validFiles.slice(0, remaining);
    if (validFiles.length > remaining) {
      toast.warning(`Apenas ${remaining} foto(s) serão enviadas (limite de ${MAX_IMAGES}).`);
    }
    if (toUpload.length === 0) { if (imageRef.current) imageRef.current.value = ""; return; }

    setUploading(true);
    setUploadTotal(toUpload.length);
    setUploadCurrent(0);
    setUploadProgress(0);

    const maxOrder = images.length > 0 ? Math.max(...images.map((i) => i.sort_order)) : -1;

    for (let i = 0; i < toUpload.length; i++) {
      const file = toUpload[i];
      setUploadCurrent(i + 1);
      setUploadProgress(Math.round(((i) / toUpload.length) * 100));

      const ext = file.name.split(".").pop();
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-images").upload(path, file, { cacheControl: "3600", upsert: false });
      if (uploadError) { toast.error("Erro no upload: " + uploadError.message); continue; }

      const { error: dbError } = await supabase.from("profile_images").insert({
        profile_id: profileId, storage_path: path, sort_order: maxOrder + 1 + i,
      });
      if (dbError) toast.error("Erro ao salvar imagem: " + dbError.message);

      setUploadProgress(Math.round(((i + 1) / toUpload.length) * 100));
    }

    await fetchMedia(profileId);
    setUploading(false);
    setUploadProgress(0);
    toast.success("Upload concluído!");
    if (imageRef.current) imageRef.current.value = "";
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user || !profileId) return;

    if (videos.length >= MAX_VIDEOS) {
      toast.error(`Limite de ${MAX_VIDEOS} vídeo atingido. Remova o atual antes de enviar outro.`);
      if (videoRef.current) videoRef.current.value = "";
      return;
    }

    const file = files[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) { toast.error(`${file.name} não é um vídeo.`); if (videoRef.current) videoRef.current.value = ""; return; }
    if (file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) { toast.error(`${file.name} excede ${MAX_VIDEO_SIZE_MB}MB.`); if (videoRef.current) videoRef.current.value = ""; return; }

    try {
      const duration = await getVideoDuration(file);
      if (duration > MAX_VIDEO_DURATION_S) {
        toast.error(`Vídeo tem ${Math.round(duration)}s — máximo permitido é ${MAX_VIDEO_DURATION_S}s.`);
        if (videoRef.current) videoRef.current.value = "";
        return;
      }
    } catch {
      toast.error("Não foi possível verificar a duração do vídeo.");
      if (videoRef.current) videoRef.current.value = "";
      return;
    }

    setUploading(true);
    setUploadTotal(1);
    setUploadCurrent(1);
    setUploadProgress(10);

    const ext = file.name.split(".").pop();
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("profile-images").upload(path, file, { cacheControl: "3600", upsert: false });

    if (uploadError) {
      toast.error("Erro no upload: " + uploadError.message);
      setUploading(false);
      setUploadProgress(0);
      if (videoRef.current) videoRef.current.value = "";
      return;
    }

    setUploadProgress(70);

    const { error: dbError } = await supabase.from("profile_videos").insert({
      profile_id: profileId, storage_path: path, sort_order: 0,
    });
    if (dbError) toast.error("Erro ao salvar vídeo: " + dbError.message);

    setUploadProgress(100);
    await fetchMedia(profileId);
    setUploading(false);
    setUploadProgress(0);
    toast.success("Upload de vídeo concluído!");
    if (videoRef.current) videoRef.current.value = "";
  };

  // ── Delete handlers ──
  const handleDeleteImage = async (item: MediaItem) => {
    try {
      await supabase.storage.from("profile-images").remove([item.storage_path]);
      const { error } = await supabase.from("profile_images").delete().eq("id", item.id);
      if (error) throw error;
      setImages((prev) => prev.filter((i) => i.id !== item.id));
      toast.success("Foto removida.");
    } catch (err) {
      console.error("[EscortPhotos] Delete image error:", err);
      toast.error("Erro ao remover foto. Tente novamente.");
    }
  };

  const handleDeleteVideo = async (item: MediaItem) => {
    try {
      await supabase.storage.from("profile-images").remove([item.storage_path]);
      const { error } = await supabase.from("profile_videos").delete().eq("id", item.id);
      if (error) throw error;
      setVideos((prev) => prev.filter((v) => v.id !== item.id));
      toast.success("Vídeo removido.");
    } catch (err) {
      console.error("[EscortPhotos] Delete video error:", err);
      toast.error("Erro ao remover vídeo. Tente novamente.");
    }
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
  const imageSlotsPct = (images.length / MAX_IMAGES) * 100;
  const videoSlotsPct = (videos.length / MAX_VIDEOS) * 100;

  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-2xl font-bold text-foreground">{t("photos.title")}</h1>
      <p className="mt-1 text-muted-foreground text-sm">
        Gerencie suas fotos e vídeos. Arraste para reordenar. Todo conteúdo passa por moderação.
      </p>

      {/* Upload progress bar */}
      {uploading && (
        <div className="mt-4 space-y-1.5 rounded-lg border border-border bg-muted/50 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground font-medium">Enviando {uploadCurrent} de {uploadTotal}...</span>
            <span className="text-muted-foreground">{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      <Tabs defaultValue="photos" className="mt-6">
        <TabsList>
          <TabsTrigger value="photos" className="gap-1.5">
            <ImageIcon className="h-3.5 w-3.5" />
            {t("photos.tab_photos", { count: String(images.length), max: String(MAX_IMAGES) })}
          </TabsTrigger>
          <TabsTrigger value="videos" className="gap-1.5">
            <Film className="h-3.5 w-3.5" />
            {t("photos.tab_videos", { count: String(videos.length), max: String(MAX_VIDEOS) })}
          </TabsTrigger>
        </TabsList>

        {/* Photos Tab */}
        <TabsContent value="photos" className="mt-4">
          {/* Slot usage bar */}
          <div className="mb-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{images.length} de {MAX_IMAGES} fotos utilizadas</span>
              <span>{approvedImages} aprovada(s) • {pendingImages} pendente(s)</span>
            </div>
            <Progress value={imageSlotsPct} className="h-1.5" />
            {images.length >= MAX_IMAGES && (
              <p className="flex items-center gap-1 text-xs text-destructive">
                <AlertCircle className="h-3 w-3" /> Limite atingido. Remova fotos para enviar novas.
              </p>
            )}
          </div>

          <div className="flex items-center justify-end mb-4">
            <input ref={imageRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
            <Button size="sm" onClick={() => imageRef.current?.click()} disabled={uploading || images.length >= MAX_IMAGES}>
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              {uploading ? "Enviando..." : "Enviar fotos"}
            </Button>
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
            Máximo {MAX_IMAGE_SIZE_MB}MB por foto • Até {MAX_IMAGES} fotos • JPG, PNG, WebP • Arraste para reordenar.
          </p>
        </TabsContent>

        {/* Videos Tab */}
        <TabsContent value="videos" className="mt-4">
          {/* Slot usage bar */}
          <div className="mb-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{videos.length} de {MAX_VIDEOS} vídeo utilizado</span>
              <span>{approvedVideos} aprovado(s) • {pendingVideos} pendente(s)</span>
            </div>
            <Progress value={videoSlotsPct} className="h-1.5" />
            {videos.length >= MAX_VIDEOS && (
              <p className="flex items-center gap-1 text-xs text-destructive">
                <AlertCircle className="h-3 w-3" /> Limite atingido. Remova o vídeo atual para enviar outro.
              </p>
            )}
          </div>

          <div className="flex items-center justify-end mb-4">
            <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
            <Button size="sm" onClick={() => videoRef.current?.click()} disabled={uploading || videos.length >= MAX_VIDEOS}>
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              {uploading ? "Enviando..." : "Enviar vídeo"}
            </Button>
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
            Máximo {MAX_VIDEO_SIZE_MB}MB • Até {MAX_VIDEO_DURATION_S}s de duração • {MAX_VIDEOS} vídeo • MP4, MOV, WebM.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
