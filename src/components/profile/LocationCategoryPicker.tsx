import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { CATEGORIES } from "@/components/onboarding/types";

interface LocationCategoryPickerProps {
  country: string;
  citySlug: string;
  category: string;
  countries: { slug: string; name: string }[];
  getCitiesByCountry: (slug: string) => { slug: string; name: string }[];
  locLoading?: boolean;
  disabled?: boolean;
  onSelectCountry: (slug: string) => void;
  onSelectCity: (name: string, slug: string) => void;
  onSelectCategory: (cat: string) => void;
  columns?: 2 | 3;
}

export default function LocationCategoryPicker({
  country,
  citySlug,
  category,
  countries,
  getCitiesByCountry,
  locLoading,
  disabled,
  onSelectCountry,
  onSelectCity,
  onSelectCategory,
  columns = 2,
}: LocationCategoryPickerProps) {
  const filteredCities = country ? getCitiesByCountry(country) : [];
  const gridCols = columns === 3 ? "sm:grid-cols-3" : "grid-cols-2";

  return (
    <div className="space-y-4">
      {/* Country */}
      <div className="space-y-2">
        <Label>País *</Label>
        {locLoading ? (
          <div className="h-10 animate-pulse rounded-md bg-muted" />
        ) : (
          <div className={cn("grid gap-2", gridCols)}>
            {countries.map((c) => (
              <button
                key={c.slug}
                type="button"
                disabled={disabled}
                onClick={() => onSelectCountry(c.slug)}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-sm transition-colors disabled:opacity-50",
                  country === c.slug
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

      {/* City */}
      {country && (
        <div className="space-y-2">
          <Label>Cidade *</Label>
          {filteredCities.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhuma cidade disponível.</p>
          ) : (
            <div className={cn("grid gap-2", gridCols)}>
              {filteredCities.map((c) => (
                <button
                  key={c.slug}
                  type="button"
                  disabled={disabled}
                  onClick={() => onSelectCity(c.name, c.slug)}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-sm transition-colors disabled:opacity-50",
                    citySlug === c.slug
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
        <Label>Categoria *</Label>
        <div className={cn("grid gap-2", gridCols)}>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              disabled={disabled}
              onClick={() => onSelectCategory(c)}
              className={cn(
                "rounded-md border px-3 py-1.5 text-sm transition-colors disabled:opacity-50",
                category === c
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/40"
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
