import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Save, Send, Eye, Pause, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { useLocations } from "@/hooks/useLocations";
import {
  useProfileForm,
  buildProfilePayload,
  validateProfileForm,
  saveProfileServices,
} from "@/hooks/useProfileForm";
import LocationCategoryPicker from "@/components/profile/LocationCategoryPicker";
import ServicesPicker from "@/components/profile/ServicesPicker";
import ProfileStatusBanner from "@/components/profile/ProfileStatusBanner";

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Rascunho", variant: "secondary" },
  pending_review: { label: "Em análise", variant: "outline" },
  approved: { label: "Aprovado — aguardando ativação", variant: "default" },
  rejected: { label: "Rejeitado", variant: "destructive" },
  paused: { label: "Pausado", variant: "secondary" },
};

export default function EscortProfile() {
  const { user } = useAuth();
  const { countries, getCitiesByCountry, getCountryByCity, loading: locLoading } = useLocations();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("draft");
  const [slug, setSlug] = useState<string | null>(null);
  const [hasActiveSub, setHasActiveSub] = useState(false);
  const [loading, setLoading] = useState(true);

  const {
    form, setForm, update, selectCountry, selectCity,
    saving, setSaving, selectedServices, setSelectedServices, toggleService,
  } = useProfileForm();

  // Auto-detect country from existing city_slug
  useEffect(() => {
    if (form.city_slug && !form.country && !locLoading) {
      const country = getCountryByCity(form.city_slug);
      if (country) update("country", country.slug);
    }
  }, [form.city_slug, form.country, locLoading, getCountryByCity, update]);

  useEffect(() => {
    if (!user) return;

    supabase.from("subscriptions").select("id").eq("user_id", user.id).eq("status", "active").limit(1)
      .then(({ data }) => setHasActiveSub((data?.length ?? 0) > 0));

    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle()
      .then(async ({ data }) => {
        if (data) {
          setProfileId(data.id);
          setStatus(data.status);
          setSlug(data.slug);
          setForm({
            display_name: data.display_name || "",
            age: data.age?.toString() || "",
            city: data.city || "",
            city_slug: (data as any).city_slug || "",
            country: (data as any).country_slug || data.country || "",
            category: data.category || "",
            bio: data.bio || "",
            languages: data.languages?.join(", ") || "English",
            pricing_from: data.pricing_from?.toString() || "",
            whatsapp: data.whatsapp || "",
            telegram: data.telegram || "",
          });
          const { data: ps } = await supabase.from("profile_services")
            .select("service_id").eq("profile_id", data.id);
          if (ps) setSelectedServices(ps.map((r: any) => r.service_id));
        }
        setLoading(false);
      });
  }, [user]);

  const handleSave = async (submitForReview = false) => {
    if (!user || !profileId) return;
    const err = validateProfileForm(form, getCitiesByCountry);
    if (err) { toast.error(err); return; }

    setSaving(true);
    try {
      const payload = buildProfilePayload(form, user.id, countries, 
        submitForReview ? { status: "pending_review" as const } : {}
      );
      const { error } = await supabase.from("profiles").update(payload).eq("id", profileId);
      if (!error) await saveProfileServices(profileId, selectedServices);

      setSaving(false);
      if (error) {
        toast.error("Não foi possível guardar as alterações. Tente novamente.");
        return;
      }
      if (submitForReview) {
        setStatus("pending_review");
        toast.success("Perfil enviado para revisão!");
      } else {
        setSlug(payload.slug);
        toast.success("Alterações guardadas!");
      }
    } catch {
      toast.error("Ocorreu um erro inesperado. Tente novamente.");
      setSaving(false);
    }
  };

  const handlePause = async () => {
    if (!profileId) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").update({ status: "paused" }).eq("id", profileId);
      if (error) { toast.error("Não foi possível pausar o perfil."); return; }
      setStatus("paused");
      toast.success("Perfil despublicado.");
    } finally { setSaving(false); }
  };

  const handleReactivate = async () => {
    if (!profileId) return;
    setSaving(true);
    try {
      const { error } = await supabase.rpc("reactivate_profile", { _profile_id: profileId });
      if (error) { toast.error("Não foi possível reativar o perfil."); return; }
      setStatus("approved");
      toast.success("Perfil reativado!");
    } finally { setSaving(false); }
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
  const isPublished = status === "approved" && hasActiveSub;
  const canSubmit = form.display_name.trim().length >= 2 && form.city && form.category;
  const canEdit = status !== "pending_review";

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Meu Perfil</h1>
          <p className="mt-1 text-muted-foreground">Edite o seu anúncio e informações.</p>
        </div>
        <div className="flex items-center gap-3">
          {isPublished ? (
            <Badge variant="default" className="bg-green-600">Publicado</Badge>
          ) : (
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link to="/app/preview"><Eye className="mr-1.5 h-4 w-4" /> Pré-visualizar</Link>
          </Button>
        </div>
      </div>

      <ProfileStatusBanner
        status={status}
        hasActiveSub={hasActiveSub}
        slug={slug}
        saving={saving}
        onPause={handlePause}
        onReactivate={handleReactivate}
      />

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
          <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Localização & categoria</h2>
          <LocationCategoryPicker
            country={form.country}
            citySlug={form.city_slug}
            category={form.category}
            countries={countries}
            getCitiesByCountry={getCitiesByCountry}
            locLoading={locLoading}
            disabled={!canEdit}
            onSelectCountry={selectCountry}
            onSelectCity={selectCity}
            onSelectCategory={(c) => update("category", c)}
          />
        </div>

        {/* Services */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Serviços</h2>
          <ServicesPicker
            selectedServices={selectedServices}
            onToggle={toggleService}
            disabled={!canEdit}
          />
        </div>

        {/* Bio */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Sobre</h2>
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
                  onChange={(e) => update("languages", e.target.value)} placeholder="English, Dutch" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pricing_from">Preço inicial (€)</Label>
                <Input id="pricing_from" type="number" min={0} value={form.pricing_from} disabled={!canEdit}
                  onChange={(e) => update("pricing_from", e.target.value)} placeholder="200" />
              </div>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Contacto</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input id="whatsapp" value={form.whatsapp} disabled={!canEdit}
                onChange={(e) => update("whatsapp", e.target.value)} placeholder="+31 6 12345678" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telegram">Telegram</Label>
              <Input id="telegram" value={form.telegram} disabled={!canEdit}
                onChange={(e) => update("telegram", e.target.value)} placeholder="@youruser" />
            </div>
          </div>
        </div>

        {/* Actions */}
        {canEdit && (
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => handleSave(false)} disabled={saving}>
              <Save className="mr-1.5 h-4 w-4" />
              {saving ? "Guardando..." : "Guardar alterações"}
            </Button>
            {(status === "draft" || status === "rejected") && canSubmit && (
              <Button variant="outline" onClick={() => handleSave(true)} disabled={saving}>
                <Send className="mr-1.5 h-4 w-4" /> Enviar para revisão
              </Button>
            )}
            {isPublished && (
              <Button variant="ghost" onClick={handlePause} disabled={saving}>
                <Pause className="mr-1.5 h-4 w-4" /> Despublicar
              </Button>
            )}
            {status === "paused" && hasActiveSub && (
              <Button variant="ghost" onClick={handleReactivate} disabled={saving}>
                <Play className="mr-1.5 h-4 w-4" /> Republicar
              </Button>
            )}
          </div>
        )}
        {!canEdit && (
          <p className="text-sm text-muted-foreground">
            O seu perfil está em análise e não pode ser editado neste momento.
          </p>
        )}
      </div>
    </div>
  );
}
