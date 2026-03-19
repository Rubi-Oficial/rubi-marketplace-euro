import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Upload, Trash2, GripVertical, ImageIcon } from "lucide-react";

interface ProfileImage {
  id: string;
  storage_path: string;
  moderation_status: "pending" | "approved" | "rejected";
  sort_order: number;
  url: string;
}

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendente", variant: "outline" },
  approved: { label: "Aprovada", variant: "default" },
  rejected: { label: "Rejeitada", variant: "destructive" },
};

export default function EscortPhotos() {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [images, setImages] = useState<ProfileImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchImages = async (pid: string) => {
    const { data } = await supabase
      .from("profile_images")
      .select("*")
      .eq("profile_id", pid)
      .order("sort_order");

    if (data) {
      const mapped = data.map((img) => ({
        ...img,
        moderation_status: img.moderation_status as ProfileImage["moderation_status"],
        url: supabase.storage.from("profile-images").getPublicUrl(img.storage_path).data.publicUrl,
      }));
      setImages(mapped);
    }
  };

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("id").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setProfileId(data.id);
          fetchImages(data.id);
        }
        setLoading(false);
      });
  }, [user]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user || !profileId) return;

    setUploading(true);
    const maxOrder = images.length > 0 ? Math.max(...images.map((i) => i.sort_order)) : -1;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} não é uma imagem.`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} excede 5MB.`);
        continue;
      }

      const ext = file.name.split(".").pop();
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-images")
        .upload(path, file, { cacheControl: "3600", upsert: false });

      if (uploadError) {
        toast.error("Erro no upload: " + uploadError.message);
        continue;
      }

      const { error: dbError } = await supabase.from("profile_images").insert({
        profile_id: profileId,
        storage_path: path,
        sort_order: maxOrder + 1 + i,
      });

      if (dbError) {
        toast.error("Erro ao salvar imagem: " + dbError.message);
      }
    }

    await fetchImages(profileId);
    setUploading(false);
    toast.success("Upload concluído!");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleDelete = async (img: ProfileImage) => {
    const { error: storageError } = await supabase.storage
      .from("profile-images")
      .remove([img.storage_path]);

    if (storageError) {
      toast.error("Erro ao excluir arquivo: " + storageError.message);
      return;
    }

    const { error: dbError } = await supabase
      .from("profile_images")
      .delete()
      .eq("id", img.id);

    if (dbError) {
      toast.error("Erro ao excluir registro: " + dbError.message);
      return;
    }

    setImages((prev) => prev.filter((i) => i.id !== img.id));
    toast.success("Foto removida.");
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
        <p className="text-muted-foreground">Crie seu perfil antes de adicionar fotos.</p>
      </div>
    );
  }

  const approvedCount = images.filter((i) => i.moderation_status === "approved").length;
  const pendingCount = images.filter((i) => i.moderation_status === "pending").length;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Fotos</h1>
          <p className="mt-1 text-muted-foreground">
            {images.length} foto(s) • {approvedCount} aprovada(s) • {pendingCount} pendente(s)
          </p>
        </div>
        <div>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
            onChange={handleUpload} />
          <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
            <Upload className="mr-1.5 h-4 w-4" />
            {uploading ? "Enviando..." : "Enviar fotos"}
          </Button>
        </div>
      </div>

      {images.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-16">
          <ImageIcon className="h-12 w-12 text-muted-foreground/40" />
          <p className="mt-4 text-muted-foreground">Nenhuma foto ainda.</p>
          <Button variant="outline" className="mt-4" onClick={() => fileRef.current?.click()}>
            <Upload className="mr-1.5 h-4 w-4" /> Enviar primeira foto
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((img) => {
            const badge = STATUS_BADGE[img.moderation_status] || STATUS_BADGE.pending;
            return (
              <div key={img.id} className="group relative overflow-hidden rounded-lg border border-border bg-card">
                <div className="aspect-[3/4] w-full">
                  <img src={img.url} alt="Foto do perfil" loading="lazy"
                    className="h-full w-full object-cover" />
                </div>
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-background/90 to-transparent p-3 pt-8">
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                  <Button variant="destructive" size="icon" className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => handleDelete(img)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-6 text-xs text-muted-foreground">
        Máximo 5MB por foto. Formatos aceitos: JPG, PNG, WebP. Fotos passam por moderação antes de ficarem visíveis.
      </p>
    </div>
  );
}
