import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import type { ProfileDraft, ServiceOption } from "./types";
import { CATEGORIES, CITIES } from "./types";

interface Props {
  form: ProfileDraft;
  update: (field: keyof ProfileDraft, value: string) => void;
  selectedServices?: string[];
  onServicesChange?: (ids: string[]) => void;
}

export default function StepDetails({ form, update, selectedServices = [], onServicesChange }: Props) {
  const [services, setServices] = useState<ServiceOption[]>([]);

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
      {/* City */}
      <div className="space-y-2">
        <Label>City *</Label>
        <div className="grid grid-cols-2 gap-2">
          {CITIES.map((c) => (
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
      </div>

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
