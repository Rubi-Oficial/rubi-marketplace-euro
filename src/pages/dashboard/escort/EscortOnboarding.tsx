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
import { useLocations } from "@/hooks/useLocations";

const STEPS: StepConfig[] = [
  { label: "Basic Info" },
  { label: "Details & Services" },
  { label: "Description" },
  { label: "Review" },
];

export default function EscortOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { countries } = useLocations();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [form, setForm] = useState<ProfileDraft>(INITIAL_DRAFT);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(async ({ data }) => {
        if (data) {
          setProfileId(data.id);
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
          // Load existing services
          const { data: ps } = await supabase
            .from("profile_services")
            .select("service_id")
            .eq("profile_id", data.id);
          if (ps) setSelectedServices(ps.map((r: any) => r.service_id));
        }
      });
  }, [user]);

  const update = useCallback(
    (field: keyof ProfileDraft, value: string) =>
      setForm((prev) => ({ ...prev, [field]: value })),
    []
  );

  const buildPayload = () => {
    const base = form.city ? `${form.display_name}-${form.city}` : form.display_name;
    const slug = base
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
      city_slug: form.city_slug || null,
      country: countries.find((c) => c.slug === form.country)?.name || form.country || null,
      country_slug: form.country || null,
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

    try {
      const payload = buildPayload();

      // Validate essential fields
      if (payload.display_name && payload.display_name.length > 60) {
        toast.error("O nome deve ter no máximo 60 caracteres.");
        setSaving(false);
        return false;
      }
      if (payload.age !== null && (payload.age < 18 || payload.age > 99)) {
        toast.error("A idade deve estar entre 18 e 99.");
        setSaving(false);
        return false;
      }

      let error;
      let currentProfileId = profileId;
      if (currentProfileId) {
        ({ error } = await supabase
          .from("profiles")
          .update(payload)
          .eq("id", currentProfileId));
      } else {
        const res = await supabase
          .from("profiles")
          .insert(payload)
          .select("id")
          .single();
        error = res.error;
        if (res.data) {
          currentProfileId = res.data.id;
          setProfileId(res.data.id);
        }
      }

      // Save services
      if (!error && currentProfileId) {
        const { error: delErr } = await supabase.from("profile_services").delete().eq("profile_id", currentProfileId);
        if (delErr) console.error("[Onboarding] Failed to clear services:", delErr.message);

        if (selectedServices.length > 0) {
          const { error: insErr } = await supabase.from("profile_services").insert(
            selectedServices.map((sid) => ({ profile_id: currentProfileId!, service_id: sid }))
          );
          if (insErr) console.error("[Onboarding] Failed to save services:", insErr.message);
        }
      }

      setSaving(false);
      if (error) {
        console.error("[Onboarding] Save error:", error.message);
        toast.error("Não foi possível guardar. Tente novamente.");
        return false;
      }
      return true;
    } catch (err) {
      console.error("[Onboarding] Unexpected save error:", err);
      toast.error("Ocorreu um erro inesperado. Tente novamente.");
      setSaving(false);
      return false;
    }
  };

  const canAdvance = () => {
    switch (step) {
      case 0:
        return form.display_name.trim().length >= 2;
      case 1: {
        if (!form.country || !form.city || !form.city_slug || !form.category) return false;
        // Validate city belongs to selected country
        const citiesForCountry = getCitiesByCountry(form.country);
        return citiesForCountry.some((c) => c.slug === form.city_slug);
      }
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
      toast.success("Changes saved!");
      navigate("/app");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-lg animate-fade-in">
        <div className="mb-8 text-center">
          <h1 className="font-display text-2xl font-bold text-foreground">
            Set up your profile
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Fill in your details to create your listing
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
          {step === 1 && (
            <StepDetails
              form={form}
              update={update}
              selectedServices={selectedServices}
              onServicesChange={setSelectedServices}
            />
          )}
          {step === 2 && <StepDescription form={form} update={update} />}
          {step === 3 && <StepReview form={form} />}

          <div className="mt-6 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 0}
            >
              Back
            </Button>

            {step < STEPS.length - 1 ? (
              <Button onClick={handleNext} disabled={!canAdvance() || saving}>
                {saving ? "Saving..." : "Next"}
              </Button>
            ) : (
              <Button onClick={handleFinish} disabled={saving}>
                {saving ? "Saving..." : "Save draft"}
              </Button>
            )}
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Your progress is saved at each step. You can leave and come back later.
        </p>
      </div>
    </div>
  );
}
