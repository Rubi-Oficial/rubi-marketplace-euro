import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useLocations } from "@/hooks/useLocations";
import type { ProfileDraft, ServiceOption } from "./types";
import { CATEGORIES } from "./types";

interface Props {
  form: ProfileDraft;
  update: (field: keyof ProfileDraft, value: string) => void;
  selectedServices?: string[];
  onServicesChange?: (ids: string[]) => void;
}

export default function StepDetails({ form, update, selectedServices = [], onServicesChange }: Props) {
  const [services, setServices] = useState<ServiceOption[]>([]);
  const { countries, cities, loading: locLoading, getCitiesByCountry, getCountryByCity } = useLocations();

  // Derive active country from form or auto-detect
  const activeCountrySlug = form.country || "";
  const filteredCities = activeCountrySlug ? getCitiesByCountry(activeCountrySlug) : [];

  // Auto-detect country from existing city_slug on mount
  useEffect(() => {
    if (form.city_slug && !form.country) {
      const country = getCountryByCity(form.city_slug);
      if (country) update("country", country.slug);
    }
  }, [form.city_slug, form.country, cities]);

  useEffect(() => {
    supabase
      .from("services")
      .select("id, name, slug")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (data) setServices(data as ServiceOption[]);
      });
  }, []);

  const selectCountry = (slug: string) => {
    update("country", slug);
    // Clear city when changing country
    update("city", "");
    update("city_slug", "");
  };

  const selectCity = (name: string, slug: string) => {
    update("city", name);
    update("city_slug", slug);
  };

  const toggleService = (id: string) => {
    if (!onServicesChange) return;
    const next = selectedServices.includes(id)
      ? selectedServices.filter((s) => s !== id)
      : [...selectedServices, id];
    onServicesChange(next);
  };

  return (
    <div className="space-y-6">
      {/* Country */}
      <div className="space-y-2">
        <Label>Country *</Label>
        {locLoading ? (
          <div className="h-10 animate-pulse rounded-md bg-muted" />
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {countries.map((c) => (
              <button
                key={c.slug}
                type="button"
                onClick={() => selectCountry(c.slug)}
                className={cn(
                  "rounded-md border px-3 py-2 text-sm transition-colors",
                  activeCountrySlug === c.slug
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40"
                )}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* City — only shown when a country is selected */}
      {activeCountrySlug && (
        <div className="space-y-2">
          <Label>City *</Label>
          {filteredCities.length === 0 ? (
            <p className="text-xs text-muted-foreground">No cities available for this country.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {filteredCities.map((c) => (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => selectCity(c.name, c.slug)}
                  className={cn(
                    "rounded-md border px-3 py-2 text-sm transition-colors",
                    form.city_slug === c.slug
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Category */}
      <div className="space-y-2">
        <Label>Category *</Label>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => update("category", c)}
              className={cn(
                "rounded-md border px-3 py-2 text-sm transition-colors",
                form.category === c
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/40"
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Services */}
      {services.length > 0 && (
        <div className="space-y-2">
          <Label>Services</Label>
          <p className="text-xs text-muted-foreground">Select the services you offer</p>
          <div className="grid grid-cols-2 gap-2">
            {services.map((s) => (
              <label
                key={s.id}
                className={cn(
                  "flex items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer transition-colors",
                  selectedServices.includes(s.id)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40"
                )}
              >
                <Checkbox
                  checked={selectedServices.includes(s.id)}
                  onCheckedChange={() => toggleService(s.id)}
                />
                {s.name}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Languages */}
      <div className="space-y-2">
        <Label htmlFor="languages">Languages</Label>
        <input
          id="languages"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          value={form.languages}
          onChange={(e) => update("languages", e.target.value)}
          placeholder="English, Dutch, Spanish"
        />
        <p className="text-xs text-muted-foreground">Separate with commas</p>
      </div>
    </div>
  );
}
