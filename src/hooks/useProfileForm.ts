import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useLocations } from "@/hooks/useLocations";
import type { ProfileDraft } from "@/components/onboarding/types";
import { INITIAL_DRAFT } from "@/components/onboarding/types";

export function generateSlug(name: string, city?: string): string {
  const base = city ? `${name}-${city}` : name;
  return base
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function buildProfilePayload(
  form: ProfileDraft,
  userId: string,
  countries: { slug: string; name: string }[],
  overrides?: Record<string, unknown>
) {
  const slug = generateSlug(form.display_name, form.city);
  return {
    user_id: userId,
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
    ...overrides,
  };
}

export function validateProfileForm(
  form: ProfileDraft,
  getCitiesByCountry: (slug: string) => { slug: string; name: string }[]
): string | null {
  const name = form.display_name.trim();
  if (name.length < 2) return "O nome deve ter pelo menos 2 caracteres.";
  if (name.length > 60) return "O nome deve ter no máximo 60 caracteres.";

  if (form.age) {
    const age = parseInt(form.age);
    if (isNaN(age) || age < 18 || age > 99) return "A idade deve estar entre 18 e 99.";
  }

  if (form.pricing_from) {
    const price = parseFloat(form.pricing_from);
    if (isNaN(price) || price < 0 || price > 99999) return "O preço deve estar entre 0 e 99.999€.";
  }

  if (form.whatsapp && form.whatsapp.trim().length > 20)
    return "O número de WhatsApp é inválido.";

  if (form.bio && form.bio.length > 1000) return "A bio deve ter no máximo 1000 caracteres.";

  if (form.country && form.city_slug) {
    const cities = getCitiesByCountry(form.country);
    if (!cities.some((c) => c.slug === form.city_slug))
      return "A cidade selecionada não pertence ao país escolhido. Selecione novamente.";
  }

  if (form.country && !form.city_slug) return "Selecione uma cidade.";
  if (!form.country && form.city_slug) return "Selecione um país.";

  return null;
}

export async function saveProfileServices(
  profileId: string,
  selectedServices: string[]
) {
  const { error: delErr } = await supabase
    .from("profile_services")
    .delete()
    .eq("profile_id", profileId);
  if (delErr) console.error("[Profile] Failed to clear services:", delErr.message);

  if (selectedServices.length > 0) {
    const { error: insErr } = await supabase.from("profile_services").insert(
      selectedServices.map((sid) => ({ profile_id: profileId, service_id: sid }))
    );
    if (insErr) console.error("[Profile] Failed to save services:", insErr.message);
  }
}

export function useProfileForm(initial?: ProfileDraft) {
  const [form, setForm] = useState<ProfileDraft>(initial || INITIAL_DRAFT);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const update = useCallback(
    (field: keyof ProfileDraft, value: string) =>
      setForm((prev) => ({ ...prev, [field]: value })),
    []
  );

  const selectCountry = useCallback((slug: string) => {
    setForm((prev) => ({ ...prev, country: slug, city: "", city_slug: "" }));
  }, []);

  const selectCity = useCallback((name: string, slug: string) => {
    setForm((prev) => ({ ...prev, city: name, city_slug: slug }));
  }, []);

  const toggleService = useCallback((id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }, []);

  return {
    form,
    setForm,
    update,
    selectCountry,
    selectCity,
    saving,
    setSaving,
    selectedServices,
    setSelectedServices,
    toggleService,
  };
}
