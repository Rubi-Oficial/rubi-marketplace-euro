import React from "react";
import { SlidersHorizontal, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";

interface MobileFilterBarProps {
  hasGeneralFilter: boolean;
  hasLocationFilter: boolean;
  generalCount: number;
  locationCount: number;
  onOpenFilters: () => void;
  onOpenLocation: () => void;
}

export const MobileFilterBar = React.forwardRef<HTMLDivElement, MobileFilterBarProps>(
  ({ hasGeneralFilter, hasLocationFilter, generalCount, locationCount, onOpenFilters, onOpenLocation }, ref) => {
    const { t } = useLanguage();

    return (
      <div
        ref={ref}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 px-4 md:hidden w-full max-w-md"
        role="toolbar"
        aria-label="Filters"
      >
        <div className="mx-auto flex items-center gap-3 rounded-full border border-border/30 bg-background/80 backdrop-blur-xl px-3 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenFilters}
            className={`h-11 flex-1 rounded-full border-border/30 text-[13px] font-semibold tracking-wide transition-all duration-300 focus-visible:ring-2 focus-visible:ring-primary/50 active:scale-[0.96] ${
              hasGeneralFilter
                ? "border-primary/50 text-primary bg-primary/10 shadow-[0_2px_12px_hsl(var(--primary)_/_0.2)]"
                : "hover:bg-accent/25 hover:border-border/50"
            }`}
            aria-label={`${t("landing.filters")}${hasGeneralFilter ? ` (${generalCount} active)` : ""}`}
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            {t("landing.filters")}
            {hasGeneralFilter && (
              <span className="ml-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground shadow-sm animate-scale-in">
                {generalCount}
              </span>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenLocation}
            className={`h-11 flex-1 rounded-full border-border/30 text-[13px] font-semibold tracking-wide transition-all duration-300 focus-visible:ring-2 focus-visible:ring-primary/50 active:scale-[0.96] ${
              hasLocationFilter
                ? "border-primary/50 text-primary bg-primary/10 shadow-[0_2px_12px_hsl(var(--primary)_/_0.2)]"
                : "hover:bg-accent/25 hover:border-border/50"
            }`}
            aria-label={`${t("landing.location")}${hasLocationFilter ? ` (${locationCount} active)` : ""}`}
          >
            <MapPin className="mr-2 h-4 w-4" />
            {t("landing.location")}
            {hasLocationFilter && (
              <span className="ml-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground shadow-sm animate-scale-in">
                {locationCount}
              </span>
            )}
          </Button>
        </div>
      </div>
    );
  }
);
MobileFilterBar.displayName = "MobileFilterBar";