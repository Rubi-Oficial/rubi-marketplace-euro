import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Check } from "lucide-react";

const STEPS = [
  "Dados básicos",
  "Cidade e categoria",
  "Bio e informações",
  "Canais de contato",
];

const CATEGORIES = [
  "Acompanhante",
  "Massagista",
  "Dominatrix",
  "Trans",
  "Dupla",
];

const CITIES = [
  "São Paulo",
  "Rio de Janeiro",
  "Belo Horizonte",
  "Curitiba",
  "Brasília",
  "Salvador",
  "Fortaleza",
  "Porto Alegre",
  "Recife",
  "Goiânia",
];

interface ProfileDraft {
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

export default function EscortOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [form, setForm] = useState<ProfileDraft>({
    display_name: "",
    age: "",
    city: "",
    country: "Brasil",
    category: "",
    bio: "",
    languages: "Português",
    pricing_from: "",
    whatsapp: "",
    telegram: "",
  });

  // Load existing draft profile
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setProfileId(data.id);
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
      });
  }, [user]);

  const update = (field: keyof ProfileDraft, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const slug = form.display_name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const payload = {
      user_id: user.id,
      display_name: form.display_name.trim(),
      age: form.age ? parseInt(form.age) : null,
      city: form.city || null,
      country: form.country || null,
      category: form.category || null,
      bio: form.bio.trim() || null,
      languages: form.languages
        ? form.languages.split(",").map((l) => l.trim()).filter(Boolean)
        : null,
      pricing_from: form.pricing_from ? parseFloat(form.pricing_from) : null,
      whatsapp: form.whatsapp.trim() || null,
      telegram: form.telegram.trim() || null,
      slug: slug || null,
      status: "draft" as const,
    };

    let error;
    if (profileId) {
      ({ error } = await supabase
        .from("profiles")
        .update(payload)
        .eq("id", profileId));
    } else {
      const res = await supabase
        .from("profiles")
        .insert(payload)
        .select("id")
        .single();
      error = res.error;
      if (res.data) setProfileId(res.data.id);
    }

    setSaving(false);

    if (error) {
      toast.error("Erro ao salvar: " + error.message);
      return;
    }

    toast.success("Perfil salvo como rascunho!");
    navigate("/app");
  };

  const canAdvance = () => {
    switch (step) {
      case 0:
        return form.display_name.trim().length >= 2;
      case 1:
        return form.city.length > 0 && form.category.length > 0;
      case 2:
        return true; // bio is optional
      case 3:
        return true; // contacts optional at this stage
      default:
        return false;
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-lg animate-fade-in">
        <div className="mb-8 text-center">
          <h1 className="font-display text-2xl font-bold text-foreground">
            Configure seu perfil
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Preencha as informações para criar seu anúncio
          </p>
        </div>

        {/* Step indicator */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                  i < step
                    ? "bg-primary text-primary-foreground"
                    : i === step
                    ? "border-2 border-primary text-primary"
                    : "border border-border text-muted-foreground"
                }`}
              >
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`hidden h-px w-8 sm:block ${
                    i < step ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-foreground">
            {STEPS[step]}
          </h2>

          {/* Step 0: Basic data */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="display_name">Nome de exibição *</Label>
                <Input
                  id="display_name"
                  value={form.display_name}
                  onChange={(e) => update("display_name", e.target.value)}
                  placeholder="Como quer ser chamada"
                  maxLength={60}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Idade</Label>
                <Input
                  id="age"
                  type="number"
                  min={18}
                  max={99}
                  value={form.age}
                  onChange={(e) => update("age", e.target.value)}
                  placeholder="18"
                />
              </div>
            </div>
          )}

          {/* Step 1: City & Category */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Cidade *</Label>
                <div className="grid grid-cols-2 gap-2">
                  {CITIES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => update("city", c)}
                      className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                        form.city === c
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <Input
                  value={form.city}
                  onChange={(e) => update("city", e.target.value)}
                  placeholder="Ou digite outra cidade"
                  className="mt-2"
                />
              </div>
              <div className="space-y-2">
                <Label>Categoria *</Label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => update("category", c)}
                      className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                        form.category === c
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Bio */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bio">Sobre você</Label>
                <Textarea
                  id="bio"
                  value={form.bio}
                  onChange={(e) => update("bio", e.target.value)}
                  placeholder="Descreva-se em poucas palavras..."
                  rows={5}
                  maxLength={1000}
                />
                <p className="text-xs text-muted-foreground">
                  {form.bio.length}/1000 caracteres
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="languages">Idiomas</Label>
                <Input
                  id="languages"
                  value={form.languages}
                  onChange={(e) => update("languages", e.target.value)}
                  placeholder="Português, Inglês"
                />
                <p className="text-xs text-muted-foreground">
                  Separe por vírgula
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pricing_from">Valor a partir de (R$)</Label>
                <Input
                  id="pricing_from"
                  type="number"
                  min={0}
                  value={form.pricing_from}
                  onChange={(e) => update("pricing_from", e.target.value)}
                  placeholder="200"
                />
              </div>
            </div>
          )}

          {/* Step 3: Contact */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  value={form.whatsapp}
                  onChange={(e) => update("whatsapp", e.target.value)}
                  placeholder="+55 11 99999-9999"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telegram">Telegram</Label>
                <Input
                  id="telegram"
                  value={form.telegram}
                  onChange={(e) => update("telegram", e.target.value)}
                  placeholder="@seuuser"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Esses dados ficarão visíveis no seu perfil público após
                aprovação.
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-6 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 0}
            >
              Voltar
            </Button>

            {step < STEPS.length - 1 ? (
              <Button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canAdvance()}
              >
                Próximo
              </Button>
            ) : (
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Salvando..." : "Salvar rascunho"}
              </Button>
            )}
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Você poderá editar todas as informações depois. Fotos e plano serão
          configurados na próxima etapa.
        </p>
      </div>
    </div>
  );
}
