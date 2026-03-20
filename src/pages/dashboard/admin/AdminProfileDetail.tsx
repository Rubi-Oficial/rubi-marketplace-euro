import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { compressImage } from "@/lib/imageCompression";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy, useSortable, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowLeft, CheckCircle, XCircle, Pause, Play, Pencil, Save, X,
  Trash2, Upload, Star, Clock, Mail, Phone, User, Calendar,
  ImageIcon, Video, GripVertical,
} from "lucide-react";

/* ───────── types ───────── */
interface ProfileData {
  id: string;
  user_id: string;
  display_name: string | null;
  city: string | null;
  city_slug: string | null;
  country: string | null;
  country_slug: string | null;
  category: string | null;
  gender: string | null;
  bio: string | null;
  age: number | null;
  slug: string | null;
  status: string;
  is_featured: boolean;
  featured_until: string | null;
  pricing_from: number | null;
  languages: string[] | null;
  whatsapp: string | null;
  telegram: string | null;
  created_at: string;
  updated_at: string;
}

interface MediaItem {
  id: string;
  storage_path: string;
  moderation_status: string;
  sort_order: number;
  url: string;
  duration_seconds?: number | null;
  thumbnail_path?: string | null;
  thumbnail_url?: string | null;
}

interface AdminAction {
  id: string;
  action_type: string;
  notes: string | null;
  created_at: string;
  admin_user_id: string;
}

interface UserInfo {
  email: string;
  full_name: string | null;
}

/* ───────── constants ───────── */
const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Rascunho", variant: "secondary" },
  pending_review: { label: "Em análise", variant: "outline" },
  approved: { label: "Aprovado", variant: "default" },
  rejected: { label: "Rejeitado", variant: "destructive" },
  paused: { label: "Pausado", variant: "secondary" },
};

const GENDER_OPTIONS = ["Women", "Men", "Couples", "Shemales", "Gay", "Virtual Sex"];
const CATEGORY_OPTIONS = ["Premium", "Elite", "Companion", "Events"];

const MOD_BADGE: Record<string, { label: string; variant: "default" | "destructive" | "outline" }> = {
  approved: { label: "Aprovada", variant: "default" },
  rejected: { label: "Rejeitada", variant: "destructive" },
  pending: { label: "Pendente", variant: "outline" },
};

/* ───────── helpers ───────── */
function formatDuration(s: number | null | undefined) {
  if (!s) return "";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

/* ───────── component ───────── */
export default function AdminProfileDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [images, setImages] = useState<MediaItem[]>([]);
  const [videos, setVideos] = useState<MediaItem[]>([]);
  const [services, setServices] = useState<string[]>([]);
  const [actions, setActions] = useState<AdminAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [acting, setActing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<ProfileData>>({});
  const [uploading, setUploading] = useState(false);

  const imgInputRef = useRef<HTMLInputElement>(null);
  const vidInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (id) loadAll();
  }, [id]);

  /* ── data fetching ── */
  const loadAll = useCallback(async () => {
    if (!id) return;
    setLoading(true);

    const [pRes, imgRes, vidRes, psRes, actRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", id).single(),
      supabase.from("profile_images").select("*").eq("profile_id", id).order("sort_order"),
      supabase.from("profile_videos").select("*").eq("profile_id", id).order("sort_order"),
      supabase.from("profile_services").select("service_id, services!inner(name)").eq("profile_id", id),
      supabase.from("admin_actions").select("*").eq("target_profile_id", id).order("created_at", { ascending: false }).limit(20),
    ]);

    if (pRes.data) {
      setProfile(pRes.data as any);
      setEditForm(pRes.data as any);
      // fetch user info
      const { data: u } = await supabase.from("users").select("email, full_name").eq("id", (pRes.data as any).user_id).single();
      if (u) setUserInfo(u as UserInfo);
    }

    if (imgRes.data) {
      setImages(imgRes.data.map((img: any) => ({
        ...img,
        url: supabase.storage.from("profile-images").getPublicUrl(img.storage_path).data.publicUrl,
      })));
    }

    if (vidRes.data) {
      setVideos(vidRes.data.map((v: any) => ({
        ...v,
        url: supabase.storage.from("profile-images").getPublicUrl(v.storage_path).data.publicUrl,
        thumbnail_url: v.thumbnail_path
          ? supabase.storage.from("profile-images").getPublicUrl(v.thumbnail_path).data.publicUrl
          : null,
      })));
    }

    if (psRes.data) setServices(psRes.data.map((r: any) => r.services?.name || "Unknown"));
    if (actRes.data) setActions(actRes.data as AdminAction[]);

    setLoading(false);
  }, [id]);

  /* ── status action ── */
  const handleAction = async (newStatus: string) => {
    if (!profile) return;
    setActing(true);
    const { error } = await supabase.from("profiles").update({ status: newStatus as any }).eq("id", profile.id);
    if (error) { toast.error(error.message); setActing(false); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("admin_actions").insert({
        admin_user_id: user.id, action_type: `profile_${newStatus}`,
        target_profile_id: profile.id, target_user_id: profile.user_id,
        notes: note.trim() || null,
      });
    }
    toast.success(`Status alterado para ${STATUS_MAP[newStatus]?.label || newStatus}.`);
    setNote(""); setActing(false);
    loadAll();
  };

  /* ── save edit ── */
  const handleSaveEdit = async () => {
    if (!profile) return;
    setActing(true);
    const updates: any = {
      display_name: editForm.display_name, age: editForm.age ? Number(editForm.age) : null,
      city: editForm.city, city_slug: editForm.city_slug, country: editForm.country,
      country_slug: editForm.country_slug, category: editForm.category, gender: editForm.gender,
      slug: editForm.slug, pricing_from: editForm.pricing_from ? Number(editForm.pricing_from) : null,
      bio: editForm.bio, whatsapp: editForm.whatsapp, telegram: editForm.telegram,
      languages: editForm.languages, is_featured: editForm.is_featured,
      featured_until: editForm.featured_until || null,
    };
    const { error } = await supabase.from("profiles").update(updates).eq("id", profile.id);
    if (error) { toast.error(error.message); setActing(false); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("admin_actions").insert({
        admin_user_id: user.id, action_type: "profile_edited",
        target_profile_id: profile.id, target_user_id: profile.user_id,
        notes: "Perfil editado pelo admin.",
      });
    }
    toast.success("Perfil atualizado com sucesso.");
    setEditing(false); setActing(false);
    loadAll();
  };

  /* ── image moderation ── */
  const handleImageModeration = async (imageId: string, status: "approved" | "rejected") => {
    const { error } = await supabase.from("profile_images").update({ moderation_status: status }).eq("id", imageId);
    if (error) { toast.error(error.message); return; }
    toast.success(`Foto ${status === "approved" ? "aprovada" : "rejeitada"}.`);
    loadAll();
  };

  /* ── video moderation ── */
  const handleVideoModeration = async (videoId: string, status: "approved" | "rejected") => {
    const { error } = await supabase.from("profile_videos").update({ moderation_status: status }).eq("id", videoId);
    if (error) { toast.error(error.message); return; }
    toast.success(`Vídeo ${status === "approved" ? "aprovado" : "rejeitado"}.`);
    loadAll();
  };

  /* ── delete image ── */
  const handleDeleteImage = async (img: MediaItem) => {
    await supabase.storage.from("profile-images").remove([img.storage_path]);
    const { error } = await supabase.from("profile_images").delete().eq("id", img.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Foto removida.");
    loadAll();
  };

  /* ── delete video ── */
  const handleDeleteVideo = async (vid: MediaItem) => {
    const paths = [vid.storage_path];
    if (vid.thumbnail_path) paths.push(vid.thumbnail_path);
    await supabase.storage.from("profile-images").remove(paths);
    const { error } = await supabase.from("profile_videos").delete().eq("id", vid.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Vídeo removido.");
    loadAll();
  };

  /* ── upload images ── */
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!profile || !e.target.files?.length) return;
    const files = Array.from(e.target.files);
    if (images.length + files.length > 10) {
      toast.error("Máximo de 10 fotos.");
      return;
    }
    setUploading(true);
    for (const file of files) {
      if (file.size > 2 * 1024 * 1024) { toast.error(`${file.name} excede 2MB.`); continue; }
      const compressed = await compressImage(file);
      const path = `${profile.slug || profile.id}/${Date.now()}-${compressed.name}`;
      const { error: upErr } = await supabase.storage.from("profile-images").upload(path, compressed);
      if (upErr) { toast.error(upErr.message); continue; }
      await supabase.from("profile_images").insert({
        profile_id: profile.id, storage_path: path, sort_order: images.length,
      });
    }
    setUploading(false);
    e.target.value = "";
    toast.success("Upload concluído.");
    loadAll();
  };

  /* ── upload video ── */
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!profile || !e.target.files?.[0]) return;
    if (videos.length >= 1) { toast.error("Máximo de 1 vídeo."); return; }
    const file = e.target.files[0];
    if (file.size > 100 * 1024 * 1024) { toast.error("Vídeo excede 100MB."); return; }
    setUploading(true);
    const path = `${profile.slug || profile.id}/video-${Date.now()}.mp4`;
    const { error: upErr } = await supabase.storage.from("profile-images").upload(path, file);
    if (upErr) { toast.error(upErr.message); setUploading(false); return; }
    await supabase.from("profile_videos").insert({
      profile_id: profile.id, storage_path: path, sort_order: 0,
    });
    setUploading(false);
    e.target.value = "";
    toast.success("Vídeo enviado.");
    loadAll();
  };

  /* ── toggle featured ── */
  const toggleFeatured = async () => {
    if (!profile) return;
    const newVal = !profile.is_featured;
    const { error } = await supabase.from("profiles").update({ is_featured: newVal }).eq("id", profile.id);
    if (error) { toast.error(error.message); return; }
    toast.success(newVal ? "Destaque ativado." : "Destaque removido.");
    loadAll();
  };

  /* ── reorder persist ── */
  const persistOrder = useCallback(async (table: "profile_images" | "profile_videos", items: MediaItem[]) => {
    const updates = items.map((item, idx) =>
      supabase.from(table).update({ sort_order: idx }).eq("id", item.id)
    );
    await Promise.all(updates);
  }, []);

  const handleReorderImages = useCallback((reordered: MediaItem[]) => {
    setImages(reordered);
    persistOrder("profile_images", reordered);
  }, [persistOrder]);

  const handleReorderVideos = useCallback((reordered: MediaItem[]) => {
    setVideos(reordered);
    persistOrder("profile_videos", reordered);
  }, [persistOrder]);

  const startEditing = () => { setEditForm({ ...profile } as any); setEditing(true); };
  const updateField = (field: string, value: any) => setEditForm(prev => ({ ...prev, [field]: value }));

  /* ── loading / not found ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Perfil não encontrado.</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate("/admin/perfis")}>Voltar</Button>
      </div>
    );
  }

  const statusInfo = STATUS_MAP[profile.status] || STATUS_MAP.draft;

  return (
    <div className="animate-fade-in space-y-6 pb-10">
      {/* ─── Header ─── */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/perfis")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-2xl font-bold text-foreground truncate">
            {profile.display_name || "Sem nome"}
          </h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Criado em {new Date(profile.created_at).toLocaleDateString("pt-BR")}
            {userInfo?.email && (
              <span className="ml-3 flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" /> {userInfo.email}
              </span>
            )}
          </p>
        </div>
        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
        <Button variant="outline" size="sm" onClick={toggleFeatured} className={profile.is_featured ? "text-amber-500" : ""}>
          <Star className={`mr-1.5 h-3.5 w-3.5 ${profile.is_featured ? "fill-current" : ""}`} />
          {profile.is_featured ? "Destaque" : "Destacar"}
        </Button>
        {!editing ? (
          <Button variant="outline" size="sm" onClick={startEditing}>
            <Pencil className="mr-1.5 h-3.5 w-3.5" /> Editar
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSaveEdit} disabled={acting}>
              <Save className="mr-1.5 h-3.5 w-3.5" /> Salvar
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
              <X className="mr-1.5 h-3.5 w-3.5" /> Cancelar
            </Button>
          </div>
        )}
      </div>

      {/* ─── Media Tabs ─── */}
      <div className="rounded-lg border border-border bg-card p-4">
        <Tabs defaultValue="photos">
          <div className="flex items-center justify-between mb-3">
            <TabsList>
              <TabsTrigger value="photos" className="gap-1.5"><ImageIcon className="h-3.5 w-3.5" /> Fotos ({images.length})</TabsTrigger>
              <TabsTrigger value="videos" className="gap-1.5"><Video className="h-3.5 w-3.5" /> Vídeos ({videos.length})</TabsTrigger>
            </TabsList>
            <div className="flex gap-2">
              <input ref={imgInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
              <input ref={vidInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
              <Button size="sm" variant="outline" disabled={uploading} onClick={() => imgInputRef.current?.click()}>
                <Upload className="mr-1.5 h-3.5 w-3.5" /> Foto
              </Button>
              <Button size="sm" variant="outline" disabled={uploading || videos.length >= 1} onClick={() => vidInputRef.current?.click()}>
                <Upload className="mr-1.5 h-3.5 w-3.5" /> Vídeo
              </Button>
            </div>
          </div>

          {uploading && (
            <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" /> Enviando...
            </div>
          )}

          <TabsContent value="photos">
            {images.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma foto.</p>
            ) : (
              <DndMediaGrid items={images} onReorder={handleReorderImages} type="image"
                onModerate={(id, s) => handleImageModeration(id, s)}
                onDelete={(item) => handleDeleteImage(item)}
              />
            )}
          </TabsContent>

          <TabsContent value="videos">
            {videos.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Nenhum vídeo.</p>
            ) : (
              <DndMediaGrid items={videos} onReorder={handleReorderVideos} type="video"
                onModerate={(id, s) => handleVideoModeration(id, s)}
                onDelete={(item) => handleDeleteVideo(item)}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* ─── Details Grid ─── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Details */}
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h2 className="font-display text-lg font-semibold text-foreground">Detalhes</h2>
          {editing ? (
            <div className="grid grid-cols-2 gap-3">
              <EditField label="Nome" value={editForm.display_name ?? ""} onChange={v => updateField("display_name", v)} />
              <EditField label="Idade" value={String(editForm.age ?? "")} onChange={v => updateField("age", v)} type="number" />
              <EditField label="Cidade" value={editForm.city ?? ""} onChange={v => updateField("city", v)} />
              <EditField label="City Slug" value={editForm.city_slug ?? ""} onChange={v => updateField("city_slug", v)} />
              <EditField label="País" value={editForm.country ?? ""} onChange={v => updateField("country", v)} />
              <EditField label="Country Slug" value={editForm.country_slug ?? ""} onChange={v => updateField("country_slug", v)} />
              <div>
                <label className="text-xs text-muted-foreground">Gênero</label>
                <Select value={editForm.gender ?? ""} onValueChange={v => updateField("gender", v)}>
                  <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GENDER_OPTIONS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Categoria</label>
                <Select value={editForm.category ?? ""} onValueChange={v => updateField("category", v)}>
                  <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <EditField label="Slug" value={editForm.slug ?? ""} onChange={v => updateField("slug", v)} />
              <EditField label="Preço a partir de" value={String(editForm.pricing_from ?? "")} onChange={v => updateField("pricing_from", v)} type="number" />
              <div className="col-span-2">
                <EditField label="Idiomas (separados por vírgula)" value={(editForm.languages ?? []).join(", ")} onChange={v => updateField("languages", v.split(",").map(s => s.trim()).filter(Boolean))} />
              </div>
              <div className="col-span-2 flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Switch checked={editForm.is_featured ?? false} onCheckedChange={v => updateField("is_featured", v)} />
                  <label className="text-xs text-muted-foreground">Destaque</label>
                </div>
                <EditField label="Destaque até" value={editForm.featured_until ? editForm.featured_until.slice(0, 10) : ""} onChange={v => updateField("featured_until", v || null)} type="date" />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Detail label="Nome" value={profile.display_name} />
              <Detail label="Idade" value={profile.age?.toString()} />
              <Detail label="Cidade" value={profile.city} />
              <Detail label="País" value={profile.country} />
              <Detail label="Gênero" value={profile.gender} />
              <Detail label="Categoria" value={profile.category} />
              <Detail label="Slug" value={profile.slug} />
              <Detail label="Preço a partir de" value={profile.pricing_from ? `€${profile.pricing_from}` : null} />
              <Detail label="Idiomas" value={profile.languages?.join(", ")} />
              <Detail label="Destaque" value={profile.is_featured ? "Sim" : "Não"} />
              <Detail label="Destaque até" value={profile.featured_until ? new Date(profile.featured_until).toLocaleDateString("pt-BR") : null} />
              <Detail label="Atualizado" value={new Date(profile.updated_at).toLocaleDateString("pt-BR")} />
            </div>
          )}
        </div>

        {/* Contact & Services */}
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h2 className="font-display text-lg font-semibold text-foreground">Contato & Serviços</h2>
          {editing ? (
            <div className="grid grid-cols-2 gap-3">
              <EditField label="WhatsApp" value={editForm.whatsapp ?? ""} onChange={v => updateField("whatsapp", v)} />
              <EditField label="Telegram" value={editForm.telegram ?? ""} onChange={v => updateField("telegram", v)} />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Detail label="Email" value={userInfo?.email} icon={<Mail className="h-3.5 w-3.5" />} />
              <Detail label="Nome completo" value={userInfo?.full_name} icon={<User className="h-3.5 w-3.5" />} />
              <Detail label="WhatsApp" value={profile.whatsapp} icon={<Phone className="h-3.5 w-3.5" />} />
              <Detail label="Telegram" value={profile.telegram} />
            </div>
          )}
          {services.length > 0 && (
            <div className="pt-2">
              <p className="text-xs font-medium text-muted-foreground mb-2">Serviços</p>
              <div className="flex flex-wrap gap-1.5">
                {services.map(s => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Bio ─── */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="font-display text-lg font-semibold text-foreground mb-2">Bio</h2>
        {editing ? (
          <Textarea value={editForm.bio ?? ""} onChange={e => updateField("bio", e.target.value)} rows={4} />
        ) : (
          <p className="text-sm text-foreground whitespace-pre-wrap">{profile.bio || "—"}</p>
        )}
      </div>

      {/* ─── Admin Actions Log ─── */}
      {actions.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="font-display text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4" /> Histórico de Ações
          </h2>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {actions.map(a => (
              <div key={a.id} className="flex items-start gap-3 text-sm border-b border-border/50 pb-2 last:border-0">
                <span className="text-muted-foreground text-xs whitespace-nowrap mt-0.5">
                  {new Date(a.created_at).toLocaleDateString("pt-BR")} {new Date(a.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </span>
                <Badge variant="outline" className="text-[10px] shrink-0">{a.action_type}</Badge>
                {a.notes && <span className="text-foreground">{a.notes}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Status Actions ─── */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <h2 className="font-display text-lg font-semibold text-foreground">Ações</h2>
        <Textarea placeholder="Nota interna (opcional)..." value={note} onChange={e => setNote(e.target.value)} rows={2} />
        <div className="flex flex-wrap gap-3">
          {profile.status !== "approved" && (
            <Button onClick={() => handleAction("approved")} disabled={acting}>
              <CheckCircle className="mr-1.5 h-4 w-4" /> Aprovar
            </Button>
          )}
          {profile.status !== "rejected" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={acting}>
                  <XCircle className="mr-1.5 h-4 w-4" /> Rejeitar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Rejeitar perfil?</AlertDialogTitle>
                  <AlertDialogDescription>Esta ação vai rejeitar o perfil "{profile.display_name}". O profissional será notificado.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleAction("rejected")}>Confirmar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {profile.status === "approved" && (
            <Button variant="outline" onClick={() => handleAction("paused")} disabled={acting}>
              <Pause className="mr-1.5 h-4 w-4" /> Pausar
            </Button>
          )}
          {profile.status === "paused" && (
            <Button variant="outline" onClick={() => handleAction("approved")} disabled={acting}>
              <Play className="mr-1.5 h-4 w-4" /> Reativar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ───────── sub-components ───────── */

function Detail({ label, value, icon }: { label: string; value?: string | null; icon?: React.ReactNode }) {
  return (
    <div>
      <span className="text-muted-foreground text-xs flex items-center gap-1">{icon}{label}</span>
      <p className="text-foreground text-sm font-medium">{value || "—"}</p>
    </div>
  );
}

function EditField({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground">{label}</label>
      <Input className="h-9 text-sm mt-1" type={type} value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );
}

/* ── DnD Media Grid ── */
function DndMediaGrid({ items, onReorder, type, onModerate, onDelete }: {
  items: MediaItem[]; onReorder: (items: MediaItem[]) => void; type: "image" | "video";
  onModerate: (id: string, s: "approved" | "rejected") => void;
  onDelete: (item: MediaItem) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = items.findIndex(i => i.id === active.id);
    const newIdx = items.findIndex(i => i.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;
    const reordered = [...items];
    const [moved] = reordered.splice(oldIdx, 1);
    reordered.splice(newIdx, 0, moved);
    onReorder(reordered.map((item, idx) => ({ ...item, sort_order: idx })));
  };

  const gridCols = type === "image"
    ? "grid-cols-3 sm:grid-cols-4 lg:grid-cols-6"
    : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4";

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map(i => i.id)} strategy={rectSortingStrategy}>
        <div className={`grid gap-3 ${gridCols}`}>
          {items.map((item, idx) => (
            <SortableMediaCard key={item.id} item={item} type={type} index={idx}
              onModerate={s => onModerate(item.id, s)} onDelete={() => onDelete(item)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

/* ── Sortable Media Card ── */
function SortableMediaCard({ item, type, index, onModerate, onDelete }: {
  item: MediaItem; type: "image" | "video"; index: number;
  onModerate: (s: "approved" | "rejected") => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, zIndex: isDragging ? 50 : 0 };
  const mod = MOD_BADGE[item.moderation_status] || MOD_BADGE.pending;

  return (
    <div ref={setNodeRef} style={style} className="group relative aspect-[3/4] overflow-hidden rounded-lg bg-muted">
      {/* Drag handle */}
      <button {...attributes} {...listeners}
        className="absolute top-1 left-1 z-20 flex h-6 w-6 items-center justify-center rounded bg-background/80 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        aria-label="Arrastar"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>

      {type === "image" ? (
        <img src={item.url} alt="Mídia" className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <>
          {item.thumbnail_url ? (
            <img src={item.thumbnail_url} alt="Thumbnail" className="h-full w-full object-cover" />
          ) : (
            <video src={item.url} className="h-full w-full object-cover" muted preload="metadata" />
          )}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="rounded-full bg-black/50 p-2"><Play className="h-5 w-5 text-white fill-white" /></div>
          </div>
          {item.duration_seconds != null && (
            <span className="absolute top-8 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
              {formatDuration(item.duration_seconds)}
            </span>
          )}
        </>
      )}

      {/* Cover badge */}
      {index === 0 && type === "image" && (
        <span className="absolute top-8 left-1 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded font-medium">Capa</span>
      )}

      {/* Moderation badge */}
      <div className="absolute bottom-1 right-1">
        <Badge variant={mod.variant} className="text-[10px]">{mod.label}</Badge>
      </div>

      {/* Hover actions */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors pointer-events-none" />
      <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        {item.moderation_status !== "approved" && (
          <button onClick={() => onModerate("approved")} className="rounded-full bg-green-600 p-1 text-white hover:bg-green-700 transition-colors" title="Aprovar">
            <CheckCircle className="h-3.5 w-3.5" />
          </button>
        )}
        {item.moderation_status !== "rejected" && (
          <button onClick={() => onModerate("rejected")} className="rounded-full bg-destructive p-1 text-white hover:bg-destructive/80 transition-colors" title="Rejeitar">
            <XCircle className="h-3.5 w-3.5" />
          </button>
        )}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="rounded-full bg-black/60 p-1 text-white hover:bg-black/80 transition-colors" title="Excluir">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir {type === "image" ? "foto" : "vídeo"}?</AlertDialogTitle>
              <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete}>Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
