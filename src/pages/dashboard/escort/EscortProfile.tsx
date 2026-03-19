import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Save, Send, Eye } from "lucide-react";
import { Link } from "react-router-dom";

const CATEGORIES = ["Acompanhante", "Massagista", "Dominatrix", "Trans", "Dupla"];
const CITIES = [
  "São Paulo", "Rio de Janeiro", "Belo Horizonte", "Curitiba", "Brasília",
  "Salvador", "Fortaleza", "Porto Alegre", "Recife", "Goiânia",
];

interface ProfileForm {
  display_name: string;
  age: string;
  city: string;
  country: string;
  category: string;
  bio: string;
  languages: string;
  pricing_from: string;
  whatsapp: string;
  telegram: string;
}

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Rascunho", variant: "secondary" },
  pending_review: { label: "Em análise", variant: "outline" },
  approved: { label: "Aprovado", variant: "default" },
  rejected: { label: "Rejeitado", variant: "destructive" },
  paused: { label: "Pausado", variant: "secondary" },
};

export default function EscortProfile() {
  const { user } = useAuth();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("draft");
  const [slug, setSlug] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<ProfileForm>({
    display_name: "", age: "", city: "", country: "Brasil",
    category: "", bio: "", languages: "Português",
    pricing_from: "", whatsapp: "", telegram: "",
  });

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setProfileId(data.id);
          setStatus(data.status);
          setSlug(data.slug);
          setForm({
            display_name: data.display_name || "",
            age: data.age?.toString() || "",
            city: data.city || "",
            country: data.country || "Brasil",
            category: data.category || "",
            bio: data.bio || "",
            languages: data.languages?.join(", ") || "Português",
            pricing_from: data.pricing_from?.toString() || "",
            whatsapp: data.whatsapp || "",
            telegram: data.telegram || "",
          });
        }
        setLoading(false);
      });
  }, [user]);

  const update = (field: keyof ProfileForm, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const generateSlug = (name: string) =>
    name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const handleSave = async (submitForReview = false) => {
    if (!user || !profileId) return;
    setSaving(true);

    const newSlug = generateSlug(form.display_name);
    const payload = {
      display_name: form.display_name.trim(),
      age: form.age ? parseInt(form.age) : null,
      city: form.city || null,
      country: form.country || null,
      category: form.category || null,
      bio: form.bio.trim() || null,
      languages: form.languages ? form.languages.split(",").map((l) => l.trim()).filter(Boolean) : null,
      pricing_from: form.pricing_from ? parseFloat(form.pricing_from) : null,
      whatsapp: form.whatsapp.trim() || null,
      telegram: form.telegram.trim() || null,
      slug: newSlug || null,
      ...(submitForReview ? { status: "pending_review" as const } : {}),
    };

    const { error } = await supabase.from("profiles").update(payload).eq("id", profileId);
    setSaving(false);

    if (error) {
      toast.error("Erro ao salvar: " + error.message);
      return;
    }

    if (submitForReview) {
      setStatus("pending_review");
      toast.success("Perfil enviado para aprovação!");
    } else {
      setSlug(newSlug);
      toast.success("Perfil salvo!");
    }
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
        <p className="text-muted-foreground">Nenhum perfil encontrado.</p>
        <Button asChild className="mt-4"><Link to="/app/onboarding">Criar perfil</Link></Button>
      </div>
    );
  }

  const statusInfo = STATUS_LABELS[status] || STATUS_LABELS.draft;
  const canSubmit = form.display_name.trim().length >= 2 && form.city && form.category;
  const canEdit = status !== "pending_review";

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Meu Perfil</h1>
          <p className="mt-1 text-muted-foreground">Edite seu anúncio e informações.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
          {status === "approved" && slug && (
            <Button variant="outline" size="sm" asChild>
              <Link to={`/perfil/${slug}`} target="_blank">
                <Eye className="mr-1.5 h-4 w-4" /> Ver público
              </Link>
            </Button>
          )}
        </div>
      </div>

      {status === "rejected" && (
        <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">
            Seu perfil foi rejeitado. Corrija as informações e envie novamente.
          </p>
        </div>
      )}

      <div className="mt-8 space-y-6">
        {/* Basic info */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Dados básicos</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="display_name">Nome de exibição *</Label>
              <Input id="display_name" value={form.display_name} disabled={!canEdit}
                onChange={(e) => update("display_name", e.target.value)} maxLength={60} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">Idade</Label>
              <Input id="age" type="number" min={18} max={99} value={form.age} disabled={!canEdit}
                onChange={(e) => update("age", e.target.value)} />
            </div>
          </div>
        </div>

        {/* Location & Category */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Cidade e categoria</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Cidade *</Label>
              <div className="flex flex-wrap gap-2">
                {CITIES.map((c) => (
                  <button key={c} type="button" disabled={!canEdit}
                    onClick={() => update("city", c)}
                    className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                      form.city === c
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    } disabled:opacity-50`}>
                    {c}
                  </button>
                ))}
              </div>
              <Input value={form.city} disabled={!canEdit}
                onChange={(e) => update("city", e.target.value)} placeholder="Ou digite outra cidade" />
            </div>
            <div className="space-y-2">
              <Label>Categoria *</Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button key={c} type="button" disabled={!canEdit}
                    onClick={() => update("category", c)}
                    className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                      form.category === c
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    } disabled:opacity-50`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Sobre você</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" rows={5} maxLength={1000} value={form.bio} disabled={!canEdit}
                onChange={(e) => update("bio", e.target.value)} placeholder="Descreva-se..." />
              <p className="text-xs text-muted-foreground">{form.bio.length}/1000</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="languages">Idiomas</Label>
                <Input id="languages" value={form.languages} disabled={!canEdit}
                  onChange={(e) => update("languages", e.target.value)} placeholder="Português, Inglês" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pricing_from">Valor a partir de (R$)</Label>
                <Input id="pricing_from" type="number" min={0} value={form.pricing_from} disabled={!canEdit}
                  onChange={(e) => update("pricing_from", e.target.value)} placeholder="200" />
              </div>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Contato</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input id="whatsapp" value={form.whatsapp} disabled={!canEdit}
                onChange={(e) => update("whatsapp", e.target.value)} placeholder="+55 11 99999-9999" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telegram">Telegram</Label>
              <Input id="telegram" value={form.telegram} disabled={!canEdit}
                onChange={(e) => update("telegram", e.target.value)} placeholder="@seuuser" />
            </div>
          </div>
        </div>

        {/* Actions */}
        {canEdit && (
          <div className="flex items-center gap-3">
            <Button onClick={() => handleSave(false)} disabled={saving}>
              <Save className="mr-1.5 h-4 w-4" />
              {saving ? "Salvando..." : "Salvar alterações"}
            </Button>
            {(status === "draft" || status === "rejected") && canSubmit && (
              <Button variant="outline" onClick={() => handleSave(true)} disabled={saving}>
                <Send className="mr-1.5 h-4 w-4" /> Enviar para aprovação
              </Button>
            )}
          </div>
        )}
        {!canEdit && (
          <p className="text-sm text-muted-foreground">
            Seu perfil está em análise e não pode ser editado no momento.
          </p>
        )}
      </div>
    </div>
  );
}
