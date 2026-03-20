import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ArrowLeft, CheckCircle, XCircle, Pause, Play, Pencil, Save, X, Trash2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  pricing_from: number | null;
  languages: string[] | null;
  whatsapp: string | null;
  telegram: string | null;
  created_at: string;
  updated_at: string;
}

interface ProfileImage {
  id: string;
  storage_path: string;
  moderation_status: string;
  sort_order: number;
  url: string;
}

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Rascunho", variant: "secondary" },
  pending_review: { label: "Em análise", variant: "outline" },
  approved: { label: "Aprovado", variant: "default" },
  rejected: { label: "Rejeitado", variant: "destructive" },
  paused: { label: "Pausado", variant: "secondary" },
};

const GENDER_OPTIONS = ["Women", "Men", "Couples", "Shemales", "Gay", "Virtual Sex"];
const CATEGORY_OPTIONS = ["Premium", "Elite", "Companion", "Events"];

export default function AdminProfileDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [images, setImages] = useState<ProfileImage[]>([]);
  const [services, setServices] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [acting, setActing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<ProfileData>>({});

  useEffect(() => {
    if (!id) return;
    loadProfile();
  }, [id]);

  const loadProfile = async () => {
    setLoading(true);
    const [{ data: profileData }, { data: imgData }, { data: psData }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", id!).single(),
      supabase.from("profile_images").select("*").eq("profile_id", id!).order("sort_order", { ascending: true }),
      supabase.from("profile_services").select("service_id, services!inner(name)").eq("profile_id", id!),
    ]);

    if (profileData) {
      setProfile(profileData as any);
      setEditForm(profileData as any);
    }
    if (imgData) {
      setImages(imgData.map((img: any) => ({
        ...img,
        url: supabase.storage.from("profile-images").getPublicUrl(img.storage_path).data.publicUrl,
      })));
    }
    if (psData) {
      setServices(psData.map((r: any) => r.services?.name || "Unknown"));
    }
    setLoading(false);
  };

  const handleAction = async (newStatus: string) => {
    if (!profile) return;
    setActing(true);
    const { error } = await supabase.from("profiles").update({ status: newStatus as any }).eq("id", profile.id);
    if (error) { toast.error(error.message); setActing(false); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("admin_actions").insert({
        admin_user_id: user.id,
        action_type: `profile_${newStatus}`,
        target_profile_id: profile.id,
        target_user_id: profile.user_id,
        notes: note.trim() || null,
      });
    }
    toast.success(`Status alterado para ${STATUS_MAP[newStatus]?.label || newStatus}.`);
    setNote("");
    setActing(false);
    loadProfile();
  };

  const handleSaveEdit = async () => {
    if (!profile) return;
    setActing(true);
    const updates: any = {
      display_name: editForm.display_name,
      age: editForm.age ? Number(editForm.age) : null,
      city: editForm.city,
      city_slug: editForm.city_slug,
      country: editForm.country,
      country_slug: editForm.country_slug,
      category: editForm.category,
      gender: editForm.gender,
      slug: editForm.slug,
      pricing_from: editForm.pricing_from ? Number(editForm.pricing_from) : null,
      bio: editForm.bio,
      whatsapp: editForm.whatsapp,
      telegram: editForm.telegram,
      languages: editForm.languages,
    };
    const { error } = await supabase.from("profiles").update(updates).eq("id", profile.id);
    if (error) { toast.error(error.message); setActing(false); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("admin_actions").insert({
        admin_user_id: user.id,
        action_type: "profile_edited",
        target_profile_id: profile.id,
        target_user_id: profile.user_id,
        notes: "Perfil editado pelo admin.",
      });
    }
    toast.success("Perfil atualizado com sucesso.");
    setEditing(false);
    setActing(false);
    loadProfile();
  };

  const handleImageModeration = async (imageId: string, status: "approved" | "rejected") => {
    const { error } = await supabase.from("profile_images").update({ moderation_status: status }).eq("id", imageId);
    if (error) { toast.error(error.message); return; }
    toast.success(`Foto ${status === "approved" ? "aprovada" : "rejeitada"}.`);
    loadProfile();
  };

  const handleDeleteImage = async (image: ProfileImage) => {
    const { error: storageErr } = await supabase.storage.from("profile-images").remove([image.storage_path]);
    if (storageErr) { toast.error(storageErr.message); return; }
    const { error } = await supabase.from("profile_images").delete().eq("id", image.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Foto removida.");
    loadProfile();
  };

  const startEditing = () => {
    setEditForm({ ...profile } as any);
    setEditing(true);
  };

  const updateField = (field: string, value: any) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

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
        <Button variant="ghost" className="mt-4" onClick={() => navigate("/admin/perfis")}>
          Voltar
        </Button>
      </div>
    );
  }

  const statusInfo = STATUS_MAP[profile.status] || STATUS_MAP.draft;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/perfis")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold text-foreground">
            {profile.display_name || "Sem nome"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Criado em {new Date(profile.created_at).toLocaleDateString("pt-BR")}
          </p>
        </div>
        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
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

      {/* Images with moderation */}
      {images.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="font-display text-lg font-semibold text-foreground mb-3">Fotos</h2>
          <div className="grid gap-3 grid-cols-3 sm:grid-cols-4 lg:grid-cols-6">
            {images.map((img) => (
              <div key={img.id} className="group relative aspect-[3/4] overflow-hidden rounded-lg bg-muted">
                <img src={img.url} alt="Foto do perfil" className="h-full w-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
                <div className="absolute bottom-1 right-1">
                  <Badge
                    variant={img.moderation_status === "approved" ? "default" : img.moderation_status === "rejected" ? "destructive" : "outline"}
                    className="text-[10px]"
                  >
                    {img.moderation_status === "approved" ? "Aprovada" : img.moderation_status === "rejected" ? "Rejeitada" : "Pendente"}
                  </Badge>
                </div>
                {/* Moderation buttons on hover */}
                <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {img.moderation_status !== "approved" && (
                    <button
                      onClick={() => handleImageModeration(img.id, "approved")}
                      className="rounded-full bg-green-600 p-1 text-white hover:bg-green-700 transition-colors"
                      title="Aprovar foto"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {img.moderation_status !== "rejected" && (
                    <button
                      onClick={() => handleImageModeration(img.id, "rejected")}
                      className="rounded-full bg-destructive p-1 text-white hover:bg-destructive/80 transition-colors"
                      title="Rejeitar foto"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteImage(img)}
                    className="rounded-full bg-black/60 p-1 text-white hover:bg-black/80 transition-colors"
                    title="Excluir foto"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Profile details — view or edit mode */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h2 className="font-display text-lg font-semibold text-foreground">Detalhes</h2>
          {editing ? (
            <div className="grid grid-cols-2 gap-3">
              <EditField label="Nome" value={editForm.display_name ?? ""} onChange={(v) => updateField("display_name", v)} />
              <EditField label="Idade" value={String(editForm.age ?? "")} onChange={(v) => updateField("age", v)} type="number" />
              <EditField label="Cidade" value={editForm.city ?? ""} onChange={(v) => updateField("city", v)} />
              <EditField label="City Slug" value={editForm.city_slug ?? ""} onChange={(v) => updateField("city_slug", v)} />
              <EditField label="País" value={editForm.country ?? ""} onChange={(v) => updateField("country", v)} />
              <EditField label="Country Slug" value={editForm.country_slug ?? ""} onChange={(v) => updateField("country_slug", v)} />
              <div>
                <label className="text-xs text-muted-foreground">Gênero</label>
                <Select value={editForm.gender ?? ""} onValueChange={(v) => updateField("gender", v)}>
                  <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GENDER_OPTIONS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Categoria</label>
                <Select value={editForm.category ?? ""} onValueChange={(v) => updateField("category", v)}>
                  <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <EditField label="Slug" value={editForm.slug ?? ""} onChange={(v) => updateField("slug", v)} />
              <EditField label="Preço a partir de" value={String(editForm.pricing_from ?? "")} onChange={(v) => updateField("pricing_from", v)} type="number" />
              <div className="col-span-2">
                <EditField label="Idiomas (separados por vírgula)" value={(editForm.languages ?? []).join(", ")} onChange={(v) => updateField("languages", v.split(",").map((s) => s.trim()).filter(Boolean))} />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Detail label="Nome" value={profile.display_name} />
              <Detail label="Idade" value={profile.age?.toString()} />
              <Detail label="Cidade" value={profile.city} />
              <Detail label="City Slug" value={profile.city_slug} />
              <Detail label="País" value={profile.country} />
              <Detail label="Gênero" value={profile.gender} />
              <Detail label="Categoria" value={profile.category} />
              <Detail label="Slug" value={profile.slug} />
              <Detail label="Preço a partir de" value={profile.pricing_from ? `€${profile.pricing_from}` : null} />
              <Detail label="Idiomas" value={profile.languages?.join(", ")} />
              <Detail label="Destaque" value={profile.is_featured ? "Sim" : "Não"} />
            </div>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h2 className="font-display text-lg font-semibold text-foreground">Contato & Serviços</h2>
          {editing ? (
            <div className="grid grid-cols-2 gap-3">
              <EditField label="WhatsApp" value={editForm.whatsapp ?? ""} onChange={(v) => updateField("whatsapp", v)} />
              <EditField label="Telegram" value={editForm.telegram ?? ""} onChange={(v) => updateField("telegram", v)} />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Detail label="WhatsApp" value={profile.whatsapp} />
              <Detail label="Telegram" value={profile.telegram} />
            </div>
          )}
          {services.length > 0 && (
            <div className="pt-2">
              <p className="text-xs font-medium text-muted-foreground mb-2">Serviços</p>
              <div className="flex flex-wrap gap-1.5">
                {services.map((s) => (
                  <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bio */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="font-display text-lg font-semibold text-foreground mb-2">Bio</h2>
        {editing ? (
          <Textarea
            value={editForm.bio ?? ""}
            onChange={(e) => updateField("bio", e.target.value)}
            rows={4}
          />
        ) : (
          <p className="text-sm text-foreground whitespace-pre-wrap">{profile.bio || "—"}</p>
        )}
      </div>

      {/* Actions */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <h2 className="font-display text-lg font-semibold text-foreground">Ações</h2>
        <div className="space-y-3">
          <Textarea
            placeholder="Nota interna (opcional)..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
          />
          <div className="flex flex-wrap gap-3">
            {profile.status !== "approved" && (
              <Button onClick={() => handleAction("approved")} disabled={acting}>
                <CheckCircle className="mr-1.5 h-4 w-4" /> Aprovar
              </Button>
            )}
            {profile.status !== "rejected" && (
              <Button variant="destructive" onClick={() => handleAction("rejected")} disabled={acting}>
                <XCircle className="mr-1.5 h-4 w-4" /> Rejeitar
              </Button>
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
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <span className="text-muted-foreground text-xs">{label}</span>
      <p className="text-foreground text-sm font-medium">{value || "—"}</p>
    </div>
  );
}

function EditField({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground">{label}</label>
      <Input className="h-9 text-sm mt-1" type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
