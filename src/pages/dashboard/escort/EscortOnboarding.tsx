import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Stepper, { type StepConfig } from "@/components/shared/Stepper";
import StepBasicInfo from "@/components/onboarding/StepBasicInfo";
import StepDetails from "@/components/onboarding/StepDetails";
import StepDescription from "@/components/onboarding/StepDescription";
import StepReview from "@/components/onboarding/StepReview";
import { type ProfileDraft, INITIAL_DRAFT } from "@/components/onboarding/types";

const STEPS: StepConfig[] = [
  { label: "Informações básicas" },
  { label: "Dados complementares" },
  { label: "Descrição" },
  { label: "Revisão" },
];

export default function EscortOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [form, setForm] = useState<ProfileDraft>(INITIAL_DRAFT);

  // Load existing draft
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

  const update = useCallback(
    (field: keyof ProfileDraft, value: string) =>
      setForm((prev) => ({ ...prev, [field]: value })),
    []
  );

  const buildPayload = () => {
    const slug = form.display_name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    return {
      user_id: user!.id,
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
  };

  const saveProgress = async () => {
    if (!user) return false;
    setSaving(true);
    const payload = buildPayload();

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
      return false;
    }
    return true;
  };

  const canAdvance = () => {
    switch (step) {
      case 0:
        return form.display_name.trim().length >= 2;
      case 1:
        return form.city.length > 0 && form.category.length > 0;
      case 2:
        return true;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const handleNext = async () => {
    const saved = await saveProgress();
    if (saved) setStep((s) => s + 1);
  };

  const handleFinish = async () => {
    const saved = await saveProgress();
    if (saved) {
      toast.success("Perfil salvo como rascunho!");
      navigate("/app");
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
            Preencha as informações para criar seu cadastro
          </p>
        </div>

        <div className="mb-8">
          <Stepper steps={STEPS} currentStep={step} />
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-foreground">
            {STEPS[step].label}
          </h2>

          {step === 0 && <StepBasicInfo form={form} update={update} />}
          {step === 1 && <StepDetails form={form} update={update} />}
          {step === 2 && <StepDescription form={form} update={update} />}
          {step === 3 && <StepReview form={form} />}

          <div className="mt-6 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 0}
            >
              Voltar
            </Button>

            {step < STEPS.length - 1 ? (
              <Button onClick={handleNext} disabled={!canAdvance() || saving}>
                {saving ? "Salvando..." : "Próximo"}
              </Button>
            ) : (
              <Button onClick={handleFinish} disabled={saving}>
                {saving ? "Salvando..." : "Salvar rascunho"}
              </Button>
            )}
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Seu progresso é salvo a cada etapa. Você pode sair e voltar depois.
        </p>
      </div>
    </div>
  );
}
