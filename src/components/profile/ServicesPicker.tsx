import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import type { ServiceOption } from "@/components/onboarding/types";

interface ServicesPickerProps {
  selectedServices: string[];
  onToggle: (id: string) => void;
  disabled?: boolean;
  label?: string;
}

export default function ServicesPicker({
  selectedServices,
  onToggle,
  disabled,
  label = "Serviços",
}: ServicesPickerProps) {
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

  if (services.length === 0) return null;

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="grid gap-2 sm:grid-cols-2">
        {services.map((s) => (
          <label
            key={s.id}
            className={cn(
              "flex items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer transition-colors",
              disabled && "opacity-50 pointer-events-none",
              selectedServices.includes(s.id)
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/40"
            )}
          >
            <Checkbox
              checked={selectedServices.includes(s.id)}
              onCheckedChange={() => onToggle(s.id)}
              disabled={disabled}
            />
            {s.name}
          </label>
        ))}
      </div>
    </div>
  );
}
