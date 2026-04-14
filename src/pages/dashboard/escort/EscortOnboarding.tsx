import { useState, useEffect } from "react";
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
import { useLocations } from "@/hooks/useLocations";
import {
  useProfileForm,
  buildProfilePayload,
  saveProfileServices,
} from "@/hooks/useProfileForm";

const STEPS: StepConfig[] = [
  { label: "Basic Info" },
  { label: "Details & Services" },
  { label: "Description" },
  { label: "Review" },
];

export default function EscortOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { countries, getCitiesByCountry } = useLocations();
  const [step, setStep] = useState(0);
  const [profileId, setProfileId] = useState<string | null>(null);

  const {
    form, setForm, update,
    saving, setSaving,
    selectedServices, setSelectedServices,
  } = useProfileForm();

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
          const { data: ps } = await supabase
            .from("profile_services")
            .select("service_id")
            .eq("profile_id", data.id);
          if (ps) setSelectedServices(ps.map((r: any) => r.service_id));
        }
      });
  }, [user]);

  const saveProgress = async () => {
    if (!user) return false;
    setSaving(true);

    try {
      const payload = buildProfilePayload(form, user.id, countries, { status: "draft" as const });

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
        ({ error } = await supabase.from("profiles").update(payload).eq("id", currentProfileId));
      } else {
        const res = await supabase.from("profiles").insert(payload).select("id").single();
        error = res.error;
        if (res.data) {
          currentProfileId = res.data.id;
          setProfileId(res.data.id);
        }
      }

      if (!error && currentProfileId) {
        await saveProfileServices(currentProfileId, selectedServices);
      }

      setSaving(false);
      if (error) {
        toast.error("Não foi possível guardar. Tente novamente.");
        return false;
      }
      return true;
    } catch {
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
        const citiesForCountry = getCitiesByCountry(form.country);
        return citiesForCountry.some((c) => c.slug === form.city_slug);
      }
      default:
        return true;
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
          <h1 className="font-display text-2xl font-bold text-foreground">Set up your profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">Fill in your details to create your listing</p>
        </div>

        <div className="mb-8">
          <Stepper steps={STEPS} currentStep={step} />
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-foreground">{STEPS[step].label}</h2>

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
            <Button variant="ghost" onClick={() => setStep((s) => s - 1)} disabled={step === 0}>
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
