import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { ProfileDraft } from "./types";
import { CATEGORIES, CITIES } from "./types";

interface Props {
  form: ProfileDraft;
  update: (field: keyof ProfileDraft, value: string) => void;
}

export default function StepDetails({ form, update }: Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Cidade *</Label>
        <div className="grid grid-cols-2 gap-2">
          {CITIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => update("city", c)}
              className={cn(
                "rounded-md border px-3 py-2 text-sm transition-colors",
                form.city === c
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/40"
              )}
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
      <div className="space-y-2">
        <Label htmlFor="languages">Idiomas</Label>
        <Input
          id="languages"
          value={form.languages}
          onChange={(e) => update("languages", e.target.value)}
          placeholder="Português, Inglês"
        />
        <p className="text-xs text-muted-foreground">Separe por vírgula</p>
      </div>
    </div>
  );
}
