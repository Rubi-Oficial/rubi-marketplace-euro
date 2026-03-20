import { X } from "lucide-react";

interface ActiveFilterChipsProps {
  filters: {
    country: string;
    city: string;
    category: string;
    service: string;
  };
  countryName?: string;
  cityName?: string;
  serviceName?: string;
  onRemove: (key: string) => void;
  onClearAll: () => void;
}

export function ActiveFilterChips({ filters, countryName, cityName, serviceName, onRemove, onClearAll }: ActiveFilterChipsProps) {
  const chips: { key: string; label: string }[] = [];

  if (filters.country && countryName) chips.push({ key: "country", label: countryName });
  if (filters.city && cityName) chips.push({ key: "city", label: cityName });
  if (filters.service && serviceName) chips.push({ key: "service", label: serviceName });
  if (filters.category) chips.push({ key: "category", label: filters.category });

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 mb-4">
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
        >
          {chip.label}
          <button
            onClick={() => onRemove(chip.key)}
            className="ml-0.5 rounded-full p-0.5 hover:bg-primary/20 transition-colors"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </span>
      ))}
      {chips.length > 1 && (
        <button onClick={onClearAll} className="text-[11px] text-muted-foreground hover:text-foreground ml-1 transition-colors">
          Clear all
        </button>
      )}
    </div>
  );
}
