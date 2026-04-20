import { SlidersHorizontal, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActiveFilterChips } from "@/components/public/ActiveFilterChips";
import { useLanguage } from "@/i18n/LanguageContext";

interface FilterBarProps {
  hasGeneralFilter: boolean;
  hasLocationFilter: boolean;
  hasFilters: boolean;
  generalCount: number;
  locationCount: number;
  countryFilter: string;
  cityFilter: string;
  categoryFilter: string;
  serviceFilters: string[];
  countryName?: string;
  cityName?: string;
  serviceNames?: string[];
  onOpenFilters: () => void;
  onOpenLocation: () => void;
  onRemoveFilter: (key: string) => void;
  onClearAll: () => void;
}

export function FilterBar({
  hasGeneralFilter,
  hasLocationFilter,
  hasFilters,
  generalCount,
  locationCount,
  countryFilter,
  cityFilter,
  categoryFilter,
  serviceFilters,
  countryName,
  cityName,
  serviceNames,
  onOpenFilters,
  onOpenLocation,
  onRemoveFilter,
  onClearAll,
}: FilterBarProps) {
  const { t } = useLanguage();

  return (
    <div className="mb-5 hidden md:flex flex-wrap items-center gap-2.5">
      <Button
        variant="outline"
        size="sm"
        onClick={onOpenFilters}
        className={`h-9 gap-2 rounded-full border-border/40 focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 ${hasGeneralFilter ? "border-primary/40 text-primary" : ""}`}
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        <span className="text-xs">{t("landing.filters")}</span>
        {hasGeneralFilter && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground px-1">
            {generalCount}
          </span>
        )}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={onOpenLocation}
        className={`h-9 gap-2 rounded-full border-border/40 focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 ${hasLocationFilter ? "border-primary/40 text-primary" : ""}`}
      >
        <MapPin className="h-3.5 w-3.5" />
        <span className="text-xs">{t("landing.location")}</span>
        {hasLocationFilter && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground px-1">
            {locationCount}
          </span>
        )}
      </Button>

      <ActiveFilterChips
        filters={{ country: countryFilter, city: cityFilter, category: categoryFilter, services: serviceFilters }}
        countryName={countryName}
        cityName={cityName}
        serviceNames={serviceNames}
        onRemove={onRemoveFilter}
        onClearAll={onClearAll}
        inline
      />

      {hasFilters && (
        <button onClick={onClearAll} className="ml-auto text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 rounded-sm">
          {t("landing.clear_all")}
        </button>
      )}
    </div>
  );
}
